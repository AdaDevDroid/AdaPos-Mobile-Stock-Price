@echo off
cd /d "%~dp0"
echo ================================
echo   AdaPos Mobile Stock and Price  
echo     BUILD SCRIPT (FIXED)
echo ================================
echo.

echo [1/4] Cleaning previous build...
if exist ".next" (
    rmdir /s /q ".next"
    echo Previous build cleaned
) else (
    echo No previous build found
)

echo.
echo [2/4] Installing dependencies...
npm install
if errorlevel 1 (
    echo npm install failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Building Next.js application...
npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
) else (
    echo Build completed successfully!
)

echo.
echo [4/4] Verifying build...
if exist ".next\BUILD_ID" (
    echo Build verification: SUCCESS
) else (
    echo Build verification: FAILED - BUILD_ID missing
    pause
    exit /b 1
)
echo.
echo Build Summary:
echo - Token expiry extended to 24 hours
echo - Network status monitoring improved  
echo - Auto token refresh enabled
echo - PWA cache handling enhanced
echo.
echo Ready to start with Ada_Start_NextJS.bat
echo.
pause
