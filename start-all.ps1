# Slide Effect - Démarrage de tous les services
Write-Host "🚀 Démarrage de Slide Effect..." -ForegroundColor Cyan

# Backend API
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\slide-effect-server'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# Admin Dashboard
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\slide-effect-admin'; npm run dev" -WindowStyle Normal

# Editor
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\slide-effect-app'; npm run dev" -WindowStyle Normal

# Player
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\slide-effect-player'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Services démarrés :" -ForegroundColor Green
Write-Host "   Backend API  : http://localhost:3003" -ForegroundColor White
Write-Host "   Admin        : http://localhost:5175" -ForegroundColor White
Write-Host "   Éditeur      : http://localhost:5173" -ForegroundColor White
Write-Host "   Player       : http://localhost:3004" -ForegroundColor White
