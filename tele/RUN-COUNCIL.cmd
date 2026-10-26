@echo off
cd /d "%~dp0"
echo.
echo  ========================================
echo  Kyros council starter
echo  folder: %cd%
echo  ========================================
echo.

if not exist ".env" (
  echo  MISSING .env in this folder.
  echo  Copy RUN-COUNCIL.cmd into C:\users\user\tele next to the live .env.
  goto FAIL
)

if exist "kyros_telegram_council.mjs.txt" (
  echo  The council file was saved as .txt. Rename it to kyros_telegram_council.mjs
  goto FAIL
)

if not exist "kyros_telegram_council.mjs" (
  echo  MISSING kyros_telegram_council.mjs in this folder.
  echo  Download RAW, not the GitHub webpage:
  echo  https://raw.githubusercontent.com/Scrollsmith/thescrollsmith/cursor/kyros-doctor-b7f6/tele/kyros_telegram_council.mjs
  goto FAIL
)

where node >nul 2>&1
if errorlevel 1 (
  echo  NODE is not on PATH in this window.
  echo  Open the same kind of window you use for index2, then:
  echo    cd /d "%cd%"
  echo    node kyros_telegram_council.mjs
  goto FAIL
)

echo  node version:
call node -v
if errorlevel 1 goto FAIL
echo.

if not exist "node_modules\telegraf" (
  echo  node_modules\telegraf missing. Run START-LIVE.cmd once, or:
  echo    npm install
  goto FAIL
)

echo  checking file...
call node --check kyros_telegram_council.mjs
if errorlevel 1 (
  echo.
  echo  node --check failed. The syntax error is above.
  echo  Re-download RAW, not the GitHub webpage:
  echo  https://raw.githubusercontent.com/Scrollsmith/thescrollsmith/cursor/kyros-doctor-b7f6/tele/kyros_telegram_council.mjs
  echo  Save as kyros_telegram_council.mjs  (not .txt)
  goto FAIL
)
echo  syntax ok
echo.
echo  starting council on TELEGRAM_TOKENX  (not TOKEN2)
echo  index2 can stay running.
echo  Leave this window OPEN. If you see Press any key, it already died.
echo.

call node kyros_telegram_council.mjs
echo.
echo  **********************************************
echo  COUNCIL STOPPED  (exit code %errorlevel%)
echo  That is NOT a successful start.
echo  Read / screenshot the lines ABOVE this box.
echo  **********************************************
echo.
pause
exit /b %errorlevel%

:FAIL
echo.
echo  **********************************************
echo  START FAILED. Read the lines above. Do not close yet.
echo  **********************************************
echo.
pause
exit /b 1
