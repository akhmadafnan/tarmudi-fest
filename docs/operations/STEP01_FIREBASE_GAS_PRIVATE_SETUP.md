# STEP 01 — Konfigurasi Privat Firebase ↔ GAS (Dua Akun Uji)

**Status:** TEST-ONLY, belum produksi. Jangan masukkan nilai riil ke GitHub, Issue, atau chat.  
**Proyek Firebase:** `tarmudi-fest-2026-afnan`  
**Akun Firebase:** dua pengguna telah terverifikasi melalui `firebase auth:export`, berstatus aktif.  
**PoC:** `experiments/step01-firebase-gas/` (pada branch `develop`).  
**Kode menggunakan akun email uji secara langsung; final produk tetap 13 username internal.**

## Yang harus disetel pada GAS

Pada proyek Apps Script pengujian (bukan proyek produksi), buka **Project Settings → Script Properties → Add script property**. Isi empat properti:

| Nama properti | Nilai yang dimasukkan sendiri oleh pemilik melalui console |
|---|---|
| `TF26_FIREBASE_API_KEY` | Ambil `apiKey` di Firebase Console → Project Settings → Your apps → Web app configuration. Firebase Web API key adalah konfigurasi klien yang dapat dipublikasikan, tetapi **jangan letakkan nilai lingkungan pribadi di dokumentasi publik**. |
| `TF26_FIREBASE_PROJECT_ID` | `tarmudi-fest-2026-afnan` |
| `TF26_INTERNAL_LOGIN_DOMAIN` | `accounts.tarmudifest.test` (hanya untuk alias `username`; dua akun yang dibuat dapat login memakai email lengkap) |
| `TF26_AUTH_ALLOWLIST_JSON` | JSON **UID yang terverifikasi** → penugasan role/cabang seperti template di bawah. Gunakan UID yang disalin dari **Firebase Console → Authentication → Users**. |

Template nilai **TF26_AUTH_ALLOWLIST_JSON** (ganti dua placeholder UID dengan UID nyata **di konsol pribadi**, bukan di chat):

```json
{"ISI_UID_ADMIN_DARI_FIREBASE":{"role":"admin","competition":"ALL","active":true},"ISI_UID_JURI_DARI_FIREBASE":{"role":"juri","competition":"THF","active":true}}
```

**Penting:**
- Kedua UID berasal dari dua baris yang berbeda pada Users; jangan menukar milik Admin dan Juri.
- Jangan memasukkan password di empat properti tersebut; password tersimpan dan diverifikasi oleh Firebase Auth.
- Jangan bagikan Project Settings, Firebase Web API config, UID, token, kode OAuth, atau password melalui GitHub.
- User saat ini membuat akun berbasis email uji (bukan alias `@accounts.tarmudifest.test`). Form login PoC telah mendukung email lengkap sebagai input selama pengujian. Final UI 13 akun tetap akan menggunakan username.
- Jika password tersimpan di manager, tidak perlu memberikan kepada pengembang; pemilik mengujinya langsung melalui browser.

## Sesudah menyimpan 4 Script Properties

1. Kunjungi deployment Apps Script versi terbaru (link dari hasil `clasp deploy`).
2. Masuk memakai alamat email akun uji Admin dan password yang hanya pemilik ketahui.
3. Ekspektasi: `Firebase menerima login` lalu `PASS — Identitas terverifikasi; Peran: admin; Cabang: ALL`.
4. Keluar, lalu masuk sebagai Juri; ekspektasi: `Peran: juri; Cabang: THF`.
5. Salah password, akun asing, token palsu, akun dinonaktifkan, dan hak akses silang tetap harus diuji sebelum menyatakan AUTH-GATE PASS.

## Gate

Sekalipun dua login berhasil, **belum berarti aplikasi produksi siap**: perlu pengujian browser mobile, account-disable/revocation, privilege scoping pada setiap use case, publikasi aman, dan semua acceptance tests PRD V1.5.

**Status setup:** properti dan dua login end-to-end belum terkonfirmasi. Tidak boleh ditandai PASS sampai ada respons HTTP/browser nyata.
