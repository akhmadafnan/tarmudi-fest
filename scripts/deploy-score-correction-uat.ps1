# Tarmudi Fest 2026 — UAT deployment (Score Correction)
# Run from PowerShell using:
# powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-score-correction-uat.ps1
# Never uploads passwords, Firebase export files or real participant lists.
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$workspace = Split-Path -Parent $repo
$target = Join-Path $workspace "tarmudi-fest-auth-gate"
$expectedScriptId = "19K-nARHpOv0PZdSpKlsqJjvx999Q1pAy44CZ7cqqGfH6_utGc4tuIncN"
$clasp = Join-Path $repo "node_modules\.bin\clasp.cmd"

if (!(Test-Path (Join-Path $target ".clasp.json"))) {
    throw "Folder Apps Script uji tidak ditemukan: $target"
}
if (!(Test-Path $clasp)) {
    throw "clasp belum terpasang di proyek. Jangan lanjut deployment."
}
$settings = Get-Content (Join-Path $target ".clasp.json") -Raw | ConvertFrom-Json
if ($settings.scriptId -ne $expectedScriptId) {
    throw "Script ID tidak cocok dengan AUTH-GATE. Deployment dibatalkan."
}
if (-not (Test-Path (Join-Path $repo "src\server\ContestApplication.js"))) {
    throw "Kode proyek tidak lengkap."
}

Push-Location $repo
try {
    Write-Host "[1/5] Menjalankan seluruh pengujian otomatis..." -ForegroundColor Cyan
    & node --test
    if ($LASTEXITCODE -ne 0) { throw "Pengujian gagal. Tidak ada deployment." }

    Write-Host "[2/5] Memvalidasi build Google Apps Script..." -ForegroundColor Cyan
    & node scripts\build-gas.cjs
    if ($LASTEXITCODE -ne 0) { throw "Build gagal. Tidak ada deployment." }

    $dist = Join-Path $repo "dist\gas"
    foreach ($f in @("Code.js", "Index.html", "appsscript.json")) {
        if (!(Test-Path (Join-Path $dist $f))) { throw "Hasil build hilang: $f" }
    }

    $backup = Join-Path $env:TEMP ("TF26_UAT_before_score_correction_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    foreach ($f in @("Code.js", "Index.html", "appsscript.json")) {
        if (Test-Path (Join-Path $target $f)) {
            Copy-Item (Join-Path $target $f) (Join-Path $backup $f) -Force
        }
    }
    Write-Host "Cadangan file Apps Script: $backup"

    Write-Host "[3/5] Menyalin kode UAT v17 ke folder Apps Script yang benar..." -ForegroundColor Cyan
    foreach ($f in @("Code.js", "Index.html", "appsscript.json")) {
        Copy-Item (Join-Path $dist $f) (Join-Path $target $f) -Force
    }

    Push-Location $target
    try {
        Write-Host "[4/5] Mengirim source ke Apps Script..." -ForegroundColor Cyan
        & $clasp push --force
        if ($LASTEXITCODE -ne 0) { throw "clasp push gagal; cadangan ada di $backup" }

        Write-Host "[5/5] Membuat deployment UAT baru..." -ForegroundColor Cyan
        & $clasp deploy --description "TF26 v17 UAT scored corrections with reasons and revision journal"
        if ($LASTEXITCODE -ne 0) { throw "clasp deploy gagal; cadangan ada di $backup" }

        Write-Host "DEPLOYMENT UAT BERHASIL. Gunakan URL /exec yang dicetak clasp di atas." -ForegroundColor Green
        Write-Host "Nilai yang sudah ada tidak dimodifikasi oleh script deployment." -ForegroundColor Green
        Write-Host "Lakukan koreksi data SIMULASI hanya setelah verifikasi login juri."
    }
    finally { Pop-Location }
}
finally { Pop-Location }
