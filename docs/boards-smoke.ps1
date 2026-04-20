# 需要：已 docker compose up -d (postgres/api/web/mailhog)
# 目的：验证 boards/list/cards/attachments/reorder 基本闭环

$Base = "http://127.0.0.1:8080/api"
$MailhogApi = "http://127.0.0.1:8025/api/v2/messages?limit=50"

$Email = "demo_" + [Guid]::NewGuid().ToString("N").Substring(0,8) + "@example.com"
$Password = "Passw0rd!"
$Name = "Demo"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "[1] register: $Email"
$regBody = @{ email = $Email; password = $Password; name = $Name } | ConvertTo-Json
$reg = Invoke-RestMethod -Method Post -Uri "$Base/auth/register" -Body $regBody -ContentType "application/json" -WebSession $session
if (-not $reg.ok) { throw "register failed" }

Write-Host "[1.1] fetch verification code from mailhog: $Email"
$code = $null
for ($i = 0; $i -lt 5; $i++) {
  try {
    $resp = Invoke-RestMethod -Method Get -Uri $MailhogApi
    if ($i -eq 0) {
      $t = ''
      try { $t = $resp.GetType().FullName } catch { $t = 'unknown' }
      $total = $null
      try { $total = $resp.total } catch { $total = $null }
      $rawCount = $null
      try { $rawCount = @($resp.items).Count } catch { $rawCount = $null }
      Write-Host "mailhog respType=$t total=$total itemsCount=$rawCount"
    }
    $items = @($resp.items)
    if ($items.Count -gt 0) {
      if ($i -eq 0) {
        try { Write-Host "mailhog newestTo=$($items[0].Raw.To[0])" } catch {}
      }
      $body = [string]$items[0].Content.Body
      $m = [regex]::Match($body, "(\d{6})")
      if ($m.Success) { $code = $m.Groups[1].Value; break }
    }
  } catch {
    Write-Host "mailhog fetch failed: $($_.Exception.Message)"
  }
}
if (-not $code) {
  throw "could not find verification code in MailHog. Open http://127.0.0.1:8025 and check inbox."
}
Write-Host "code: $code"

Write-Host "[1.2] verify"
$verBody = @{ email = $Email; code = $code } | ConvertTo-Json
$ver = Invoke-RestMethod -Method Post -Uri "$Base/auth/verify" -Body $verBody -ContentType "application/json" -WebSession $session
$access = $ver.accessToken
if (-not $access) { throw "verify did not return accessToken" }
$H = @{ Authorization = "Bearer $access" }

Write-Host "[2] workspaces"
$wsResp = Invoke-RestMethod -Method Get -Uri "$Base/workspaces" -Headers $H
$ws = $null
if ($wsResp -is [System.Array]) {
  $ws = $wsResp | Select-Object -First 1
} elseif ($wsResp.items -is [System.Array]) {
  $ws = $wsResp.items | Select-Object -First 1
}

$workspaceId = $ws.workspace.id
if (-not $workspaceId) { throw "no workspace returned" }
Write-Host "workspaceId: $workspaceId"

Write-Host "[3] create board"
$boardBody = @{ title = "Demo Board"; visibility = "private" } | ConvertTo-Json
$board = Invoke-RestMethod -Method Post -Uri "$Base/workspaces/$workspaceId/boards" -Headers $H -Body $boardBody -ContentType "application/json"
if (-not $board -or -not $board.id) { throw "board create failed" }
$boardId = $board.id
Write-Host "boardId: $boardId"

Write-Host "[4] create list"
$listBody = @{ title = "Todo"; position = 0 } | ConvertTo-Json
$list = Invoke-RestMethod -Method Post -Uri "$Base/boards/$boardId/lists" -Headers $H -Body $listBody -ContentType "application/json"
if (-not $list -or -not $list.id) { throw "list create failed" }
$listId = $list.id
Write-Host "listId: $listId"

Write-Host "[5] create card"
$cardBody = @{ title = "First Card"; description = "hello"; position = 0; dueDate = "2030-01-01" } | ConvertTo-Json
$card = Invoke-RestMethod -Method Post -Uri "$Base/lists/$listId/cards" -Headers $H -Body $cardBody -ContentType "application/json"
if (-not $card -or -not $card.id) { throw "card create failed" }
$cardId = $card.id
Write-Host "cardId: $cardId"

Write-Host "[6] create attachment"
$attBody = @{ name = "spec.txt"; url = "https://example.com/spec.txt"; type = "text/plain"; size = 12 } | ConvertTo-Json
$att = Invoke-RestMethod -Method Post -Uri "$Base/cards/$cardId/attachments" -Headers $H -Body $attBody -ContentType "application/json"
if (-not $att -or -not $att.id) { throw "attachment create failed" }
Write-Host "attachmentId: $($att.id)"

Write-Host "[7] reorder (noop)"
$reorderBody = @{ lists = @(@{ id = $listId; position = 0 }); cards = @(@{ id = $cardId; listId = $listId; position = 0 }) } | ConvertTo-Json
$reorder = Invoke-RestMethod -Method Post -Uri "$Base/boards/$boardId/reorder" -Headers $H -Body $reorderBody -ContentType "application/json"
if (-not $reorder.ok) { throw "reorder failed" }

Write-Host "[8] fetch board"
$fetched = Invoke-RestMethod -Method Get -Uri "$Base/boards/$boardId" -Headers $H
$fetched | ConvertTo-Json -Depth 8 | Write-Host

Write-Host "OK: boards smoke passed"