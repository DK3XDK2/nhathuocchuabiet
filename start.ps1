# Script khoi dong toan bo he thong (backend + frontend + ngrok)
# Chay bang: .\start.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    HE THONG QUAN LY THUOC - STARTUP    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Khoi dong Backend
Write-Host "[1/3] Khoi dong Backend (port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Title", "Backend", "-Command", "cd '$root\backend'; node src/server.js"
Start-Sleep -Seconds 2

# 2. Khoi dong Frontend
Write-Host "[2/3] Khoi dong Frontend (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Title", "Frontend", "-Command", "cd '$root\frontend'; npx vite"
Start-Sleep -Seconds 3

# 3. Khoi dong Ngrok
Write-Host "[3/3] Khoi dong Ngrok..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Title", "Ngrok", "-Command", "C:\ngrok\ngrok.exe start --all --config '$root\ngrok.yml'"
Start-Sleep -Seconds 4

# Lay URL tu Ngrok API
Write-Host ""
Write-Host "Dang lay URL ngrok..." -ForegroundColor Gray
try {
    $tunnels = (Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels").tunnels
    $backendUrl = ($tunnels | Where-Object { $_.name -eq "backend" -and $_.proto -eq "https" }).public_url
    $frontendUrl = ($tunnels | Where-Object { $_.name -eq "frontend" -and $_.proto -eq "https" }).public_url
    if (-not $backendUrl)  { $backendUrl  = ($tunnels | Where-Object { $_.name -eq "backend"  }).public_url }
    if (-not $frontendUrl) { $frontendUrl = ($tunnels | Where-Object { $_.name -eq "frontend" }).public_url }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  NGROK DA CHAY THANH CONG!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Backend API : $backendUrl" -ForegroundColor White
    Write-Host "  Frontend    : $frontendUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "QUAN TRONG: De nguoi khac dung frontend qua ngrok," -ForegroundColor Yellow
    Write-Host "mo console trinh duyet (F12) va chay lenh nay:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  localStorage.setItem('apiBaseUrl', '$backendUrl')" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Xem chi tiet tai: http://localhost:4040" -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "Chua lay duoc URL. Doi them vai giay roi mo http://localhost:4040 de xem." -ForegroundColor Red
}
