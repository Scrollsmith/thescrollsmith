@echo off
cd /d "%~dp0"
echo.
echo  This does NOT touch port 8080 or OpenClaw gateway.
echo  It only stops node processes whose command line is index2.mjs or kyros_scheduler.mjs
echo.

powershell -NoProfile -Command ^
  "$skip='openclaw|gateway|claw'; Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -match 'node' -and ($_.CommandLine -match 'index2\.mjs' -or $_.CommandLine -match 'kyros_scheduler\.mjs') -and $_.CommandLine -notmatch $skip } | ForEach-Object { Write-Host ('  stop PID ' + $_.ProcessId + ' ' + $_.CommandLine.Substring(0, [Math]::Min(80, $_.CommandLine.Length))); Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo.
echo  Gateway should still be on 8080. If it died, start OpenClaw again the usual way.
echo  Do not use any old STOP that says "Stopping listeners on 8080".
pause
