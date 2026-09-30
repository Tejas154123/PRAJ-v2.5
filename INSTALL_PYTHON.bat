@echo off
title PRAJ SYSTEM - 1-CLICK PYTHON AUTO-INSTALLER
color 0A
cls
echo =====================================================================
echo           PRAJ AI - 1-CLICK PYTHON INSTALLER FOR WINDOWS
echo =====================================================================
echo.

:: 1. Check if python is already working
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [FOUND] Python is already installed on this computer!
    python --version
    echo.
    echo [*] Checking pip package manager...
    python -m pip --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [*] Installing pip...
        python -m ensurepip --default-pip
    )
    echo [*] Installing required PRAJ libraries (flask, flask-cors, psutil, pywin32)...
    python -m pip install flask flask-cors psutil pywin32 --quiet --disable-pip-version-check
    echo.
    echo =====================================================================
    echo   [SUCCESS] Python is ready and configured with all PRAJ dependencies!
    echo =====================================================================
    echo.
    pause
    exit /b 0
)

:: 2. Check if py launcher is installed
py -3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [FOUND] Python launcher (py) is installed on this computer!
    py -3 --version
    echo.
    echo [*] Installing required PRAJ libraries using py launcher...
    py -3 -m pip install flask flask-cors psutil pywin32 --quiet --disable-pip-version-check
    echo.
    echo =====================================================================
    echo   [SUCCESS] Python is ready and configured with all PRAJ dependencies!
    echo =====================================================================
    echo.
    pause
    exit /b 0
)

:: 3. Check AppData default path
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"
    echo [FOUND] Python is located in %LOCALAPPDATA%\Programs\Python\Python311!
    python --version
    python -m pip install flask flask-cors psutil pywin32 --quiet --disable-pip-version-check
    echo.
    echo =====================================================================
    echo   [SUCCESS] Python is ready!
    echo =====================================================================
    pause
    exit /b 0
)

echo [!] Python is NOT installed on this computer.
echo [*] Downloading official Python 3.11 for Windows...
echo.

set "PY_INSTALLER=%TEMP%\praj_python_installer.exe"
set "PY_URL=https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"

powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('%PY_URL%', '%PY_INSTALLER%')"

if not exist "%PY_INSTALLER%" (
    echo [!] Direct download was blocked.
    echo [*] Trying winget...
    winget install --id Python.Python.3.11 -e --source winget --accept-source-agreements --accept-package-agreements
    goto FINISH
)

echo [*] Installing Python silently with PATH and pip enabled...
"%PY_INSTALLER%" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_test=0 Include_launcher=1

echo [*] Waiting for installer to finalize...
timeout /t 5 /nobreak >nul

if exist "%PY_INSTALLER%" del /f /q "%PY_INSTALLER%" >nul 2>&1

:FINISH
set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"

python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Python successfully installed!
    python --version
    echo.
    echo [*] Installing PRAJ libraries (flask, flask-cors, psutil, pywin32)...
    python -m pip install flask flask-cors psutil pywin32 --quiet --disable-pip-version-check
    echo.
    echo =====================================================================
    echo    [COMPLETED] 1-Click Python Setup is Finished!
    echo =====================================================================
) else (
    echo.
    echo =====================================================================
    echo    [DONE] Python installer has finished!
    echo    Please restart this Command Prompt window so Windows refreshes PATH.
    echo =====================================================================
)

echo.
pause
exit /b 0
