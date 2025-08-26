@echo off
cd /d "%~dp0"
echo ================================
echo   AdaPos Mobile Stock and Price  
echo     BUILD SCRIPT
echo ================================
echo.

echo Building Next.js application...
npm run build

echo.
echo Checking build result...
if exist ".next\BUILD_ID" (
    echo Build SUCCESS - BUILD_ID found
    echo Build completed successfully!
) else (
    echo Build FAILED - BUILD_ID missing
    echo Please check the error messages above
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
