# Threat Model: Autentikasi Internal dan Blind Judging

**Status:** UNTESTED / HIGH RISK — bukan bukti aman.  
**Tanggal:** 2026-10-18. **Baseline:** PRD V1.5; ADR-0003 dan ADR-0004.

## Assets & trust boundary

Aset yang harus dilindungi: identitas anak/sekolah, nomor registrasi, skor juri, persetujuan hasil, hash password, sesi login, daftar peran/cabang, spreadsheet privat, PDF draft. Aktor ancaman: pengunjung anonim, bot login, juri yang mencoba cabang lain, penyerang XSS, perangkat HP yang hilang, akun Google pemilik yang kompromi.

**A:** Setiap payload browser, username, nomor, cabang, token = tidak dipercaya.  
**B:** GAS dapat di-deploy `execute as deployer` dan terbuka ke pengunjung anonim. Semua fungsi server harus mengotorisasi setiap aksi sendiri.  
**C:** Sheet/Drive produksi harus privat; juri dan publik tidak mempunyai hak langsung.  
**D:** Public interim adalah *projection* terfilter, bukan data mentah.

## Threat / kontrol / bukti

| Ancaman | Kontrol minimum | Acceptance |
|---|---|---|
| Password default bersama/tebak username | 13 password sementara unik berentropi tinggi, tanpa plaintext di source | AUTH-01..06 |
| Hash dicuri | Adaptif salted KDF teruji; jangan SHA-256 tunggal | AUTH-03 |
| Credential stuffing | Batas percobaan di server, audit generik, kontrol lockout proporsional | AUTH-10 |
| Prediksi sesi | CSPRNG terverifikasi, token verifier hash, masa berlaku, cabut/logout | AUTH-08/09 |
| Token dicuri lewat XSS | Jangan simpan bearer token di localStorage/sessionStorage; transport cookie aman jika tersedia, sanitasi data, uji XSS | AUTH-16 |
| CSRF memicu aksi | CSRF defense sesuai transport, jangan pakai GET untuk mutasi | AUTH-16 |
| Juri ubah cabang via payload | Server role/cabang lookup, deny-by-default | AUTH-11 |
| Data nama/sekolah bocor ke juri | Dedicated judge serializer + test nested payload/error/log | AUTH-12 |
| Publik mengakses fungsi tulis | Auth semua write, public snapshot read-only | AUTH-14/15 |
| Sesi masih berlaku setelah deaktivasi | Revoke session dan tes ulang pada endpoint sensitif | AUTH-07/08 |
| Repo bocor credential | Check secret/data, synthetic-only fixtures | AUTH-18 |
| Dua petugas nomor sama | ScriptLock, transaksi semu idempotent dan rekonsiliasi | AT-04/05 |
| Internet/kuota habis | Load test, fallback registrasi/juri manual | STEP 09 |

## Risiko GAS yang belum terpecahkan

**KDF**: Google `Utilities` mendokumentasikan HMAC/hash, tetapi belum ada bukti dukungan native Argon2id/PBKDF2 password KDF siap pakai dalam daftar API. OWASP merekomendasikan algoritma adaptif dan salah satu parameter PBKDF2-HMAC-SHA-256 **600.000 iterasi** ketika PBKDF2 yang dipilih. Implementasi JavaScript manual dapat tidak layak untuk kuota/latensi Apps Script. Wajib ukur dahulu.

**CSPRNG**: GAS V8 tidak menyediakan built-in `crypto` / `SubtleCrypto`; `Utilities.getUuid()` adalah identifier dan tidak cukup dijadikan bukti entropi token pembawa sesi. Wajib bukti primitive yang terpercaya.

**Session**: HTML Service memakai IFRAME sandbox. Kendali aplikasi atas header `Set-Cookie` termasuk `HttpOnly; Secure; SameSite` belum terbukti tersedia. OWASP memperingatkan bahwa token bearer di localStorage atau sessionStorage dapat dibaca JavaScript dan rentan terhadap XSS. **Tidak boleh mengklaim sesi aman sampai browser+server proof melewati uji.**

**Rate limiting**: jangan menjadikan cache volatil satu-satunya ledger penolakan login. Perhatikan serangan serentak dan batas kuota layanan.

**Owner Google**: seluruh data tetap berada di bawah izin satu akun personal; MFA/recovery/backup privat dan prosedur pemulihan harus siap. Audit Sheets bukan jaminan tamper-proof.

## Disposisi

Kemampuan OOP dan koneksi Sheets pada GAS = **terdokumentasi secara teknis**, bukan aplikasi selesai.

Autentikasi internal username/password pada GAS = **UNPROVEN / HIGH RISK / AUTH-GATE REQUIRED**.

Jika KDF, sumber random aman, session transport, brute-force control atau otorisasi gagal dibuktikan, jalur GAS-only custom login berstatus **NO-GO**. Dokumentasikan hasil dan ajukan arsitektur alternatif tanpa biaya melalui persetujuan pengguna, tanpa diam-diam mengganti platform.

## Rujukan resmi

- https://developers.google.com/apps-script/guides/v8-runtime
- https://developers.google.com/apps-script/guides/html/restrictions
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/reference/utilities/utilities
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
