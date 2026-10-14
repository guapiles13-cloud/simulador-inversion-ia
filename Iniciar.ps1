param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$nodePath = if ($nodeCommand) { $nodeCommand.Source } elseif (Test-Path -LiteralPath $bundledNode) { $bundledNode } else { throw 'No se encuentra Node.js. Instala Node.js 24 o abre el proyecto desde Codex.' }
$nodeVersion = & $nodePath --version
$major = ([regex]::Match($nodeVersion, '^v(\d+)')).Groups[1].Value
if ([int]$major -lt 24) { throw 'Esta aplicación necesita Node.js 24 o posterior.' }
$env:PATH = (Split-Path $nodePath) + ';' + $env:PATH
$env:PORT = '4318'
$url = 'http://127.0.0.1:4318'
$serverProcess = $null
New-Item -ItemType Directory -Force -Path 'data' | Out-Null
function Test-Application {
    try { $state = Invoke-RestMethod -Uri ($url + '/api/status') -TimeoutSec 2; return ($state.stage -eq 'viabilidad' -and $state.symbols -contains 'AAPL') }
    catch { return $false }
}
if (-not (Test-Application)) {
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    $localNpm = Join-Path $PSScriptRoot 'work\npm\bin\npm-cli.js'
    function Invoke-ProjectNpm {
        param([string[]]$Arguments)
        if ($npmCommand) { & $npmCommand.Source @Arguments }
        elseif (Test-Path -LiteralPath $localNpm) { & $nodePath $localNpm @Arguments }
        else { throw 'No se encuentra npm. Instala Node.js con npm incluido.' }
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la aplicación. Revisa la conexión o las dependencias.' }
    }
    if (-not (Test-Path -LiteralPath 'node_modules')) { Invoke-ProjectNpm -Arguments @('ci','--cache','work\npm-cache') }
    Invoke-ProjectNpm -Arguments @('run','build')
    $ollamaPath = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
    try { $null = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 }
    catch {
        if (Test-Path -LiteralPath $ollamaPath) {
            $env:OLLAMA_MODELS = Join-Path $PSScriptRoot 'data\models'
            Start-Process -FilePath $ollamaPath -ArgumentList 'serve' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'data\ollama.log') -RedirectStandardError (Join-Path $PSScriptRoot 'data\ollama-error.log') | Out-Null
        }
    }
    $serverProcess = Start-Process -FilePath $nodePath -ArgumentList '--env-file-if-exists=.env','server/server.ts' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'data\server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'data\server-error.log') -PassThru
    for ($attempt=0; $attempt -lt 30; $attempt++) {
        if (Test-Application) { break }
        if ($serverProcess.HasExited) { throw 'El servidor no pudo iniciarse. Consulta data\server-error.log; puede haber otra aplicación usando el puerto 4318.' }
        Start-Sleep -Milliseconds 500
    }
    if (-not (Test-Application)) { throw 'El servidor no responde todavía. Vuelve a abrir la aplicación en unos segundos.' }
    $serverProcess.Id | Set-Content -LiteralPath 'data\server.pid'
}
Write-Host ('Aplicación preparada: ' + $url)
if (-not $NoBrowser) { Start-Process $url }
if ($serverProcess) {
    Write-Host 'Mantén esta ventana abierta mientras uses la aplicación. Puedes minimizarla.'
    Wait-Process -Id $serverProcess.Id
}
