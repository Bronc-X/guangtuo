[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 8091
)

$ErrorActionPreference = "Stop"
$serviceRoot = $PSScriptRoot
$projectRoot = Split-Path -Parent (Split-Path -Parent $serviceRoot)
$python = Join-Path $serviceRoot ".gpu-venv\Scripts\python.exe"
$localEnvironmentFile = Join-Path $projectRoot ".env.local"

if (-not (Test-Path -LiteralPath $python -PathType Leaf)) {
    [Console]::Error.WriteLine("Hunyuan3D Python 环境不存在：$python")
    exit 2
}

if (Test-Path -LiteralPath $localEnvironmentFile -PathType Leaf) {
    foreach ($environmentName in @("OPENAI_API_KEY", "STUDIO_MODEL_WORKER_URL", "STUDIO_ALLOWED_ORIGINS")) {
        $existingValue = [Environment]::GetEnvironmentVariable($environmentName, "Process")
        if ([string]::IsNullOrWhiteSpace($existingValue)) {
            $escapedName = [regex]::Escape($environmentName)
            $valueLine = Get-Content -LiteralPath $localEnvironmentFile |
                Where-Object { $_ -match "^\s*$escapedName\s*=" } |
                Select-Object -Last 1
            if ($valueLine -match "^\s*$escapedName\s*=\s*(.*)\s*$") {
                $value = $Matches[1].Trim()
                if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                if ($value) {
                    [Environment]::SetEnvironmentVariable($environmentName, $value, "Process")
                }
            }
        }
    }
}

if (-not (Test-Path Env:OPENAI_API_KEY)) {
    Write-Warning "OPENAI_API_KEY 未配置；现有包装预览可用，新造型方案图暂不可生成。"
}

Push-Location $projectRoot
try {
    & $python -m uvicorn services.hunyuan3d.studio_api:app `
        --host "127.0.0.1" `
        --port $Port
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
