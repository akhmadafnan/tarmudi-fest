# Tarmudi Fest 2026 — GO/NO-GO Kesiapan Aplikasi (Audit 19 Okt 2026)

**Target:** baseline UAT siap sebelum 22.00 WIB, Senin 19 Oktober 2026.  
**Event:** Sabtu 24 Oktober 2026, Kampus 2 MIS Tarbiyatul Mubtadiin.  
**Putusan saat audit:** **GO untuk SIMULASI/UAT**, **NO-GO bersyarat untuk data lomba asli dan publikasi identitas** sampai pemeriksaan operasional selesai.

## Temuan yang telah diverifikasi

| Area | Status audit | Bukti |
|---|---|---|
| Repository `develop`, akses revisi & CI | PASS | Tes/commit versioned |
| Alur role-based Admin, Registrasi, Juri | PASS pada uji peran | UAT perangkat dan otorisasi kode |
| Penomoran per cabang, check-in, skor DRAFT/FINAL | PASS | UAT terdahulu dan regresi |
| Skema 100 poin ketiga cabang | PASS | SETTINGS + validasi rubrik |
| Hasil sementara anonim endpoint publik Tahfidz | PASS live GET | Empat peserta tampil tanpa fullName/school |
| Tie-break Tahfidz dan enam besar | PASS | UAT dan uji simulasi 200 |
| Paginasi Admin 20 hasil/halaman | PASS | UAT Admin & automated |
| REVIEW, gerbang publikasi & jurnal audit | PASS simulasi | Tes terisolasi, tidak menerbitkan nyata |
| Koreksi nilai FINAL sebelum REVIEW | PASS | UAT dan jurnal revisi |
| Sesi Firebase lebih dari satu jam | PASS automated; browser real renewal **perlu observasi** | Token refresh in-memory, tidak di localStorage |
| Snapshot seluruh database UAT | PASS | Backup salinan Google Sheets owner-only |
| Template operasional kosong | PASS | 8 tab, 3 cabang READY, 0 peserta/check-in/skor, akses owner-only |
| Ketersediaan API GAS anonim | PASS live | URL aktif mengembalikan fase INTERIM |
| Pengujian beban 200 peserta / 600 skor | PASS unit/logika | Belum load test **serentak** di jaringan sekolah |

## Gate operasional yang belum terkonfirmasi

| Gate | Harus disahkan/dicek oleh | Status |
|---|---|---|
| Daftar peserta Google Form sebenarnya (ID stabil, nama, sekolah, cabang, verifikasi, aturan delegasi) | Admin registrasi | PENDING |
| Aktivasi dan login 13 akun internal (1 Admin, 3 Registrasi, 9 Juri) | Admin/pemilik Firebase | PENDING; akun Tahfidz 3/3 telah diuji |
| UAT jaringan dan HP asli di Kampus 2, termasuk tiga perangkat juri simultan | Tim teknis panitia | PENDING |
| Kepastian peserta/juri dan skema per cabang sesuai juknis, terutama Mendongeng/Tahfidz tiga juri | Ketua panitia/dewan juri | PENDING |
| Dokumen persetujuan/pemberitahuan wali dan otorisasi pemilik sebelum mengumumkan identitas | Ketua panitia/pengelola data | PENDING — jangan aktifkan privacy release dulu |
| Berita acara resmi minimal per cabang, daftar enam juara dan paraf/tanda tangan | Ketua panitia/dewan juri | PENDING — prosedur PDF manual sebagai fallback |
| Verifikasi perangkat cadangan, baterai, daftar kertas, nomor panggilan, penanggung jawab troubleshooting | Koordinator lapangan | PENDING |
| Cutover dari Sheet UAT sintetis ke template/data asli setelah backup dan otorisasi | Pemilik sistem | PENDING — **tidak dieksekusi** |

## Snapshot data saat audit

- Google Sheets **UAT aktif** (private): **30 peserta sintetis** = 10/cabang; 5 check-in (Tahfidz 4, Mendongeng 1); 12 skor FINAL Tahfidz; THF `JUDGING_OPEN`, MDG/MWN `READY`, publikasi semua ANONYMOUS, tidak ada keputusan musyawarah.
- Salinan **BACKUP PRIVATE UAT** dibuat; isi seluruh tab termasuk audit, revisi, serta backup tersembunyi; permission hanya owner.
- **TEMPLATE OPERASIONAL KOSONG** (private, belum aktif): 8 tab sesuai adapter `TF26SheetStore`, masing-masing cabang `READY`, 3 juri wajib, nilai rubrik 100, flag privasi `FALSE`; 0 peserta, 0 check-in, 0 skor. Header `TIE_RESOLUTIONS` diselaraskan dengan data yang benar-benar ditulis adapter.
- URL UAT masih diarahkan melalui Script Properties lama ke data sintetis; tidak ada tindakan reset atau perubahan izin.

## Syarat keputusan

**GO UAT:** Admin bisa masuk, juri bisa mengakses hanya nomor, form responsif, hasil anonim benar, keseluruhan tes hijau, cadangan tersedia.

**GO OPERASIONAL HARI H:** seluruh gate PENDING di atas selesai, data asli diimpor pada **template privat** setelah persetujuan dan verifikasi; skema/juri dan identitas peserta divalidasi; semua petugas siap; fallback dan berita acara tersedia; tes smoke sesudah cutover PASS; ketua panitia memberi persetujuan tertulis.

**NO-GO/PAUSE:** identitas anak tampil tanpa izin, skor orang lain bocor, nomor terduplikasi, perangkat/jaringan tanpa fallback, juri belum siap, data palsu tercampur, ketidaklengkapan skor/berita acara, atau belum ada izin pengungkapan identitas.

## Pembatas keselamatan cutover

1. **Jangan** menghapus isi Spreadsheet UAT untuk menjadikannya produksi. Simpan backup dan gunakan template operasional kosong yang sudah dibuat.
2. **Jangan** mengganti `TF26_DATA_SHEET_ID` tanpa persetujuan eksplisit pemilik, karena berlaku pada **seluruh deployment GAS yang berbagi proyek Script Properties**.
3. Sesudah cutover, lakukan tes publik anonim, uji Admin, cek jumlah peserta terverifikasi, dan cek cabang; jangan membuat check-in/score contoh di data asli.
4. Simpan sheet dan kredensial privat; **jangan commit ID sheet, daftar nama siswa, UID juri atau kata sandi ke GitHub publik**.
5. Jika pengujian petugas ingin terus memakai data sintetis, gunakan GAS project **terpisah**, bukan hanya URL deployment berbeda dengan Script Properties yang sama.

## Sumber laporan internal

- `docs/operations/UAT_CLOSE_JUDGING_GATE_20261019.md`
- `docs/operations/UAT_REVIEW_PUBLICATION_20261019.md`
- `tests/uat-auth-session-renewal.test.cjs`
- `tests/uat-review-publication-gates.test.cjs`
- `tests/top-six-cutoff.test.cjs`
- `docs/architecture/ADR-0005-top-six-tie-deliberation.md`

## Pembaruan pemeriksaan langsung dan penyelesaian UAT malam hari

Pada 19 Oktober 2026 malam, baseline sesi Firebase diperkuat: token ID yang mendekati kedaluwarsa dapat diperbarui menggunakan refresh token yang hanya disimpan dalam memori browser. Verifikasi programatis mencakup refresh serentak, refresh gagal, logout, anti-replay setelah logout, dan satu kali retry bila backend secara eksplisit mengembalikan AUTH_REQUIRED. **11/11** tes khusus PASS, pengamatan sesi >1 jam pada HP tetap menjadi gate lapangan.

**Hasil rilis:** 171/171 regresi PASS; Google Apps Script UAT menggunakan deployment lama yang diperbarui sampai **@24**, bukan URL baru. Pengujian GET live sesudah deployment menjawab `ok=true`, cabang THF, fase `INTERIM`, empat hasil, dua kelompok pending deliberation, dan **tidak ada nama ataupun sekolah** dalam keluaran publik. Tidak ada perubahan pada nilai, penomoran, atau pengesahan data yang aktif.

**Backup:** satu salinan penuh private seluruh Google Sheets UAT berhasil dibuat; metadata Google Drive menunjukkan `shared=false` dan izin `user:owner` saja.

**Template data baru:** delapan tab sesuai adapter GAS, semua sheet memiliki header dan konfigurasi fase READY/ANONYMOUS, tiga juri per cabang, skema 100 poin. 0 peserta/check-in/skor; metadata Google Drive menunjukkan hanya izin `user:owner`. **Belum ditautkan** ke aplikasi atau mengganti Script Properties.

**Perubahan kode dan dokumentasi:** README lama yang menyatakan repository belum mempunyai aplikasi telah diganti dengan status UAT aktual. Panduan simulasi, laporan kesiapan, dan templat berita acara minimum telah ditambahkan dalam docs/operations.

**Keputusan setelah pembaruan:** GO untuk simulasi dan demonstrasi petugas malam ini. GO-LIVE nyata menunggu persetujuan operator/panitia atas cutover data, autentikasi semua 13 akun, tes HP/jaringan lokasi, persetujuan privasi anak, serta berita acara final. Tidak ada publikasi hasil resmi.
