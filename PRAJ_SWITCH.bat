@echo off
setlocal DisableDelayedExpansion
title PRAJ - Toggle
cd /d "%~dp0"
powershell.exe -NoProfile -Command "try { $bridge=Invoke-RestMethod 'http://127.0.0.1:5000/api/status' -TimeoutSec 2; $web=Invoke-RestMethod 'http://127.0.0.1:3000/api/health' -TimeoutSec 2; if ($bridge.agent -eq 'PRAJ Desktop Bridge' -and $web.name -eq 'PRAJ') { exit 0 }; exit 1 } catch { exit 1 }"
if errorlevel 1 goto START
if not exist "%~dp0KILL_PRAJ.bat" goto MISSING
call "%~dp0KILL_PRAJ.bat"
exit /b %ERRORLEVEL%
:START
if not exist "%~dp0START_PRAJ.bat" goto MISSING
call "%~dp0START_PRAJ.bat"
exit /b %ERRORLEVEL%
:MISSING
echo [ERROR] A launcher file is missing. Extract the entire repository ZIP into one folder.
pause
exit /b 1
