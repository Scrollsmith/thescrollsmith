Set-Location $PSScriptRoot
Write-Host ""
Write-Host "folder: $(Get-Location)"
Write-Host "Same window. No second window. index2 can stay running."
Write-Host ""
if (-not (Test-Path -LiteralPath ".env")) {
    Write-Host "MISSING .env — run this from C:\users\user\tele"
    Read-Host "Press Enter"
    exit 1
}
if (-not (Test-Path -LiteralPath "kyros_telegram_council.mjs")) {
    Write-Host "MISSING kyros_telegram_council.mjs"
    Read-Host "Press Enter"
    exit 1
}
node .\kyros_telegram_council.mjs
Write-Host ""
Write-Host "COUNCIL STOPPED. The error is the lines above."
Read-Host "Press Enter"
