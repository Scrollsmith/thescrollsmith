@echo off
setlocal
cd /d "%~dp0"

echo.
echo  Kyros live start
echo  folder: %cd%
echo.

if not exist ".env" (
  echo  MISSING .env in this folder. Copy your live .env here first.
  echo  Do not overwrite a good live .env with an empty one.
  pause
  exit /b 1
)

REM Never kill 8080 — OpenClaw lives there 24/7.
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 (
  echo  8080 is already taken. Leaving it alone ^(OpenClaw^).
  echo  Kyros will use 8081.
  set KYROS_PORT=8081
  set KYROS_HOST=http://127.0.0.1:8081
) else (
  echo  8080 is free. Kyros will use 8080.
  set KYROS_PORT=8080
  set KYROS_HOST=http://127.0.0.1:8080
)

if not exist "node_modules\express" (
  echo  Installing npm packages...
  call npm install --omit=dev
)

echo  Starting index2 on %KYROS_PORT%...
start "Kyros index2" cmd /k "set KYROS_PORT=%KYROS_PORT%&& node index2.mjs"

echo  Waiting for %KYROS_PORT%...
set /a tries=0
:waitport
set /a tries+=1
netstat -ano | findstr ":%KYROS_PORT%" | findstr "LISTENING" >nul
if %errorlevel%==0 goto up
if %tries% GEQ 30 (
  echo  index2 did not open %KYROS_PORT%. Look at the Kyros index2 window.
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
goto waitport

:up
echo  Starting scheduler -^> %KYROS_HOST%
start "Kyros scheduler" cmd /k "set KYROS_HOST=%KYROS_HOST%&& node kyros_scheduler.mjs"

echo.
echo  OpenClaw on 8080 was not touched.
echo  Leave both Kyros windows open.
echo  Then:  set KYROS_HOST=%KYROS_HOST% ^&^& node kyros_doctor.mjs
echo.
pause
