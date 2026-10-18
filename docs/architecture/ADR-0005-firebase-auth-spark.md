# ADR-0005 — Firebase Authentication Spark sebagai Penyedia Identitas

**Status:** APPROVED FOR AUTH-GATE EXPERIMENT / BELUM LULUS INTEGRASI  
**Tanggal:** 18 Oktober 2026  
**Persetujuan pemilik proyek:** eksplisit; menggunakan Firebase Authentication gratis khusus login.  
**Baseline produk:** PRD V1.5 tetap berlaku. Ketentuan username/password 13 akun tidak berubah.

## Konteks

Google Apps Script V8 berhasil diuji menjalankan aplikasi web, class OOP, HMAC dan ScriptLock. Namun GAS tidak memiliki Web Crypto `crypto.subtle`, dan kendali terhadap cookie HttpOnly maupun sumber entropi sesi belum dibuktikan. Menulis password KDF dan server-session sendiri berisiko tinggi.

## Keputusan

1. **Firebase Authentication Spark** mengelola autentikasi password dan siklus hidup Firebase ID token. Juri/Petugas/Admin tetap melihat satu kolom **username** dan **password**, bukan diwajibkan memiliki akun Gmail.
2. **GAS** masih menjalankan business use case, skor, registrasi, audit, dan data di Google Sheets/Drive privat milik akun Google pemilik proyek.
3. **Browser** mengirim username→identifier internal terstandar lalu autentikasi langsung ke Firebase via SDK/REST. Credential atau password **tidak pernah dikirim ke `google.script.run`**. Token ID Firebase berumur pendek diserahkan kepada GAS hanya untuk panggilan berotorisasi.
4. **GAS server** wajib memvalidasi keaslian Firebase ID token dengan backend Firebase yang dipercayai (kandidat: Identity Toolkit `accounts:lookup` dengan Firebase Web API Key dari proyek yang ditetapkan) atau verifikasi JWT RS256 standar. Pilih satu mekanisme hanya setelah pengujian nyata menunjukkan penolakan token salah, token dari proyek lain, kadaluarsa, dan akun dinonaktifkan. Gagal: **NO-GO**.
5. Setelah token tervalidasi, GAS memakai `localId`/Firebase UID yang benar dari hasil verifikasi, **bukan** username/email/role kiriman browser, untuk lookup whitelist 13 akun dan penugasan per cabang. Periksa status aktif pada server setiap request.
6. Semua fungsi privileged GAS callable dari browser harus fail closed dan memanggil authorizer; hasil publik hanya snapshot anonim read-only. Sumber Google Sheets/Drive tidak pernah dishare dengan Juri/Petugas.
7. **Sesi browser**: prefer memory-only Firebase Auth persistence untuk HP bersama; jangan menaruh refresh token sendiri di localStorage atau URL/log. Uji SDK/REST pada sandbox HTMLService nyata; jika gagal, cari mekanisme aman yang disetujui, bukan memperlonggar kontrol.
8. **Provisioning 13 user:** hanya dilakukan di lingkungan uji setelah setup Firebase. Tidak boleh password default bersama atau plaintext di repo; setiap akun punya password acak unik dan diserahkan privat. Bootstrap/disable/reset Admin perlu aksi owner-privileged yang diaudit. **Tidak boleh membuat 13 email/Gmail pribadi.**
9. Firebase email/password mensyaratkan identitas email internal. Implementasi boleh menggunakan alamat sintetis internal turunan username (contoh domain reservasi) **hanya bila Firebase menerima, Admin reset dapat dilakukan tanpa inbox, dan ancaman pendaftaran liar/peniruan telah dimitigasi**. UI tidak menampilkan email sintetis kepada juri.
10. **Spark plan** dipilih untuk uji bebas biaya; kuota, persyaratan billing, dan kelayakan fitur diverifikasi dari Firebase resmi saat inisialisasi. Tidak aktifkan Blaze tanpa persetujuan pemilik.
11. Larangan: menganggap Web API Key sebagai rahasia/kunci autentikasi, membandingkan UID tanpa token valid, menyimpan refresh token di Sheets/log, mempercayai email klien, membuat akses publik ke mutasi, atau mengandalkan UI untuk hak akses.

## Trust boundary

```text
[Browser / username-password]
       │ Firebase Auth SDK or REST via HTTPS
       ▼
[Firebase Authentication] -- returns verified-account ID token
       │ idToken supplied per privileged request
       ▼
[Apps Script entrypoint]
       │ verify token with Firebase backend, strict project check
       │ UID → private user allowlist + role + competition scope
       ▼
[Application use case] → [GAS Sheets/Drive adapters]
       │
       └── only approved DTOs → UI
```

No privileged GAS use case may depend exclusively on an untrusted browser username, email, or claimed `role`.

## Mandatory AUTH-GATE

- Firebase Spark project created under user's Google account; Email/Password provider explicitly enabled; two minimal dummy accounts before seeding 13.
- Client login with username and password actually works in GAS HTMLService iframe/mobile; custom alias policy verified.
- GAS validates ID token via trusted Firebase endpoint/verification and maps actual UID. Reject malformed, expired, disabled and other-project tokens.
- Test cross-branch reads/writes, blind judge payload, anonymous results snapshot, logout/password reset/revoked account behavior, concurrent requests and stale token handling.
- Confirm `accounts:lookup` per-request latency and quota under peak workload; cache only if secure revocation semantics are preserved. Never cache unverified privilege state.
- No credentials/passwords/tokens in GitHub, audit or screenshots.
- If this hybrid route fails: NO-GO and explicit alternative decision before participant/judge modules.

## Implementation state at decision time

The **Firebase project, its Email/Password provider, username mapping, token verifier, provisioning and UI are NOT yet implemented or validated**. The existing Apps Script capability probe is not proof of Firebase integration.

## References (official)

- https://firebase.google.com/pricing
- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/reference/rest/auth
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://firebase.google.com/docs/cli
- https://developers.google.com/apps-script/guides/html/communication
