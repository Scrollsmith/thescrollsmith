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

echo  Stopping whatever is already on port 8080...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%P >nul 2>&1
)

if not exist "node_modules\express" (
  echo  Installing npm packages...
  call npm install --omit=dev
)

echo  Starting index2...
start "Kyros index2" cmd /k node index2.mjs

echo  Waiting for port 8080...
set /a tries=0
:wait8080
set /a tries+=1
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 goto up
if %tries% GEQ 30 (
  echo  index2 did not open 8080. Look at the Kyros index2 window.
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
goto wait8080

:up
echo  Starting scheduler...
start "Kyros scheduler" cmd /k node kyros_scheduler.mjs

echo.
echo  Leave both windows open.
echo  Then:  node kyros_doctor.mjs
echo.
pause
