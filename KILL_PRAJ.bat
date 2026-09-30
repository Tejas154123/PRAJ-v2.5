@echo off
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
