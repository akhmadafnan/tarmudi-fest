# Tarmudi Fest 2026 — targeted v18 UI UAT deployment
# PowerShell: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-registration-mobile-v18.ps1
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$target = Join-Path (Split-Path -Parent $repo) "tarmudi-fest-auth-gate"
$scriptId = "19K-nARHpOv0PZdSpKlsqJjvx999Q1pAy44CZ7cqqGfH6_utGc4tuIncN"
$clasp = Join-Path $repo "node_modules\.bin\clasp.cmd"
if (!(Test-Path (Join-Path $target ".clasp.json"))) { throw "Folder Apps Script auth-gate tidak tersedia." }
$config = Get-Content (Join-Path $target ".clasp.json") -Raw | ConvertFrom-Json
if ($config.scriptId -ne $scriptId) { throw "Script ID berbeda. Deployment dibatalkan." }
if (!(Test-Path $clasp)) { throw "clasp tidak tersedia. Deployment dibatalkan." }

Push-Location $repo
try {
    $currentBranch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $currentBranch -ne "develop") {
        throw "Branch proyek harus develop, saat ini: $currentBranch"
    }
    $html = Get-Content "src\client\Index.html" -Raw
    foreach ($needle in @("function tf26RegistrationSummary(", "summary.checkedIn+", ".chips.jury-filters{")) {
        if (-not $html.Contains($needle)) { throw "Kode koreksi v18 belum terpasang: $needle. Jalankan git pull." }
    }
    Write-Host "[1/5] Tes seluruh modul..." -ForegroundColor Cyan
    & node --test
    if ($LASTEXITCODE -ne 0) { throw "Test FAIL. Tidak ada deployment." }
    Write-Host "[2/5] Build GAS..." -ForegroundColor Cyan
    & node scripts\build-gas.cjs
    if ($LASTEXITCODE -ne 0) { throw "Build FAIL. Tidak ada deployment." }
    $dist = Join-Path $repo "dist\gas"
    $filenames = @("Code.js", "Index.html", "appsscript.json")
    foreach ($name in $filenames) {
        if (!(Test-Path (Join-Path $dist $name))) { throw "Output tidak lengkap: $name" }
    }

    $backup = Join-Path $env:TEMP ("TF26_before_v18_registration_" + (Get-Date -Format "yyyyMMdd_HHmmssfff"))
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    Write-Host "[3/5] Backup kode aktif ke $backup" -ForegroundColor Cyan
    foreach ($name in $filenames) {
        $live = Join-Path $target $name
        if (!(Test-Path $live)) { throw "File aktif tidak ditemukan: $name" }
        Copy-Item $live (Join-Path $backup $name)
    }
    foreach ($name in $filenames) {
        Copy-Item (Join-Path $dist $name) (Join-Path $target $name) -Force
    }

    Push-Location $target
    try {
        Write-Host "[4/5] Push v18 ke Apps Script..." -ForegroundColor Cyan
        & $clasp push --force
        if ($LASTEXITCODE -ne 0) { throw "clasp push gagal. Backup: $backup" }
        Write-Host "[5/5] Buat URL deployment UAT baru..." -ForegroundColor Cyan
        & $clasp deploy --description "TF26 v18 UAT branch-specific registration counts + mobile filter grid"
        if ($LASTEXITCODE -ne 0) { throw "clasp deploy gagal. Backup: $backup" }
        Write-Host "V18 DEPLOYED: salin deployment ID dari output menjadi https://script.google.com/macros/s/<ID>/exec" -ForegroundColor Green
        Write-Host "Database SCORES, CHECKINS dan SETTINGS tidak diubah oleh skrip ini." -ForegroundColor Green
    }
    finally { Pop-Location }
}
finally { Pop-Location }
