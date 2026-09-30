@echo off
title PRAJ SYSTEM - 1-CLICK SMART MASTER TOGGLE SWITCH
color 0B
cls

echo =====================================================================
echo                PRAJ AI - 1-CLICK SMART MASTER SWITCH
echo =====================================================================
echo.
echo [*] Inspecting PRAJ system status on this computer...

:: Check if Port 5000 (Python Bridge) or Port 3000 (Web Server) is listening
netstat -aon | findstr ":5000 :3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    goto ACTION_KILL
) else (
    goto ACTION_START
)

:ACTION_START
color 0A
echo [*] STATUS: PRAJ is currently OFFLINE.
echo [*] ACTION: Activating both programs now (1-Click Master Launch)...
echo.

:: 1. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not added to your Windows PATH!
    echo.
    if exist "INSTALL_PYTHON.bat" (
        echo [*] Found INSTALL_PYTHON.bat in this directory.
        set /p RUN_PY="Auto-install Python for Windows now? (Y/N): "
        if /i "%RUN_PY%"=="Y" (
            call INSTALL_PYTHON.bat
        )
    ) else (
        echo Please download Python from https://www.python.org/ or run INSTALL_PYTHON.bat
    )
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        pause
        exit /b
    )
)

:: 1b. Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not added to your Windows PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: 2. Clear previous port listeners
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: 3. Start Python Desktop Bridge
echo [*] Step 1/3: Launching PRAJ Python Desktop Bridge (Port 5000)...
start "PRAJ-Python-Bridge" cmd /k "python praj_desktop_bridge.py"

:: 4. Start Web Interface Server
echo [*] Step 2/3: Launching PRAJ Web Voice Server (Port 3000)...
if exist "package.json" (
    if not exist "node_modules" (
        echo [*] Installing dependencies first...
        call npm install
    )
    start "PRAJ-Web-Server" cmd /k "npm run dev || npm start || (echo [ERROR] npm failed to start server. & pause)"
) else (
    echo [!] Note: package.json not found in current folder.
)

:: 4. Open in browser
echo [*] Step 3/3: Opening PRAJ dashboard in default browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo =====================================================================
echo    [ONLINE] PRAJ is now fully operational!
echo    - Python Desktop Bridge: http://localhost:5000
echo    - Web Voice Dashboard:   http://localhost:3000
echo.
echo    Tip: Double-click PRAJ_SWITCH.bat again anytime to KILL the system.
echo =====================================================================
echo.
timeout /t 4 >nul
exit /b

:ACTION_KILL
color 0C
echo [!] STATUS: PRAJ is currently RUNNING.
echo [!] ACTION: Triggering Emergency Kill Switch...
echo.

:: 1. Abort scheduled shutdowns
shutdown /a >nul 2>&1
echo [OK] Aborted scheduled host shutdowns (shutdown /a)

:: 2. Terminate PRAJ command windows
taskkill /F /FI "WINDOWTITLE eq PRAJ-Python-Bridge*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PRAJ-Web-Server*" >nul 2>&1

:: 3. Terminate Port 5000 and 3000 listeners
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo [*] Terminating Python Bridge on PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [*] Terminating Web Server on PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo =====================================================================
echo    [HALTED] PRAJ Kill Switch completed successfully.
echo    All bridge and server processes have been killed.
echo.
echo    Tip: Double-click PRAJ_SWITCH.bat again anytime to START the system.
echo =====================================================================
echo.
timeout /t 4 >nul
exit /b
