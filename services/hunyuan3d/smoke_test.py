import importlib
import importlib.metadata
import json
import os
import platform
import sys
import time
import traceback

import psutil


PROCESS = psutil.Process(os.getpid())


def rss_mb():
    return round(PROCESS.memory_info().rss / 1024 / 1024, 2)


def timed_import(name):
    started = time.perf_counter()
    before = rss_mb()
    try:
        module = importlib.import_module(name)
        return {
            "module": name,
            "ok": True,
            "seconds": round(time.perf_counter() - started, 3),
            "rss_before_mb": before,
            "rss_after_mb": rss_mb(),
            "version": getattr(module, "__version__", None),
        }
    except Exception as exc:
        return {
            "module": name,
            "ok": False,
            "seconds": round(time.perf_counter() - started, 3),
            "rss_before_mb": before,
            "rss_after_mb": rss_mb(),
            "error": f"{type(exc).__name__}: {exc}",
            "traceback": traceback.format_exc().splitlines()[-8:],
        }


result = {
    "python": sys.version,
    "platform": platform.platform(),
    "started_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    "initial_rss_mb": rss_mb(),
    "imports": [],
}

for module_name in [
    "torch",
    "torchvision",
    "numpy",
    "cv2",
    "diffusers",
    "transformers",
    "trimesh",
    "pymeshlab",
    "xatlas",
    "onnxruntime",
    "rembg",
    "hy3dgen",
    "hy3dgen.shapegen",
    "hy3dgen.texgen",
]:
    result["imports"].append(timed_import(module_name))

import torch

result["torch"] = {
    "version": torch.__version__,
    "cuda_compiled": torch.version.cuda,
    "cuda_available": torch.cuda.is_available(),
    "cuda_device_count": torch.cuda.device_count(),
    "xpu_available": bool(hasattr(torch, "xpu") and torch.xpu.is_available()),
    "mps_available": bool(
        hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
    ),
    "cpu_tensor_ok": bool(torch.rand(5, 3).sum().item()),
}

asset_path = os.path.join(
    os.path.dirname(__file__),
    "Hunyuan3D-2-f8db63096c8282cb27354314d896feba5ba6ff8a",
    "assets",
    "1.glb",
)
asset_started = time.perf_counter()
try:
    import trimesh

    scene_or_mesh = trimesh.load(asset_path, force=None)
    geometry_count = (
        len(scene_or_mesh.geometry) if isinstance(scene_or_mesh, trimesh.Scene) else 1
    )
    result["bundled_glb"] = {
        "ok": True,
        "path": asset_path,
        "bytes": os.path.getsize(asset_path),
        "geometry_count": geometry_count,
        "seconds": round(time.perf_counter() - asset_started, 3),
    }
except Exception as exc:
    result["bundled_glb"] = {
        "ok": False,
        "error": f"{type(exc).__name__}: {exc}",
        "traceback": traceback.format_exc().splitlines()[-8:],
    }

for package_name in [
    "hy3dgen",
    "torch",
    "torchvision",
    "diffusers",
    "transformers",
    "numpy",
    "pymeshlab",
    "xatlas",
    "onnxruntime",
    "rembg",
]:
    try:
        result.setdefault("packages", {})[package_name] = importlib.metadata.version(
            package_name
        )
    except importlib.metadata.PackageNotFoundError:
        result.setdefault("packages", {})[package_name] = None

result["final_rss_mb"] = rss_mb()
result["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
print(json.dumps(result, ensure_ascii=False, indent=2))
