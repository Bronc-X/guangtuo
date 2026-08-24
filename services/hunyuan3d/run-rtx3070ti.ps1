[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 8080,

    [string]$ListenAddress = "127.0.0.1",

    [switch]$PreflightOnly
)

$ErrorActionPreference = "Stop"

$minimumGeometryVramGiB = 6
$texturePipelineVramGiB = 16
$sourceCommit = "f8db63096c8282cb27354314d896feba5ba6ff8a"
$serviceRoot = $PSScriptRoot
$python = Join-Path $serviceRoot ".gpu-venv\Scripts\python.exe"
$sourceRoot = Join-Path $serviceRoot "Hunyuan3D-2-$sourceCommit"
$app = Join-Path $sourceRoot "gradio_app.py"
$modelCache = Join-Path $serviceRoot "hf-cache"
$gradioCache = Join-Path $serviceRoot "gradio-cache"

foreach ($requiredPath in @($python, $app)) {
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        [Console]::Error.WriteLine("Hunyuan3D 运行文件缺失：$requiredPath")
        exit 2
    }
}

$probeCode = @'
import json
import torch

result = {
    "torch": torch.__version__,
    "cuda_build": torch.version.cuda,
    "cuda_built": torch.backends.cuda.is_built(),
    "cuda_available": torch.cuda.is_available(),
    "device_count": torch.cuda.device_count(),
    "compiled_architectures": (
        torch._C._cuda_getArchFlags().split()
        if hasattr(torch._C, "_cuda_getArchFlags")
        else []
    ),
}

if result["cuda_available"]:
    properties = torch.cuda.get_device_properties(0)
    result.update({
        "gpu": properties.name,
        "vram_gib": round(properties.total_memory / 1024**3, 2),
        "compute_capability": f"{properties.major}.{properties.minor}",
    })

print(json.dumps(result, ensure_ascii=False))
'@

$probeJson = & $python -c $probeCode
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("无法执行 CUDA 预检。")
    exit 2
}
$probe = $probeJson | ConvertFrom-Json

if (-not $probe.cuda_built) {
    Write-Output $probeJson
    [Console]::Error.WriteLine("当前 PyTorch 是 CPU 构建；请重建 services/hunyuan3d/.gpu-venv。")
    exit 2
}

if (-not $probe.cuda_available) {
    $nvidiaDevices = @()
    if (Get-Command Get-PnpDevice -ErrorAction SilentlyContinue) {
        $nvidiaDevices = @(
            Get-PnpDevice -PresentOnly:$false -ErrorAction SilentlyContinue |
                Where-Object {
                    $_.InstanceId -match "VEN_10DE" -or
                    $_.FriendlyName -match "NVIDIA|GeForce|3070"
                } |
                Select-Object Status, FriendlyName, InstanceId, Problem
        )
    }

    Write-Output $probeJson
    if ($nvidiaDevices.Count -eq 0) {
        [Console]::Error.WriteLine(
            "CUDA 运行时已就绪，但 Windows 没有枚举到任何 NVIDIA 设备。请先连接/直通 RTX 3070 Ti 并安装驱动；当前软件无法启动一块系统不可见的显卡。"
        )
    }
    else {
        [Console]::Error.WriteLine(
            "Windows 找到 NVIDIA 设备但 PyTorch 无法使用。请在设备管理器确认设备已启用，并用 nvidia-smi 检查驱动。设备：$($nvidiaDevices | ConvertTo-Json -Compress)"
        )
    }
    exit 2
}

$deviceArchitecture = "sm_$($probe.compute_capability -replace '\.', '')"
if ($probe.compiled_architectures -notcontains $deviceArchitecture) {
    Write-Output $probeJson
    [Console]::Error.WriteLine(
        "当前 PyTorch 不包含 $($probe.gpu) 所需的 $deviceArchitecture 内核。"
    )
    exit 2
}

if ([double]$probe.vram_gib -lt $minimumGeometryVramGiB) {
    Write-Output $probeJson
    [Console]::Error.WriteLine(
        "显存只有 $($probe.vram_gib) GiB；Hunyuan3D-2 几何生成至少需要 $minimumGeometryVramGiB GiB。"
    )
    exit 2
}

if ([double]$probe.vram_gib -lt $texturePipelineVramGiB) {
    Write-Warning "显存低于 $texturePipelineVramGiB GiB，纹理生成保持关闭，仅启动几何模型。"
}

Write-Output $probeJson
if ($PreflightOnly) {
    exit 0
}

New-Item -ItemType Directory -Path $modelCache, $gradioCache -Force | Out-Null
$env:HF_HOME = $modelCache
$env:HF_HUB_CACHE = $modelCache
$env:PYTORCH_CUDA_ALLOC_CONF = "expandable_segments:True"

Push-Location $sourceRoot
try {
    & $python $app `
        --model_path "tencent/Hunyuan3D-2mini" `
        --subfolder "hunyuan3d-dit-v2-mini" `
        --host $ListenAddress `
        --port $Port `
        --device "cuda" `
        --cache-path $gradioCache `
        --disable_tex `
        --low_vram_mode
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
