# Tarmudi Fest 2026 — Sistem Registrasi, Penjurian, dan Hasil

**Status 19 Oktober 2026: BERJALAN PADA LINGKUNGAN UAT. BELUM GO-LIVE DENGAN DATA PESERTA ASLI.**

Sistem untuk **Tarmudi Fest 2026**, Sabtu **24 Oktober 2026**, Kampus 2 MIS Tarbiyatul Mubtadiin. Cabang: **Tahfidz**, **Mendongeng**, **Mewarnai**.

> Repository publik hanya memuat kode dan data contoh sintetis. Data siswa asli, daftar UID/akun aktif, Google Sheets privat, kredensial, token, maupun berita acara belum disahkan tidak boleh di-commit.

## Fitur UAT yang telah berjalan

- **Google Apps Script V8, Google Sheets privat, Firebase Authentication:** login internal dengan role dan cabang yang diverifikasi server melalui token dan allowlist privat. Token ID Firebase diperbarui dalam memori saat akan kedaluwarsa.
- **Panel Admin:** impor peserta, pengaturan skema 100 poin, penugasan juri, status penjurian, rekap internal, cari/paginasi 20 per halaman, review, musyawarah dan pengesahan bersyarat.
- **Panel Registrasi:** cari peserta terverifikasi dan check-in. Nomor start berurutan secara independen per cabang.
- **Panel Juri:** hanya nomor start, tanpa nama/sekolah atau nilai juri lain; DRAFT, FINAL dan koreksi FINAL beralasan selama status JUDGING_OPEN.
- **Hasil sementara anonim:** hanya peserta dengan semua juri wajib FINAL. Tahfidz memprioritaskan akumulasi kriteria; seri identik yang menyentuh enam besar wajib musyawarah. Seri di luar enam besar memperoleh peringkat bersama.
- **Audit dan privasi:** riwayat koreksi dan keputusan, gerbang izin pemilik sebelum publikasi nama/sekolah, perlindungan teks Google Sheets dari formula injection.
- **Mobile-first:** formulir registrasi, juri dan hasil publik telah melalui UAT pada layar ponsel.

Pengujian otomatis mencakup simulasi 200 peserta, 600 nilai, token refresh, penutupan penjurian, musyawarah dan gerbang publikasi. Tes tersebut **bukan** pengganti latihan operator dan pengecekan jaringan asli di lokasi.

## Belum dinyatakan siap produksi

Database UAT masih berisi peserta **sintetis**, check-in dan nilai contoh. Backup privat telah dibuat dan sebuah **template operasional kosong** disiapkan, tetapi tidak dihubungkan ke aplikasi. Sebelum tanggal acara, panitia harus memastikan data peserta asli terverifikasi, 13 akun internal (1 Admin, 3 Registrasi, 9 Juri) disiapkan, HP/jaringan lokasi diuji, berita acara dan persetujuan identitas anak tersedia.

**Jangan menghapus data UAT atau mengganti pengaturan TF26_DATA_SHEET_ID tanpa persetujuan eksplisit pemilik.** Semua deployment dalam satu proyek GAS berbagi Script Properties, sehingga mengganti sumber data akan memengaruhi URL UAT yang sama. Berita acara PDF otomatis belum diklaim selesai; dokumen minimum manual bertanda tangan tersedia sebagai fallback.

## Menjalankan tes dan build

Pada folder repository dengan Node.js terpasang:

- Jalankan perintah: node --test
- Jalankan build: node scripts/build-gas.cjs

Build menghasilkan Code.js, Index.html dan appsscript.json untuk GAS. Jangan mendorong ke deployment operasional tanpa backup, verifikasi target, dan persetujuan.

## Dokumen operasional terbaru

- [Panduan simulasi panitia dan hari H](docs/operations/SIMULASI_PANITIA_20261019.md)
- [Register kesiapan dan GO/NO-GO](docs/operations/READINESS_GO_NO_GO_20261019.md)
- [Templat berita acara manual minimum](docs/operations/BERITA_ACARA_MINIMUM_TEMPLATE.md)
- [UAT penutupan penjurian](docs/operations/UAT_CLOSE_JUDGING_GATE_20261019.md)
- [UAT REVIEW dan publikasi](docs/operations/UAT_REVIEW_PUBLICATION_20261019.md)
- [Aturan tie enam besar](docs/architecture/ADR-0005-top-six-tie-deliberation.md)

## Baseline produk dan kebijakan

- [PRD V1.5](docs/product/PRD_TARMUDI_FEST_V1.5.md)
- [Decision Register](docs/governance/DECISION_REGISTER.md)
- [Batas data publik/privat](docs/governance/PUBLIC_PRIVATE_BOUNDARY.md)
- [Threat Model keamanan](docs/security/AUTH_THREAT_MODEL_V1.md)

Hak cipta kode asli tunduk lisensi MIT. **GO UAT bukan GO-LIVE.** Persetujuan GO-LIVE dan publikasi resmi merupakan kewenangan penanggung jawab panitia setelah semua gerbang diperiksa.
