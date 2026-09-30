/**
 * Windows 1-Click Batch Automation Scripts for PRAJ System
 */

export const INSTALL_PYTHON_BAT = `@echo off
setlocal EnableDelayedExpansion
title PRAJ SYSTEM - 1-CLICK PYTHON AUTO-INSTALLER
color 0A
cls
echo =====================================================================
echo           PRAJ AI - 1-CLICK PYTHON INSTALLER FOR WINDOWS
echo =====================================================================
echo.
echo [*] Checking if Python is already available on this PC...

:: Check standard python command
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('python --version 2^>^&1') do set "PY_VER=%%v"
    echo [FOUND] Python is installed: !PY_VER!
    goto INSTALL_LIBS
)

:: Check py launcher
py -3 --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('py -3 --version 2^>^&1') do set "PY_VER=%%v"
    echo [FOUND] Python launcher is installed: !PY_VER!
    goto INSTALL_LIBS_PY
)

:: Check common default installation locations
if exist "%LOCALAPPDATA%\\Programs\\Python\\Python311\\python.exe" (
    set "PATH=%LOCALAPPDATA%\\Programs\\Python\\Python311;%LOCALAPPDATA%\\Programs\\Python\\Python311\\Scripts;!PATH!"
    echo [FOUND] Python found in AppData!
    goto INSTALL_LIBS
)
if exist "%ProgramFiles%\\Python311\\python.exe" (
    set "PATH=%ProgramFiles%\\Python311;%ProgramFiles%\\Python311\\Scripts;!PATH!"
    echo [FOUND] Python found in Program Files!
    goto INSTALL_LIBS
)

echo [!] Python is NOT detected in your Windows system.
echo [*] Downloading official Python 3.11 for Windows...
echo.

set "PY_INSTALLER_PATH=%TEMP%\\praj_python_setup.exe"
set "PY_URL=https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"

if "%PROCESSOR_ARCHITECTURE%"=="x86" (
    if not defined PROCESSOR_ARCHITEW6432 (
        set "PY_URL=https://www.python.org/ftp/python/3.11.9/python-3.11.9.exe"
    )
)

echo [*] Downloading installer from python.org to %TEMP%...
echo     URL: %PY_URL%

powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('%PY_URL%', '%PY_INSTALLER_PATH%')"

if not exist "%PY_INSTALLER_PATH%" (
    echo [!] Direct download failed or was interrupted.
    echo [*] Attempting install via winget (Windows Package Manager)...
    winget install --id Python.Python.3.11 -e --source winget --accept-source-agreements --accept-package-agreements
    goto VERIFY_INSTALL
)

echo.
echo [*] Installing Python silently for the current user...
echo [*] Adding Python to Windows PATH automatically (PrependPath=1)...
"%PY_INSTALLER_PATH%" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_test=0 Include_doc=0 Include_launcher=1 Shortcuts=0

echo [*] Waiting for Windows registry & environment update...
timeout /t 6 /nobreak >nul

if exist "%PY_INSTALLER_PATH%" del /f /q "%PY_INSTALLER_PATH%" >nul 2>&1

:VERIFY_INSTALL
set "PATH=%LOCALAPPDATA%\\Programs\\Python\\Python311;%LOCALAPPDATA%\\Programs\\Python\\Python311\\Scripts;%ProgramFiles%\\Python311;%ProgramFiles%\\Python311\\Scripts;!PATH!"

python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Python installed successfully!
    python --version
    goto INSTALL_LIBS
)

py -3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Python installed and py launcher is ready!
    py -3 --version
    goto INSTALL_LIBS_PY
)

echo.
echo [NOTE] Python installation has finished, but your current command prompt
echo        needs to refresh its PATH variable.
echo        Please close this window and re-run PRAJ_MASTER_SWITCH.bat.
echo.
pause
exit /b 0

:INSTALL_LIBS
echo.
echo [*] Checking pip and installing PRAJ bridge libraries (flask, flask-cors, psutil, pywin32)...
python -m pip install --upgrade pip --quiet --disable-pip-version-check >nul 2>&1
python -m pip install flask flask-cors psutil pywin32 --quiet --disable-pip-version-check
echo.
echo =====================================================================
echo    [READY] Python & all PRAJ bridge libraries are installed!
echo    You can now run PRAJ without any errors.
echo =====================================================================
echo.
pause
exit /b 0

:INSTALL_LIBS_PY
echo.
echo [*] Installing PRAJ bridge libraries using py launcher...
py -3 -m pip install flask flask-cors psutil pywin32 --quiet --disable-pip-version-check
echo.
echo =====================================================================
echo    [READY] Python & all PRAJ bridge libraries are installed!
echo =====================================================================
echo.
pause
exit /b 0
`;

export const START_PRAJ_BAT = `@echo off
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
        echo [*] Detected INSTALL_PYTHON.bat in the current folder!
        set /p RUN_PY_SETUP="Would you like to install Python automatically now? (Y/N): "
        if /i "%RUN_PY_SETUP%"=="Y" (
            call INSTALL_PYTHON.bat
        )
    ) else (
        echo Tip: Run INSTALL_PYTHON.bat or download Python from https://www.python.org/
    )
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo Please ensure Python is installed and added to PATH, then re-run this launcher.
        pause
        exit /b
    )
)

:: 2. Verify Node.js availability
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not added to your Windows PATH!
    echo Please install Node.js from https://nodejs.org/ (LTS recommended).
    echo.
    pause
    exit /b
)

:: 3. Clear existing listeners on Port 5000 and 3000
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
    start "PRAJ-Web-Server" cmd /k "npm run dev || npm start || (echo. & echo [ERROR] npm failed to start server. & pause)"
) else (
    echo [!] Note: package.json not detected in current folder, skipping npm dev.
)

:: 4. Launch Web App in browser
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
`;

export const KILL_PRAJ_BAT = `@echo off
title PRAJ SYSTEM - 1-CLICK KILL SWITCH
color 0C
cls
echo =====================================================================
echo                PRAJ AI - EMERGENCY 1-CLICK KILL SWITCH
echo =====================================================================
echo.
echo [*] Executing Emergency Shutdown for all PRAJ processes...
echo.

:: 1. Abort any active Windows scheduled shutdown sequence
shutdown /a >nul 2>&1
echo [OK] Windows shutdown sequences aborted (shutdown /a)

:: 2. Terminate named PRAJ Command Prompt windows if present
taskkill /F /FI "WINDOWTITLE eq PRAJ-Python-Bridge*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PRAJ-Web-Server*" >nul 2>&1

:: 3. Terminate python process running praj_desktop_bridge.py
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo [*] Terminating PRAJ Desktop Bridge on PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

:: 4. Terminate node process running on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [*] Terminating PRAJ Web Server on PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo =====================================================================
echo    [HALTED] All PRAJ processes have been successfully terminated!
echo    - Python Desktop Bridge (Port 5000): STOPPED
echo    - Web Application Server (Port 3000): STOPPED
echo    - Host Scheduled Shutdown: ABORTED
echo =====================================================================
echo.
timeout /t 3 >nul
`;

export const PRAJ_MASTER_SWITCH_BAT = `@echo off
title PRAJ SYSTEM - MASTER SWITCH & EMERGENCY KILL PANEL
color 0A
cls

:MENU
cls
echo =====================================================================
echo                PRAJ AI DESKTOP - MASTER SWITCH CONSOLE
echo =====================================================================
echo.
echo    [1] ACTIVATE PRAJ SYSTEM  (1-Click Master Launch: Bridge + Web UI)
echo    [2] EMERGENCY KILL SWITCH (1-Click Terminate All Programs & Abort)
echo    [3] ABORT SHUTDOWN ONLY   (Cancel any pending Windows shutdown)
echo    [4] SYSTEM STATUS CHECK   (Inspect Port 5000 & 3000 processes)
echo    [5] RESTART PRAJ SYSTEM   (Full cycle restart: Kill -> Re-launch)
echo    [6] INSTALL PYTHON (1-CLICK) (Auto-download official Python & all dependencies)
echo    [7] EXIT CONSOLE
echo.
echo =====================================================================
set /p choice="Enter option [1-7] and press Enter: "

if "%choice%"=="1" goto LAUNCH_ALL
if "%choice%"=="2" goto KILL_ALL
if "%choice%"=="3" goto ABORT_SHUTDOWN
if "%choice%"=="4" goto STATUS_CHECK
if "%choice%"=="5" goto RESTART_ALL
if "%choice%"=="6" goto RUN_PYTHON_SETUP
if "%choice%"=="7" goto EXIT_SCRIPT

echo [!] Invalid selection, please enter 1, 2, 3, 4, 5, 6, or 7.
timeout /t 2 >nul
goto MENU

:LAUNCH_ALL
cls
color 0B
echo =====================================================================
echo           [*] ACTIVATING COMPLETE PRAJ SYSTEM (1-CLICK)
echo =====================================================================
echo.
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in Windows PATH!
    echo Please install Python from https://www.python.org/
    pause
    goto MENU
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

echo [*] 1/3: Starting Python Desktop Agent on Port 5000...
start "PRAJ-Python-Bridge" cmd /k "python praj_desktop_bridge.py"

echo [*] 2/3: Starting Web Interface Server on Port 3000...
if exist "package.json" (
    if not exist "node_modules" (
        echo [*] Installing dependencies first...
        call npm install
    )
    start "PRAJ-Web-Server" cmd /k "npm run dev || npm start || (echo [ERROR] npm failed to start server. & pause)"
) else (
    echo [!] Note: package.json not found in this folder.
)

echo [*] 3/3: Opening PRAJ in default browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo [SUCCESS] PRAJ System is fully operational!
echo Press any key to return to Master Switch menu...
pause >nul
goto MENU

:KILL_ALL
cls
color 0C
echo =====================================================================
echo           [!] EXECUTING EMERGENCY KILL SWITCH (1-CLICK)
echo =====================================================================
echo.
echo [*] Aborting any scheduled Windows host shutdowns...
shutdown /a >nul 2>&1
echo [OK] Windows shutdown aborted.

echo [*] Terminating PRAJ Command Prompt windows...
taskkill /F /FI "WINDOWTITLE eq PRAJ-Python-Bridge*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PRAJ-Web-Server*" >nul 2>&1

echo [*] Killing process on Port 5000 (Python Desktop Bridge)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo   - Terminating PID %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] Killing process on Port 3000 (PRAJ Web Server)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo   - Terminating PID %%a
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

:ABORT_SHUTDOWN
cls
color 0E
echo =====================================================================
echo           [*] ABORTING WINDOWS SHUTDOWN ("ARISE")
echo =====================================================================
echo.
shutdown /a
if %errorlevel% equ 0 (
    echo.
    echo [OK] Shutdown sequence cancelled successfully! System stands ready.
) else (
    echo.
    echo [NOTE] No active shutdown sequence was scheduled.
)
echo.
pause
goto MENU

:STATUS_CHECK
cls
color 07
echo =====================================================================
echo                  PRAJ SYSTEM PORT & PROCESS AUDIT
echo =====================================================================
echo.
echo [*] Checking Port 5000 (Python Desktop Bridge):
netstat -aon | findstr ":5000" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo    -> Status: ONLINE (Bridge is active and listening)
) else (
    echo    -> Status: OFFLINE (Bridge is not running)
)

echo.
echo [*] Checking Port 3000 (PRAJ Web Interface):
netstat -aon | findstr ":3000" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo    -> Status: ONLINE (Web Server is active and listening)
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

:RUN_PYTHON_SETUP
cls
color 0A
echo =====================================================================
echo       [*] RUNNING 1-CLICK PYTHON AUTO-INSTALLER FOR WINDOWS
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
        powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $wc = New-Object System.Net.WebClient; Write-Host 'Downloading Python installer...'; $wc.DownloadFile('https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe', '%TEMP%\\python-installer.exe')"
        if exist "%TEMP%\\python-installer.exe" (
            echo [*] Installing Python silently to Windows PATH...
            "%TEMP%\\python-installer.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_pip=1 Include_test=0
            timeout /t 5 /nobreak >nul
            del /f /q "%TEMP%\\python-installer.exe" >nul 2>&1
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
`;

export const PRAJ_SWITCH_BAT = `@echo off
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

:: 1b. Check Node
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
`;

export function downloadScriptFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
