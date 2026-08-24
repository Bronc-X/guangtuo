from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


SERVICE_DIR = Path(__file__).resolve().parent


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate and validate one TripoSG GLB")
    parser.add_argument("--image-input", type=Path, required=True)
    parser.add_argument("--output-path", type=Path, required=True)
    parser.add_argument("--weights-dir", type=Path, default=SERVICE_DIR / "pretrained_weights")
    parser.add_argument("--faces", type=int, default=50_000)
    args = parser.parse_args()

    try:
        subprocess.run(
            [
                sys.executable,
                str(SERVICE_DIR / "preflight.py"),
                "--weights-dir",
                str(args.weights_dir),
                "--require-ready",
            ],
            check=True,
        )
        subprocess.run(
            [
                sys.executable,
                str(SERVICE_DIR / "inference.py"),
                "--image-input",
                str(args.image_input),
                "--output-path",
                str(args.output_path),
                "--weights-dir",
                str(args.weights_dir),
                "--faces",
                str(args.faces),
            ],
            check=True,
        )
    except subprocess.CalledProcessError as error:
        print(f"TripoSG smoke test stopped at a failed prerequisite (exit {error.returncode}).", file=sys.stderr)
        return error.returncode

    import trimesh

    loaded = trimesh.load(args.output_path, force="scene")
    geometries = tuple(loaded.geometry.values())
    if not geometries:
        raise RuntimeError("GLB 不包含任何 mesh geometry")
    mesh = trimesh.util.concatenate(geometries)
    if len(mesh.vertices) == 0 or len(mesh.faces) == 0:
        raise RuntimeError("GLB mesh 为空")
    if len(mesh.faces) > args.faces * 1.02:
        raise RuntimeError(f"GLB 面数 {len(mesh.faces)} 超过预算 {args.faces}")

    print(
        json.dumps(
            {
                "status": "passed",
                "output": str(args.output_path.resolve()),
                "bytes": args.output_path.stat().st_size,
                "vertices": len(mesh.vertices),
                "faces": len(mesh.faces),
                "watertight": bool(mesh.is_watertight),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
