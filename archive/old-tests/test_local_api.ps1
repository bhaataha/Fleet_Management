# Test Local API - Phase 2 Features
# בדיקת תכונות Phase 2 מקומי

Write-Host "🧪 Testing Local Fleet Management API - Phase 2" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

$baseUrl = "http://localhost:8001/api"
$token = ""

# 1. Login as Super Admin
Write-Host "1️⃣ Testing Login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -Body '{"email":"admin@fleetmanagement.com","password":"SuperAdmin123!"}' `
        -ContentType "application/json"
    
    $token = $loginResponse.access_token
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Test Subcontractors Endpoint
Write-Host "2️⃣ Testing Subcontractors API..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Get subcontractors list
try {
    $subcontractors = Invoke-RestMethod -Uri "$baseUrl/subcontractors" `
        -Method GET `
        -Headers $headers
    
    Write-Host "   ✅ GET /subcontractors - Success" -ForegroundColor Green
    Write-Host "   Found: $($subcontractors.Count) subcontractors" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ GET /subcontractors failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Create Test Subcontractor
Write-Host "3️⃣ Creating Test Subcontractor..." -ForegroundColor Yellow

$newSubcontractor = @{
    name = "דוד לוי הובלות"
    company_name = "דוד לוי הובלות בע״מ"
    phone = "+972501234567"
    vat_id = "123456789"
    contact_person = "דוד לוי"
    payment_terms = "monthly"
} | ConvertTo-Json

try {
    $created = Invoke-RestMethod -Uri "$baseUrl/subcontractors" `
        -Method POST `
        -Headers $headers `
        -Body $newSubcontractor
    
    Write-Host "   ✅ POST /subcontractors - Success" -ForegroundColor Green
    Write-Host "   Created: $($created.name) (ID: $($created.id))" -ForegroundColor Gray
    
    $subId = $created.id
    
    # 4. Create Price List for Subcontractor
    Write-Host ""
    Write-Host "4️⃣ Creating Price List for Subcontractor..." -ForegroundColor Yellow
    
    $priceList = @{
        price_per_trip = 80
        price_per_ton = 50
        min_charge = 400
        valid_from = "2026-01-01T00:00:00"
        notes = "מחירון רגיל"
    } | ConvertTo-Json
    
    try {
        $createdPrice = Invoke-RestMethod -Uri "$baseUrl/subcontractors/$subId/prices" `
            -Method POST `
            -Headers $headers `
            -Body $priceList
        
        Write-Host "   ✅ POST /subcontractors/$subId/prices - Success" -ForegroundColor Green
        Write-Host "   Price per trip: $($createdPrice.price_per_trip)₪" -ForegroundColor Gray
        Write-Host "   Price per ton: $($createdPrice.price_per_ton)₪" -ForegroundColor Gray
        
        # 5. Test Pricing Preview
        Write-Host ""
        Write-Host "5️⃣ Testing Pricing Preview..." -ForegroundColor Yellow
        
        try {
            $preview = Invoke-RestMethod -Uri "$baseUrl/subcontractors/$subId/pricing-preview?qty=15&unit=TON" `
                -Method POST `
                -Headers $headers
            
            Write-Host "   ✅ POST /subcontractors/$subId/pricing-preview - Success" -ForegroundColor Green
            Write-Host "   Quantity: 15 TON" -ForegroundColor Gray
            Write-Host "   Base trip price: $($preview.base_trip_price)₪" -ForegroundColor Gray
            Write-Host "   Quantity price: $($preview.qty_price)₪" -ForegroundColor Gray
            Write-Host "   Total: $($preview.total)₪" -ForegroundColor Green
            Write-Host "   Calculation: $($preview.calculation)" -ForegroundColor Gray
        } catch {
            Write-Host "   ❌ Pricing preview failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "   ❌ Create price list failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "   ❌ POST /subcontractors failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 6. Test Other Endpoints
Write-Host "6️⃣ Testing Other Core Endpoints..." -ForegroundColor Yellow

$endpoints = @(
    @{name="Customers"; url="/customers"},
    @{name="Sites"; url="/sites"},
    @{name="Trucks"; url="/trucks"},
    @{name="Drivers"; url="/drivers"},
    @{name="Materials"; url="/materials"},
    @{name="Jobs"; url="/jobs"}
)

foreach ($endpoint in $endpoints) {
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl$($endpoint.url)" `
            -Method GET `
            -Headers $headers
        
        Write-Host "   ✅ $($endpoint.name): $($result.Count) items" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  $($endpoint.name): Error" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=" * 60
Write-Host "✅ Local API Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Local API: http://localhost:8001" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8001/docs" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3010" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3010/subcontractors in browser" -ForegroundColor White
Write-Host "   2. Test the UI for creating/editing subcontractors" -ForegroundColor White
Write-Host "   3. Once verified, we can update production server" -ForegroundColor White
