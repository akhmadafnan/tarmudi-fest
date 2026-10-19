# Tarmudi Fest 2026 — Panduan Simulasi Panitia dan Hari Pelaksanaan

**Edisi:** 19 Oktober 2026, target siap demonstrasi pukul 22.00 WIB.  
**Event sesuai PRD/Juknis:** Sabtu, 24 Oktober 2026, Kampus 2 MIS Tarbiyatul Mubtadiin.  
**Cabang:** Tahfidz (THF), Mendongeng (MDG), Mewarnai (MWN).  
**Jenis dokumen:** SOP latihan dan operasional; **bukan** otorisasi membuka hasil resmi atau menggunakan peserta asli tanpa persetujuan.

## 1. Arti status

- **READY:** skema disiapkan; penjurian belum dibuka.
- **JUDGING_OPEN:** Admin telah membuka penjurian, skema terkunci; juri dapat menyimpan DRAFT/FINAL.
- **REVIEW:** Admin menutup penjurian setelah **minimal 6 peserta check-in** dan semua nilai wajib FINAL; koreksi FINAL oleh juri tidak lagi dibolehkan.
- **INTERIM / ANONYMOUS:** hasil sementara hanya nomor start dan nilai lengkap; nama dan sekolah tetap privat.
- **Musyawarah wajib:** hanya seri identik yang memengaruhi peringkat **1–6**, termasuk seri melewati batas peringkat ke-6; jika 20 peserta seri posisi 6–25, dewan juri cukup memilih **satu** peserta untuk posisi keenam dan sisanya berbagi peringkat ketujuh.
- **OFFICIAL:** hanya Admin yang dapat menerbitkan setelah fase REVIEW, skor lengkap, musyawarah wajib selesai, dan persetujuan privasi penanggung jawab tersedia. Hasil resmi dapat menampilkan identitas sesuai kewenangan.

## 2. Siapa mengerjakan apa

| Peran | Jumlah rancangan | Kewajiban |
|---|---:|---|
| Admin | 1 | Impor data, verifikasi juri, skema, buka/tutup penjurian, musyawarah, pengesahan, audit |
| Registrasi | 3 (1/cabang) | Cari peserta terverifikasi, check-in, serahkan/tempeI nomor start |
| Juri | 9 (3/cabang) | Login mandiri, pilih nomor start, isi poin, simpan draft/final sesuai skema, koreksi FINAL beralasan sebelum REVIEW |
| Ketua panitia/dewan juri | Sesuai SK | Validasi peserta dan berita acara, memutuskan seri, menyetujui pengumuman identitas |

Akun riil yang sudah dibuat, status aktif dan password harus diperiksa sendiri oleh Admin tanpa memasukkan kredensial ke GitHub, Sheets publik, atau percakapan.

## 3. Simulasi singkat tanpa mengubah data UAT aktif (±25 menit)

1. **Persiapan (3 menit).** Operator membuka URL UAT. Admin memeriksa cabang, fase, jumlah juri dan registrasi. Gunakan perangkat HP ukuran kurang-lebih 390×844. Jangan mengakses lembar kerja privat dengan akun juri.
2. **Registrasi (4 menit).** Buka panel Registrasi ulang, cari nama/sekolah peserta sintetis, cek cabang dan status `TERVERIFIKASI`. Diskusikan penomoran otomatis: nomor berurutan **per cabang**, bukan per seluruh lomba. Untuk demonstrasi tanpa perubahan, cukup tunjukkan peserta yang sudah check-in dan nomor start-nya.
3. **Juri (5 menit).** Tunjukkan Panel Juri Tahfidz pada login juri yang sudah sah. Indeks berisi nomor start dan status `Belum dinilai`, `Draft`, atau `Selesai`; tidak ada nama dan sekolah. Buka skor FINAL yang sudah tersedia dan jelaskan tombol koreksi plus alasan. **Jangan menyimpan koreksi nyata hanya untuk demonstrasi.**
4. **Hasil sementara (4 menit).** Buka `Lihat hasil sementara → Tahfidz`. Nomor 001/003/002/004 sudah memiliki hasil sintetis; nomor 002 dan 004 menunggu musyawarah. Bedakan label INTERIM dari OFFICIAL; identitas siswa tidak boleh muncul.
5. **Panel Admin (4 menit).** Tunjukkan rekap internal, pencarian, paginasi 20 entri per halaman, status cabang, dan panel musyawarah. Pada data sekarang Tahfidz masih `JUDGING_OPEN` sehingga formulir keputusan musyawarah tidak aktif. Jangan menekan `Tutup penjurian` atau `Sahkan & publikasikan`.
6. **Diskusi simulasi penuh (5 menit).** Jelaskan urutan `READY → JUDGING_OPEN → REVIEW → OFFICIAL` memakai contoh skenario di Bagian 4. Transisi resmi sudah diuji melalui 160+ pengujian otomatis terisolasi, tetapi bukan transaksi live pada database acara.

## 4. Skenario latihan end-to-end pada lingkungan sintetis TERPISAH

Berlaku **hanya** bila panitia membuat sandbox terpisah atau menggunakan pengujian otomatis. Jangan pakai database UAT aktif/produksi untuk menerbitkan hasil buatan.

1. Impor **8 peserta simulasi** Tahfidz yang telah diverifikasi, kemudian check-in nomor 001–008.
2. Admin mengonfirmasi tiga UID juri terdaftar dan membuka penjurian Tahfidz.
3. Tiga juri masing-masing mengisi seluruh kriteria tiap nomor dengan poin berikut. Semua nilai di bawah ini valid terhadap skema 40/30/20/10; gunakan poin yang sama pada Juri 1–3 agar contoh mudah dihitung:

   | Nomor | Kelancaran | Tajwid | Fashohah | Irama | Total tiap juri |
   |---|---:|---:|---:|---:|---:|
   | 001 | 39 | 29 | 19 | 8 | 95 |
   | 002 | 38 | 28 | 19 | 9 | 94 |
   | 003 | 37 | 28 | 19 | 9 | 93 |
   | 004 | 36 | 28 | 19 | 9 | 92 |
   | 005 | 35 | 28 | 19 | 9 | 91 |
   | 006 | 35 | 27 | 19 | 9 | 90 |
   | 007 | 35 | 27 | 19 | 9 | 90 |
   | 008 | 30 | 25 | 17 | 8 | 80 |

4. Setelah Juri 1 dan Juri 2 FINAL, peserta **belum** boleh tampil di hasil sementara sampai Juri 3 juga FINAL. Ketika 24 skor FINAL tersimpan, semuanya tampil. Nomor 006 dan 007 **seri identik pada batas enam besar**.
5. Coba menutup penjurian sebelum seluruh skor lengkap: sistem menolak `INCOMPLETE_SCORES`. Setelah semua lengkap dan check-in sedikitnya enam, Admin menutup menjadi `REVIEW`. Status hasil publik tetap `INTERIM`.
6. Coba publikasi sebelum keputusan seri: sistem menolak `TIE_RESOLUTION_REQUIRED` (jika izin privasi telah tersedia). Admin/dewan juri memutuskan **satu** peserta untuk posisi ke-6; masukkan nomor yang benar-benar disepakati dan alasan tertulis minimal 15 karakter. **Nomor 006 atau 007 tidak boleh dipilih otomatis oleh sistem**.
7. Coba publikasi tanpa otorisasi identitas penanggung jawab: sistem menolak `PRIVACY_APPROVAL_REQUIRED`.
8. Setelah semua gerbang dan izin sah, Admin dapat mengesahkan hasil. Data publik tetap tidak membuka nama/sekolah selama tidak ada otorisasi. Keputusan musyawarah dan pengesahan tercatat dalam AUDIT.
9. Panitia memeriksa daftar Juara I, II, III dan Harapan I, II, III terhadap berita acara yang ditandatangani. Jangan mengumumkan sebelum pencocokan selesai.

## 5. Prosedur di lokasi acara

**Sebelum registrasi dibuka:**

- Admin memastikan file peserta asli sudah diverifikasi, tidak ada peserta ganda atau cabang salah; Tahfidz/Mendongeng maksimal dua delegasi per sekolah menurut juknis; pastikan no. start per cabang dimulai dari 001.
- Konfirmasi **tiga akun juri aktif untuk setiap cabang** atau addendum resmi bila jumlah berbeda; setiap juri login di HP mereka sendiri.
- Operator mengecek koneksi internet, daya/pengisi daya, Chrome/Safari, jam ponsel, dan menyepakati orang yang mengoperasikan cadangan kertas.
- Batas tugas: petugas Registrasi tidak boleh melihat panel Admin/juri; juri hanya nomor start, tidak melihat identitas anak.
- Mendongeng: naskah rangkap tiga diserahkan saat daftar ulang. Jika naskah dikirim ke juri, samarkan identitas peserta.
- Tahfidz: bila peserta tidak hadir setelah tiga panggilan, dapat dipindahkan ke akhir **urutan tampil**, bukan mengganti nomor start.
- Mewarnai: karya hanya berlabel nomor start, tanpa identitas pada lembar yang dinilai juri.

**Selama lomba:** Registrasi menentukan nomor otomatis; Juri boleh menyimpan DRAFT lalu FINAL; Admin memantau kelengkapan dari rekap. Koreksi setelah FINAL saat `JUDGING_OPEN` wajib alasan; setelah REVIEW tidak dapat dilakukan lewat jalur koreksi biasa.

**Akhir cabang:** Admin memeriksa check-in dan seluruh nilai FINAL, menutup penjurian, meninjau enam besar, meminta keputusan musyawarah jika perlu, kemudian memeriksa persetujuan privasi dan berita acara. Jika satu gerbang belum lengkap, biarkan `INTERIM`.

## 6. Fallback internet/ponsel bermasalah

- Bila aplikasi tak bisa dibuka atau Google Apps Script melambat, hentikan penerbitan nomor baru di aplikasi sementara agar tidak terjadi dua daftar nomor berbeda.
- Petugas memakai daftar kehadiran kertas **satu sumber yang ditunjuk** dan menulis waktu, cabang, nomor, serta paraf dua petugas.
- Juri mengisi formulir kertas berdasarkan **nomor start dan empat/lima kriteria resmi**; dokumen diserahkan dan dihitung silang oleh Admin. Nama/sekolah tidak ditulis pada lembar juri.
- Sesudah pulih, Admin merekonsiliasi nomor dan nilai dengan operator, **bukan** menghapus/mengedit Google Sheets sembarangan atau memasukkan ulang skor yang mungkin sudah berhasil disimpan.
- Hasil resmi ditahan sampai status input, berita acara, dan otorisasi lengkap. Formulir kertas bertanda tangan disimpan di arsip panitia.

## 7. Batas persetujuan dan kesiapan nyata

**Yang dapat dinyatakan siap malam ini:** kode, alur UAT, endpoint hasil anonim, tes fungsi dan dokumen latihan.

**Yang belum boleh diasumsikan siap produksi:** data peserta asli, kesiapan semua akun petugas, persetujuan pengungkapan identitas siswa, jaringan perangkat di lokasi, berita acara PDF terintegrasi dan persetujuan final panitia.

Aplikasi UAT dan template operasional kosong adalah dua dataset terpisah; **jangan mengubah `TF26_DATA_SHEET_ID` sebelum pemilik menyetujui cutover**. Script Properties digunakan bersama oleh deployment dalam satu proyek Apps Script; menggantinya akan memengaruhi URL UAT yang sama. Simpan sheet UAT, backup UAT, dan template operasional secara privat.

**Tanggung jawab final GO-LIVE ada pada penanggung jawab panitia setelah check fisik/administratif.**
