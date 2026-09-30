@echo off
title PRAJ SYSTEM - 1-CLICK MASTER LAUNCHER
color 0B
cls
echo =====================================================================
echo                PRAJ AI DESKTOP - MASTER 1-CLICK LAUNCHER
echo =====================================================================
echo.
echo [*] Initiating PRAJ Core System...
echo.

:: 1. Verify Python availability
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not added to your Windows PATH!
    echo.
    if exist "INSTALL_PYTHON.bat" (
        echo [*] Found INSTALL_PYTHON.bat in the current folder!
        set /p RUN_PY_SETUP="Would you like to install Python automatically now? (Y/N): "
        if /i "%RUN_PY_SETUP%"=="Y" (
            call INSTALL_PYTHON.bat
        )
    ) else (
        echo Tip: Run INSTALL_PYTHON.bat or choose Option 6 in PRAJ_MASTER_SWITCH.bat
    )
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo Please ensure Python is installed and added to PATH, then re-run this launcher.
        pause
        exit /b
    )
)

:: 2. Verify Node.js availability
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not added to your Windows PATH!
    echo Please install Node.js from https://nodejs.org/ (LTS version recommended).
    echo.
    pause
    exit /b
)

:: 3. Clean up any stale or stuck processes on Port 5000 & 3000 first
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: 4. Start Python Desktop Bridge in a dedicated window
echo [*] Step 1/3: Launching PRAJ Python Desktop Bridge (Port 5000)...
start "PRAJ-Python-Bridge" cmd /k "python praj_desktop_bridge.py"

:: 5. Install dependencies if node_modules is missing
if exist "package.json" (
    if not exist "node_modules" (
        echo [*] Installing npm dependencies first (one-time setup, please wait)...
        call npm install
    )
)

:: 6. Start Node.js Web Server in a dedicated window
echo [*] Step 2/3: Launching PRAJ Web Interface Server (Port 3000)...
if exist "package.json" (
    start "PRAJ-Web-Server" cmd /k "npm run dev || npm start || (echo [ERROR] npm failed to start server. & pause)"
) else (
    echo [!] Note: package.json not found in current directory.
)

:: 7. Wait 3 seconds for listeners to bind and launch user's default browser
echo [*] Step 3/3: Opening PRAJ dashboard in default browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo =====================================================================
echo    [SUCCESS] PRAJ System is now fully LIVE!
echo    - Python Desktop Bridge: http://localhost:5000
echo    - Web Voice Dashboard:   http://localhost:3000
echo.
echo    Keep this window open or minimize it.
echo    To shut down all PRAJ programs at once, double-click KILL_PRAJ.bat
echo =====================================================================
echo.
pause
