@echo off
setlocal DisableDelayedExpansion
title PRAJ - Python Setup
set "PRAJ_SETUP_FILE=%~f0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; try { $source=[IO.File]::ReadAllText($env:PRAJ_SETUP_FILE); $body=($source -split '(?m)^# PRAJ_POWERSHELL_START\r?$',2)[1]; & ([scriptblock]::Create($body)) } catch { Write-Host ('[ERROR] '+$_.Exception.Message); exit 1 }"
set "PRAJ_SETUP_RESULT=%ERRORLEVEL%"
if "%PRAJ_SETUP_RESULT%"=="0" exit /b 0
echo.
echo Setup failed. Review the error above and the log path, then try again.
pause
exit /b %PRAJ_SETUP_RESULT%
# PRAJ_POWERSHELL_START
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

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

$logDirectory = Join-Path ([IO.Path]::GetTempPath()) ('PRAJ-setup-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $logDirectory | Out-Null
$transcribing = $false
try {
    Start-Transcript -Path (Join-Path $logDirectory 'setup.log') | Out-Null
    $transcribing = $true
    Write-Host 'Checking for Python 3.9 or newer...'
    $python = Find-Python
    if (-not $python) {
        $version = '3.13.15'
        $architecture = $env:PROCESSOR_ARCHITEW6432
        if (-not $architecture) { $architecture = $env:PROCESSOR_ARCHITECTURE }
        switch ($architecture.ToUpperInvariant()) {
            'ARM64' { $suffix = '-arm64' }
            'AMD64' { $suffix = '-amd64' }
            'X86'   { $suffix = '' }
            default { throw "Unsupported Windows architecture: $architecture" }
        }
        $url = "https://www.python.org/ftp/python/$version/python-$version$suffix.exe"
        $installer = Join-Path $logDirectory 'python-setup.exe'
        Write-Host "Python was not found. Downloading Python $version for $architecture..."
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $installer -TimeoutSec 300
        $signature = Get-AuthenticodeSignature -LiteralPath $installer
        if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'O=Python Software Foundation(?:,|$)') {
            throw 'The download does not have a valid Python Software Foundation signature.'
        }
        $target = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python313'
        $installerLog = Join-Path $logDirectory 'python-install.log'
        Write-Host 'Installing Python for your Windows user. This may take a few minutes...'
        $arguments = @('/quiet', 'InstallAllUsers=0', 'PrependPath=1',
            'Include_pip=1', 'Include_test=0', 'Include_launcher=1',
            'InstallLauncherAllUsers=0', 'Shortcuts=0',
            ('TargetDir="' + $target + '"'), '/log', ('"' + $installerLog + '"'))
        $process = Start-Process -FilePath $installer -ArgumentList $arguments -Wait -PassThru
        if ($process.ExitCode -notin @(0, 3010)) {
            throw "Python installer exited with code $($process.ExitCode). See $installerLog"
        }
        $python = Test-Python (Join-Path $target 'python.exe')
        if (-not $python) {
            $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
            $python = Find-Python
        }
        if (-not $python) { throw 'Setup finished, but Python could not run. Check the installer log; a Windows restart may be required.' }
        if ($process.ExitCode -eq 3010) { Write-Host 'Windows reports that a restart is required to finish installation.' }
    }
    Write-Host "Using Python: $python"
    & $python --version
    if ($LASTEXITCODE -ne 0) { throw 'Python verification failed.' }
    & $python -m pip --version
    if ($LASTEXITCODE -ne 0) {
        & $python -m ensurepip --upgrade
        if ($LASTEXITCODE -ne 0) { throw 'Could not set up pip.' }
    }
    Write-Host 'Installing PRAJ libraries...'
    & $python -m pip install --disable-pip-version-check flask flask-cors psutil pywin32
    if ($LASTEXITCODE -ne 0) { throw 'PRAJ library installation failed. Check the pip error above.' }
    & $python -c 'import flask, flask_cors, psutil, win32api'
    if ($LASTEXITCODE -ne 0) { throw 'PRAJ library verification failed.' }
    Write-Host '[READY] Python and PRAJ libraries are installed.'
    Write-Host 'Open PRAJ from a new window so it picks up any PATH changes.'
    Write-Host "Setup logs: $logDirectory"
} catch {
    Write-Host ("[ERROR] " + $_.Exception.Message) -ForegroundColor Red
    Write-Host "Setup logs: $logDirectory"
    if ($transcribing) { Stop-Transcript | Out-Null }
    exit 1
}
if ($transcribing) { Stop-Transcript | Out-Null }
exit 0
