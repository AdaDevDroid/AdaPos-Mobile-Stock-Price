@echo off
setlocal
cd /d "%~dp0"
set "APP_NAME=AdaCheckStockSTD"
set "ENTRY_FILE=server.js"
set "NODE_ENV=production"

echo ================================
echo   AdaPos Mobile Stock and Price
echo     START ^& RESTART SCRIPT (for PM2)
echo ================================
echo.

echo Checking if build exists...
if not exist ".next\BUILD_ID" (
    echo No complete build found! Please run Ada_Build_NextJS.bat first
    pause
    exit /b 1
)
echo Build found!
echo.

where pm2 >nul 2>&1
if errorlevel 1 (
    echo ERROR: PM2 was not found in PATH.
    echo Install it with: npm install -g pm2
    echo.
    pause
    exit /b 1
)

echo ================================================
echo Starting/Restarting application via PM2...
echo.

pm2 describe "%APP_NAME%" >nul 2>&1
if errorlevel 1 (
    echo PM2 process "%APP_NAME%" not found. Starting it for the first time...
    pm2 start "%ENTRY_FILE%" --name "%APP_NAME%" --time --cwd "%CD%"
) else (
    echo PM2 process "%APP_NAME%" found. Restarting with updated environment...
    pm2 restart "%APP_NAME%" --update-env
)

if errorlevel 1 (
    echo.
    echo Failed to start/restart "%APP_NAME%" via PM2.
    echo Please check the PM2 error messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo Saving process list to memory...
pm2 save
if errorlevel 1 (
    echo.
    echo WARNING: pm2 save failed. The app may be running, but PM2 startup memory was not saved.
)

echo.
echo ================================================
echo Application Status:
echo.
pm2 list

echo.
echo Process has been handed over to PM2. You can now close this window.
echo Default URL: http://localhost:3001/AdaCheckStockSTD
echo.
pause
exit /b 0
