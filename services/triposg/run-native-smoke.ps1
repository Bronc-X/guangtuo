param(
    [string]$InputPath = (Join-Path $PSScriptRoot "fixtures\gt-airless-030-smoke.png"),
    [string]$OutputPath = (Join-Path $PSScriptRoot "outputs\gt-airless-030-smoke.glb"),
    [ValidateRange(5000, 100000)]
    [int]$Faces = 50000
)

$ErrorActionPreference = "Stop"
$runtimePython = Join-Path $PSScriptRoot ".runtime-venv\Scripts\python.exe"
$smokeScript = Join-Path $PSScriptRoot "smoke_test.py"
$weightsDir = Join-Path $PSScriptRoot "pretrained_weights"

if (-not (Test-Path -LiteralPath $runtimePython)) {
    throw "Native runtime is missing: $runtimePython"
}
if (-not (Test-Path -LiteralPath $InputPath)) {
    throw "Transparent PNG input is missing: $InputPath"
}

$env:HF_HUB_OFFLINE = "1"
$env:TRANSFORMERS_OFFLINE = "1"

& $runtimePython $smokeScript `
    --image-input $InputPath `
    --output-path $OutputPath `
    --weights-dir $weightsDir `
    --faces $Faces
exit $LASTEXITCODE
