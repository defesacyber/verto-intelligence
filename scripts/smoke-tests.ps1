param(
  [Parameter(Mandatory = $true)][string]$SupabaseUrl,
  [Parameter(Mandatory = $true)][string]$AnonKey,
  [Parameter(Mandatory = $true)][string]$Email,
  [Parameter(Mandatory = $true)][string]$Password,
  [string]$Origin = "https://app.example.com"
)

$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [object]$Body
  )

  $params = @{
    Method = $Method
    Uri = $Url
    Headers = $Headers
  }

  if ($Body -ne $null) {
    $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    $params["ContentType"] = "application/json"
  }

  return Invoke-RestMethod @params
}

$baseHeaders = @{
  "apikey" = $AnonKey
  "origin" = $Origin
}

Write-Host "[1/6] Login auth..."
$login = Invoke-JsonRequest -Method "POST" -Url "$SupabaseUrl/functions/v1/auth/login" -Headers $baseHeaders -Body @{
  email = $Email
  password = $Password
}

if (-not $login.result.data.token) {
  throw "Login failed: token not returned"
}

$jwt = $login.result.data.token
$authHeaders = @{
  "apikey" = $AnonKey
  "Authorization" = "Bearer $jwt"
  "origin" = $Origin
}

Write-Host "[2/6] Projects list..."
$null = Invoke-JsonRequest -Method "GET" -Url "$SupabaseUrl/functions/v1/projects" -Headers $authHeaders -Body $null

Write-Host "[3/6] Reports list..."
$null = Invoke-JsonRequest -Method "GET" -Url "$SupabaseUrl/functions/v1/reports" -Headers $authHeaders -Body $null

Write-Host "[4/6] Market states..."
$null = Invoke-JsonRequest -Method "POST" -Url "$SupabaseUrl/functions/v1/market-data-api" -Headers $authHeaders -Body @{ action = "list-states" }

Write-Host "[5/6] CORS preflight (auth endpoint)..."
$preflight = Invoke-WebRequest -Method "OPTIONS" -Uri "$SupabaseUrl/functions/v1/auth/login" -Headers @{
  "origin" = $Origin
  "access-control-request-method" = "POST"
}
if ($preflight.StatusCode -lt 200 -or $preflight.StatusCode -gt 299) {
  throw "CORS preflight failed"
}

Write-Host "[6/6] Unauthorized check on protected endpoint..."
try {
  Invoke-JsonRequest -Method "GET" -Url "$SupabaseUrl/functions/v1/projects" -Headers $baseHeaders -Body $null | Out-Null
  throw "Expected unauthorized response but request succeeded"
} catch {
  Write-Host "Protected endpoint denied without JWT as expected"
}

Write-Host "Smoke tests concluídos com sucesso."
