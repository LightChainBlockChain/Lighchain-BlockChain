#!/usr/bin/env pwsh
# LightChain Setup Script
# Sets up the development environment for the blockchain project

Write-Host "🌱⚡ LightChain Setup" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Rust installation
if (-not (Get-Command "cargo" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Cargo not found. Please install Rust first." -ForegroundColor Red
    Write-Host "Visit: https://rustup.rs/" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Rust/Cargo found" -ForegroundColor Green
}

# Display project information
Write-Host ""
Write-Host "📋 Project Information:" -ForegroundColor Cyan
Write-Host "Name: LightChain" -ForegroundColor White
Write-Host "Description: Environmental Governance Blockchain System" -ForegroundColor White
Write-Host "Author: GreyWarden" -ForegroundColor White
Write-Host "Version: 0.1.0" -ForegroundColor White
Write-Host ""

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
cargo build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: ./run.ps1 - to start the blockchain" -ForegroundColor White
    Write-Host "2. Run: cargo run - to start manually" -ForegroundColor White
    Write-Host "3. Run: cargo test - to run tests" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Features available:" -ForegroundColor Magenta
    Write-Host "• Environmental data tracking" -ForegroundColor White
    Write-Host "• Carbon credit system" -ForegroundColor White
    Write-Host "• Governance proposals" -ForegroundColor White
    Write-Host "• Marketplace integration" -ForegroundColor White
    Write-Host "• Transaction validation" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above and fix any issues." -ForegroundColor Yellow
    exit 1
}
