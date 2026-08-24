from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
from pathlib import Path


SERVICE_DIR = Path(__file__).resolve().parent
UPSTREAM_DIR = SERVICE_DIR / "upstream"
if not (UPSTREAM_DIR / "triposg").is_dir():
    UPSTREAM_DIR = SERVICE_DIR / "source-git"
sys.path.insert(0, str(UPSTREAM_DIR))
sys.path.insert(0, str(UPSTREAM_DIR / "scripts"))


def require_transparent_background(image_path: Path) -> None:
    from PIL import Image

    with Image.open(image_path) as image:
        if "A" not in image.getbands():
            raise ValueError("输入必须是带透明背景的 PNG（需要有效 Alpha 通道）")
        histogram = image.getchannel("A").histogram()
        pixel_count = image.width * image.height
        transparent = sum(histogram[:13])
        opaque = sum(histogram[243:])
        if transparent < pixel_count * 0.01 or opaque < pixel_count * 0.01:
            raise ValueError("Alpha 通道必须同时包含至少 1% 的透明区域和不透明主体")


def simplify_mesh(mesh, target_faces: int):
    if target_faces <= 0 or mesh.faces.shape[0] <= target_faces:
        return mesh

    import fast_simplification
    import trimesh

    target_reduction = 1 - (target_faces / mesh.faces.shape[0])
    vertices, faces = fast_simplification.simplify(
        mesh.vertices,
        mesh.faces,
        target_reduction=target_reduction,
    )
    simplified = trimesh.Trimesh(
        vertices=vertices,
        faces=faces,
        process=False,
    )
    simplified.update_faces(simplified.nondegenerate_faces())
    simplified.update_faces(simplified.unique_faces())
    simplified.remove_unreferenced_vertices()
    return simplified


def prepare_unicode_safe_image(image_path: Path, bg_color, prepare_image):
    try:
        str(image_path).encode("ascii")
    except UnicodeEncodeError:
        with tempfile.TemporaryDirectory(prefix="triposg-input-") as temp_dir:
            staged_path = Path(temp_dir) / "input.png"
            shutil.copyfile(image_path, staged_path)
            return prepare_image(str(staged_path), bg_color=bg_color, rmbg_net=None)
    return prepare_image(str(image_path), bg_color=bg_color, rmbg_net=None)


def main() -> int:
    parser = argparse.ArgumentParser(description="Offline TripoSG GLB inference")
    parser.add_argument("--image-input", type=Path, required=True)
    parser.add_argument("--output-path", type=Path, required=True)
    parser.add_argument("--weights-dir", type=Path, default=SERVICE_DIR / "pretrained_weights")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--num-inference-steps", type=int, default=50)
    parser.add_argument("--guidance-scale", type=float, default=7.0)
    parser.add_argument("--faces", type=int, default=50_000)
    args = parser.parse_args()

    import torch

    if not torch.cuda.is_available():
        parser.error("TripoSG 需要 NVIDIA CUDA GPU，本机未检测到 CUDA")
    if torch.cuda.get_device_properties(0).total_memory < 8 * 1024**3:
        parser.error("TripoSG 至少需要 8 GiB NVIDIA 显存")
    if not args.image_input.is_file():
        parser.error(f"输入图片不存在: {args.image_input}")
    try:
        require_transparent_background(args.image_input)
    except ValueError as error:
        parser.error(str(error))

    triposg_dir = args.weights_dir / "TripoSG"
    if not triposg_dir.is_dir():
        parser.error("权重未下载；先运行 download_models.py")

    import numpy as np
    import trimesh
    from image_process import prepare_image
    from triposg.pipelines.pipeline_triposg import TripoSGPipeline

    device = "cuda"
    pipe = TripoSGPipeline.from_pretrained(triposg_dir).to(device, torch.float16)

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    image = prepare_unicode_safe_image(
        args.image_input,
        bg_color=np.array([1.0, 1.0, 1.0]),
        prepare_image=prepare_image,
    )
    with torch.no_grad():
        output = pipe(
            image=image,
            generator=torch.Generator(device=device).manual_seed(args.seed),
            num_inference_steps=args.num_inference_steps,
            guidance_scale=args.guidance_scale,
        ).samples[0]
    mesh = trimesh.Trimesh(
        output[0].astype(np.float32),
        np.ascontiguousarray(output[1]),
    )
    mesh = simplify_mesh(
        mesh,
        target_faces=args.faces,
    )
    mesh.export(args.output_path)
    print(f"GLB saved: {args.output_path.resolve()} ({args.output_path.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
