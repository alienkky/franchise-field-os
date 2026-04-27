$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolver = Join-Path $PSScriptRoot "resolve-python.ps1"
$venvPath = Join-Path $repoRoot ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$browserPath = Join-Path $repoRoot ".playwright"

. $resolver
$pythonInfo = Get-PreferredPython

if ($pythonInfo.Kind -eq "bundled") {
    throw "System Python was not found. Install Python 3.12+ first, then rerun this script."
}

if (-not (Test-Path $venvPython)) {
    if ($pythonInfo.Launcher) {
        & $pythonInfo.Path @($pythonInfo.Launcher + @("-m", "venv", ".venv"))
    }
    else {
        & $pythonInfo.Path -m venv .venv
    }
}

& $venvPython -m pip install -r (Join-Path $repoRoot "apps\api\requirements.txt") -r (Join-Path $repoRoot "apps\automation\requirements.txt")
$env:PLAYWRIGHT_BROWSERS_PATH = $browserPath
& $venvPython -m playwright install chromium
