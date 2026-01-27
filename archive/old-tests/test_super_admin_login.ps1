# Test Super Admin Login
# קובץ בדיקה למשתמש Super Admin

Write-Host "🔐 Testing Super Admin Login..." -ForegroundColor Cyan
Write-Host ""

# Login credentials
$loginData = @{
    email = "admin@fleetmanagement.com"
    password = "SuperAdmin123!"
} | ConvertTo-Json

Write-Host "📧 Email: admin@fleetmanagement.com" -ForegroundColor Yellow
Write-Host "🔑 Password: SuperAdmin123!" -ForegroundColor Yellow
Write-Host ""

# Login request
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/api/auth/login" `
        -Method POST `
        -Body $loginData `
        -ContentType "application/json"
    
    Write-Host "✅ Login Successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "👤 User Info:" -ForegroundColor Cyan
    Write-Host "   Name: $($response.name)" -ForegroundColor White
    Write-Host "   Email: $($response.email)" -ForegroundColor White
    Write-Host "   User ID: $($response.id)" -ForegroundColor White
    Write-Host "   Org ID: $($response.org_id)" -ForegroundColor White
    Write-Host "   Is Super Admin: $($response.is_super_admin)" -ForegroundColor White
    Write-Host ""
    Write-Host "🎫 Access Token (first 50 chars):" -ForegroundColor Cyan
    Write-Host "   $($response.access_token.Substring(0, [Math]::Min(50, $response.access_token.Length)))..." -ForegroundColor Gray
    Write-Host ""
    
    # Save token to file for easy reuse
    $response.access_token | Out-File -FilePath "super_admin_token.txt" -Encoding utf8
    Write-Host "💾 Token saved to: super_admin_token.txt" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Login Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📚 API Docs: http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3010" -ForegroundColor Cyan
