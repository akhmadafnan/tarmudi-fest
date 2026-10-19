# Tarmudi Fest 2026 — v22 REVIEW privacy and jury journal hardening rollout
# No database mutation or final jury decision. Requires a locally authorized clasp session.
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$gate = Join-Path (Split-Path -Parent $repo) "tarmudi-fest-auth-gate"
$clasp = Join-Path $repo "node_modules\.bin\clasp.cmd"
$expectedScriptId = "19K-nARHpOv0PZdSpKlsqJjvx999Q1pAy44CZ7cqqGfH6_utGc4tuIncN"

if (!(Test-Path (Join-Path $gate ".clasp.json"))) { throw "Auth-gate GAS project tidak ditemukan." }
$settings = Get-Content (Join-Path $gate ".clasp.json") -Raw | ConvertFrom-Json
if ($settings.scriptId -ne $expectedScriptId) { throw "ID script GAS tidak sesuai. Deployment dibatalkan." }
if (!(Test-Path $clasp)) { throw "CLI clasp belum tersedia." }
Push-Location $repo
try {
    if ((& git branch --show-current).Trim() -ne "develop") { throw "Branch yang diharapkan: develop." }
    $dirty = (& git status --porcelain --untracked-files=no)
    if ($dirty) { throw "File tracked sedang dimodifikasi lokal. Simpan/periksa terlebih dahulu: $dirty" }
    $html = Get-Content "src\client\Index.html" -Raw
    foreach ($needle in @("function tf26AdminStandingPage(", "tf26RankLabel(item,true)", "tf26RankLabel(p,false)", "winnerSlots", "tieGroupPosition", "TF26_ADMIN_STANDINGS_PAGE_SIZE=20")) {
        if (!$html.Contains($needle)) { throw "UAT v22 source not yet available. Jalankan git pull. Missing: $needle" }
    }
    $domain = Get-Content "src\server\ContestDomain.js" -Raw
    $application = Get-Content "src\server\ContestApplication.js" -Raw
    if (-not $domain.Contains("const winningSlots=Math.min(members.length,Math.max(0,7-position))") -or
        -not $application.Contains("const winnerSlots=Math.min(exactGroup.length,7-tiedPosition)") -or
        -not $application.Contains("results.some(x=>x.pendingDeliberation===true)")) {
        throw "Gerbang top-six backend tidak terdeteksi. Deployment dibatalkan."
    }

    $storeSource = Get-Content "src\server\ContestStore.js" -Raw
    foreach ($required in @("this.safeText_(payload.reason)", "this.safeText_(value.reason)", "this.safeText_(detail)")) {
        if (!$storeSource.Contains($required)) { throw "Journal protection missing: $required" }
    }
    Write-Host "[1/5] Running UAT tests..." -ForegroundColor Cyan
    & node --test
    if ($LASTEXITCODE -ne 0) { throw "Tests failed. No deploy." }

    Write-Host "[2/5] Building GAS bundle..." -ForegroundColor Cyan
    & node scripts\build-gas.cjs
    if ($LASTEXITCODE -ne 0) { throw "GAS build failed. No deploy." }

    $dist=Join-Path $repo "dist\gas"
    foreach ($name in @("Code.js","Index.html","appsscript.json")) {
        if (!(Test-Path (Join-Path $dist $name))) { throw "Missing build artifact: $name" }
    }
    $buildHtml = Get-Content (Join-Path $dist "Index.html") -Raw
    if (!$buildHtml.Contains("function tf26AdminStandingPage(") -or !$buildHtml.Contains("winnerSlots")) { throw "GAS build does not contain v22 Admin pagination and top-six controls." }


    $builtCode = Get-Content (Join-Path $dist "Code.js") -Raw
    if (!$builtCode.Contains("this.safeText_(payload.reason)")) { throw "GAS bundle does not include jury minutes safety fix." }
    $backup=Join-Path $env:TEMP ("TF26_before_v22_review_journal_" + (Get-Date -Format "yyyyMMdd_HHmmssfff"))
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    Write-Host "[3/5] Saving local GAS backup to: $backup" -ForegroundColor Cyan
    foreach ($name in @("Code.js","Index.html","appsscript.json")) {
        $live=Join-Path $gate $name
        if (!(Test-Path $live)) { throw "Active GAS file missing: $name" }
        Copy-Item $live (Join-Path $backup $name)
        Copy-Item (Join-Path $dist $name) $live -Force
    }

    Push-Location $gate
    try {
        Write-Host "[4/5] Uploading GAS v22..." -ForegroundColor Cyan
        & $clasp push --force
        if ($LASTEXITCODE -ne 0) { throw "clasp push failed. Backup: $backup" }
        Write-Host "[5/5] Updating the existing UAT deployment..." -ForegroundColor Cyan
        $activeUatId = "AKfycbxUjeTXT_Eh0bFYdWLu525OmCINHvyiAvIhuCXK8KeW091RuoUlhvDfXc7CInkniVPl"
        $reply = & $clasp deploy --deploymentId $activeUatId --description "TF26 v22 REVIEW privacy and jury journal hardening" 2>&1
        $responseText = ($reply | Out-String)
        Write-Host $responseText
        if ($LASTEXITCODE -ne 0 -or !$responseText.Contains("Deployed $activeUatId @")) {
            throw "Deployment belum terverifikasi. Backup: $backup"
        }
        Write-Host "UAT deployment diperbarui dengan aman, URL tetap." -ForegroundColor Green
        Write-Host "No SCORES/CHECKINS/TIE_RESOLUTIONS/SETTINGS data has been changed by this script." -ForegroundColor Green
    } finally { Pop-Location }
} finally { Pop-Location }
