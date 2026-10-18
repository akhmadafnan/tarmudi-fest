# Kontrak Impor Peserta — Baseline Contoh V1 (STEP 00)

**Status:** data-format baseline untuk implementasi mendatang; **bukan kode aplikasi dan belum diuji pada layanan produksi**. PRD V1.5 merupakan baseline persyaratan produk aktif; V1.4 tersimpan sebagai arsip riwayat.

## Tujuan

Admin dapat mengimpor data pendaftar Google Form/Excel. Sampel publik disediakan **30 peserta sintetis**: 10 Mendongeng, 10 Tahfidz, dan 10 Mewarnai. Semua nama, sekolah, dan nomor ID contoh dibuat untuk demonstrasi, bukan data anak atau lembaga nyata.

- Sampel CSV: [`examples/synthetic/participants_tarmudi_fest_30.csv`](../../examples/synthetic/participants_tarmudi_fest_30.csv).
- Berkas Excel `.xlsx` dengan sheet `PESERTA_IMPORT` dan `PETUNJUK` tersedia sebagai artefak percakapan untuk Admin; tidak diperlukan untuk memulai desain.
- **Hanya sheet `PESERTA_IMPORT` yang diproses saat impor**. Petunjuk bukan data impor.
- Header ada di **baris pertama** dan tidak boleh diganti. CSV UTF-8 juga didukung sebagai target pengembangan.

## Kolom wajib (tepat lima pada template awal)

| Kolom | Contoh | Aturan |
|---|---|---|
| `ID_PENDAFTARAN` | `TF26-THF-001` | Teks wajib; unik; pengenal dari sumber registrasi, **bukan nomor start**; tidak boleh berubah sembarangan setelah digunakan |
| `NAMA_PESERTA` | `Peserta Simulasi THF-001` | Teks wajib; dipakai admin/petugas; **tidak dikirim ke panel juri** |
| `ASAL_SEKOLAH` | `RA Simulasi F` | Teks wajib; dipakai admin/petugas dan hasil resmi setelah pengesahan; **tidak dikirim ke panel juri** |
| `CABANG_LOMBA` | `Tahfidz` | Hanya `Mendongeng`, `Tahfidz`, atau `Mewarnai` |
| `STATUS_VERIFIKASI` | `TERVERIFIKASI` | Hanya `TERVERIFIKASI` atau `BELUM_TERVERIFIKASI` |

## Aturan domain

1. Peserta hanya boleh berada di satu cabang.
2. Nama tidak wajib unik: gunakan `ID_PENDAFTARAN` sebagai kunci bisnis impor; aplikasi membuat ID internal sendiri.
3. Untuk Mendongeng dan Tahfidz, maksimum dua peserta per sekolah per cabang (sesuai Juknis Tarmudi Fest 2026). Mewarnai tidak memiliki batas delegasi sekolah.
4. Peserta dengan status `BELUM_TERVERIFIKASI` tidak dapat dikonfirmasi registrasi ulang sebelum panitia memverifikasinya.
5. **Nomor start, kehadiran, identitas juri, dan nilai TIDAK disertakan pada file impor**. Nomor unik dan berurutan per cabang dibuat oleh aplikasi saat registrasi ulang.
6. Jangan menyertakan nama wali, telepon, alamat, foto, surat aktif sekolah, tanggal lahir, atau data anak lain yang tidak diperlukan ke repo publik.
7. Nilai campuran cabang yang salah eja, ID duplikat, kolom kosong, dan delegasi melewati kuota harus ditampilkan dalam laporan pratinjau dan tidak boleh dipaksakan masuk ke produksi tanpa koreksi.

## Mode impor yang wajib disediakan Admin

### IMPOR AWAL
- Admin pilih file, melihat **pratinjau dan ringkasan per cabang**, daftar kesalahan, jumlah ID unik, dan perubahan yang akan terjadi.
- Semua baris divalidasi secara menyeluruh. Bila ada kesalahan kritis, data produksi **tidak berubah**.
- Admin mengonfirmasi commit data yang lolos; sistem mencatat operator, waktu, ringkasan, serta ID batch.

### GANTI DATA CONTOH / UPLOAD ULANG
- Sebelum ada **registrasi ulang, nomor start, nilai Draft/Final, atau pengesahan**, Admin dapat memilih **Ganti Semua Data Peserta** dan mengunggah file baru.
- Sistem harus menampilkan peringatan, pratinjau perbedaan serta opsi backup sebelum menyimpan. Penggantian dilakukan atomik dan diaudit.
- Setelah aktivitas tersebut dimulai, **blokir penghapusan/ganti massal data peserta**. Pembetulan harus melalui proses koreksi berbasis ID dengan audit dan perlindungan nomor start, nilai, serta hasil. Jangan menerapkan `clear sheet` secara langsung.
- Data produksi tidak boleh berisi campuran peserta sintetis dengan peserta asli.

## Kontrak pengujian modul impor

- 30 baris dan lima kolom contoh valid; distribusi 10/10/10.
- Semua `ID_PENDAFTARAN` unik dan semua cabang sesuai daftar.
- Maksimal dua peserta per sekolah untuk Mendongeng dan Tahfidz.
- Impor file yang sama berulang harus menolak/mendeteksi duplikasi; tidak menghasilkan identitas ganda.
- Impor invalid tidak boleh sebagian mengubah database.
- Nomor start selalu berasal dari registrasi ulang; identitas tidak muncul pada payload juri.
- Setelah registrasi/nilai aktif, mass replace ditolak dan arsip penilaian tidak berubah.

**Privasi & lisensi:** data CSV contoh aman untuk dipublikasikan sebagai data sintetis. File Google Form asli, peserta anak, surat dan kontak orang tua harus tetap berada di sumber penyimpanan privat milik pemilik deployment.
