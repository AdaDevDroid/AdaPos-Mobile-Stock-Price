@echo off
cd /d "%~dp0"
title AdaPos+ Server Monitor
echo ================================
echo     AdaPos+ SERVER MONITOR
echo ================================
echo.

:monitor
cls
echo 🔍 Server Status Check - %date% %time%
echo ================================================
echo.

echo 📊 Checking server process...
tasklist /fi "imagename eq node.exe" /fo csv | find /i "node.exe" >nul
if %errorlevel% equ 0 (
    echo ✅ Node.js process: RUNNING
    
    echo.
    echo 🌐 Checking HTTP response...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/AdaCheckStockSTD/api/health' -TimeoutSec 5; if($response.StatusCode -eq 200){ Write-Host '✅ HTTP Health Check: OK' -ForegroundColor Green; $content = $response.Content | ConvertFrom-Json; Write-Host ('📈 Uptime: ' + $content.uptime) -ForegroundColor Cyan; Write-Host ('🕐 Last Check: ' + $content.timestamp) -ForegroundColor Cyan } else { Write-Host '⚠️ HTTP Health Check: FAILED' -ForegroundColor Yellow } } catch { Write-Host '❌ HTTP Health Check: ERROR' -ForegroundColor Red }"
    
    echo.
    echo 💾 Memory usage:
    powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Select-Object ProcessName, @{Name='CPU(%)';Expression={$_.CPU}}, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet/1MB,2)}} | Format-Table -AutoSize"
    
    echo.
    echo 🌐 Network connections:
    netstat -ano | findstr "3001"
    
) else (
    echo ❌ Node.js process: NOT RUNNING
    echo.
    echo 🔄 Attempting to restart server...
    call Ada_Start_NextJS_Fixed.bat
)

echo.
echo 📋 Quick Actions:
echo [R] Restart Server   [C] Clear Cache   [Q] Quit Monitor
echo.
echo ⏰ Auto-refresh in 30 seconds...
echo.

choice /c RCQ /t 30 /d R /n >nul
if errorlevel 3 goto exit
if errorlevel 2 goto clear_cache
if errorlevel 1 goto restart_server

goto monitor

:restart_server
echo 🔄 Manual restart initiated...
call Manual_Restart.bat
goto monitor

:clear_cache
echo 🧹 Clearing cache...
call Clear_Cache.bat
echo ✅ Cache cleared!
timeout /t 3 /nobreak >nul
goto monitor

:exit
echo 👋 Monitor stopped.
pause
