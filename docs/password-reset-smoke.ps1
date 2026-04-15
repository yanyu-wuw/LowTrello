# 需要：已 docker compose up -d
# 目的：验证 request-password-reset -> (mailhog code) -> reset-password -> login

$Base = "http://localhost:8080/api"
$Email = "demo_" + [Guid]::NewGuid().ToString("N").Substring(0,8) + "@example.com"
$Password1 = "Passw0rd!"
$Password2 = "N3wPassw0rd!"
$Name = "Demo"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$MailhogApi = "http://localhost:8025/api/v2/messages?limit=50"

function Get-VerificationCodeFromMailhog([string]$targetEmail) {
  $resp = Invoke-RestMethod -Method Get -Uri $MailhogApi
  if (-not $resp -or -not $resp.items) { return $null }

  foreach ($m in $resp.items) {
    $tos = @()
    try {
      if ($m.Content -and $m.Content.Headers -and $m.Content.Headers.To) {
        $tos = @($m.Content.Headers.To)
      }
    } catch {
      $tos = @()
    }

    $toMatched = $false
    foreach ($to in $tos) {
      if ([string]$to -like "*$targetEmail*") { $toMatched = $true; break }
    }
    if (-not $toMatched) { continue }

    $body = ""
    try {
      $body = [string]$m.Content.Body
    } catch {
      $body = ""
    }

    $match = [regex]::Match($body, '\b(\d{6})\b')
    if ($match.Success) {
      return $match.Groups[1].Value
    }
  }

  return $null
}

Write-Host "[1] register: $Email"
$regBody = @{ email = $Email; password = $Password1; name = $Name } | ConvertTo-Json
$reg = Invoke-RestMethod -Method Post -Uri "$Base/auth/register" -Body $regBody -ContentType "application/json" -WebSession $session
if (-not $reg.ok) { throw "register failed" }

Write-Host "[1.1] fetch verification code from mailhog: $Email"
$code = Get-VerificationCodeFromMailhog $Email
if (-not $code) { throw "could not find verification code in MailHog" }
Write-Host "code: $code"

Write-Host "[1.2] verify"
$verBody = @{ email = $Email; code = $code } | ConvertTo-Json
$ver = Invoke-RestMethod -Method Post -Uri "$Base/auth/verify" -Body $verBody -ContentType "application/json" -WebSession $session
if (-not $ver.accessToken) { throw "verify did not return accessToken" }

Write-Host "[2] request password reset"
$reqResetBody = @{ email = $Email } | ConvertTo-Json
$r1 = Invoke-RestMethod -Method Post -Uri "$Base/auth/request-password-reset" -Body $reqResetBody -ContentType "application/json"
if (-not $r1.ok) { throw "request-password-reset failed" }

Write-Host "[2.1] fetch reset code from mailhog: $Email"
$resetCode = Get-VerificationCodeFromMailhog $Email
if (-not $resetCode) { throw "could not find reset code in MailHog" }
Write-Host "reset code: $resetCode"

Write-Host "[2.2] reset password"
$resetBody = @{ email = $Email; code = $resetCode; newPassword = $Password2 } | ConvertTo-Json
$r2 = Invoke-RestMethod -Method Post -Uri "$Base/auth/reset-password" -Body $resetBody -ContentType "application/json" -WebSession $session
if (-not $r2.ok) { throw "reset-password failed" }

Write-Host "[3] login with new password"
$loginBody = @{ email = $Email; password = $Password2 } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$Base/auth/login" -Body $loginBody -ContentType "application/json" -WebSession $session
if (-not $login.accessToken) { throw "login did not return accessToken" }

Write-Host "[4] me"
$me = Invoke-RestMethod -Method Get -Uri "$Base/me" -Headers @{ Authorization = "Bearer $($login.accessToken)" }
$me | ConvertTo-Json -Compress | Write-Host

Write-Host "ok: password reset flow"
