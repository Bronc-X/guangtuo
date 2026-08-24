# TripoSG GPU worker

> **项目状态：已暂停。** 广拓项目的主 3D 生成引擎已切换为 Hunyuan3D-2mini。本目录只保留历史评测、固定权重和回滚证据，不进入默认启动、部署或网站生成链路。`compose.yaml` 已放入 `legacy-triposg-disabled` profile，普通 `docker compose up` 不会启动它。未经新的书面技术决策，不得重新接入生产。

这是广拓生物项目的内部图片转 3D 初稿 worker。它固定使用：

- TripoSG 源码提交 `fc5c40990181e2a756c4e0b1c2f4d6b5202faf8c`
- TripoSG 权重版本 `2c1c516d22d58db486a058d98d31bb6177344e06`

模型用于生成可视化基础网格，不替代工业 CAD、结构工程或开模文件。

输入必须是带有效 Alpha 通道的透明背景 PNG。官方示例使用的 RMBG-1.4 权重仅授权非商业使用，因此本商业项目明确不下载、不打包、不调用该权重。

## 当前机器状态

当前 Windows 机器已检测到 NVIDIA GeForce RTX 5070 Ti（16,303 MiB，驱动 591.86），PyTorch 2.7.1+cu128 可正常访问 CUDA，计算能力为 `sm_120`。正式运行目标仍为 Linux + NVIDIA GPU（至少 8 GiB 显存，建议 16 GiB 以上）；Windows 原生环境只用于开发烟测，不作为生产运行目标。

当前 `.runtime-venv` 原生 Windows 环境为 Python 3.10.21、PyTorch 2.7.1+cu128，并已完成一次固定 Seed 42、50 步的端到端烟测：扩散推理约 11 秒，总耗时约 42 秒；输出 4,119 个顶点、8,216 个有效三角面、148,812 字节，GLB 验证通过。

商业运行补丁：移除了非商业许可的 `diso` 和 RMBG-1.4，也不打包 GPL3 的 `pymeshlab`。等值运行环节分别替换为 BSD 的 `scikit-image marching_cubes`、输入图片自带 Alpha，以及 MIT 的 `fast-simplification`。这些补丁已通过 5070 Ti 上的实际 GLB 回归；但单张正视图生成的工业包装结构失真明显，只适合作为概念网格参考，不能直接替换正式的可参数化 SKU 模型。

## 高速、可恢复下载

下载器只访问 Hugging Face 官方端点，使用 `hf_xet` 并行分块，固定模型 revision，并在完成后核对大文件 SHA-256。连接元数据超时 10 秒、单次下载超时 60 秒；PowerShell 外层默认 30 分钟硬截止。中断后重新执行同一命令会复用缓存。

```powershell
cd services\triposg
.\bootstrap-download.ps1 -Model all -Workers 16 -MaxMinutes 30
```

## Linux GPU 容器

主机需要 NVIDIA 驱动、Docker Engine、NVIDIA Container Toolkit。

```bash
docker compose build triposg
docker compose run --rm --entrypoint python3 triposg /opt/triposg/download_models.py \
  --root /opt/triposg/pretrained_weights --model all --max-workers 16
docker compose run --rm triposg \
  --image-input /data/input/product.png \
  --output-path /data/output/product.glb \
  --faces 50000
```

推理脚本只读取已固定并校验的本地权重，运行时不会偷偷联网补文件。

## 原生 Windows 烟测

透明测试图由内置图像编辑生成，实际文件为 RGBA，保存在 `fixtures/gt-airless-030-smoke.png`。显卡和驱动被系统识别后运行：

```powershell
cd services\triposg
.\run-native-smoke.ps1
```

脚本强制 Hugging Face/Transformers 离线运行，默认输出到 `outputs/gt-airless-030-smoke.glb`。

5070 Ti 接入后的正式烟测命令：

```bash
docker compose run --rm --entrypoint python3 triposg /opt/triposg/smoke_test.py \
  --image-input /data/input/product.png \
  --output-path /data/output/product.glb \
  --weights-dir /opt/triposg/pretrained_weights \
  --faces 50000
```

烟测会依次验证 CUDA/显存、执行离线推理，再检查 GLB 是否包含有效网格以及面数是否在预算内。
