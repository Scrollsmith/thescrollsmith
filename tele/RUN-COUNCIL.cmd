@echo off
cd /d "%~dp0"
echo.
echo  folder: %cd%
echo.

if not exist ".env" (
  echo  MISSING .env in this folder. Put this cmd in C:\users\user\tele
  pause
  exit /b 1
)

if not exist "kyros_telegram_council.mjs" (
  echo  MISSING kyros_telegram_council.mjs
  echo  In PowerShell in this folder you can skip the cmd:
  echo    node kyros_telegram_council.mjs
  pause
  exit /b 1
)

echo  Opening a window titled: Kyros council TOKENX
echo  Look at the taskbar if you do not see it.
echo  Leave THAT window open. This one can close.
echo.
start "Kyros council TOKENX" cmd /k "node kyros_telegram_council.mjs"
pause
