@echo off
cd /d "%~dp0"
echo  Stopping listeners on 8080...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%P >nul 2>&1
)
echo  Done. Close leftover Node windows if any remain.
pause
