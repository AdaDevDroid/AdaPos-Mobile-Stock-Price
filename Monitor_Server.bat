@echo off
cd /d "%~dp0"

:check
echo Checking server status...
netstat -ano | findstr "3000"
echo Memory usage:
tasklist | findstr "node.exe"
timeout /t 300 /nobreak
goto check
