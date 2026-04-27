$repoRoot = Split-Path -Parent $PSScriptRoot
$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"
$bundledPython = "C:\Users\BETTERMONDAY\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

function Get-SystemPython {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCmd) {
        return $pythonCmd.Source
    }

    $pyCmd = Get-Command py -ErrorAction SilentlyContinue
    if ($pyCmd) {
        return $pyCmd.Source
    }

    return $null
}

function Get-PreferredPython {
    if (Test-Path $venvPython) {
        return @{
            Path = $venvPython
            Kind = "venv"
            Launcher = $null
        }
    }

    $systemPython = Get-SystemPython
    if ($systemPython) {
        $launcher = $null
        if ([System.IO.Path]::GetFileName($systemPython).Equals("py.exe", [System.StringComparison]::OrdinalIgnoreCase)) {
            $launcher = @("-3.12")
        }

        return @{
            Path = $systemPython
            Kind = "system"
            Launcher = $launcher
        }
    }

    if (Test-Path $bundledPython) {
        return @{
            Path = $bundledPython
            Kind = "bundled"
            Launcher = $null
        }
    }

    throw "No usable Python interpreter was found. Install Python 3.12+ or recreate the bundled Codex runtime."
}
