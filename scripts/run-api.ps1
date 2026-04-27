$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolver = Join-Path $PSScriptRoot "resolve-python.ps1"
$apiRoot = Join-Path $repoRoot "apps\api"
$deps = Join-Path $repoRoot ".pydeps"

. $resolver
$pythonInfo = Get-PreferredPython

Push-Location $apiRoot
try {
    if ($pythonInfo.Kind -eq "venv") {
        $env:PYTHONPATH = $apiRoot
    }
    else {
        if (-not (Test-Path $deps)) {
            throw "Missing .pydeps. Run scripts\\setup-bundled-python.ps1 or set up a system Python .venv first."
        }
        $env:PYTHONPATH = "$deps;$apiRoot"
    }

    if ($pythonInfo.Launcher) {
        & $pythonInfo.Path @($pythonInfo.Launcher + @("-m", "uvicorn", "app.main:app", "--reload"))
    }
    else {
        & $pythonInfo.Path -m uvicorn app.main:app --reload
    }
}
finally {
    Pop-Location
}
