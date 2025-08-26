@echo off
cd /d "%~dp0"
echo ================================
echo   AdaPos+ Mobile Stock & Price  
echo     START SCRIPT (FIXED)
echo ================================
echo.

echo 🔍 Checking if build exists...
if not exist ".next" (
    echo ❌ No build found! Please run Ada_Build_NextJS_Fixed.bat first
    pause
    exit /b 1
)

echo ✅ Build found!
echo.

echo 🧹 Clearing cache before start...
call Clear_Cache.bat
echo.

echo 🚀 Starting Next.js server with auto-restart...
echo.
echo 📋 Server Information:
echo - Environment: Production
echo - Port: 3001 (or from environment)
echo - Base Path: /AdaCheckStockSTD
echo - Token Duration: 24 hours (with auto-refresh)
echo - Network Monitoring: Enhanced
echo - Auto-restart: Every day at 1:00 AM
echo - Cache clearing: Before each restart
echo.
echo 🌐 Access URLs:
echo - Local: http://localhost:3001/AdaCheckStockSTD
echo - Network: http://dev.ada-soft.com:3001/AdaCheckStockSTD
echo.
echo ⚠️ Keep this window open while using the application
echo 🔄 Server will restart automatically at 1:00 AM daily
echo 📊 Server logs will appear below:
echo ================================================
echo.

:restart
npm run start
echo.
echo 🔄 Server stopped. Restarting in 5 seconds...
timeout /t 5 /nobreak
goto restart
