# TripoSG upstream patches

Pinned upstream commit: `fc5c40990181e2a756c4e0b1c2f4d6b5202faf8c`.

Local production patch scope:

1. `requirements.txt` removes `diso` (CC BY-NC 4.0) and `pymeshlab` (GPL3), then adds `fast-simplification==0.2.0` (MIT).
2. `triposg/inference_utils.py` replaces the inference-only `DiffDMC` call with `skimage.measure.marching_cubes`, which is already used by the upstream non-flash decoder.
3. The wrapper requires a transparent PNG and never imports or invokes the upstream RMBG example.
4. NumPy is raised from `1.22.3` to `1.26.4`, satisfying the pinned OpenCV wheel across the target and cross-platform resolver while remaining inside SciPy 1.10's supported range.

No model architecture, scheduler, transformer, image encoder, VAE weights or diffusion sampling logic is changed. The mesh extraction change still requires visual and topology regression testing on the target RTX 5070 Ti before production use.
