# ADR-0004 — Standard OOP & Modular Monolith untuk GAS

**Status:** ENGINEERING BASELINE (DESIGN), belum teruji live.  
**Tanggal:** 2026-10-18  
**Acuan:** PRD V1.5 (tetap terkunci), ADR-0001 dan ADR-0003.  
**Batas:** Dokumentasi saja. Tidak membuat kode, password, akun, deployment, atau Google Sheet.

## Keputusan teknik

1. Bangun **modular monolith** untuk 3 cabang lomba; tidak perlu microservices.
2. Gunakan konsep **OOP + dependency injection + ports/adapters**. Domain/application tidak boleh mengakses `SpreadsheetApp`, `DriveApp`, `HtmlService`, atau global GAS secara langsung.
3. Sumber kode yang direkomendasikan: **TypeScript strict secara lokal**, lalu di-build ke JavaScript yang kompatibel dengan **GAS V8**. TypeScript hanyalah tool development, bukan mengganti runtime.
4. GAS V8 mendukung `class`, tetapi **tidak menyediakan loader ES6 `import/export`**, `#private` class fields dan static class fields langsung; bundler/output harus diverifikasi sebelum `clasp push`. Hindari asumsi Node `process`, browser `window`, built-in `crypto.subtle`, server `fetch` atau timers.
5. Semua browser-callable global entrypoints harus minimal dan eksplisit; dilarang arbitrary RPC method dispatch, raw Sheet return, dynamic evaluation, dan top-level side effects.
6. **`google.script.run` asynchronous**; UI wajib punya pending/success/error yang tidak dapat menampilkan hasil lama sebagai hasil permintaan terbaru. Fungsi `name_` tidak callable secara langsung, tetapi naming itu **bukan perlindungan authorization**.
7. Deployment menggunakan akun Google pribadi pemilik; user internal 13 akun username/password (rencana), **bukan** akun yang diberi hak ke Sheets. Semua command harus menguji sesi, role, dan cabang **di server**.
8. Wajib build reproducible, pinned versions, unit tests, contract/security tests, negative authorization tests, integration GAS, mobile E2E, peer review dan rollback.

## Batas modul

| Layer | Isi | Dilarang |
|---|---|---|
| `domain` | Kompetisi, peserta, nomor start, kriteria versi, skor poin, pemeringkatan | Impor GAS/global, network, HTML, identitas dari klien |
| `application` | Use cases dan port/interface seperti `ParticipantRepository`, `ScoreRepository`, `Authorizer` | Akses Sheet mentah langsung |
| `infrastructure/gas` | Adapters Sheets/Drive/Docs/Lock/Cache/Properties/Crypto | Aturan penjurian tersebar pada adapter |
| `interfaces` | Thin entrypoints, allowlisted dispatch, validasi DTO, response projection | Endpoint mengembalikan objek domain privat |
| `frontend` | Admin, Registrar, Judge, Public — mobile-first Neo-Brutalism | Menentukan role, keabsahan sesi, atau skor hanya dari UI |
| `bootstrap` | Composition root, dependency wiring per request | Singleton global mutable dengan data pengguna lintas request |

**Kontrak dependensi:** `UI → entrypoint → use case → domain + ports ← GAS adapters`. Jangan bikin satu god-class `AppService`.

## Kontrak domain terkunci

- Nomor start unik dan berurutan **per cabang**; gunakan script-scope lock dan idempotency key; klik ganda tidak menetapkan nomor baru.
- Skema kriteria milik Admin versioned; jumlah maksimal poin tepat 100; setelah penjurian dibuka versi terkunci.
- Juri hanya melihat nomor start, cabang, kriteria+max dan status/skor sendiri; **nama, sekolah, nilai juri lain dilarang dalam payload**.
- Input poin langsung **integer 0..max**, bukan skala 0–100 di setiap kriteria; total juri = penjumlahan poin; hasil rata-rata dari semua juri wajib yang sudah FINAL.
- Nilai seri Tahfidz berdasarkan prioritas juknis; lainnya musyawarah tercatat. Jangan ikat tie-break pada angka yang sudah dibulatkan.
- Publik interim menampilkan nomor saja; setelah persetujuan cabang dan kebijakan privasi wali dipenuhi baru nama+sekolah.
- Cache hanya untuk proyeksi publik aman; tidak otoritatif untuk sesi, akun, status skor, atau audit.
- Sheets bukan database ACID. `LockService.getScriptLock()` untuk read-modify-write; jangan mengandalkan `getDocumentLock()` pada standalone web app atau `getUserLock()` untuk lock lintas petugas.

## Quality gates — tidak boleh dilewati

**QG-01 Build:** strict TS, lint, pinned tools, valid GAS output (tanpa runtime `import/export`, `#private`, Node-only globals).  
**QG-02 Domain:** uji jumlah poin, batas integer, rata-rata, tie, complete judges, version freeze.  
**QG-03 Auth:** hash adaptif salted, password awal unik, bootstrap, CSPRNG sesi, expiry/revoke, brute-force, CSRF/XSS dan akses server per cabang **PASS**.  
**QG-04 Privacy:** inspect serialized judge DTO dan interim public snapshot untuk membuktikan identitas tidak ada.  
**QG-05 Concurrency:** minimum 20 permintaan registrasi hampir bersamaan dan retry; tidak ada nomor duplikat.  
**QG-06 Mobile:** lebar 360px, kontrol sentuh ≥44px, interaksi numerik, offline/failure feedback.  
**QG-07 Release:** semua tes PRD V1.5 P0 PASS, evidence dan rollback siap.

**Penting:** standar OOP dapat ditetapkan tanpa menyimpulkan custom login sudah aman. [ADR-0003](ADR-0003-internal-authentication.md) tetap memiliki AUTH-GATE yang kritis; jika gagal, wajib NO-GO dan minta persetujuan arsitektur alternatif gratis.

**Sumber resmi:**
- https://developers.google.com/apps-script/guides/v8-runtime
- https://developers.google.com/apps-script/guides/clasp
- https://developers.google.com/apps-script/guides/html/communication
- https://developers.google.com/apps-script/reference/lock/lock-service
- https://developers.google.com/apps-script/guides/web
