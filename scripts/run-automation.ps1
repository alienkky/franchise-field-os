$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolver = Join-Path $PSScriptRoot "resolve-python.ps1"
$deps = Join-Path $repoRoot ".pydeps"
$automationRoot = Join-Path $repoRoot "apps\automation"
$browserPath = Join-Path $repoRoot ".playwright"

. $resolver
$pythonInfo = Get-PreferredPython

$env:PLAYWRIGHT_BROWSERS_PATH = $browserPath
Push-Location $automationRoot
try {
    if ($pythonInfo.Kind -eq "venv") {
        $env:PYTHONPATH = $automationRoot
    }
    else {
        if (-not (Test-Path $deps)) {
            throw "Missing .pydeps. Run scripts\\setup-bundled-python.ps1 or set up a system Python .venv first."
        }
        $env:PYTHONPATH = "$deps;$automationRoot"
    }

    if ($pythonInfo.Launcher) {
        & $pythonInfo.Path @($pythonInfo.Launcher + @("main.py"))
    }
    else {
        & $pythonInfo.Path main.py
    }
}
finally {
    Pop-Location
}
