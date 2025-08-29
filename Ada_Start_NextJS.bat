@echo off
cd /d "%~dp0"
echo ================================
echo   AdaPos Mobile Stock and Price
echo     START & RESTART SCRIPT (for PM2)
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

echo ================================================
echo Starting/Restarting application via PM2...
echo.


pm2 restart AdaCheckStockSTD

echo.
echo Saving process list to memory...
pm2 save

echo.
echo ================================================
echo Application Status:
echo.
pm2 list

echo.
echo Process has been handed over to PM2. You can now close this window.
echo.
pause