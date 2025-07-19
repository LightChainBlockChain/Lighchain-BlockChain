@echo off
cd /d "%~dp0"
echo.
echo 🎵 Sideline Pinas TikTok Marketplace Backup
echo ==========================================
echo.
echo Running backup script...
echo.

REM Try PowerShell 7 first, then fall back to Windows PowerShell
pwsh -ExecutionPolicy Bypass -File "backup-script.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo PowerShell 7 not found, using Windows PowerShell...
    powershell -ExecutionPolicy Bypass -File "backup-script.ps1"
)

echo.
echo Press any key to continue...
pause > nul
