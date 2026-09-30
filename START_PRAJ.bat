@echo off
setlocal DisableDelayedExpansion
if "%~1"=="--bridge" goto BRIDGE
if "%~1"=="--web" goto WEB
title PRAJ - Startup
set "PRAJ_START_FILE=%~f0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; try { $source=[IO.File]::ReadAllText($env:PRAJ_START_FILE); & ([scriptblock]::Create(($source -split '(?m)^# PRAJ_POWERSHELL_START\r?$',2)[1])) } catch { Write-Host ('[ERROR] '+$_.Exception.Message); exit 1 }"
set "PRAJ_RESULT=%ERRORLEVEL%"
if "%PRAJ_RESULT%"=="0" exit /b 0
echo.
echo PRAJ could not start. Read the error above before closing this window.
pause
exit /b %PRAJ_RESULT%

:BRIDGE
title PRAJ-Python-Bridge
cd /d "%~dp0"
"%PRAJ_PYTHON%" -u "%~dp0praj_desktop_bridge.py"
exit /b %ERRORLEVEL%

:WEB
title PRAJ-Web-Server
cd /d "%~dp0"
call npm.cmd run dev
exit /b %ERRORLEVEL%

# PRAJ_POWERSHELL_START
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $env:PRAJ_START_FILE
Set-Location -LiteralPath $root
# Refresh PATH after an installation in another process or an older console.
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + $env:Path
$env:PYTHONIOENCODING = 'utf-8'
$env:PRAJ_NO_BROWSER = '1'
# The desktop dashboard and bridge expect port 3000 for this launcher.
$env:PORT = '3000'
$env:NODE_ENV = 'development'
function Test-Python([string]$Executable, [string[]]$Prefix = @()) {
    try {
        # Execute code: --version alone can mistake Store aliases for Python.
        $result = & $Executable @Prefix -c 'import sys; assert sys.version_info >= (3, 9); print(sys.executable)' 2>$null
        if ($LASTEXITCODE -eq 0 -and $result) {
            $resolved = ([string]($result | Select-Object -Last 1)).Trim()
            if (Test-Path -LiteralPath $resolved -PathType Leaf) { return $resolved }
        }
    } catch {}
    return $null
}

function Find-Python {
    $launcher = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($launcher) {
        $found = Test-Python $launcher.Source @('-3')
        if ($found) { return $found }
    }
    foreach ($command in @(Get-Command python.exe -All -ErrorAction SilentlyContinue)) {
        # Skip the Windows Store stub, which can open the Store instead of running.
        if ($command.Source -notlike '*\Microsoft\WindowsApps\*') {
            $found = Test-Python $command.Source
            if ($found) { return $found }
        }
    }
    $programFiles32 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
    $patterns = @(
        "$env:LOCALAPPDATA\Programs\Python\Python*\python.exe",
        "$env:ProgramFiles\Python*\python.exe",
        "$programFiles32\Python*\python.exe"
    )
    foreach ($candidate in @(Get-ChildItem -Path $patterns -ErrorAction SilentlyContinue | Sort-Object FullName -Descending)) {
        $found = Test-Python $candidate.FullName
        if ($found) { return $found }
    }
    foreach ($key in @(Get-Item -Path 'HKCU:\Software\Python\PythonCore\*\InstallPath',
        'HKLM:\Software\Python\PythonCore\*\InstallPath',
        'HKLM:\Software\WOW6432Node\Python\PythonCore\*\InstallPath' -ErrorAction SilentlyContinue)) {
        $directory = $key.GetValue('')
        if ($directory) {
            $found = Test-Python (Join-Path $directory 'python.exe')
            if ($found) { return $found }
        }
    }
    return $null
}


function Test-Service([string]$Url, [string]$Property, [string]$Value) {
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec 2
        return $response.$Property -eq $Value
    } catch { return $false }
}

function Start-Worker([string]$Mode) {
    # cmd /k leaves runtime errors visible after a child process exits.
    Start-Process -FilePath $env:ComSpec -WorkingDirectory $root -ArgumentList ('/d /k ""' + $env:PRAJ_START_FILE + '" --' + $Mode + '"') | Out-Null
}

function Wait-Service([string]$Url, [string]$Property, [string]$Value) {
    $deadline = (Get-Date).AddSeconds(60)
    do {
        if (Test-Service $Url $Property $Value) { return }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)
    throw "Service did not become ready: $Url. Read the error in its PRAJ console window."
}

try {
    foreach ($file in @('praj_desktop_bridge.py', 'package.json', 'server.ts', 'src', 'scripts\sync-python-installer.mjs')) {
        if (-not (Test-Path -LiteralPath (Join-Path $root $file))) {
            throw "Missing $file. Extract the full repository ZIP, then run START_PRAJ.bat from that folder."
        }
    }
    $python = Find-Python
    if (-not $python) {
        $setup = Join-Path $root 'INSTALL_PYTHON.bat'
        if (-not (Test-Path -LiteralPath $setup)) { throw 'Python was not found. Download INSTALL_PYTHON.bat into this folder.' }
        & $setup
        if ($LASTEXITCODE -ne 0) { throw 'Python installation failed.' }
        $python = Find-Python
        if (-not $python) { throw 'Python still could not be found after installation.' }
    }
    $env:PRAJ_PYTHON = $python
    Write-Host "Using Python: $python"
    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $node -or -not $npm) { throw 'Python is ready, but Node.js is missing. Install Node.js LTS from https://nodejs.org/ and run START_PRAJ.bat again.' }
    & $node.Source -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit((a===20&&b>=19)||(a===22&&b>=12)||a>22?0:1)'
    if ($LASTEXITCODE -ne 0) { throw 'Node.js is too old for Vite. Install the current Node.js LTS and try again.' }
    if (-not (Test-Path -LiteralPath (Join-Path $root 'node_modules\.bin\tsx.cmd'))) {
        Write-Host 'Installing web dependencies. Please wait...'
        & $npm.Source install
        if ($LASTEXITCODE -ne 0) { throw 'npm install failed. Read the error above.' }
    }
    if (-not (Test-Service 'http://127.0.0.1:5000/api/status' 'agent' 'PRAJ Desktop Bridge')) {
        Start-Worker 'bridge'
    }
    if (-not (Test-Service 'http://127.0.0.1:3000/api/health' 'name' 'PRAJ')) {
        Start-Worker 'web'
    }
    Write-Host 'Waiting for the desktop bridge and web server...'
    Wait-Service 'http://127.0.0.1:5000/api/status' 'agent' 'PRAJ Desktop Bridge'
    Wait-Service 'http://127.0.0.1:3000/api/health' 'name' 'PRAJ'
    Write-Host '[READY] PRAJ bridge and web server are responding.'
    Start-Process 'http://localhost:3000'
} catch {
    Write-Host ('[ERROR] ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
exit 0
