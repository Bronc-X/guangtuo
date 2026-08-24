[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 8080,

    [string]$ListenAddress = "127.0.0.1",

    [switch]$PreflightOnly
)

$ErrorActionPreference = "Stop"
$runner = Join-Path $PSScriptRoot "run-rtx3070ti.ps1"
$runnerParameters = @{
    Port = $Port
    ListenAddress = $ListenAddress
}
if ($PreflightOnly) {
    $runnerParameters.PreflightOnly = $true
}

& $runner @runnerParameters
exit $LASTEXITCODE
