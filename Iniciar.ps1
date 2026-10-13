$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw 'Necesitas Node.js 24 o abrir esta carpeta desde Codex.' }
$nodePath = $nodeCommand.Source
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
$bundledNpm = Join-Path (Split-Path (Split-Path $nodePath)) 'node_modules\npm\bin\npm-cli.js'
$projectNpm = Join-Path $PSScriptRoot '..\..\work\npm-runtime\package\bin\npm-cli.js'
function Invoke-ProjectNpm {
    param([string[]]$Arguments)
    if ($npmCommand) { & $npmCommand.Source @Arguments }
    elseif (Test-Path -LiteralPath $bundledNpm) { & $nodePath $bundledNpm @Arguments }
    elseif (Test-Path -LiteralPath $projectNpm) { & $nodePath $projectNpm @Arguments }
    else { throw 'No se encuentra npm. Instala Node.js con npm incluido.' }
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo completar la preparación de la aplicación.' }
}
if (-not (Test-Path -LiteralPath 'node_modules')) { Invoke-ProjectNpm -Arguments @('ci') }
Invoke-ProjectNpm -Arguments @('run','build')
Invoke-ProjectNpm -Arguments @('start')
