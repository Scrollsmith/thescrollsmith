@echo off
cd /d "%~dp0"
echo.
echo  folder: %cd%
echo  Same window. No second window.
echo  index2 can stay running.
echo.

if not exist ".env" (
  echo  MISSING .env — this cmd must sit in C:\users\user\tele
  goto END
)
if not exist "kyros_telegram_council.mjs" (
  echo  MISSING kyros_telegram_council.mjs
  goto END
)

call node kyros_telegram_council.mjs
echo.
echo  COUNCIL STOPPED. The error is the lines above.

:END
echo.
pause
