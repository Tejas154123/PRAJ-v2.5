@echo off
setlocal DisableDelayedExpansion
title PRAJ - Master Switch
cd /d "%~dp0"
:MENU
echo.
echo [1] Start PRAJ
echo [2] Stop PRAJ
echo [3] Restart PRAJ
echo [4] Cancel Windows shutdown
echo [5] Check status
echo [6] Install Python
echo [7] Exit
choice /c 1234567 /n /m "Choose [1-7]: "
if errorlevel 7 exit /b 0
if errorlevel 6 goto INSTALL
if errorlevel 5 goto STATUS
if errorlevel 4 goto CANCEL
if errorlevel 3 goto RESTART
if errorlevel 2 goto STOP
:START
if not exist "%~dp0START_PRAJ.bat" goto MISSING
call "%~dp0START_PRAJ.bat"
goto MENU
:STOP
if not exist "%~dp0KILL_PRAJ.bat" goto MISSING
call "%~dp0KILL_PRAJ.bat"
goto MENU
:RESTART
if not exist "%~dp0KILL_PRAJ.bat" goto MISSING
call "%~dp0KILL_PRAJ.bat"
goto START
:CANCEL
shutdown /a
goto MENU
:STATUS
powershell.exe -NoProfile -Command "foreach ($url in @('http://127.0.0.1:5000/api/status','http://127.0.0.1:3000/api/health')) { try { Invoke-RestMethod $url -TimeoutSec 2 | Format-List } catch { Write-Host ($url + ' is offline') } }"
goto MENU
:INSTALL
if not exist "%~dp0INSTALL_PYTHON.bat" goto MISSING
call "%~dp0INSTALL_PYTHON.bat"
goto MENU
:MISSING
echo [ERROR] A launcher file is missing. Extract the entire repository ZIP into one folder.
pause
goto MENU
