@echo off
cd /d "%~dp0"

echo Cleaning up old build...
if exist ".next" rd /s /q ".next"
if exist "node_modules" rd /s /q "node_modules"

echo Installing dependencies...
npm install

echo Building Next.js...
npm run build
pause
