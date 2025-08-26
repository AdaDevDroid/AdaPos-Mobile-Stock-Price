@echo off
cd /d "%~dp0"
echo ================================
echo   AdaPos Mobile Stock and Price  
echo     START SCRIPT (FIXED)
echo ================================
echo.

echo Checking if build exists...
if not exist ".next\BUILD_ID" (
    echo No complete build found! Please run Ada_Build_NextJS.bat first
    echo The .next folder exists but BUILD_ID is missing
    pause
    exit /b 1
)

echo Build found!
echo.

echo Clearing cache before start...
if exist ".next\cache" (
    rmdir /s /q ".next\cache" 2>nul
    echo Cache cleared
) else (
    echo No cache to clear
)
echo.

echo Starting Next.js server...
echo.
echo Server Information:
echo - Environment: Production
echo - Port: 3001 (or from environment)
echo - Base Path: /AdaCheckStockSTD
echo - Auto-restart: Available
echo.
echo Access URLs:
echo - Local: http://localhost:3001/AdaCheckStockSTD
echo - Network: http://dev.ada-soft.com:3001/AdaCheckStockSTD
echo.
echo Keep this window open while using the application
echo Server logs will appear below:
echo ================================================
echo.

npm run start
