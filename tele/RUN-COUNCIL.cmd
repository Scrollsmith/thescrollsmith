@echo off
cd /d "%~dp0"
echo.
if not exist ".env" (
  echo  MISSING .env in %cd%
  pause
  exit /b 1
)
if not exist "kyros_telegram_council.mjs" (
  echo  MISSING kyros_telegram_council.mjs in %cd%
  pause
  exit /b 1
)
echo  checking file...
node --check kyros_telegram_council.mjs
if errorlevel 1 (
  echo.
  echo  That file is damaged. Re-download RAW, not the GitHub webpage:
  echo  https://raw.githubusercontent.com/Scrollsmith/thescrollsmith/cursor/kyros-doctor-b7f6/tele/kyros_telegram_council.mjs
  echo  Save as kyros_telegram_council.mjs  (not .txt)
  pause
  exit /b 1
)
echo  starting council on TELEGRAM_TOKENX  (not TOKEN2)
echo  index2 can stay running. In Telegram: /who then /start_council
node kyros_telegram_council.mjs
pause
