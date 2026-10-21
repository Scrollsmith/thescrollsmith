@echo off
cd /d "%~dp0"
echo  Stopping Kyros index2 / scheduler only. OpenClaw on 8080 is left alone.
powershell -NoProfile -Command ^
  "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -match 'index2\.mjs' -or $_.CommandLine -match 'kyros_scheduler\.mjs') } | ForEach-Object { Write-Host ('  kill PID ' + $_.ProcessId); Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
echo  Done.
pause
