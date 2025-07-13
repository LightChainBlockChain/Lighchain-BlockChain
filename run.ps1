#!/usr/bin/env pwsh
# LightChain Blockchain Runner Script
# Created for integrated blockchain development

Write-Host "🌱⚡ LightChain - Environmental Governance Blockchain" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

# Check if Rust is installed
if (-not (Get-Command "cargo" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Cargo not found. Please install Rust first." -ForegroundColor Red
    Write-Host "Visit: https://rustup.rs/" -ForegroundColor Yellow
    exit 1
}

# Build the project
Write-Host "🔨 Building LightChain..." -ForegroundColor Yellow
cargo build --release

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Starting LightChain..." -ForegroundColor Cyan
    Write-Host ""
    cargo run --release
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
