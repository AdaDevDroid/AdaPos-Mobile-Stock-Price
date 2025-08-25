@echo off
cd /d "%~dp0"

:start
echo %date% %time% - Restarting server >> server_log.txt
echo Clearing Next.js cache...
if exist ".next" rd /s /q ".next"
if exist "node_modules\.cache" rd /s /q "node_modules\.cache"

echo Starting Next.js...
start /B cmd /c "npm run start 2>> error_log.txt"

echo Server will restart in 24 hours...
timeout /t 86400 /nobreak
taskkill /f /im "node.exe"
goto start
