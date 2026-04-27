$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$deps = Join-Path $repoRoot ".pydeps"
$browserPath = Join-Path $repoRoot ".playwright"
$bundledPython = "C:\Users\BETTERMONDAY\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if (-not (Test-Path $bundledPython)) {
    throw "Bundled Python runtime was not found at $bundledPython"
}

if (-not (Test-Path $deps)) {
    New-Item -ItemType Directory -Force -Path $deps | Out-Null
}

& $bundledPython -m pip install --target $deps -r (Join-Path $repoRoot "apps\api\requirements.txt") -r (Join-Path $repoRoot "apps\automation\requirements.txt")
$env:PYTHONPATH = $deps
$env:PLAYWRIGHT_BROWSERS_PATH = $browserPath
& $bundledPython -m playwright install chromium
