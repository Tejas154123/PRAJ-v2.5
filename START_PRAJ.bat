@echo off
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
title PRAJ SYSTEM - 1-CLICK MASTER LAUNCHER
color 0B
cls
echo =====================================================================
echo                PRAJ AI DESKTOP - MASTER 1-CLICK LAUNCHER
echo =====================================================================
echo.
echo [*] Initiating PRAJ Core System in %SCRIPT_DIR%...
echo.

:: 1. Verify Python availability (including Python 3.13 installed by INSTALL_PYTHON.bat)
set "PY_CMD="

:: Priority 1: py -3 launcher
py -3 -c "import sys; assert sys.version_info >= (3, 8)" >nul 2>&1
if %errorlevel% equ 0 (
    set "PY_CMD=py -3"
    goto FOUND_PYTHON
)

:: Priority 2: python command
python -c "import sys; assert sys.version_info >= (3, 8)" >nul 2>&1
if %errorlevel% equ 0 (
    set "PY_CMD=python"
    goto FOUND_PYTHON
)

:: Priority 3: Check AppData user installations (Python 3.13, 3.12, 3.11, 3.10)
for %%v in (Python313 Python312 Python311 Python310) do (
    if exist "%LOCALAPPDATA%\Programs\Python\%%v\python.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\Python\%%v;%LOCALAPPDATA%\Programs\Python\%%v\Scripts;%PATH%"
        set "PY_CMD=%LOCALAPPDATA%\Programs\Python\%%v\python.exe"
        goto FOUND_PYTHON
    )
)

:: Priority 4: Check Program Files installations
for %%v in (Python313 Python312 Python311 Python310) do (
    if exist "%ProgramFiles%\Python\%%v\python.exe" (
        set "PATH=%ProgramFiles%\Python\%%v;%ProgramFiles%\Python\%%v\Scripts;%PATH%"
        set "PY_CMD=%ProgramFiles%\Python\%%v\python.exe"
        goto FOUND_PYTHON
    )
    if exist "%ProgramFiles%\%%v\python.exe" (
        set "PATH=%ProgramFiles%\%%v;%ProgramFiles%\%%v\Scripts;%PATH%"
        set "PY_CMD=%ProgramFiles%\%%v\python.exe"
        goto FOUND_PYTHON
    )
)

:FOUND_PYTHON
if not defined PY_CMD (
    echo [ERROR] Python is not installed or not added to your Windows PATH!
    echo.
    if exist "INSTALL_PYTHON.bat" (
        echo [*] Found INSTALL_PYTHON.bat in the current folder!
        set /p RUN_PY_SETUP="Would you like to install Python automatically now? (Y/N): "
        if /i "%RUN_PY_SETUP%"=="Y" (
            call "%SCRIPT_DIR%INSTALL_PYTHON.bat"
        )
    ) else (
        echo Tip: Run INSTALL_PYTHON.bat or choose Option 6 in PRAJ_MASTER_SWITCH.bat
    )
    py -3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        set "PY_CMD=py -3"
    ) else (
        python --version >nul 2>&1
        if %errorlevel% equ 0 (
            set "PY_CMD=python"
        ) else (
            echo Please ensure Python is installed and added to PATH, then re-run this launcher.
            pause
            exit /b
        )
    )
)

echo [*] Python verified:
%PY_CMD% --version

:: 2. Check Node / npm (Optional: if not installed, launches Python bridge and connects to cloud PRAJ UI)
set "NPM_CMD="
call npm.cmd --version >nul 2>&1
if %errorlevel% equ 0 (
    set "NPM_CMD=npm.cmd"
) else (
    call npm --version >nul 2>&1
    if %errorlevel% equ 0 (
        set "NPM_CMD=npm"
    )
)

if defined NPM_CMD (
    echo [*] Node.js/npm verified: Local server mode available.
) else (
    echo [*] Note: Node.js is not in PATH. Launching Python Desktop Bridge with cloud-hosted PRAJ Web UI!
)

:: 3. Clean up any stale processes on Port 5000 & 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: 4. Start Python Desktop Bridge in a dedicated window
echo [*] Step 1/3: Launching PRAJ Python Desktop Bridge (Port 5000)...
start "PRAJ-Python-Bridge" cmd /k "cd /d "%SCRIPT_DIR%" && %PY_CMD% praj_desktop_bridge.py"

:: 5. Start Local Web Server (if package.json and npm exist)
if defined NPM_CMD (
    if exist "package.json" (
        if not exist "node_modules" (
            echo [*] Installing npm dependencies first (one-time setup, please wait)...
            call %NPM_CMD% install
        )
        echo [*] Step 2/3: Launching PRAJ Web Interface Server (Port 3000)...
        start "PRAJ-Web-Server" cmd /k "cd /d "%SCRIPT_DIR%" && (%NPM_CMD% run dev || %NPM_CMD% start || pause)"
    ) else (
        echo [*] Step 2/3: Using cloud-hosted PRAJ Web Interface...
    )
) else (
    echo [*] Step 2/3: Using cloud-hosted PRAJ Web Interface...
)

:: 7. Wait 3 seconds for listeners to bind and launch user's default browser
echo [*] Step 3/3: Opening PRAJ dashboard in default browser...
timeout /t 3 /nobreak >nul
netstat -aon | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    start http://localhost:3000
) else (
    start https://ais-dev-grpahkusxz6afiadipb4go-151229087198.asia-southeast1.run.app
)

echo.
echo =====================================================================
echo    [SUCCESS] PRAJ System is now fully LIVE!
echo    - Python Desktop Bridge: http://localhost:5000
echo    - Web Voice Dashboard:   http://localhost:3000 (or cloud link)
echo.
echo    Keep this window open or minimize it.
echo    To shut down all PRAJ programs at once, double-click KILL_PRAJ.bat
echo =====================================================================
echo.
pause
