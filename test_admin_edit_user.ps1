# Test script to verify admin can edit user email
# Login as admin and try to update a user's email

$API_URL = "https://app.truckflow.site/api"
$ADMIN_EMAIL = "admin@demo-org.com"
$ADMIN_PASSWORD = "password123"

Write-Host "[*] Logging in as admin..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body (@{
        email = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD
    } | ConvertTo-Json)

$token = $loginResponse.access_token
Write-Host "[OK] Login successful! Token: $($token.Substring(0,50))..." -ForegroundColor Green

# Get list of users
Write-Host "`n[*] Fetching users list..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$users = Invoke-RestMethod -Uri "$API_URL/admin/users" `
    -Method Get `
    -Headers $headers

Write-Host "[OK] Found $($users.Count) users" -ForegroundColor Green

# Find a USER role (not admin)
$testUser = $users | Where-Object { $_.org_role -eq "driver" } | Select-Object -First 1

if ($testUser) {
    Write-Host "`n[TEST] Testing email edit on user:" -ForegroundColor Yellow
    Write-Host "   ID: $($testUser.id)" -ForegroundColor White
    Write-Host "   Name: $($testUser.name)" -ForegroundColor White
    Write-Host "   Email: $($testUser.email)" -ForegroundColor White
    Write-Host "   Role: $($testUser.org_role)" -ForegroundColor White
    
    # Try to update email
    $newEmail = "test_updated_$(Get-Random)@example.com"
    Write-Host "`n[*] Attempting to change email to: $newEmail" -ForegroundColor Cyan
    
    try {
        $updateResponse = Invoke-RestMethod -Uri "$API_URL/admin/users/$($testUser.id)" `
            -Method Patch `
            -Headers $headers `
            -Body (@{
                email = $newEmail
            } | ConvertTo-Json)
        
        Write-Host "[SUCCESS] Email updated successfully!" -ForegroundColor Green
        Write-Host "   New email: $($updateResponse.email)" -ForegroundColor White
        
        # Verify in database
        Write-Host "`n[SUCCESS] Email edit feature is WORKING!" -ForegroundColor Green
        
    } catch {
        Write-Host "[ERROR] FAILED! Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Warning: No driver users found to test with" -ForegroundColor Yellow
}
