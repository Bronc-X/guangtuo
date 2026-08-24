from __future__ import annotations

import argparse
import hashlib
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ModelSpec:
    name: str
    repo_id: str
    revision: str
    directory: str
    allow_patterns: tuple[str, ...]
    expected_sha256: dict[str, str]


MODELS = {
    "triposg": ModelSpec(
        name="TripoSG",
        repo_id="VAST-AI/TripoSG",
        revision="2c1c516d22d58db486a058d98d31bb6177344e06",
        directory="TripoSG",
        allow_patterns=("*.json", "*.safetensors"),
        expected_sha256={
            "image_encoder_dinov2/model.safetensors": "399fba97a95f22c36834418bc69373364a99af3a1153da1c0fb31db567c92e23",
            "transformer/diffusion_pytorch_model.safetensors": "9192b5923f7b605b394192809aa2ceb73bf0f4009674d8e3b999b45bb97d4bf2",
            "vae/diffusion_pytorch_model.safetensors": "a2e667c24927a5a35e5f19fcb4c75890e9399aa966b6db8131d7df733a750c8b",
        },
    ),
}


def configure_hub(cache_dir: Path) -> None:
    defaults = {
        "HF_HOME": str(cache_dir.resolve()),
        "HF_HUB_DISABLE_TELEMETRY": "1",
        "HF_HUB_ETAG_TIMEOUT": "10",
        "HF_HUB_DOWNLOAD_TIMEOUT": "60",
        "HF_XET_HIGH_PERFORMANCE": "1",
    }
    for name, value in defaults.items():
        os.environ.setdefault(name, value)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(16 * 1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def verify(spec: ModelSpec, model_dir: Path) -> None:
    for relative_path, expected in spec.expected_sha256.items():
        path = model_dir / relative_path
        if not path.is_file():
            raise RuntimeError(f"缺少权重文件: {path}")
        actual = sha256(path)
        if actual != expected:
            raise RuntimeError(f"权重校验失败: {path} expected={expected} actual={actual}")
        print(f"verified {spec.name}: {relative_path}", flush=True)


def download(spec: ModelSpec, root: Path, max_workers: int) -> None:
    from huggingface_hub import snapshot_download

    model_dir = root / spec.directory
    model_dir.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    print(
        f"downloading {spec.repo_id}@{spec.revision} -> {model_dir} "
        f"(official Hugging Face Xet, workers={max_workers})",
        flush=True,
    )
    snapshot_download(
        repo_id=spec.repo_id,
        revision=spec.revision,
        local_dir=model_dir,
        allow_patterns=list(spec.allow_patterns),
        max_workers=max_workers,
    )
    print(f"downloaded {spec.name} in {time.monotonic() - started:.1f}s", flush=True)
    verify(spec, model_dir)


def main() -> int:
    parser = argparse.ArgumentParser(description="Resumable, pinned TripoSG model downloader")
    parser.add_argument("--model", choices=("all", *MODELS.keys()), default="all")
    parser.add_argument("--root", type=Path, default=Path("pretrained_weights"))
    parser.add_argument("--cache", type=Path, default=Path("downloads/huggingface"))
    parser.add_argument("--max-workers", type=int, default=16)
    args = parser.parse_args()

    if not 1 <= args.max_workers <= 32:
        parser.error("--max-workers 必须在 1 到 32 之间")

    configure_hub(args.cache)
    args.root.mkdir(parents=True, exist_ok=True)
    selected = MODELS.values() if args.model == "all" else (MODELS[args.model],)
    try:
        for spec in selected:
            download(spec, args.root, args.max_workers)
    except KeyboardInterrupt:
        print("下载已中断；重新运行同一命令会从 Hugging Face/Xet 缓存继续。", file=sys.stderr)
        return 130
    except Exception as error:
        print(f"下载失败但缓存已保留，可直接重试: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
