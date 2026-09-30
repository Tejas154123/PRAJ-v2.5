@echo off
title PRAJ SYSTEM - MASTER SWITCH & EMERGENCY KILL PANEL
color 0A
cls

:MENU
cls
echo =====================================================================
echo                PRAJ AI DESKTOP - MASTER SWITCH CONSOLE
echo =====================================================================
echo.
echo   [1] START PRAJ (Launch Python Bridge + Web Server + Browser)
echo   [2] EMERGENCY KILL SWITCH (Immediately stop all programs)
echo   [3] RESTART PRAJ (Clean reboot of all system components)
echo   [4] ABORT SHUTDOWN ONLY (Cancel any active Windows host shutdown)
echo   [5] CHECK STATUS (Inspect Bridge Port 5000 and Web Server Port 3000)
echo   [6] AUTO-INSTALL PYTHON (1-Click Download and Configure Python for Windows)
echo   [7] EXIT CONSOLE
echo.
echo =====================================================================
set /p choice="Enter your selection [1-7] and press ENTER: "

if "%choice%"=="1" goto LAUNCH_ALL
if "%choice%"=="2" goto KILL_ALL
if "%choice%"=="3" goto RESTART_ALL
if "%choice%"=="4" goto CANCEL_SHUTDOWN
if "%choice%"=="5" goto CHECK_STATUS
if "%choice%"=="6" goto INSTALL_PYTHON
if "%choice%"=="7" goto EXIT_SCRIPT

echo Invalid selection. Please choose 1, 2, 3, 4, 5, 6, or 7.
timeout /t 2 >nul
goto MENU

:LAUNCH_ALL
cls
color 0B
echo =====================================================================
echo                PRAJ MASTER SWITCH: STARTING SYSTEM
echo =====================================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in Windows PATH!
    echo.
    if exist "INSTALL_PYTHON.bat" (
        echo [*] Found INSTALL_PYTHON.bat in the current folder.
        set /p RUN_PY="Auto-install Python now? (Y/N): "
        if /i "%RUN_PY%"=="Y" (
            call INSTALL_PYTHON.bat
        )
    ) else (
        echo Tip: Choose Option 6 in Master Switch to install Python automatically.
    )
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        pause
        goto MENU
    )
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in Windows PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    goto MENU
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo [*] Step 1/3: Launching PRAJ Python Desktop Bridge (Port 5000)...
start "PRAJ-Python-Bridge" cmd /k "python praj_desktop_bridge.py"

if exist "package.json" (
    if not exist "node_modules" (
        echo [*] Installing dependencies first (npm install)...
        call npm install
    )
    echo [*] Step 2/3: Launching Web Voice Interface (Port 3000)...
    start "PRAJ-Web-Server" cmd /k "npm run dev || npm start || (echo [ERROR] npm failed to start server. & pause)"
) else (
    echo [!] Note: package.json not found in current directory.
)

echo [*] Step 3/3: Launching PRAJ dashboard in default browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo =====================================================================
echo    [SUCCESS] PRAJ is online and ready for voice commands!
echo =====================================================================
echo Press any key to return to Master Switch menu...
pause >nul
goto MENU

:KILL_ALL
cls
color 0C
echo =====================================================================
echo                PRAJ MASTER SWITCH: KILL SWITCH ACTIVATED
echo =====================================================================
echo.

echo [*] Aborting any pending Windows shutdown sequences...
shutdown /a >nul 2>&1
echo [OK] Windows shutdown aborted.

echo [*] Terminating PRAJ Command Prompt instances...
taskkill /F /FI "WINDOWTITLE eq PRAJ-Python-Bridge*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PRAJ-Web-Server*" >nul 2>&1

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo [*] Stopping Python Bridge on PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [*] Stopping Web Server on PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo =====================================================================
echo    [HALTED] PRAJ Kill Switch completed successfully.
echo    All bridge and server processes have been killed.
echo =====================================================================
echo Press any key to return to Master Switch menu...
pause >nul
goto MENU

:CANCEL_SHUTDOWN
cls
color 0E
echo [*] Sending host abort signal (shutdown /a)...
shutdown /a
echo.
echo If a shutdown was active, it has now been cancelled.
pause
goto MENU

:CHECK_STATUS
cls
color 0F
echo =====================================================================
echo                   PRAJ RUNTIME STATUS CHECK
echo =====================================================================
echo.
echo [*] Checking Python Bridge (Port 5000):
netstat -aon | findstr ":5000" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo    -> Status: ONLINE (Bridge is listening on Port 5000)
) else (
    echo    -> Status: OFFLINE (Bridge is not running)
)
echo.
echo [*] Checking Web Interface Server (Port 3000):
netstat -aon | findstr ":3000" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo    -> Status: ONLINE (Web Server is listening on Port 3000)
) else (
    echo    -> Status: OFFLINE (Web Server is not running)
)

echo.
pause
goto MENU

:RESTART_ALL
cls
color 0E
echo [*] Cycling PRAJ System... Terminating existing instances first...
shutdown /a >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PRAJ-Python-Bridge*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PRAJ-Web-Server*" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul
goto LAUNCH_ALL

:INSTALL_PYTHON
cls
color 0A
echo =====================================================================
echo       [*] 1-CLICK PYTHON AUTO-INSTALLER FOR WINDOWS
echo =====================================================================
echo.
if exist "INSTALL_PYTHON.bat" (
    call INSTALL_PYTHON.bat
) else (
    echo [*] Checking if Python is already installed...
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo [FOUND] Python is already installed: %%v
        echo [*] Installing required PRAJ bridge dependencies (flask, flask-cors, psutil, pywin32)...
        pip install flask flask-cors psutil pywin32 --quiet --disable-pip-version-check
        echo [OK] Python dependencies are ready!
    ) else (
        echo [!] Python is not installed.
        echo [*] Downloading and running official Python 3.11 Windows installer...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe', '%TEMP%\python-installer.exe')"
        if exist "%TEMP%\python-installer.exe" (
            echo [*] Installing Python silently to Windows PATH...
            "%TEMP%\python-installer.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_test=0
            timeout /t 5 /nobreak >nul
            del /f /q "%TEMP%\python-installer.exe" >nul 2>&1
            echo [OK] Python installation completed!
        ) else (
            echo [!] Download failed. Launching python.org...
            start https://www.python.org/downloads/
        )
    )
)
echo.
echo Press any key to return to Master Switch menu...
pause >nul
goto MENU

:EXIT_SCRIPT
cls
echo Exiting PRAJ Master Switch. Have a nice day!
exit /b
