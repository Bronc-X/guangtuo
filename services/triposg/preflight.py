from __future__ import annotations

import argparse
import json
import platform
import shutil
import sys
from pathlib import Path


MINIMUM_VRAM_GIB = 8
MINIMUM_FREE_DISK_GIB = 12


def gib(value: int) -> float:
    return round(value / 1024**3, 2)


def inspect_environment(weights_dir: Path) -> tuple[dict[str, object], list[str]]:
    failures: list[str] = []
    disk = shutil.disk_usage(weights_dir.parent if weights_dir.parent.exists() else Path.cwd())
    report: dict[str, object] = {
        "platform": platform.platform(),
        "python": platform.python_version(),
        "weights_dir": str(weights_dir.resolve()),
        "free_disk_gib": gib(disk.free),
        "minimum_free_disk_gib": MINIMUM_FREE_DISK_GIB,
        "minimum_vram_gib": MINIMUM_VRAM_GIB,
    }

    if gib(disk.free) < MINIMUM_FREE_DISK_GIB:
        failures.append(f"至少需要 {MINIMUM_FREE_DISK_GIB} GiB 可用磁盘")

    try:
        import torch
    except ImportError:
        report["torch"] = "not_installed"
        failures.append("未安装 PyTorch/CUDA 运行时")
        return report, failures

    report["torch"] = torch.__version__
    report["cuda_available"] = torch.cuda.is_available()
    if not torch.cuda.is_available():
        failures.append("未检测到可用的 NVIDIA CUDA GPU")
        return report, failures

    properties = torch.cuda.get_device_properties(0)
    vram_gib = gib(properties.total_memory)
    report["gpu"] = properties.name
    report["vram_gib"] = vram_gib
    report["cuda_runtime"] = torch.version.cuda
    if vram_gib < MINIMUM_VRAM_GIB:
        failures.append(f"显存 {vram_gib} GiB，低于最低要求 {MINIMUM_VRAM_GIB} GiB")

    return report, failures


def main() -> int:
    parser = argparse.ArgumentParser(description="TripoSG GPU and disk preflight")
    parser.add_argument("--weights-dir", type=Path, default=Path("pretrained_weights"))
    parser.add_argument("--require-ready", action="store_true")
    args = parser.parse_args()

    report, failures = inspect_environment(args.weights_dir)
    report["ready"] = not failures
    report["failures"] = failures
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if args.require_ready and failures else 0


if __name__ == "__main__":
    sys.exit(main())
