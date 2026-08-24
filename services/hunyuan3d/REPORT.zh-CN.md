# Hunyuan3D-2 本机 Smoke Test 报告

> 历史说明：本报告记录的是 NVIDIA 显卡接入前的 CPU/Intel 环境预检，不代表当前生产状态。当前项目已在 RTX 5070 Ti 上完成实际推理并选择 Hunyuan3D-2mini 为主引擎；现行启动与质量配置以本目录 `README.md` 为准。

测试时间：2026-08-21（Asia/Shanghai）

## 结论

本机完成了源码固定、官方依赖安装、核心导入、CLI/API 入口、模型仓库可达性、配置下载、权重元数据以及仓库自带 GLB 读取测试。以上轻量链路通过。

本机没有枚举到 NVIDIA GPU 或 NVIDIA 驱动，也没有 CUDA Toolkit。迁移前的 CPU 环境报告 `cuda_available=false`；迁移后已新增独立 GPU 环境，PyTorch 为 `2.7.1+cu128`、`cuda_built=true`，并确认包含 RTX 3070 Ti 所需的 `sm_86` 内核，但仍因 Windows 设备层不存在 NVIDIA 设备而报告 `device_count=0`。因此没有进入 Hunyuan3D-2 的实际 CUDA 推理路径，没有生成新的 GLB，也没有伪造质量或速度数据。

简要判定：**代码与基础依赖可用；模型权重可获取；这台机器当前不能按官方路径完成代表性的本地 3D 推理。**

## 测试边界与固定版本

- 误发项目未写入任何 Hunyuan 文件；原独立测试目录已迁入当前项目，旧路径已移除。
- 当前测试根目录：`services\hunyuan3d`
- 源码 commit：`f8db63096c8282cb27354314d896feba5ba6ff8a`
- GitHub archive SHA-256：`1BE140879646034A98941E494072CE0AB26918FDC2FB59210443D56D41BC5622`
- Mini 模型 revision：`f90a0f7df7d5e6f71109cf333f6a95a0ae3194a6`
- Mini 标准 safetensors：3,819,958,234 bytes；整个模型仓库约 25,258,959,889 bytes。

Git 端点两次返回 `Recv failure: Connection was reset`。随后改用固定 commit 的 GitHub 官方 codeload archive，成功下载 80,303,566 bytes 并校验 SHA-256。源码解压后 226 个文件、约 78.43 MiB。

## 本机环境

- Windows 11 Pro 10.0.26200 build 26200
- Intel Core Ultra X7 358H，16 logical cores
- 63.49 GiB RAM
- Intel Arc B390 GPU，驱动 32.0.101.8509
- 无 `nvidia-smi`、无 `nvcc`、无 WSL、无 Docker、无 Conda
- 测试前 C 盘可用约 1,513.51 GiB
- Python 3.12.10，独立 venv

## 实际安装与版本

实际执行：

```powershell
python -m venv services\hunyuan3d\.venv
services\hunyuan3d\.venv\Scripts\python.exe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
services\hunyuan3d\.venv\Scripts\python.exe -m pip install -r requirements.txt
services\hunyuan3d\.venv\Scripts\python.exe -m pip install -e . --no-deps
```

耗时：venv 14.91 秒；CPU PyTorch 192.02 秒；官方 requirements 377.29 秒；editable 安装约 10.59 秒。

关键解析版本：`hy3dgen 2.0.2`、`torch 2.13.0+cpu`、`torchvision 0.28.0+cpu`、`diffusers 0.40.0`、`transformers 5.15.1`、`numpy 2.5.2`、`pymeshlab 2025.7.post1`、`onnxruntime 1.29.0`。

仓库 requirements 未固定大部分版本，因此上述组合是 2026-08-21 当日解析结果，不代表腾讯发布时的原始验证组合。`api_server.py --help` 出现一个 Transformers deprecation warning，但入口仍成功退出。

## 迁入后的 RTX 3070 Ti 修复验证

- 新增隔离环境：`.gpu-venv`，Python 3.10.21。
- GPU PyTorch：`torch 2.7.1+cu128`、`torchvision 0.22.1+cu128`。
- `pip check`：111 个包兼容。
- CUDA 构建：`USE_CUDA=ON`、CUDA 12.8、cuDNN 9.7.1。
- 编译架构包含：`sm_50 sm_60 sm_61 sm_70 sm_75 sm_80 sm_86 sm_90 sm_100 sm_120`。
- `hy3dgen.shapegen` 导入通过；`gradio_app.py --help` 退出码 0。
- 实际 CUDA 张量分配失败信息已从“PyTorch 未编译 CUDA”收敛为“Found no NVIDIA driver”，证明 Python/CUDA wheel 已修复，剩余阻塞位于 Windows 硬件/驱动枚举层。
- `run-rtx3070ti.ps1` 固定使用 Mini 几何模型、`--low_vram_mode` 与 `--disable_tex`；这是 8 GiB 级 3070 Ti 的可运行边界，不承诺纹理生成。

## Smoke Test 结果

通过：

- `pip check`：`No broken requirements found.`
- `python -m compileall -q hy3dgen`
- `gradio_app.py --help`
- `api_server.py --help`
- 导入 `torch/torchvision/numpy/cv2/diffusers/transformers/trimesh/pymeshlab/xatlas/onnxruntime/rembg/hy3dgen.shapegen/hy3dgen.texgen`
- 用 Trimesh 读取仓库样例 `assets/1.glb`：720,764 bytes，1 个 geometry
- 匿名、固定 revision 下载 Mini 配置文件；配置 SHA-256 为 `cabcba7f6115752c8fe5b370e12bf714936f70377a8a80f151872f76c2d64609`
- 对 3.82GB 标准 Mini safetensors 做 HEAD/元数据验证；无需下载大权重即可确认可获取

导入测试约 61 秒，进程常驻内存从 26.48 MiB 增至 810.28 MiB；其中 `rembg` 首次导入 37.862 秒，是本轮最慢单项。此数据只是依赖导入，不是模型推理资源数据。

确定失败：

```text
torch.zeros(1).to('cuda')
AssertionError: Torch not compiled with CUDA enabled
```

```text
custom_rasterizer/setup.py install
OSError: CUDA_HOME environment variable is not set.
```

```text
differentiable_renderer/setup.py install
error: Microsoft Visual C++ 14.0 or greater is required.
```

## 质量与速度判断

- 本机没有新生成资产，所以不能把仓库样例当成模型质量实测。
- 官方 README 报告 Hunyuan3D 2.0 在其对比表中取得 CMMD 3.193、FID_CLIP 49.165、FID 282.429、CLIP-score 0.809；这些是作者数据，不是本轮复现。
- Mini 是 0.6B 几何模型，官方示例为 CUDA、30 或 50 步；仓库还有 5 步的 Fast/Turbo 路径。由于没有 CUDA，本轮不存在可比较的本机推理耗时。
- 对当前机器的工程判断是：基础代码和 CUDA 版 Python 运行时均已就绪，但本地生成速度不是“慢”，而是 Windows 当前没有暴露 NVIDIA 设备；系统 RAM 与 Intel Arc 不能直接替代代码中的 CUDA 路径。RTX 3070 Ti 常见 8 GiB 显存只走低显存几何路径，纹理链路保持关闭。

## 输出与预览

- 新生成 GLB：无（推理未运行）
- 仓库自带、已成功读取的样例：`Hunyuan3D-2-f8db63096c8282cb27354314d896feba5ba6ff8a\assets\1.glb`
- 输入样例：`Hunyuan3D-2-f8db63096c8282cb27354314d896feba5ba6ff8a\assets\demo.png`
- 机器可读结果：`smoke-result.json`
- 可复跑脚本：`smoke_test.py`

仓库自带 GLB 只用于验证读取链路，不是本机模型输出，因此不附带冒充推理结果的截图。

## 下一步建议

要完成代表性实测，先让 Windows 枚举到 RTX 3070 Ti，并确保 `nvidia-smi` 正常。几何至少按官方 6GB VRAM 基线准备；几何加纹理按官方 16GB VRAM 基线准备。当前 3070 Ti 启动器只运行低显存几何模型，不需要编译纹理 CUDA 扩展。

先执行预检，再启动几何 Mini：

```powershell
cd services\hunyuan3d
.\run-rtx3070ti.ps1 -PreflightOnly
.\run-rtx3070ti.ps1
```

当前主机的预检会明确失败，因为设备管理器只枚举到 Intel Arc B390 和虚拟显示适配器。RTX 3070 Ti 在系统层出现后，同一脚本会继续检查 `sm_86`、显存和 CUDA 可用性，然后才下载模型并启动 Gradio。
