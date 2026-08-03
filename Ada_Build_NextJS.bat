@echo off
setlocal
cd /d "%~dp0"

rem Ensure Node.js / npm are available when launched by double-click
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%APPDATA%\npm\npm.cmd" set "PATH=%APPDATA%\npm;%PATH%"

echo ================================
echo   AdaPos Mobile Stock and Price
echo     BUILD SCRIPT
echo ================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm was not found in PATH.
    echo Please install Node.js or open a terminal where npm is available.
    echo.
    pause
    exit /b 1
)

echo Building Next.js application...
call npm run build
if errorlevel 1 (
    echo.
    echo Build FAILED - npm run build returned an error
    echo Please check the error messages above
    echo.
    pause
    exit /b 1
)

echo.
echo Checking build result...
if exist ".next\BUILD_ID" (
    echo Build SUCCESS - BUILD_ID found
    echo Build completed successfully!
) else (
    echo Build FAILED - BUILD_ID missing
    echo Please check the error messages above
    echo.
    pause
    exit /b 1
)

echo.
echo Ready to start with Ada_Start_NextJS.bat
echo.
pause
exit /b 0
