/**
 * Windows 1-Click Batch Automation Scripts for PRAJ System
 */

// Keep the standalone installer and the browser download identical.
import pythonInstaller from './pythonInstaller';
export const INSTALL_PYTHON_BAT = pythonInstaller;

export const START_PRAJ_BAT = `@echo off
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
    if exist "%LOCALAPPDATA%\\Programs\\Python\\%%v\\python.exe" (
        set "PATH=%LOCALAPPDATA%\\Programs\\Python\\%%v;%LOCALAPPDATA%\\Programs\\Python\\%%v\\Scripts;%PATH%"
        set "PY_CMD=%LOCALAPPDATA%\\Programs\\Python\\%%v\\python.exe"
        goto FOUND_PYTHON
    )
)

:: Priority 4: Check Program Files installations
for %%v in (Python313 Python312 Python311 Python310) do (
    if exist "%ProgramFiles%\\Python\\%%v\\python.exe" (
        set "PATH=%ProgramFiles%\\Python\\%%v;%ProgramFiles%\\Python\\%%v\\Scripts;%PATH%"
        set "PY_CMD=%ProgramFiles%\\Python\\%%v\\python.exe"
        goto FOUND_PYTHON
    )
    if exist "%ProgramFiles%\\%%v\\python.exe" (
        set "PATH=%ProgramFiles%\\%%v;%ProgramFiles%\\%%v\\Scripts;%PATH%"
        set "PY_CMD=%ProgramFiles%\\%%v\\python.exe"
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
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
title PRAJ SYSTEM - MASTER SWITCH CONSOLE
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
echo   [6] AUTO-INSTALL PYTHON (1-Click Download and Configure Python)
echo   [7] EXIT CONSOLE
echo.
echo =====================================================================
set "choice="
set /p choice="Enter your selection [1-7] and press ENTER: "

if "%choice%"=="1" goto LAUNCH_ALL
if "%choice%"=="2" goto KILL_ALL
if "%choice%"=="3" goto RESTART_ALL
if "%choice%"=="4" goto CANCEL_SHUTDOWN
if "%choice%"=="5" goto CHECK_STATUS
if "%choice%"=="6" goto INSTALL_PYTHON
if "%choice%"=="7" goto EXIT_SCRIPT

echo.
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

:: 1. Comprehensive Python detection (checks py launcher, PATH, and Python 3.13 / 3.12 / 3.11 locations)
set "PY_CMD="

:: Priority 1: py -3 launcher
py -3 -c "import sys; assert sys.version_info >= (3, 8)" >nul 2>&1
if %errorlevel% equ 0 (
    set "PY_CMD=py -3"
    goto FOUND_PYTHON
)

:: Priority 2: python command in current PATH
python -c "import sys; assert sys.version_info >= (3, 8)" >nul 2>&1
if %errorlevel% equ 0 (
    set "PY_CMD=python"
    goto FOUND_PYTHON
)

:: Priority 3: Check AppData user installations (Python 3.13, 3.12, 3.11, 3.10)
for %%v in (Python313 Python312 Python311 Python310) do (
    if exist "%LOCALAPPDATA%\\Programs\\Python\\%%v\\python.exe" (
        set "PATH=%LOCALAPPDATA%\\Programs\\Python\\%%v;%LOCALAPPDATA%\\Programs\\Python\\%%v\\Scripts;%PATH%"
        set "PY_CMD=%LOCALAPPDATA%\\Programs\\Python\\%%v\\python.exe"
        goto FOUND_PYTHON
    )
)

:: Priority 4: Check Program Files installations
for %%v in (Python313 Python312 Python311 Python310) do (
    if exist "%ProgramFiles%\\Python\\%%v\\python.exe" (
        set "PATH=%ProgramFiles%\\Python\\%%v;%ProgramFiles%\\Python\\%%v\\Scripts;%PATH%"
        set "PY_CMD=%ProgramFiles%\\Python\\%%v\\python.exe"
        goto FOUND_PYTHON
    )
    if exist "%ProgramFiles%\\%%v\\python.exe" (
        set "PATH=%ProgramFiles%\\%%v;%ProgramFiles%\\%%v\\Scripts;%PATH%"
        set "PY_CMD=%ProgramFiles%\\%%v\\python.exe"
        goto FOUND_PYTHON
    )
)

:FOUND_PYTHON
if not defined PY_CMD (
    echo [ERROR] Python is not installed or not in Windows PATH!
    echo.
    if exist "INSTALL_PYTHON.bat" (
        echo [*] Running INSTALL_PYTHON.bat automatically...
        call "%SCRIPT_DIR%INSTALL_PYTHON.bat"
    ) else (
        echo Please select Option [6] from the menu to auto-install Python.
    )
    goto MENU
)

echo [*] Python verified:
%PY_CMD% --version

:: 2. Check Node / npm (Optional: if not installed, will use cloud-hosted PRAJ Web App)
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
    echo [*] Note: Node.js is not in PATH. Will launch Python Desktop Bridge and open cloud PRAJ Voice interface!
)

:: 3. Clear existing listeners on Port 5000 and 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: 4. Start Python Bridge
echo [*] Step 1/3: Launching PRAJ Python Desktop Bridge (Port 5000)...
start "PRAJ-Python-Bridge" cmd /k "cd /d "%SCRIPT_DIR%" && %PY_CMD% praj_desktop_bridge.py"

:: 5. Start Local Web Server (if package.json and npm exist)
if defined NPM_CMD (
    if exist "package.json" (
        echo [*] Step 2/3: Launching Web Voice Interface (Port 3000)...
        if not exist "node_modules" (
            echo [*] Installing dependencies first (%NPM_CMD% install)...
            call %NPM_CMD% install
        )
        start "PRAJ-Web-Server" cmd /k "cd /d "%SCRIPT_DIR%" && (%NPM_CMD% run dev || %NPM_CMD% start || pause)"
    ) else (
        echo [*] Step 2/3: Using cloud-hosted PRAJ Web Interface...
    )
) else (
    echo [*] Step 2/3: Using cloud-hosted PRAJ Web Interface...
)

:: 6. Launch browser
echo [*] Step 3/3: Opening browser to PRAJ voice dashboard...
timeout /t 3 /nobreak >nul
netstat -aon | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    start http://localhost:3000
) else (
    start https://ais-dev-grpahkusxz6afiadipb4go-151229087198.asia-southeast1.run.app
)

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
if exist "%SCRIPT_DIR%INSTALL_PYTHON.bat" (
    call "%SCRIPT_DIR%INSTALL_PYTHON.bat"
) else (
    echo [*] Launching python installer...
    start https://www.python.org/downloads/
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
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
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

:: 1. Comprehensive Python detection
set "PY_CMD="

py -3 -c "import sys; assert sys.version_info >= (3, 8)" >nul 2>&1
if %errorlevel% equ 0 (
    set "PY_CMD=py -3"
    goto FOUND_PYTHON
)

python -c "import sys; assert sys.version_info >= (3, 8)" >nul 2>&1
if %errorlevel% equ 0 (
    set "PY_CMD=python"
    goto FOUND_PYTHON
)

for %%v in (Python313 Python312 Python311 Python310) do (
    if exist "%LOCALAPPDATA%\\Programs\\Python\\%%v\\python.exe" (
        set "PATH=%LOCALAPPDATA%\\Programs\\Python\\%%v;%LOCALAPPDATA%\\Programs\\Python\\%%v\\Scripts;%PATH%"
        set "PY_CMD=%LOCALAPPDATA%\\Programs\\Python\\%%v\\python.exe"
        goto FOUND_PYTHON
    )
)

for %%v in (Python313 Python312 Python311 Python310) do (
    if exist "%ProgramFiles%\\Python\\%%v\\python.exe" (
        set "PATH=%ProgramFiles%\\Python\\%%v;%ProgramFiles%\\Python\\%%v\\Scripts;%PATH%"
        set "PY_CMD=%ProgramFiles%\\Python\\%%v\\python.exe"
        goto FOUND_PYTHON
    )
    if exist "%ProgramFiles%\\%%v\\python.exe" (
        set "PATH=%ProgramFiles%\\%%v;%ProgramFiles%\\%%v\\Scripts;%PATH%"
        set "PY_CMD=%ProgramFiles%\\%%v\\python.exe"
        goto FOUND_PYTHON
    )
)

:FOUND_PYTHON
if not defined PY_CMD (
    echo [ERROR] Python is not installed or not added to your Windows PATH!
    echo.
    if exist "INSTALL_PYTHON.bat" (
        echo [*] Running INSTALL_PYTHON.bat in this directory...
        call "%SCRIPT_DIR%INSTALL_PYTHON.bat"
    ) else (
        echo Please download Python from https://www.python.org/ or run INSTALL_PYTHON.bat
    )
    py -3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        set "PY_CMD=py -3"
    ) else (
        python --version >nul 2>&1
        if %errorlevel% equ 0 (
            set "PY_CMD=python"
        ) else (
            pause
            exit /b
        )
    )
)

:: 1b. Check Node.js (Optional)
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
    echo [*] Node.js verified.
) else (
    echo [*] Note: Node.js is not in PATH. Will launch Python Desktop Bridge and open cloud PRAJ Voice interface!
)

:: 2. Clear previous port listeners
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: 3. Start Python Desktop Bridge
echo [*] Step 1/3: Launching PRAJ Python Desktop Bridge (Port 5000)...
start "PRAJ-Python-Bridge" cmd /k "cd /d "%SCRIPT_DIR%" && %PY_CMD% praj_desktop_bridge.py"

:: 4. Start Web Interface Server (if package.json and npm exist)
if defined NPM_CMD (
    if exist "package.json" (
        if not exist "node_modules" (
            echo [*] Installing dependencies first (%NPM_CMD% install)...
            call %NPM_CMD% install
        )
        echo [*] Step 2/3: Launching PRAJ Web Voice Server (Port 3000)...
        start "PRAJ-Web-Server" cmd /k "cd /d "%SCRIPT_DIR%" && (%NPM_CMD% run dev || %NPM_CMD% start || pause)"
    ) else (
        echo [*] Step 2/3: Using cloud-hosted PRAJ Web Interface...
    )
) else (
    echo [*] Step 2/3: Using cloud-hosted PRAJ Web Interface...
)

:: 5. Open in browser
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
echo    [ONLINE] PRAJ is now fully operational!
echo    - Python Desktop Bridge: http://localhost:5000
echo    - Web Voice Dashboard:   http://localhost:3000 (or cloud link)
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
  const windowsContent = content.replace(/\r?\n/g, '\r\n');
  const blob = new Blob([windowsContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
