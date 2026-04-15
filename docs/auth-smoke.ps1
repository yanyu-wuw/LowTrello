# 需要：已 docker compose up -d
# 目的：验证 register -> (mailhog code) -> verify -> refresh -> logout (cookie 方式)

$Base = "http://localhost:8080/api"
$Email = "demo_" + [Guid]::NewGuid().ToString("N").Substring(0,8) + "@example.com"
$Password = "Passw0rd!"
$Name = "Demo"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$refreshUri = [Uri]"$Base/auth/refresh"
$MailhogApi = "http://localhost:8025/api/v2/messages?limit=50"

function Get-SessionCookieValue([Microsoft.PowerShell.Commands.WebRequestSession]$s, [Uri]$u) {
  $cookies = $s.Cookies.GetCookies($u)
  if ($cookies.Count -eq 0) { return $null }

  foreach ($c in $cookies) {
    if ($c.HttpOnly) {
      return @{ Name = $c.Name; Value = $c.Value }
    }
  }

  $c0 = $cookies[0]
  return @{ Name = $c0.Name; Value = $c0.Value }
}

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
$regBody = @{ email = $Email; password = $Password; name = $Name } | ConvertTo-Json
$reg = Invoke-RestMethod -Method Post -Uri "$Base/auth/register" -Body $regBody -ContentType "application/json" -WebSession $session
if (-not $reg.ok) { throw "register failed" }

Write-Host "[1.1] fetch verification code from mailhog: $Email"
$code = Get-VerificationCodeFromMailhog $Email
if (-not $code) {
  throw "could not find verification code in MailHog. Open http://localhost:8025 and check inbox."
}
Write-Host "code: $code"

Write-Host "[1.2] verify"
$verBody = @{ email = $Email; code = $code } | ConvertTo-Json
$ver = Invoke-RestMethod -Method Post -Uri "$Base/auth/verify" -Body $verBody -ContentType "application/json" -WebSession $session
$access = $ver.accessToken
if (-not $access) { throw "verify did not return accessToken" }

$rt1 = Get-SessionCookieValue $session $refreshUri
if (-not $rt1) { throw "verify did not set refresh cookie" }

Write-Host "[2] me with access token"
$me = Invoke-RestMethod -Method Get -Uri "$Base/me" -Headers @{ Authorization = "Bearer $access" }
$me | ConvertTo-Json -Compress | Write-Host

Write-Host "[2.1] home recent & notifications (real data)"
$recent = Invoke-RestMethod -Method Get -Uri "$Base/home/recent?tab=done" -Headers @{ Authorization = "Bearer $access" }
if (-not $recent -or -not $recent.items -or $recent.items.Count -lt 1) { throw "home recent should not be empty" }
$notifs = Invoke-RestMethod -Method Get -Uri "$Base/home/notifications?time=all&app=all&kind=direct" -Headers @{ Authorization = "Bearer $access" }
if (-not $notifs -or -not $notifs.items -or $notifs.items.Count -lt 1) { throw "home notifications should not be empty" }
Write-Host "recent: $($recent.items.Count), notifications: $($notifs.items.Count)"

Write-Host "[3] refresh (uses HttpOnly cookie)"
$ref = Invoke-RestMethod -Method Post -Uri "$Base/auth/refresh" -ContentType "application/json" -Body "{}" -WebSession $session
$access2 = $ref.accessToken
if (-not $access2) { throw "refresh did not return accessToken" }

$rt2 = Get-SessionCookieValue $session $refreshUri
if (-not $rt2) { throw "refresh did not keep refresh cookie" }

Write-Host "[3.1] reuse old refresh token should be 401 (reuse detection)"
try {
  Invoke-RestMethod -Method Post -Uri "$Base/auth/refresh" -ContentType "application/json" -Body "{}" -Headers @{ Cookie = "$($rt1.Name)=$($rt1.Value)" } | Out-Null
  throw "expected old refresh token reuse to fail, but it succeeded"
} catch {
  Write-Host "ok: old refresh token rejected"
}

Write-Host "[3.2] after reuse, current session refresh should also be 401 (global revoke)"
try {
  Invoke-RestMethod -Method Post -Uri "$Base/auth/refresh" -ContentType "application/json" -Body "{}" -WebSession $session | Out-Null
  throw "expected refresh to fail after reuse detection, but it succeeded"
} catch {
  Write-Host "ok: current session rejected after reuse"
}

Write-Host "[4] logout"
$logout = Invoke-RestMethod -Method Post -Uri "$Base/auth/logout" -ContentType "application/json" -Body "{}" -WebSession $session
$logout | ConvertTo-Json -Compress | Write-Host

Write-Host "[5] refresh after logout should be 401"
try {
  Invoke-RestMethod -Method Post -Uri "$Base/auth/refresh" -ContentType "application/json" -Body "{}" -WebSession $session | Out-Null
  throw "expected refresh to fail, but it succeeded"
} catch {
  Write-Host "ok: refresh rejected after logout"
}
