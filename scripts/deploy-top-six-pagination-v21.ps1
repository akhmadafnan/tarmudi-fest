# Tarmudi Fest 2026 — v21 top-six and Admin pagination UAT rollout
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
        if (!$html.Contains($needle)) { throw "Perbaikan v21 belum tersedia. Jalankan git pull. Missing: $needle" }
    }
    $domain = Get-Content "src\server\ContestDomain.js" -Raw
    $application = Get-Content "src\server\ContestApplication.js" -Raw
    if (-not $domain.Contains("const winningSlots=Math.min(members.length,Math.max(0,7-position))") -or
        -not $application.Contains("const winnerSlots=Math.min(exactGroup.length,7-tiedPosition)") -or
        -not $application.Contains("results.some(x=>x.pendingDeliberation===true)")) {
        throw "Gerbang top-six backend tidak terdeteksi. Deployment dibatalkan."
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
    if (!$buildHtml.Contains("function tf26AdminStandingPage(") -or !$buildHtml.Contains("winnerSlots")) { throw "GAS build does not contain v21 Admin pagination and top-six controls." }

    $backup=Join-Path $env:TEMP ("TF26_before_v21_top_six_pagination_" + (Get-Date -Format "yyyyMMdd_HHmmssfff"))
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
        Write-Host "[4/5] Uploading GAS v21..." -ForegroundColor Cyan
        & $clasp push --force
        if ($LASTEXITCODE -ne 0) { throw "clasp push failed. Backup: $backup" }
        Write-Host "[5/5] Creating separate UAT deployment..." -ForegroundColor Cyan
        & $clasp deploy --description "TF26 v21 UAT top-six deliberation with boundary ties and Admin pagination"
        if ($LASTEXITCODE -ne 0) { throw "clasp deploy failed. Backup: $backup" }
        Write-Host "V21 DEPLOYMENT CREATED. Use the new deployment ID above." -ForegroundColor Green
        Write-Host "No SCORES/CHECKINS/TIE_RESOLUTIONS/SETTINGS data has been changed by this script." -ForegroundColor Green
    } finally { Pop-Location }
} finally { Pop-Location }
