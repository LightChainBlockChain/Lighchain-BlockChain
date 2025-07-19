# Sideline Pinas TikTok Marketplace Auto-Backup Script
# This script automatically backs up your blockchain project to your backup folder

Write-Host "Starting Sideline Pinas Blockchain Backup..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Define directories
$sourceDir = "C:\Users\Ronirei Light\BlockChain Components\Sideline-Pinas-Complete-Project"
$backupDir = "C:\Users\Ronirei Light\OneDrive\Desktop\LightChain_Backup_2025-07-13_23-36-57"

# Check if source directory exists
if (-not (Test-Path $sourceDir)) {
    Write-Host "Error: Source directory not found: $sourceDir" -ForegroundColor Red
    exit 1
}

# Check if backup directory exists, create if it doesn't
if (-not (Test-Path $backupDir)) {
    Write-Host "Creating backup directory: $backupDir" -ForegroundColor Yellow
    New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
}

try {
    Write-Host "Source: $sourceDir" -ForegroundColor Green
    Write-Host "Backup: $backupDir" -ForegroundColor Green
    Write-Host ""
    Write-Host "Copying files..." -ForegroundColor Yellow
    
    # Use PowerShell Copy-Item with exclusions
    Copy-Item -Path "$sourceDir\*" -Destination $backupDir -Recurse -Force -Exclude @("node_modules", ".git", "*.log", "temp", "tmp")
    
    # Get backup summary
    $fileCount = (Get-ChildItem -Path $backupDir -Recurse -File).Count
    $backupSize = (Get-ChildItem -Path $backupDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $backupSizeMB = [math]::Round($backupSize / 1MB, 2)
    
    Write-Host ""
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "Backup Summary:" -ForegroundColor Cyan
    Write-Host "   Files copied: $fileCount" -ForegroundColor White
    Write-Host "   Total size: $backupSizeMB MB" -ForegroundColor White
    Write-Host "   Backup time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    Write-Host "   Location: $backupDir" -ForegroundColor White
    Write-Host ""
    Write-Host "Your Sideline Pinas TikTok Marketplace is safely backed up!" -ForegroundColor Green
    
    # Create a backup log entry
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logEntry = "[$timestamp] Sideline Pinas Backup Completed" + [Environment]::NewLine + "Files: $fileCount | Size: $backupSizeMB MB | Status: Success" + [Environment]::NewLine + "Source: $sourceDir" + [Environment]::NewLine + "Destination: $backupDir" + [Environment]::NewLine + "---" + [Environment]::NewLine
    
    $logPath = Join-Path $backupDir "backup-log.txt"
    Add-Content -Path $logPath -Value $logEntry
    
} catch {
    Write-Host "Backup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
