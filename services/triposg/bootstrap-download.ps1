param(
    [ValidateSet("all", "triposg")]
    [string]$Model = "all",
    [ValidateRange(1, 32)]
    [int]$Workers = 16,
    [ValidateRange(1, 240)]
    [int]$MaxMinutes = 30
)

$ErrorActionPreference = "Stop"
$serviceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvDir = Join-Path $serviceDir ".download-venv"
$python = Join-Path $venvDir "Scripts\python.exe"

if (-not (Test-Path -LiteralPath $python)) {
    python -m venv $venvDir
}

& $python -m pip install --disable-pip-version-check --retries 3 --timeout 30 "huggingface_hub[hf_xet]==0.36.0"
if ($LASTEXITCODE -ne 0) {
    throw "Downloader dependency installation failed"
}

$env:HF_HUB_DISABLE_TELEMETRY = "1"
$env:HF_HUB_ETAG_TIMEOUT = "10"
$env:HF_HUB_DOWNLOAD_TIMEOUT = "60"
$env:HF_XET_HIGH_PERFORMANCE = "1"

$arguments = @(
    (Join-Path $serviceDir "download_models.py"),
    "--model", $Model,
    "--root", (Join-Path $serviceDir "pretrained_weights"),
    "--cache", (Join-Path $serviceDir "downloads\huggingface"),
    "--max-workers", $Workers
)
$process = Start-Process -FilePath $python -ArgumentList $arguments -NoNewWindow -PassThru
if (-not $process.WaitForExit($MaxMinutes * 60 * 1000)) {
    Stop-Process -Id $process.Id -Force
    Write-Error "下载达到 $MaxMinutes 分钟硬截止。缓存已保留，重新执行会续传。"
}
exit $process.ExitCode
