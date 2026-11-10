@echo off
cd /d "%~dp0"
echo.
node -v
if not exist "kyros_scheduler.mjs" (
  echo  MISSING kyros_scheduler.mjs in %cd%
  pause
  exit /b 1
)
echo  checking file...
node --check kyros_scheduler.mjs
if errorlevel 1 (
  echo.
  echo  That file is damaged. Re-download RAW, not the GitHub webpage:
  echo  https://raw.githubusercontent.com/Scrollsmith/thescrollsmith/cursor/kyros-doctor-b7f6/tele/kyros_scheduler.mjs
  echo  Save as kyros_scheduler.mjs  (not .txt, not .js)
  pause
  exit /b 1
)
netstat -ano | findstr ":8081" | findstr "LISTENING" >nul
if %errorlevel%==0 (
  set KYROS_HOST=http://127.0.0.1:8081
) else (
  set KYROS_HOST=http://127.0.0.1:8080
)
echo  starting scheduler -^> %KYROS_HOST%
node kyros_scheduler.mjs
pause
