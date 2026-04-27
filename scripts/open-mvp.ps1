$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$indexHtml = Join-Path $repoRoot "index.html"

if (-not (Test-Path $indexHtml)) {
    throw "Could not find $indexHtml"
}

Start-Process $indexHtml
