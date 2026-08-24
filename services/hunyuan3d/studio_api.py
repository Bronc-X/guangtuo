"""Local job gateway between the static product site and Hunyuan3D Gradio."""

from __future__ import annotations

import base64
import binascii
import hashlib
import json
import os
import re
import shutil
import subprocess
import threading
import urllib.error
import urllib.request
import uuid
from collections.abc import Mapping
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from gradio_client import Client, handle_file
from pydantic import BaseModel, ConfigDict, Field, field_validator


PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_ROOT = Path(__file__).resolve().parent / "studio-output"
CONCEPT_ROOT = OUTPUT_ROOT / "concepts"
CONCEPT_METADATA_ROOT = OUTPUT_ROOT / "concept-cache"
DEFAULT_MODEL_WORKER_URL = "http://127.0.0.1:8080"
MODEL_WORKER_URL = os.environ.get(
    "STUDIO_MODEL_WORKER_URL", DEFAULT_MODEL_WORKER_URL
).rstrip("/")
PRIMARY_ENGINE = "hunyuan3d"
PRIMARY_MODEL = "Hunyuan3D-2mini"
IMAGE_PROVIDER = "openai"
IMAGE_MODEL = "gpt-image-2"
OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations"
OPENAI_IMAGE_SIZE = "1024x1024"
OPENAI_IMAGE_QUALITY = "medium"
OPENAI_IMAGE_BACKGROUND = "transparent"
OPENAI_IMAGE_TIMEOUT_SECONDS = 240
MAX_CONCEPT_IMAGE_BYTES = 25 * 1024 * 1024
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
CONCEPT_IMAGE_ID_PATTERN = re.compile(r"^[a-f0-9]{32}$")
GENERATION_STEPS = 50
OCTREE_RESOLUTION = 384
PRESERVE_NATIVE_MESH = True
WEB_PREVIEW_FACE_BUDGET = 100_000
TRIPO_ENABLED = False

SKU_IMAGE_PATHS = {
    "GT-AIRLESS-030": "public/assets/products/gt-airless-030-v2.png",
    "GT-DROPPER-030": "public/assets/products/gt-dropper-030-v2.png",
    "GT-JAR-050": "public/assets/products/gt-jar-050-v2.png",
    "GT-MASK-FULL-025": "public/assets/products/gt-mask-full-025-v2.png",
    "GT-MASK-SPLIT-030": "public/assets/products/gt-mask-split-030-v2.png",
}


class GenerateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    sku: str
    concept_image_id: str = Field(
        alias="conceptImageId",
        pattern=r"^[a-f0-9]{32}$",
    )
    seed: int = Field(default=1234, ge=0, le=2_147_483_647)
    specifications: dict[str, str] = Field(default_factory=dict)


class ConceptImageRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    sku: str = Field(min_length=1, max_length=64)
    prompt: str = Field(min_length=12, max_length=1200)
    specifications: dict[str, str] = Field(default_factory=dict)

    @field_validator("sku", "prompt", mode="before")
    @classmethod
    def trim_text(cls, value: Any) -> Any:
        return value.strip() if isinstance(value, str) else value

    @field_validator("specifications")
    @classmethod
    def bound_specifications(cls, value: dict[str, str]) -> dict[str, str]:
        if len(value) > 12:
            raise ValueError("Too many specifications")
        for key, selected in value.items():
            if not key or len(key) > 64 or not selected or len(selected) > 128:
                raise ValueError("Invalid specification value")
        return value


class ImageGenerationUnavailable(RuntimeError):
    """Raised when the server-side GPT Image service cannot be used."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def stable_request_id(payload: Mapping[str, Any]) -> str:
    encoded = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:32]


def concept_cache_id(request: ConceptImageRequest) -> str:
    return stable_request_id(
        {
            "policy": "concept-image-v2",
            "sku": request.sku,
            "prompt": request.prompt,
            "specifications": request.specifications,
        }
    )


def generation_cache_id(request: GenerateRequest) -> str:
    return stable_request_id(
        {
            "policy": "managed-preview-v1",
            "sku": request.sku,
            "concept_image_id": request.concept_image_id,
            "seed": request.seed,
            "specifications": request.specifications,
            "worker": {
                "engine": PRIMARY_ENGINE,
                "model": PRIMARY_MODEL,
                "steps": GENERATION_STEPS,
                "octree_resolution": OCTREE_RESOLUTION,
            },
            "preview_face_budget": WEB_PREVIEW_FACE_BUDGET,
        }
    )


def cached_concept_public_id(
    cache_key: str,
    *,
    concept_root: Path | None = None,
    metadata_root: Path | None = None,
) -> str | None:
    if not CONCEPT_IMAGE_ID_PATTERN.fullmatch(cache_key):
        raise ValueError("Invalid concept cache key")

    resolved_concept_root = CONCEPT_ROOT if concept_root is None else concept_root
    resolved_metadata_root = (
        CONCEPT_METADATA_ROOT if metadata_root is None else metadata_root
    )
    metadata_path = resolved_metadata_root / f"{cache_key}.json"
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        public_id = metadata["public_id"]
    except (FileNotFoundError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        return None

    if not isinstance(public_id, str) or not CONCEPT_IMAGE_ID_PATTERN.fullmatch(
        public_id
    ):
        return None
    if not (resolved_concept_root / f"{public_id}.png").is_file():
        return None
    return public_id


def store_concept_cache_metadata(
    cache_key: str,
    public_id: str,
    *,
    metadata_root: Path | None = None,
) -> None:
    if not CONCEPT_IMAGE_ID_PATTERN.fullmatch(cache_key):
        raise ValueError("Invalid concept cache key")
    if not CONCEPT_IMAGE_ID_PATTERN.fullmatch(public_id):
        raise ValueError("Invalid concept image id")

    resolved_metadata_root = (
        CONCEPT_METADATA_ROOT if metadata_root is None else metadata_root
    )
    resolved_metadata_root.mkdir(parents=True, exist_ok=True)
    destination = resolved_metadata_root / f"{cache_key}.json"
    temporary_destination = resolved_metadata_root / f".{cache_key}.{uuid.uuid4().hex}.tmp"
    temporary_destination.write_text(
        json.dumps({"public_id": public_id}, separators=(",", ":")),
        encoding="utf-8",
    )
    temporary_destination.replace(destination)


def model_cache_path(
    cache_key: str,
    sku: str,
    output_root: Path | None = None,
) -> Path:
    if not CONCEPT_IMAGE_ID_PATTERN.fullmatch(cache_key):
        raise ValueError("Invalid model cache key")
    if sku not in SKU_IMAGE_PATHS:
        raise ValueError(f"Unknown catalog SKU: {sku}")

    resolved_output_root = OUTPUT_ROOT if output_root is None else output_root
    return (
        resolved_output_root
        / "model-cache"
        / cache_key
        / f"{sku.lower()}-{cache_key[:8]}.glb"
    )


def master_model_cache_path(
    cache_key: str,
    sku: str,
    output_root: Path | None = None,
) -> Path:
    preview_path = model_cache_path(cache_key, sku, output_root)
    return preview_path.parent / f"{sku.lower()}-{cache_key[:8]}-master.glb"


def stage_model_assets(
    source: Path,
    cache_key: str,
    sku: str,
    output_root: Path | None = None,
    *,
    target_faces: int = WEB_PREVIEW_FACE_BUDGET,
) -> dict[str, Any]:
    if target_faces < 1_000:
        raise ValueError("Web preview face budget is too small")

    import numpy as np
    import pymeshlab
    import trimesh

    preview_path = model_cache_path(cache_key, sku, output_root)
    master_path = master_model_cache_path(cache_key, sku, output_root)
    preview_path.parent.mkdir(parents=True, exist_ok=True)

    temporary_master = master_path.parent / f".{master_path.stem}.{uuid.uuid4().hex}.glb"
    shutil.copy2(source, temporary_master)
    temporary_master.replace(master_path)

    loaded = trimesh.load(master_path, force="scene", process=False)
    geometries = tuple(
        geometry
        for geometry in loaded.geometry.values()
        if getattr(geometry, "faces", None) is not None and len(geometry.faces)
    )
    if not geometries:
        raise RuntimeError("Generated model contains no mesh geometry")
    mesh = trimesh.util.concatenate(geometries)
    source_faces = len(mesh.faces)
    optimized = source_faces > target_faces

    temporary_preview = preview_path.parent / f".{preview_path.stem}.{uuid.uuid4().hex}.glb"
    if optimized:
        mesh_set = pymeshlab.MeshSet()
        mesh_set.add_mesh(
            pymeshlab.Mesh(
                vertex_matrix=np.asarray(mesh.vertices),
                face_matrix=np.asarray(mesh.faces),
            )
        )
        mesh_set.apply_filter(
            "meshing_decimation_quadric_edge_collapse",
            targetfacenum=target_faces,
            qualitythr=1.0,
            preserveboundary=True,
            boundaryweight=3,
            preservenormal=True,
            preservetopology=True,
            autoclean=True,
        )
        reduced = mesh_set.current_mesh()
        preview_mesh = trimesh.Trimesh(
            vertices=reduced.vertex_matrix(),
            faces=reduced.face_matrix(),
            process=False,
        )
        preview_mesh.update_faces(preview_mesh.nondegenerate_faces())
        preview_mesh.update_faces(preview_mesh.unique_faces())
        preview_mesh.remove_unreferenced_vertices()
        preview_mesh.export(temporary_preview)
        preview_faces = len(preview_mesh.faces)
    else:
        shutil.copy2(master_path, temporary_preview)
        preview_faces = source_faces
    temporary_preview.replace(preview_path)

    return {
        "master_path": str(master_path.resolve()),
        "preview_path": str(preview_path.resolve()),
        "source_faces": source_faces,
        "preview_faces": preview_faces,
        "optimized": optimized,
    }


def resolve_sku_image(sku: str, project_root: Path = PROJECT_ROOT) -> Path:
    relative_path = SKU_IMAGE_PATHS.get(sku)
    if relative_path is None:
        raise ValueError(f"Unknown catalog SKU: {sku}")

    image_path = (project_root / relative_path).resolve()
    if not image_path.is_file():
        raise FileNotFoundError(f"SKU reference image is missing: {image_path}")
    return image_path


def resolve_concept_image(
    concept_image_id: str,
    concept_root: Path = CONCEPT_ROOT,
) -> Path:
    if not CONCEPT_IMAGE_ID_PATTERN.fullmatch(concept_image_id):
        raise ValueError("Invalid concept image id")

    resolved_root = concept_root.resolve()
    image_path = (resolved_root / f"{concept_image_id}.png").resolve()
    if image_path.parent != resolved_root:
        raise ValueError("Invalid concept image id")
    if not image_path.is_file():
        raise FileNotFoundError("Concept image is missing")
    return image_path


def image_generator_details(
    environment: Mapping[str, str] | None = None,
) -> dict[str, str | bool]:
    resolved_environment = os.environ if environment is None else environment
    return {
        "provider": IMAGE_PROVIDER,
        "model": IMAGE_MODEL,
        "configured": bool(resolved_environment.get("OPENAI_API_KEY", "").strip()),
    }


def build_concept_prompt(request: ConceptImageRequest) -> str:
    specification_lines = "\n".join(
        f"- {key}: {value}" for key, value in sorted(request.specifications.items())
    ) or "- No additional specification values"
    return f"""Create one manufacturable cosmetic packaging concept for image-to-3D reconstruction.

Base catalog SKU: {request.sku}
Selected specifications:
{specification_lines}

Design brief:
{request.prompt}

Show exactly one complete product, isolated and centered, in a front three-quarter product view. Keep every part fully visible with a clean, readable silhouette and realistic production proportions. Render the requested material, colour, finish and simple logo placement when specified, but do not invent extra copy, props, hands, scenery or secondary packages. Use a transparent background and soft neutral studio lighting. The image will be approved by a user and then sent to a managed image-to-3D worker."""


def decode_openai_image_response(payload: bytes) -> bytes:
    try:
        document = json.loads(payload.decode("utf-8"))
        encoded = document["data"][0]["b64_json"]
        if not isinstance(encoded, str):
            raise TypeError("b64_json must be a string")
        image = base64.b64decode(encoded, validate=True)
    except (
        KeyError,
        IndexError,
        TypeError,
        ValueError,
        UnicodeDecodeError,
        binascii.Error,
    ) as error:
        raise RuntimeError("GPT Image 2 returned no decodable image") from error

    if not image.startswith(PNG_SIGNATURE):
        raise RuntimeError("GPT Image 2 did not return a valid PNG")
    if len(image) > MAX_CONCEPT_IMAGE_BYTES:
        raise RuntimeError("GPT Image 2 image exceeds the local size limit")
    return image


def generate_concept_png(request: ConceptImageRequest) -> bytes:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise ImageGenerationUnavailable(
            "未配置 OPENAI_API_KEY，暂时不能生成 GPT Image 2 方案图"
        )

    payload = json.dumps(
        {
            "model": IMAGE_MODEL,
            "prompt": build_concept_prompt(request),
            "size": OPENAI_IMAGE_SIZE,
            "quality": OPENAI_IMAGE_QUALITY,
            "background": OPENAI_IMAGE_BACKGROUND,
            "output_format": "png",
        }
    ).encode("utf-8")
    openai_request = urllib.request.Request(
        OPENAI_IMAGE_URL,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "guangtuo-local-3d-studio/1.1",
        },
    )

    try:
        with urllib.request.urlopen(
            openai_request,
            timeout=OPENAI_IMAGE_TIMEOUT_SECONDS,
        ) as response:
            return decode_openai_image_response(response.read())
    except urllib.error.HTTPError as error:
        if error.code == 401:
            message = "OpenAI API Key 无效或没有 GPT Image 2 权限"
        elif error.code == 403:
            message = "当前 OpenAI 项目不能使用 GPT Image 2，请检查组织验证和项目权限"
        elif error.code == 429:
            message = "GPT Image 2 请求受限，请检查速率限制或账户额度"
        else:
            message = f"GPT Image 2 请求失败（HTTP {error.code}）"
        raise ImageGenerationUnavailable(message) from error
    except (urllib.error.URLError, TimeoutError) as error:
        raise ImageGenerationUnavailable("无法连接 OpenAI 图片服务") from error


def create_job_record(
    *,
    job_id: str,
    sku: str,
    engine: str,
    steps: int,
    seed: int,
    octree_resolution: int,
    preserve_native_mesh: bool,
    concept_image_id: str,
    specifications: dict[str, str] | None = None,
    cache_key: str | None = None,
) -> dict[str, Any]:
    timestamp = utc_now()
    return {
        "id": job_id,
        "engine": engine,
        "sku": sku,
        "steps": steps,
        "seed": seed,
        "octree_resolution": octree_resolution,
        "preserve_native_mesh": preserve_native_mesh,
        "concept_image_id": concept_image_id,
        "cache_key": cache_key or job_id,
        "specifications": dict(specifications or {}),
        "status": "queued",
        "progress": 5,
        "message": "正在安排生成",
        "model_url": None,
        "model_path": None,
        "error": None,
        "created_at": timestamp,
        "updated_at": timestamp,
    }


def public_job(job: dict[str, Any], *, cached: bool = False) -> dict[str, Any]:
    public_keys = {
        "id",
        "sku",
        "seed",
        "concept_image_id",
        "specifications",
        "status",
        "progress",
        "message",
        "model_url",
        "error",
        "created_at",
        "updated_at",
    }
    return {
        **{key: value for key, value in job.items() if key in public_keys},
        "cached": cached,
    }


def output_path(value: Any) -> Path:
    if isinstance(value, str):
        candidate = value
    elif isinstance(value, dict):
        candidate = value.get("path") or value.get("name") or value.get("value")
    else:
        candidate = getattr(value, "path", None) or getattr(value, "name", None)

    if not candidate:
        raise RuntimeError("Hunyuan3D returned no model file")
    path = Path(candidate)
    if not path.is_file():
        raise RuntimeError(f"Hunyuan3D model file is unavailable: {path}")
    return path


jobs: dict[str, dict[str, Any]] = {}
job_cache_index: dict[str, str] = {}
jobs_lock = threading.Lock()
concept_locks: dict[str, threading.Lock] = {}
concept_locks_guard = threading.Lock()
gpu_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="hunyuan3d-studio")


def concept_lock(cache_key: str) -> threading.Lock:
    with concept_locks_guard:
        return concept_locks.setdefault(cache_key, threading.Lock())


def update_job(job_id: str, **changes: Any) -> None:
    with jobs_lock:
        jobs[job_id].update(changes, updated_at=utc_now())


def run_generation(job_id: str) -> None:
    try:
        with jobs_lock:
            job = dict(jobs[job_id])

        update_job(
            job_id,
            status="preparing",
            progress=15,
            message="正在准备方案图",
        )
        image_path = resolve_concept_image(job["concept_image_id"])
        client = Client(MODEL_WORKER_URL, verbose=False)

        update_job(
            job_id,
            status="generating",
            progress=35,
            message="正在生成 3D 预览",
        )
        shape_result = client.predict(
            caption=None,
            image=handle_file(str(image_path)),
            mv_image_front=None,
            mv_image_back=None,
            mv_image_left=None,
            mv_image_right=None,
            steps=job["steps"],
            guidance_scale=5.0,
            seed=job["seed"],
            octree_resolution=job["octree_resolution"],
            check_box_rembg=False,
            num_chunks=8000,
            randomize_seed=False,
            api_name="/shape_generation",
        )
        raw_model = output_path(shape_result[0])

        update_job(
            job_id,
            status="finalizing",
            progress=80,
            message="正在完成预览",
        )

        assets = stage_model_assets(
            raw_model,
            job["cache_key"],
            job["sku"],
        )
        destination = Path(assets["preview_path"])

        update_job(
            job_id,
            status="completed",
            progress=100,
            message="3D 预览已完成",
            model_url=f"/jobs/{job_id}/model",
            model_path=str(destination.resolve()),
            master_model_path=assets["master_path"],
            source_faces=assets["source_faces"],
            preview_faces=assets["preview_faces"],
            preview_optimized=assets["optimized"],
        )
    except Exception as error:
        print(f"Studio generation failed for {job_id}: {error!r}")
        update_job(
            job_id,
            status="failed",
            progress=100,
            message="这次没有生成成功",
            error="请稍后重试，或先保存方案图与包装顾问沟通。",
        )


def restore_cached_job(
    request: GenerateRequest,
    public_job_id: str,
    output_root: Path | None = None,
) -> dict[str, Any] | None:
    if not CONCEPT_IMAGE_ID_PATTERN.fullmatch(public_job_id):
        raise ValueError("Invalid public job id")

    cache_key = generation_cache_id(request)
    destination = model_cache_path(cache_key, request.sku, output_root)
    if not destination.is_file():
        return None

    job = create_job_record(
        job_id=public_job_id,
        sku=request.sku,
        engine=PRIMARY_ENGINE,
        steps=GENERATION_STEPS,
        seed=request.seed,
        octree_resolution=OCTREE_RESOLUTION,
        preserve_native_mesh=PRESERVE_NATIVE_MESH,
        concept_image_id=request.concept_image_id,
        specifications=request.specifications,
        cache_key=cache_key,
    )
    timestamp = utc_now()
    job.update(
        status="completed",
        progress=100,
        message="3D 预览已完成",
        model_url=f"/jobs/{public_job_id}/model",
        model_path=str(destination.resolve()),
        updated_at=timestamp,
    )
    return job


def gpu_details() -> dict[str, str | None]:
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.total,driver_version",
                "--format=csv,noheader,nounits",
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=4,
        )
        name, memory, driver = [part.strip() for part in result.stdout.splitlines()[0].split(",")]
        return {"name": name, "memory_mb": memory, "driver": driver}
    except (FileNotFoundError, subprocess.SubprocessError, IndexError, ValueError):
        return {"name": None, "memory_mb": None, "driver": None}


def model_worker_online() -> bool:
    try:
        with urllib.request.urlopen(f"{MODEL_WORKER_URL}/gradio_api/info", timeout=2):
            return True
    except Exception:
        return False


def public_service_status(
    *, image_ready: bool, model_ready: bool, queue_depth: int
) -> dict[str, Any]:
    bounded_depth = max(0, queue_depth)
    return {
        "ready": image_ready and model_ready,
        "image_ready": image_ready,
        "model_ready": model_ready,
        "busy": bounded_depth > 0,
        "estimated_wait_seconds": bounded_depth * 90,
    }


def generated_asset_headers() -> dict[str, str]:
    return {"Cache-Control": "private, max-age=604800, immutable"}


app = FastAPI(title="Guangtuo SKU 3D Studio", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get(
            "STUDIO_ALLOWED_ORIGINS",
            "http://127.0.0.1:3000,http://localhost:3000",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    return public_service_status(
        image_ready=bool(image_generator_details()["configured"]),
        model_ready=model_worker_online(),
        queue_depth=sum(
            job["status"] not in {"completed", "failed"} for job in jobs.values()
        ),
    )


@app.post("/concept-images", status_code=201)
def create_concept_image(request: ConceptImageRequest) -> dict[str, Any]:
    try:
        resolve_sku_image(request.sku)
    except (ValueError, FileNotFoundError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    cache_key = concept_cache_id(request)
    with concept_lock(cache_key):
        concept_id = cached_concept_public_id(cache_key)
        cached = concept_id is not None
        if concept_id is None:
            try:
                image = generate_concept_png(request)
            except ImageGenerationUnavailable as error:
                raise HTTPException(
                    status_code=503,
                    detail="方案图暂时无法生成，请稍后重试。",
                ) from error
            except RuntimeError as error:
                raise HTTPException(
                    status_code=502,
                    detail="方案图暂时无法生成，请稍后重试。",
                ) from error

            concept_id = uuid.uuid4().hex
            CONCEPT_ROOT.mkdir(parents=True, exist_ok=True)
            destination = CONCEPT_ROOT / f"{concept_id}.png"
            temporary_destination = CONCEPT_ROOT / f".{concept_id}.tmp"
            temporary_destination.write_bytes(image)
            temporary_destination.replace(destination)
            store_concept_cache_metadata(cache_key, concept_id)
    return {
        "id": concept_id,
        "sku": request.sku,
        "prompt": request.prompt,
        "specifications": dict(request.specifications),
        "image_url": f"/concept-images/{concept_id}",
        "created_at": utc_now(),
        "cached": cached,
    }


@app.get("/concept-images/{concept_image_id}")
def get_concept_image(concept_image_id: str) -> FileResponse:
    try:
        image_path = resolve_concept_image(concept_image_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return FileResponse(
        path=image_path,
        media_type="image/png",
        headers=generated_asset_headers(),
    )


@app.post("/jobs", status_code=202)
def create_job(request: GenerateRequest) -> dict[str, Any]:
    try:
        resolve_sku_image(request.sku)
        resolve_concept_image(request.concept_image_id)
    except (ValueError, FileNotFoundError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    cache_key = generation_cache_id(request)
    with jobs_lock:
        existing_job_id = job_cache_index.get(cache_key)
        existing = jobs.get(existing_job_id) if existing_job_id else None
        if existing is not None and existing["status"] != "failed":
            return public_job(dict(existing), cached=True)
        if existing is not None:
            job_cache_index.pop(cache_key, None)

        job_id = uuid.uuid4().hex
        job = restore_cached_job(request, job_id)
        cached = job is not None
        if job is None:
            job = create_job_record(
                job_id=job_id,
                sku=request.sku,
                engine=PRIMARY_ENGINE,
                steps=GENERATION_STEPS,
                seed=request.seed,
                octree_resolution=OCTREE_RESOLUTION,
                preserve_native_mesh=PRESERVE_NATIVE_MESH,
                concept_image_id=request.concept_image_id,
                specifications=request.specifications,
                cache_key=cache_key,
            )
        jobs[job_id] = job
        job_cache_index[cache_key] = job_id

    if not cached:
        gpu_executor.submit(run_generation, job_id)
    return public_job(job, cached=cached)


@app.get("/jobs/{job_id}")
def get_job(job_id: str) -> dict[str, Any]:
    with jobs_lock:
        job = jobs.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Job not found")
        return public_job(dict(job), cached=False)


@app.get("/jobs/{job_id}/model")
def get_model(job_id: str) -> FileResponse:
    with jobs_lock:
        job = jobs.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Job not found")
        model_path = job.get("model_path")
        sku = job["sku"]

    if not model_path or not Path(model_path).is_file():
        raise HTTPException(status_code=409, detail="Model is not ready")
    return FileResponse(
        path=model_path,
        media_type="model/gltf-binary",
        filename=f"{sku.lower()}-preview.glb",
        headers=generated_asset_headers(),
    )
