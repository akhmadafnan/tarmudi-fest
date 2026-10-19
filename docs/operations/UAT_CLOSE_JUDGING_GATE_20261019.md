# UAT-CLOSE-GATE-01 — Penutupan Penjurian menuju REVIEW

**Proyek:** Tarmudi Fest 2026  
**Tanggal:** 19 Oktober 2026 (WIB)  
**Status:** PASS pada simulasi backend terisolasi; **belum mengubah fase penjurian aktif**.  
**Basis:** `develop`; `tests/uat-close-judging-gate.test.cjs`, `src/server/ContestApplication.js`, `src/server/ContestDomain.js`.

## Kebijakan yang diperiksa

- Penjurian hanya boleh ditutup oleh Admin pada fase `JUDGING_OPEN`.
- Minimal **6 peserta check-in pada cabang yang akan ditutup**.
- Semua peserta check-in pada cabang tersebut harus memiliki nilai `FINAL` lengkap dari **semua UID juri yang ditugaskan** pada versi skema aktif.
- Nilai `DRAFT`, UID yang tidak berhak, juri duplikat, atau versi skema yang tidak sesuai tidak dihitung sebagai kelengkapan.
- Ketika syarat lengkap, `closeJudging` memindahkan cabang ke `REVIEW` dan menyimpan entri audit `CLOSE_JUDGING`.
- Penutupan tidak sama dengan publikasi: status `ANONYMOUS`, izin privasi, dan data skor tetap tidak berubah.
- Nilai seri yang memengaruhi enam besar tidak menghalangi transisi menuju `REVIEW`; pencatatan keputusan musyawarah dilakukan pada tahap itu sebelum publikasi.
- Uji beban logika menggunakan **200 peserta sintetis / 600 baris nilai** tanpa mengakses maupun mengubah database lomba aktif.

## Bukti pengujian terisolasi

| ID | Skenario | Hasil |
|---|---|---|
| UAT-CLOSE-01 | 4 peserta, seluruhnya FINAL | PASS — ditolak `INCOMPLETE_SCORES` |
| UAT-CLOSE-02 | 0, 1, 5 peserta check-in | PASS — ditolak |
| UAT-CLOSE-03 | 6 peserta, salah satu juri masih DRAFT, kemudian dilengkapi | PASS — mula-mula ditolak, kemudian masuk REVIEW |
| UAT-CLOSE-04 | Skor FINAL dengan versi skema salah | PASS — ditolak |
| UAT-CLOSE-05 | Skor UID juri tidak ditugaskan mengganti nilai juri wajib | PASS — ditolak |
| UAT-CLOSE-06 | Dua skor dari juri sama menggantikan satu juri wajib | PASS — ditolak |
| UAT-CLOSE-07 | 6 peserta lengkap | PASS — REVIEW satu kali, satu audit, tidak OFFICIAL |
| UAT-CLOSE-08 | Kelompok seri enam besar | PASS — REVIEW diperbolehkan, tanpa keputusan otomatis |
| UAT-CLOSE-09 | Nilai/check-in cabang lain tidak lengkap | PASS — tidak memengaruhi cabang target |
| UAT-CLOSE-10 | Akun Juri / Registrasi mencoba menutup | PASS — ditolak `NOT_ALLOWED` |
| UAT-CLOSE-11 | Script lock sibuk | PASS — ditolak tanpa mutasi |
| UAT-CLOSE-12 | 200 peserta / 600 nilai, satu DRAFT lalu dilengkapi | PASS — ditolak sebelum lengkap, REVIEW setelah lengkap |

**12/12 UAT khusus PASS.**  
GitHub Actions dan regresi lengkap: **130/130 PASS**, build GAS dan sintaks JavaScript PASS.  
Lihat: https://github.com/akhmadafnan/tarmudi-fest/actions/runs/39254201524

## Snapshot lingkungan UAT aktif (READ-ONLY)

Pembacaan Google Sheets menunjukkan Tahfidz:

- 4 peserta check-in, nomor 001–004.
- 3 juri wajib; 12 skor berstatus FINAL.
- `SETTINGS`: `JUDGING_OPEN` dan publikasi belum resmi.
- `TIE_RESOLUTIONS`: 0 keputusan.
- Maka syarat minimal 6 peserta **belum terpenuhi**. Jangan menutup data Tahfidz aktif hanya untuk pengujian.

## Batas cakupan dan berikutnya

- PASS di atas membuktikan logika domain dan use case melalui simulasi `TF26Application`; **bukan** bukti bahwa penutupan berhasil pada aplikasi live, sebab tidak ada permintaan `CLOSE_JUDGING` ke Google Apps Script aktif.
- Pengujian berikutnya: simulasi fase `REVIEW` untuk keputusan musyawarah enam besar dan gerbang publikasi resmi (termasuk privasi), tanpa mengubah data peserta simulasi di Sheets aktif.
- Keputusan penutupan nyata hanya dilakukan sesudah panitia mengonfirmasi seluruh peserta yang sah telah check-in dan semua nilai final telah diperiksa.
