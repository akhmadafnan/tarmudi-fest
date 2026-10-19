# UAT REVIEW, Musyawarah, Privasi, dan Publikasi Resmi — 19 Oktober 2026

**Proyek:** Tarmudi Fest 2026  
**Status:** **PASS pada simulasi terisolasi; tidak ada penerbitan hasil resmi nyata**.  
**Lingkup:** `JUDGING_OPEN → REVIEW → RESOLVE_TIE → OFFICIAL`, aturan musyawarah enam besar, pengamanan identitas anak, penulisan jurnal Google Sheets, dan regresi.  
**Repo/branch:** `akhmadafnan/tarmudi-fest` / `develop`.  
**UAT build:** v22 REVIEW hardening, Google Apps Script deployment version **@23** pada deployment UAT yang sudah ada.

## Putusan UAT

- **17/17** skenario use case REVIEW dan publikasi berhasil.
- **5/5** skenario keamanan penyimpanan jurnal berhasil.
- **22/22** skenario khusus REVIEW dan jurnal **PASS**.
- **160/160** regresi keseluruhan di laptop proyek **PASS**, termasuk 12 tes penutupan penjurian dari tahap sebelumnya.
- GitHub Actions: https://github.com/akhmadafnan/tarmudi-fest/actions/runs/39256357190 — sukses.
- GAS build/sintaks **PASS**; cadangan file Code.js, Index.html, dan appsscript.json dibuat sebelum upload.
- Deployment UAT yang di-*redeploy*, bukan membuat deployment tambahan: `AKfycbxUjeTXT_Eh0bFYdWLu525OmCINHvyiAvIhuCXK8KeW091RuoUlhvDfXc7CInkniVPl` **@23**. URL yang sama: https://script.google.com/macros/s/AKfycbxUjeTXT_Eh0bFYdWLu525OmCINHvyiAvIhuCXK8KeW091RuoUlhvDfXc7CInkniVPl/exec

## Skenario UAT REVIEW

| Kasus | Keluaran yang diuji |
|---|---|
| REVIEW-01 | Penjurian enam peserta lengkap dapat masuk REVIEW; publik tetap INTERIM/anonim |
| REVIEW-02 | Musyawarah sebelum REVIEW ditolak tanpa mutasi |
| REVIEW-03 | Keputusan terhadap kelompok yang tidak seri ditolak |
| REVIEW-04 | Alasan wajib 15–500 karakter; nomor duplikat/invalid ditolak |
| REVIEW-05 | Hanya Admin berhak memutuskan; keputusan tersimpan dengan alasan, UID, waktu, dan tidak boleh diulang |
| REVIEW-06 | Izin privasi tidak boleh melewati seri wajib yang belum diputuskan |
| REVIEW-07 | Seri posisi 6–7: cukup satu peserta dipilih untuk posisi keenam |
| REVIEW-08 | Dua kelompok seri yang berbeda harus diputuskan masing-masing |
| REVIEW-09 | Publikasi tanpa izin pemilik/otorisasi privasi ditolak |
| REVIEW-10 | Publikasi sah sekali; status OFFICIAL, identitas, dan audit hanya sesudah seluruh gerbang lulus |
| REVIEW-11 | Seri yang seluruhnya di luar enam besar memakai peringkat bersama dan tidak memblokir publikasi |
| REVIEW-12 | 200 peserta, 195 seri pada posisi keenam: cukup satu keputusan, sisanya peringkat bersama |
| REVIEW-13 | Skor berubah ke DRAFT selama REVIEW: publikasi ditolak |
| REVIEW-14 | Kurang dari enam peserta: publikasi ditolak |
| REVIEW-15 | Kegagalan penulisan publikasi pada penyimpanan sintetis tidak menghasilkan status resmi palsu |
| REVIEW-16 | Identitas tidak terbuka bila hanya salah satu flag publikasi/privasi aktif |
| REVIEW-17 | Cabang Mendongeng: kesamaan total tetap memerlukan musyawarah sesuai aturan domain |

## Skenario keamanan jurnal Google Sheets

1. `SHEET-01`: alasan musyawarah yang diawali `=`, `+`, `-`, `@` disimpan sebagai teks nonformula.
2. `SHEET-02`: alasan biasa tersimpan tanpa perubahan.
3. `SHEET-03`: jurnal koreksi skor serta audit entity/detail juga dilindungi dari formula input.
4. `SHEET-04`: indikator publikasi resmi ditulis **terakhir** setelah waktu, pihak yang menyetujui, dan status internal.
5. `SHEET-05`: kegagalan salah satu langkah penyimpanan sebelum commit publikasi meninggalkan status publik tetap ANONYMOUS.

Perbaikan pada `src/server/ContestStore.js` menggunakan pembungkus `safeText_` yang sudah tersedia untuk alasan musyawarah, alasan koreksi nilai, dan teks audit. Tidak ada skema penilaian, skor, atau keputusan panitia yang diubah.

## Kondisi database UAT aktif setelah deployment (READ-ONLY)

| Aspek | Hasil |
|---|---|
| THF check-in | **4**, nomor 001–004 |
| THF nilai FINAL | **12 dari 12** dari 3 juri |
| THF phase | **JUDGING_OPEN** |
| Publikasi | **ANONYMOUS** |
| Flag persetujuan privasi | **FALSE** |
| Catatan musyawarah | **0** |

**Tidak dilakukan** `CLOSE_JUDGING`, `RESOLVE_TIE`, `PUBLISH_OFFICIAL` atau perubahan database nyata selama UAT REVIEW ini. Seluruh tindakan berada pada fixture in-memory.

## Batas validasi dan gate berikutnya

Pengujian UAT ini membuktikan perilaku aplikasi dan adapter penyimpanan pada simulasi terisolasi, **bukan** bukti adanya hasil OFFICIAL nyata di URL publik. Tidak dilakukan uji kegagalan jaringan setelah commit final pada Sheets; Google Sheets sendiri bukan basis data transaksional. Karena itu publikasi nyata tetap memerlukan pengecekan panitia, otorisasi privasi resmi, dan kontrol audit.

**Gate berikutnya yang disarankan:** verifikasi kesiapan operasional dan pembersihan data simulasi secara terkendali sebelum hari pelaksanaan. Jangan menghapus data uji atau menggantinya dengan peserta sebenarnya tanpa backup, konfirmasi, dan protokol migrasi terpisah.

**Bukti kode:** `tests/uat-review-publication-gates.test.cjs`, `tests/uat-review-sheet-journal-safety.test.cjs`, `tests/uat-close-judging-gate.test.cjs`, `src/server/ContestApplication.js`, `src/server/ContestDomain.js`, `src/server/ContestStore.js`.