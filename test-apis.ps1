Write-Host "=== Testing Restaurant SaaS APIs ===" -ForegroundColor Green

# Test 1: Gateway Health
Write-Host "`n1. Testing Gateway..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health"
    Write-Host "✓ Gateway is UP" -ForegroundColor Green
} catch {
    Write-Host "✗ Gateway is DOWN" -ForegroundColor Red
    exit
}

# Test 2: Register User
Write-Host "`n2. Testing User Registration..." -ForegroundColor Yellow
try {
    $random = Get-Random -Minimum 1000 -Maximum 9999
    $username = "testuser$random"
    $email = "test$random@example.com"
    $registerBody = @{
        username = $username
        email = $email
        password = "password123"
    } | ConvertTo-Json
    
    $register = Invoke-RestMethod -Uri "http://localhost:8080/api/identity/auth/register" `
        -Method POST -ContentType "application/json" `
        -Body $registerBody
    Write-Host "✓ Registration successful for user: $username" -ForegroundColor Green
    $global:testUsername = $username
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response: $responseBody" -ForegroundColor Red
    }
}

# Test 3: Login
Write-Host "`n3. Testing Login..." -ForegroundColor Yellow
if ($global:testUsername) {
    try {
        $loginBody = @{
            username = $global:testUsername
            password = "password123"
        } | ConvertTo-Json
        
        $login = Invoke-RestMethod -Uri "http://localhost:8080/api/identity/auth/login" `
            -Method POST -ContentType "application/json" `
            -Body $loginBody
        $token = $login.token
        Write-Host "✓ Login successful, Token received" -ForegroundColor Green
        $global:token = $token
    } catch {
        Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Response: $responseBody" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠ Skipping login test (registration failed or no username available)" -ForegroundColor Yellow
}

# Test 4: Validate Token
if ($global:token) {
    Write-Host "`n4. Testing Token Validation..." -ForegroundColor Yellow
    try {
        $headers = @{"Authorization" = "Bearer $global:token"}
        $validate = Invoke-RestMethod -Uri "http://localhost:8080/api/identity/auth/validate" `
            -Method GET -Headers $headers
        if ($validate.valid) {
            Write-Host "✓ Token is valid" -ForegroundColor Green
        } else {
            Write-Host "✗ Token validation returned invalid" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Token validation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 5: Get Current User
    Write-Host "`n5. Testing Get Current User..." -ForegroundColor Yellow
    try {
        $headers = @{"Authorization" = "Bearer $global:token"}
        $user = Invoke-RestMethod -Uri "http://localhost:8080/api/identity/users/me" `
            -Method GET -Headers $headers
        Write-Host "✓ Retrieved user info: $($user.username) ($($user.email))" -ForegroundColor Green
    } catch {
        Write-Host "✗ Get user info failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Green
Write-Host "`n=== Tests Complete ===" -ForegroundColor Green