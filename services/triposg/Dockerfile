FROM nvidia/cuda:12.8.1-cudnn-devel-ubuntu22.04@sha256:ad6d59a3bbf3e82c1c849c9ac09cfc2a3e0bbb8655042fd899be6681b3fe2a85

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HUB_DISABLE_TELEMETRY=1 \
    HF_HUB_ETAG_TIMEOUT=10 \
    HF_HUB_DOWNLOAD_TIMEOUT=60 \
    HF_XET_HIGH_PERFORMANCE=1 \
    TORCH_CUDA_ARCH_LIST=12.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential git libgl1 libglib2.0-0 libgomp1 python3-dev python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/triposg

COPY constraints.txt /opt/triposg/constraints.txt
COPY source-git/requirements.txt /opt/triposg/upstream-requirements.txt

RUN python3 -m pip install --upgrade pip \
    && python3 -m pip install torch==2.7.1 torchvision==0.22.1 --index-url https://download.pytorch.org/whl/cu128 \
    && python3 -m pip install -c constraints.txt -r upstream-requirements.txt \
    && python3 -m pip install "huggingface_hub[hf_xet]==0.36.0"

COPY source-git /opt/triposg/upstream
COPY download_models.py inference.py preflight.py smoke_test.py /opt/triposg/

RUN mkdir -p /opt/triposg/pretrained_weights /data/input /data/output

ENTRYPOINT ["python3", "/opt/triposg/inference.py"]
