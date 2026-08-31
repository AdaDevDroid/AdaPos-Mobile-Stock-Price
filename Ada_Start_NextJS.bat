@echo off
setlocal
cd /d "%~dp0"
set "ENTRY_FILE=server.js"
set "NODE_ENV=production"
set "APP_PORT=3001"
set "BASE_PATH=/AdaCheckStockSTD"

rem Ensure Node.js / npm global tools are available when launched by double-click
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%APPDATA%\npm\pm2.cmd" set "PATH=%APPDATA%\npm;%PATH%"

if exist ".env.local" (
    for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env.local") do (
        if /i "%%~A"=="PORT" for /f "tokens=1 delims=# " %%C in ("%%~B") do set "APP_PORT=%%C"
        if /i "%%~A"=="NEXT_PUBLIC_BASE_PATH" for /f "tokens=1 delims=# " %%C in ("%%~B") do set "BASE_PATH=%%C"
    )
)

set "APP_NAME=%BASE_PATH:/=%"
if not defined APP_NAME set "APP_NAME=AdaCheckStockSTD"

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
node -e "require('./scripts/app-release.cjs').readRelease(process.cwd())"
if errorlevel 1 (
    echo Build metadata is missing or outdated. Please run Ada_Build_NextJS.bat first.
    pause
    exit /b 1
)
echo.

if not exist "version.txt" (
    echo ERROR: version.txt was not found.
    pause
    exit /b 1
)

set /p "APP_VERSION="<"version.txt"
if not defined APP_VERSION (
    echo ERROR: version.txt is empty.
    pause
    exit /b 1
)
echo Version: %APP_VERSION%
echo.

set "PM2_CMD=pm2"
where pm2 >nul 2>&1
if errorlevel 1 (
    if exist "%APPDATA%\npm\pm2.cmd" (
        set "PM2_CMD=%APPDATA%\npm\pm2.cmd"
    ) else (
        echo ERROR: PM2 was not found in PATH.
        echo Install it with: npm install -g pm2
        echo.
        pause
        exit /b 1
    )
)

echo ================================================
echo Starting/Restarting application via PM2...
echo.

call "%PM2_CMD%" describe "%APP_NAME%" >nul 2>&1
if errorlevel 1 (
    echo PM2 process "%APP_NAME%" not found. Starting it for the first time...
    call "%PM2_CMD%" start "%ENTRY_FILE%" --name "%APP_NAME%" --time --cwd "%CD%"
) else (
    echo PM2 process "%APP_NAME%" found. Restarting with updated environment...
    call "%PM2_CMD%" restart "%APP_NAME%" --update-env
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
call "%PM2_CMD%" save
if errorlevel 1 (
    echo.
    echo WARNING: pm2 save failed. The app may be running, but PM2 startup memory was not saved.
)

echo.
echo ================================================
echo Application Status:
echo.
call "%PM2_CMD%" list

echo.
echo Process has been handed over to PM2. You can now close this window.
echo URL: http://localhost:%APP_PORT%%BASE_PATH%
echo.
pause
exit /b 0
