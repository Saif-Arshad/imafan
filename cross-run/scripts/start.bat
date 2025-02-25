@echo off
setlocal enabledelayedexpansion

:: Set script directory as working directory
cd /d "%~dp0\" || (
    echo Error: Could not change to script directory
    exit /b 1
)

:: Log file setup
set "LOG_DIR=logs"
set "LOG_FILE=%LOG_DIR%\startup_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%.log"
set "LOG_FILE=%LOG_FILE: =0%"

:: Ensure log directory exists
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:: Start logging
echo === Script started at %date% %time% === >> "%LOG_FILE%"

:: Kill existing processes
taskkill /F /IM "node.exe" >nul 2>&1

:: Check for required commands
for %%i in (node npm git) do (
    where %%i >nul 2>&1 || (
        echo Error: %%i is required but not installed. >> "%LOG_FILE%"
        echo Error: %%i is required but not installed.
        exit /b 1
    )
)

:: Get IP Address (try multiple network adapters)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4" ^| find /v "169.254"') do (
    set "IP_ADDRESS=%%a"
    set "IP_ADDRESS=!IP_ADDRESS:~1!"
    if not "!IP_ADDRESS!"=="" goto :found_ip
)

:found_ip
if "%IP_ADDRESS%"=="" (
    echo Warning: Could not determine IP address. Using localhost. >> "%LOG_FILE%"
    set "IP_ADDRESS=localhost"
)

set "NEXTAUTH_URL=http://%IP_ADDRESS%:3000"
echo Setting NEXTAUTH_URL to: %NEXTAUTH_URL% >> "%LOG_FILE%"

:: Start backend
if not exist "backend" (
    echo Error: Backend folder not found! >> "%LOG_FILE%"
    echo Error: Backend folder not found!
    exit /b 1
)

cd backend || exit /b 1
call :run_command "Pulling backend" "git pull"
call :run_command "Installing backend dependencies" "npm i"
echo Starting backend server... >> "%LOG_FILE%"
start "Backend Server" cmd /c "npm run dev || pause"

:: Start dashboard
cd ../dashboard || (
    echo Error: Dashboard folder not found! >> "%LOG_FILE%"
    echo Error: Dashboard folder not found!
    exit /b 1
)

:: Update .env file
(
    for /f "tokens=*" %%a in (.env) do (
        echo %%a | findstr /v "NEXTAUTH_URL" >nul && echo %%a
    )
    echo NEXTAUTH_URL=%NEXTAUTH_URL%
) > .env.tmp
move /y .env.tmp .env >nul

call :run_command "Pulling dashboard" "git pull"
call :run_command "Installing dashboard dependencies" "npm i"
echo Starting dashboard server... >> "%LOG_FILE%"
start "Dashboard Server" cmd /c "npm run dev || pause"

cd ..
echo.
echo === App started successfully === >> "%LOG_FILE%"
echo === App running at %NEXTAUTH_URL% === >> "%LOG_FILE%"
echo === App running at %NEXTAUTH_URL% ===
echo === Press any key to terminate all processes ===
pause

:: Cleanup on exit
taskkill /F /IM "node.exe" >nul 2>&1
exit /b 0

:run_command
echo %~1... >> "%LOG_FILE%"
echo %~1...
%~2 >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
    echo Error during %~1 >> "%LOG_FILE%"
    echo Error during %~1
    exit /b 1
)
goto :eof