# STEP 00 — Audit Arsitektur OOP/GAS dan Engineering Readiness

**Status:** CONDITIONAL_NO_GO / IN_PROGRESS  
**Tanggal:** 2026-10-18  
**PRD:** V1.5 LOCKED — tidak diubah oleh audit ini.  
**Jenis pekerjaan:** pemeriksaan dokumentasi, bukan implementasi.

## Bukti dan status

| Komponen | Status | Dasar |
|---|---|---|
| Public GitHub MIT dengan branch `main/develop` | VERIFIED | Repository |
| Template Excel sintetik 30 peserta, 3 cabang | CONTRACT READY | ADR-0002 |
| 13 username dengan role/cabang | SPEC READY, NOT PROVISIONED | Manifest sintetik |
| Google pribadi pemilik sebagai owner GAS/Sheets/Drive | DECIDED, NOT PROVISIONED | Audit STEP 00 |
| PRD V1.5 direct integer points + blind judging + publikasi 2 fase | LOCKED PRODUCT | PRD |
| GAS V8 class OOP | DOCUMENTED | Google V8 guide |
| ES6 modules native & private fields `#` | NOT SUPPORTED | Google V8 guide |
| Bundle TypeScript→GAS | PLANNED, NOT BUILT | ADR-0004 |
| Password KDF yang layak di GAS | UNPROVEN | AUTH-GATE |
| CSPRNG bearer session token | UNPROVEN | AUTH-GATE |
| Secure cookie/session di HTMLService iframe | UNPROVEN | AUTH-GATE |
| Hak akses per cabang di runtime GAS | NOT TESTED | AUTH-GATE |
| 20 check-in serentak | NOT TESTED | STEP 03 |
| Beban HP dan kuota publik | NOT TESTED | STEP 09 |
| Addendum 2 juri, izin data anak, BA signers | OPEN OPERATIONAL | Panitia |

## Keputusan engineering

Modular monolith TypeScript/OOP dengan domain/application/infrastructure/adapters, DI, port interfaces, thin RPC, validated DTOs, GAS-compatible bundle, test berlapis, prinsip deny-by-default, tanpa mengubah PRD bisnis. Lihat [ADR-0004](../architecture/ADR-0004-oop-gas-modular-monolith.md) dan [Contracts](../architecture/GAS_MODULE_CONTRACTS_V1.md). Ini **design baseline**, bukan bukti keamanan/deployment.

## Gate exit STEP 00

**Sudah dapat dibuktikan:** kebutuhan produk, kepemilikan repo/lisensi, pemilik Google, data contoh, seed 13 role/cabang, rancangan modul, daftar ancaman dan rencana uji.

**Masih perlu diputuskan/ditugaskan:**
1. Penanggung jawab operasional/pengesahan juri 2–3 dan addendum bila berubah dari juknis.
2. Penanggung jawab izin publikasi nama/sekolah anak serta berita acara resmi.
3. Perangkat HP/koneksi/fallback kertas saat hari H.
4. Persetujuan penggunaan akun Google pemilik untuk project GAS khusus **uji nonproduksi** pada STEP 01; belum membuat project/secrets.
5. Tindak lanjut jika GAS custom auth tidak lolos; harus minta persetujuan pemilik sebelum platform berubah.

Kepemilikan tugas dan batas waktunya dapat ditetapkan tanpa mengunggah email atau data privat. **STEP 00 tetap IN_PROGRESS** sampai gate pada PRD dipenuhi atau penundaan administratif secara eksplisit diterima dengan kontrol dan tenggat. Jangan menandai STEP 01 maupun produksi PASS sebelum bukti.

## STEP 01 yang akan dilakukan setelah gate

1. Persiapkan lingkungan terpisah dengan data sintetik; audit runtime dan browser iframe.
2. Buktikan keamanan bootstrap 13 akun, hash salted KDF (latensi/kuota), randomness token, session, rate limit.
3. Uji akses lintas cabang, akun mati, pencurian/replay token, XSS/CSRF, public read-only.
4. Jika PASS, rekam bukti lalu lanjut modul bisnis. Jika NO-GO, berhenti dan ajukan alternatif tanpa biaya.

## Referensi
- https://developers.google.com/apps-script/guides/v8-runtime
- https://developers.google.com/apps-script/guides/html/communication
- https://developers.google.com/apps-script/guides/clasp
- https://developers.google.com/apps-script/guides/html/restrictions
- https://developers.google.com/apps-script/reference/lock/lock-service
- https://developers.google.com/apps-script/guides/services/quotas
