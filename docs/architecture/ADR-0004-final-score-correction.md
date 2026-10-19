# ADR-0004 — Koreksi Nilai FINAL oleh Juri Pemilik

Status: **DITERIMA UNTUK UAT** (19 Oktober 2026)  
Produk: Tarmudi Fest 2026 — Tahfidz, Mendongeng, Mewarnai  
Dasar: permintaan panitia agar kesalahan input juri setelah finalisasi masih dapat diperbaiki.

## Keputusan

Nilai berstatus `FINAL` **tetap tidak dapat diubah** melalui perintah normal `SAVE_SCORE`. Sebagai pengecualian terkontrol, juri **pemilik nilai tersebut** dapat menjalankan perintah terpisah `CORRECT_FINAL_SCORE` selama cabangnya berstatus `JUDGING_OPEN`.

Persyaratan koreksi:

1. Firebase ID token valid; UID harus menjadi juri aktif pada cabangnya; skor asli harus dimiliki UID yang sama.
2. Cabang harus sedang `JUDGING_OPEN`; setelah `REVIEW`/publikasi, fungsi ini menolak koreksi.
3. Koreksi adalah satu operasi `FINAL → FINAL`, bukan pembukaan status `DRAFT`.
4. Poin harus bilangan bulat pada rentang kriteria yang berlaku, lengkap, dan berbeda dari nilai lama.
5. Juri wajib menulis alasan koreksi 15–400 karakter.
6. Klien mengirim salinan poin lama; server melakukan *optimistic concurrency check* supaya form lama tidak menimpa koreksi terbaru.
7. Sebelum penimpaan skor, server menambahkan jurnal private `SCORE_REVISIONS` berisi nomor start, cabang, UID juri, versi skema, poin/total lama, poin/total baru, alasan, waktu, dan status `PENDING`. Setelah skor utama berhasil diganti, jurnal menjadi `APPLIED`; audit `CORRECT_FINAL_SCORE` ditulis.
8. Semua operasi berada dalam satu `LockService` script lock. Sheet bukan database transaksional: jurnal yang tertinggal `PENDING` akibat kegagalan parsial perlu investigasi Admin sebelum hasil disahkan.
9. Tidak ada nama, sekolah, atau ID pendaftaran peserta yang dikirim ke juri, termasuk proses koreksi.
10. Hasil sementara dihitung dari satu skor `FINAL` terbaru per UID juri/nomor/versi skema; perubahan tidak membuka publikasi identitas.

## Alur UI

Indeks → **Lihat / koreksi** pada skor FINAL → formulir baca-saja → **Koreksi nilai** (jika fase masih dibuka) → ubah poin + isi alasan → konfirmasi → simpan koreksi FINAL → kembali ke indeks. Nilai yang tampil merupakan nilai terbaru milik juri itu sendiri.

## Batas UAT

Implementasi awal dilakukan pada branch `develop`, diuji sebelum deployment. Skor sintetis Nomor 001 milik Juri 1 semula `[35,27,18,8]` = 88/100 tidak diubah oleh pembuatan fitur. Pengujian koreksi secara nyata baru dilakukan setelah deployment yang terverifikasi dan persetujuan pengguna.

## Pengaman lanjutan

Apabila seluruh penilaian sudah ditutup, koreksi harus melalui keputusan formal Admin/panitia di luar alur juri biasa. Revisi setelah pengumuman memerlukan prosedur pembatalan/pengesahan ulang dan tidak tercakup dalam ADR ini.
