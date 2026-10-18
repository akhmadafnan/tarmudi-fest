# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## TARMUDI FEST 2026 — Sistem Manajemen Registrasi, Penjurian, Hasil, dan Berita Acara

**Kode dokumen:** TF26-PRD-001  
**Versi:** 1.5 — Baseline terkunci dengan revisi autentikasi internal  
**Tanggal penetapan dokumen:** 18 Oktober 2026  
**Penyelenggara:** MIS Tarbiyatul Mubtadiin  
**Acara:** Sabtu, 24 Oktober 2026, Kampus 2 MIS Tarbiyatul Mubtadiin  
**Status pengembangan:** Spesifikasi disahkan untuk persiapan implementasi; belum ada kode atau deployment.  
**Sumber otoritatif:** *Petunjuk Teknis Umum dan Khusus Tarmudi Fest 2026*, 7 halaman, serta keputusan panitia yang dibahas dan dikunci pada perancangan ini.

> **Aturan pembacaan:** Label **[JUKNIS]** menunjukkan aturan yang tercantum dalam dokumen sumber; **[KEPUTUSAN]** menunjukkan keputusan produk panitia pada diskusi ini; **[TEKNIS]** menunjukkan mekanisme yang diusulkan untuk memenuhi keputusan tersebut dan masih wajib dibuktikan melalui pengujian. Keputusan tambahan tidak otomatis menggantikan ketentuan formal juknis tanpa pengesahan panitia.

---

# A. KENDALI DOKUMEN

## A.1 Tujuan PRD

Dokumen ini menjadi sumber kebenaran tunggal (*single source of truth*) untuk ruang lingkup, aturan bisnis, pengalaman pengguna, arsitektur, kebutuhan data, keamanan, pengujian penerimaan, dan pelaksanaan bertahap sistem Tarmudi Fest 2026. PRD dipakai oleh panitia, pengembang, penguji, dan penanggung jawab penjurian untuk mengurangi perubahan asumsi selama implementasi.

## A.2 Riwayat keputusan

| Versi | Pokok perubahan | Keadaan |
|---|---|---|
| V1.0 | Satu sistem, tiga cabang, impor Excel, registrasi ulang, juri, portal publik, berita acara | Diterima |
| V1.1 | Gmail pribadi sebagai identitas internal; bobot awal ketiga cabang ditetapkan | Diterima |
| V1.2 | Kriteria dikelola Admin; penugasan berbasis cabang; mobile-first Neo-Brutalism | Diterima |
| V1.3 | Blind judging; nama dan sekolah tidak diberikan kepada juri; identitas publik setelah pengesahan | Diterima |
| V1.4 | Skor input berupa poin langsung 0–maksimum kriteria; skala bilangan bulat; total 100 | Arsip baseline sebelumnya |
| **V1.5** | **Autentikasi Gmail internal diganti akun internal username/password; 13 akun awal; protokol keamanan dan gerbang STEP 01 direvisi** | **Baseline aktif terkunci** |

## A.3 Aturan kendali perubahan

1. Baseline produk dikunci untuk implementasi. Perubahan fitur, aturan, atau hak akses memerlukan *change request* berisi alasan, dampak, persetujuan, versi, serta konsekuensi terhadap tes.
2. Konfigurasi bobot/kriteria dapat disunting Admin selama status DRAFT; perubahan berlaku untuk juri dan publik hanya setelah konfigurasi diterbitkan menurut aturan penguncian.
3. **Jika sesi penjurian sudah dibuka, versi aturan aktif tidak boleh diubah diam-diam**, bahkan bila belum ada skor; penyesuaian memerlukan proses revisi formal.
4. Konflik antara PRD dan juknis harus dicatat sebagai isu kebijakan, bukan diselesaikan oleh pengembang secara sepihak.

## A.4 Sasaran keberhasilan

- Seluruh peserta terverifikasi dapat ditemukan oleh petugas cabangnya dan memperoleh nomor start unik tanpa duplikasi.
- Setiap juri hanya dapat menilai dengan nomor start pada cabang yang ditugaskan; nama/sekolah tidak ada di payload penjurian.
- Skor final seluruh juri menghasilkan hasil akhir yang identik dengan perhitungan manual menggunakan poin langsung.
- Portal publik menyajikan hasil sementara tanpa identitas dan hasil resmi dengan nama/sekolah hanya setelah pengesahan per cabang.
- Admin dapat membuat, memperbarui draft, menghasilkan PDF berita acara, serta memublikasikan hanya dokumen final.
- Alur utama berjalan di HP tanpa pengguliran horizontal pada formulir dan tanpa asumsi koneksi selalu stabil.

# B. KONTEKS EVENT DAN DASAR KEBIJAKAN

## B.1 Identitas event

[JUKNIS, hlm. 1–2] Event adalah Tarmudi Fest 2026, Sabtu, 24 Oktober 2026 di Kampus 2 MIS Tarbiyatul Mubtadiin. Terdapat tiga cabang: **Tahfidz, Mendongeng, Mewarnai**. Peserta adalah siswa TK B/RA/BA sederajat; satu peserta hanya mengikuti satu cabang. Untuk Tahfidz dan Mendongeng, delegasi sekolah maksimal dua peserta; Mewarnai tanpa batas delegasi yang disebutkan. Pendaftaran telah dilakukan melalui Google Form; verifikasi pendaftaran oleh panitia mendahului pelaksanaan.

## B.2 Ketentuan khusus yang harus dipertahankan

| Cabang | Ketentuan spesifik dari juknis | Implikasi aplikasi / operasional |
|---|---|---|
| Mendongeng | Tema nilai moral; durasi 5–7 menit; naskah cerita rangkap tiga diserahkan ketika daftar ulang; kriteria berbobot 25/25/20/15/15; juknis menyatakan tiga juri (hlm. 4–5). | Tanda penerimaan naskah dapat disediakan; nama/sekolah pada naskah yang diteruskan ke juri perlu disamarkan; skema awal memakai maksimal poin 25/25/20/15/15. |
| Tahfidz | Hafalan Al-Fatihah s.d. At-Takatsur; pemanggilan nomor; tiga maqra'; maksimal tampil lima menit; bila dipanggil tiga kali tanpa hadir, dipindah ke akhir; juknis menyatakan tiga juri; prioritas tie-break sesuai urutan empat kriteria (hlm. 6–7). | Penomoran berbeda dari urutan tampil bila peserta dipindah; field status pemanggilan opsional; prioritas tie-break wajib. |
| Mewarnai | Karya harus mandiri; memakai krayon; empat kriteria tanpa bobot tertulis; enam posisi juara (hlm. 3). | Karya diberi label nomor, tanpa sekolah; bobot 25/25/25/25 berasal dari keputusan panitia, bukan redaksi juknis. |

[JUKNIS, hlm. 2–3, 5, 7] Setiap cabang memiliki Juara I, II, III dan Harapan I, II, III. Juknis menetapkan keputusan dewan juri bersifat final. Sistem memberi dukungan penetapan hasil, bukan menggantikan kewenangan dewan juri.

## B.3 Addendum kebijakan yang harus disahkan secara administratif

- **Jumlah juri:** fitur mendukung 2–3 orang per cabang, sedangkan juknis Mendongeng dan Tahfidz menetapkan 3. Jika aktual 2 orang, panitia perlu membuat keputusan tertulis/addendum sebelum lomba.
- **Bobot Tahfidz:** 40/30/20/10 diputuskan saat perancangan; tidak terdapat persentasenya pada juknis asli.
- **Bobot Mewarnai:** 25/25/25/25 diputuskan saat perancangan; tidak terdapat persentasenya pada juknis asli.
- **Skala poin langsung 0–maksimum:** implementasi penilaian yang disepakati; tidak dirinci dalam juknis asli.
- **Musyawarah hasil seri:** Mendongeng dan Mewarnai menggunakan keputusan dewan juri; kriteria penyelesaiannya perlu dicatat dalam berita acara hasil.

# C. VISI PRODUK, PRINSIP, DAN BATAS LINGKUP

## C.1 Pernyataan produk

Satu aplikasi web Tarmudi Fest yang dapat digunakan oleh Admin, Petugas Registrasi, Juri, dan Publik untuk menuntaskan operasional tiga cabang dalam waktu bersamaan, berorientasi HP, menjaga penjurian anonim, dan memublikasikan hasil yang telah dihitung dan disahkan secara dapat diaudit, tanpa PHP dan tanpa kebutuhan membeli hosting/domain.

## C.2 Prinsip rancangan

1. **Integritas terlebih dahulu:** akses berbasis penugasan, pemisahan identitas dari skor, pencatatan audit, pengesahan hasil.
2. **Sederhana di lapangan:** petugas mencari nama/sekolah; juri mencari nomor; orang tua mencari nomor sebelum hasil resmi.
3. **Satu konfigurasi berlaku menyeluruh:** kriteria yang diterbitkan Admin menjadi dasar formulir, perhitungan, dan hasil; setiap hasil menunjuk versi konfigurasi.
4. **Mobile-first:** petugas, juri, dan orang tua diasumsikan dominan menggunakan smartphone.
5. **Gratis secara target:** memanfaatkan tier tanpa biaya, disertai pengujian kuota; tidak ada janji kapasitas tanpa batas.
6. **Tidak memaksakan teknis:** akun internal username/password adalah keputusan produk; keamanan autentikasi dan manajemen sesi pada kandidat GAS masih harus dibuktikan melalui AUTH-GATE. Jika gagal, usulkan alternatif tanpa biaya untuk disetujui, bukan menerapkan jalan pintas.

## C.3 Ruang lingkup wajib rilis operasional (P0)

- Pengaturan event/cabang dan role assignment.
- Impor peserta dari Excel/Google Sheets hasil Google Form serta validasi data.
- Registrasi ulang pada cabang yang ditugaskan, nomor start urut dan unik, status serta rekam jejak.
- Login username/password internal yang sudah diprovisikan (tanpa self-registration), hash password aman, sesi terikat identitas dan otorisasi server-side; 13 akun awal menurut DEC-AUTH-01.
- Konfigurasi kriteria, maksimal poin, urutan, versi skema, dan jumlah juri oleh Admin.
- Panel juri nomor-saja; draft, final, validasi poin, larangan melihat penilaian orang lain.
- Rekap dan klasemen otomatis bila semua juri wajib final; hasil sementara anonim.
- Pengesahan hasil per cabang; publikasi nama dan sekolah setelah disahkan.
- Catatan penyelesaian hasil seri, audit perubahan penting, ekspor rekap sebagai cadangan.

## C.4 Ruang lingkup penting tetapi boleh menyusul setelah P0 stabil (P1)

- Editor teks berita acara berbasis template, ekspor PDF, upload PDF yang ditandatangani, kontrol publikasi.
- Dashboard ringkas admin, filter lanjutan, laporan PDF terformat, paket arsip final.
- Penanganan catatan naskah Mendongeng, daftar panggilan Tahfidz, dan kemudahan administrasi lain.

**Catatan tata kelola:** berita acara tetap merupakan kebutuhan produk final. Status P1 hanya merupakan urutan implementasi darurat apabila waktu menuju 24 Oktober tidak cukup; sebelum acara berakhir harus tersedia setidaknya jalur upload PDF resmi melalui Admin.

## C.5 Di luar ruang lingkup V1.5

Pendaftaran online baru; pembayaran; pengiriman WhatsApp otomatis; sertifikat otomatis; SMS; aplikasi native Android/iOS; login Gmail/Google OAuth untuk operator/juri; foto/video peserta; penjurian jarak jauh; AI untuk menentukan skor; pergantian aturan diam-diam setelah penjurian; banyak domain; fitur multi-event tingkat lanjut. Ekstensi masa depan dapat dibahas melalui PRD versi baru.

# D. PEMANGKU KEPENTINGAN DAN PERAN

## D.1 Peran

| Peran | Tanggung jawab | Cakupan data |
|---|---|---|
| Admin | Impor, pengaturan, penugasan, validasi, audit, hasil, berita acara | Seluruh cabang; wajib diaudit |
| Petugas Registrasi | Mencari peserta, cek identitas, konfirmasi hadir, menetapkan nomor, mengelola catatan check-in | Peserta hanya pada cabang penugasan |
| Juri | Memilih nomor, memasukkan poin per kriteria, menyimpan draft, memfinalisasi penilaian | Nomor peserta dan skor diri pada cabang penugasan; **tanpa nama/sekolah** |
| Publik/Orang tua | Memantau progres dan hasil dengan nomor; setelah pengesahan membaca nama/sekolah dan berita acara resmi | Hanya data publik sesuai fase |

Akun yang mempunyai beberapa penugasan boleh berganti konteks hanya jika memang terdaftar; versi awal satu penugasan utama lebih diutamakan untuk mengurangi kesalahan. Admin tidak mengubah poin atas nama juri secara diam-diam.

## D.2 Matriks otorisasi inti

| Operasi | Admin | Petugas | Juri | Publik |
|---|---|---|---|---|
| Kelola data seluruh peserta | Ya | Tidak | Tidak | Tidak |
| Cari nama + sekolah per cabang | Ya | Hanya cabangnya | Tidak | Tidak saat penjurian |
| Konfirmasi check-in/nomor start | Ya, terkontrol | Hanya cabangnya | Tidak | Tidak |
| Kelola penugasan akun | Ya | Tidak | Tidak | Tidak |
| Edit/publish skema skor | Ya, sebelum lock | Tidak | Tidak | Tidak |
| Input skor | Tidak atas nama juri | Tidak | Skor diri/cabang | Tidak |
| Lihat skor juri lain selama lomba | Admin terotorisasi | Tidak | Tidak | Tidak |
| Mengesahkan hasil | Ya melalui prosedur | Tidak | Tidak | Tidak |
| Lihat nilai final sementara anonim | Ya | Sesuai kebutuhan | Tidak perlu | Ya |
| Lihat hasil resmi dengan identitas | Ya | Ya | Ya sesudah rilis | Ya sesudah rilis |
| Kelola berita acara | Ya | Tidak | Tidak | Tidak |

# E. ALUR BISNIS END-TO-END

1. **Persiapan:** Admin membuat event dan tiga cabang, mengimpor peserta terverifikasi, menetapkan pengguna dan penugasan, menentukan jumlah juri, memasukkan skema penilaian, memeriksa bobot maksimal total 100, dan mengaktifkan konfigurasi yang disahkan.
2. **Registrasi ulang:** Petugas masuk menggunakan username/password internal, otomatis berada di cabangnya, mencari nama atau sekolah, memverifikasi peserta, menekan konfirmasi; server menetapkan nomor start berikutnya; petugas menyerahkan kartu nomor fisik.
3. **Penjurian:** Juri masuk menggunakan username/password internal, langsung berada di panel cabangnya, mencari nomor, menginput poin sesuai maksimum, menyimpan draft/akhirnya final. Nama dan sekolah tidak ditransmisikan kepada akun juri.
4. **Klasemen sementara:** Setelah semua juri wajib memfinalisasi skor satu peserta, mesin rekap memperbarui snapshot publik nomor-only. Juri tidak boleh melihat skor juri lain dari aplikasi selama penilaian aktif.
5. **Penutupan cabang:** Admin memeriksa peserta, skor, kondisi tidak hadir, dan sengketa/nilai seri. Musyawarah direkam jika diperlukan. Hasil cabang diverifikasi dan disahkan.
6. **Publikasi resmi:** Setelah disahkan, halaman publik menampilkan nama, sekolah, nomor, skor akhir, posisi, serta berita acara ketika dokumen final diterbitkan.
7. **Arsip:** Data dan dokumen diekspor, dikunci, dan disalin ke lokasi cadangan terbatas.

# F. SPESIFIKASI FUNGSIONAL BERDASARKAN MODUL

## F.1 MOD-01 — Event, cabang, dan pengaturan (P0)

- **FR-001** Admin mengatur identitas event, penyelenggara, tanggal, tempat, dan status (persiapan/aktif/ditutup/diarsipkan).
- **FR-002** Cabang Mendongeng, Tahfidz, Mewarnai tersedia dan masing-masing mempunyai ID, kode, konfigurasi, urutan nomor, dan status independen.
- **FR-003** Jumlah juri wajib ditetapkan 2 atau 3 sebelum penjurian dibuka; perubahan berikutnya memerlukan tindakan korektif yang diotorisasi.
- **FR-004** Admin mengatur pengumuman, status publikasi, dan identitas visual dasar.
- **FR-005** Sistem menyimpan timezone `Asia/Jakarta` dan timestamp yang dapat diaudit.

**Kriteria penerimaan:** satu cabang dapat diaktifkan/ditutup tanpa mengubah status cabang lain; tidak dapat membuka penjurian dengan skema invalid atau jumlah juri tidak terpenuhi.

## F.2 MOD-02 — Impor dan administrasi peserta (P0)

- **FR-010** Admin dapat mengimpor `.xlsx` atau memilih data tab Google Sheets hasil Google Form tanpa menghapus sumber aslinya.
- **FR-011** Impor memiliki tahap pratinjau: pemetaan kolom, validasi baris, ringkasan error, jumlah valid/ditolak, dan konfirmasi eksplisit.
- **FR-012** Minimal identitas operasional: `participant_id` internal, `full_name`, `school_id`/`school_name`, `competition_id`, status verifikasi; `source_row_id` bila tersedia.
- **FR-013** Penulisan sekolah dinormalisasi pada master sekolah tanpa menggabungkan peserta hanya karena nama sama.
- **FR-014** Sistem memeriksa satu peserta hanya satu cabang dan batas delegasi sekolah untuk Mendongeng/Tahfidz; pengecualian muncul di laporan Admin dan perlu keputusan manusia.
- **FR-015** Hanya peserta terverifikasi yang dapat melakukan registrasi ulang normal; pengecualian butuh persetujuan dan audit Admin.
- **FR-016** Impor ulang bersifat terkontrol (*upsert* menurut ID sumber yang stabil) dan tidak menghapus nomor start/nilai yang sudah terbentuk.

**Kriteria penerimaan:** contoh dua peserta bernama sama dari sekolah berbeda tetap menjadi dua entitas; impor ulang berkas yang sama tidak menduplikasi entitas; semua error terlihat sebelum commit.

## F.3 MOD-03 — Registrasi ulang dan penomoran (P0)

- **FR-020** Setelah login, petugas langsung melihat hanya cabang penugasan; tidak ada pemilihan cabang bebas.
- **FR-021** Cari nama dan sekolah; hasil mencantumkan status verifikasi, status check-in, nomor bila sudah ada.
- **FR-022** Tekan `Konfirmasi dan Tetapkan Nomor` sekali untuk menandai hadir sekaligus meminta nomor berikutnya dari server.
- **FR-023** Nomor `start_no` merupakan bilangan urut unik per pasangan `event_id + competition_id`; format display tiga digit dianjurkan (`001` dst.) dengan pengaturan tampilan.
- **FR-024** Penetapan nomor harus atomik/idempoten: pengulangan permintaan menghasilkan nomor yang sudah dimiliki; tidak pernah memesan nomor kedua.
- **FR-025** Dua petugas serentak tidak boleh memperoleh nomor start sama; gunakan lock yang benar, validasi ulang di dalam lock, dan commit secara utuh.
- **FR-026** Nomor yang sudah dibagikan tidak dipakai ulang; pembatalan/ketidakhadiran menciptakan status, bukan penomoran ulang.
- **FR-027** ID Card fisik disiapkan panitia; sistem **tidak wajib** mencetak ID Card. Tampilan nomor konfirmasi harus besar dan tidak ambigu.
- **FR-028** Catatan operasional opsional: penerimaan naskah Mendongeng dan pemindahan urutan tampil Tahfidz setelah tiga panggilan. `start_no` tidak berubah ketika `performance_order` berubah.

**Kriteria penerimaan:** uji 20 permintaan berdekatan menghasilkan 20 nomor unik; dua kali klik peserta yang sama tetap satu nomor; akun petugas cabang A ditolak saat meminta peserta cabang B.


## F.4 MOD-04 — Manajemen identitas dan penugasan (P0)

- **FR-030** Sistem menyediakan **13 akun awal** secara aman saat inisialisasi: 1 Admin (`admin`), 3 Petugas Registrasi (`reg-mdg`, `reg-thf`, `reg-mwn`), dan 9 Juri (`juri-mdg-01..03`, `juri-thf-01..03`, `juri-mwn-01..03`). Ini adalah **nama pengguna dan rancangan provisioning**, bukan bukti akun/password telah dibuat. Tidak ada *self-registration*.
- **FR-031** Login internal menggunakan username dan password; keduanya diperiksa di sisi server. Username bukan bukti identitas tanpa verifikasi password. Akun dan password **tidak** dibagikan melalui repo publik atau kode frontend.
- **FR-032** Setiap pengguna memiliki password awal yang **unik**, dihasilkan memakai sumber entropi kriptografis yang memadai dan disampaikan melalui kanal privat; tidak boleh ada password default bersama/hard-coded, plaintext tersimpan, maupun kredensial di GitHub. Admin memerlukan mekanisme bootstrap sekali pakai yang terbukti aman dan rotasi password awal saat login pertama.
- **FR-033** Password disimpan sebagai *salted adaptive password hash* dengan parameter dan pustaka kriptografi yang teruji serta didukung lingkungan eksekusi (Argon2id bila didukung, atau alternatif setara yang dinilai layak seperti PBKDF2-HMAC-SHA-256 dengan iterasi terkalibrasi). Hash SHA-256 tunggal, encoding Base64, atau obfuscation **bukan** proteksi password. Kelayakan implementasi pada GAS harus dibuktikan di STEP 01; tidak ada pemaksaan pustaka tak teruji.
- **FR-034** Setiap tindakan berhak istimewa memverifikasi sesi server-side, status akun, peran, dan `competition_id`; Admin dapat menonaktifkan akun, mengganti penugasan, mereset kredensial, serta mencabut sesi. Juri tidak memperoleh akses ke skor juri lain atau identitas peserta.
- **FR-035** Username tidak ada, password salah, akun nonaktif, atau sesi tidak sah menghasilkan pesan kegagalan generik yang tidak membocorkan identitas pengguna atau apakah akun terdaftar.
- **FR-036** Sesi memiliki token atau identitas sesi yang dihasilkan secara kriptografis, dibatasi masa berlaku, dapat dicabut, dan tidak dapat dipalsukan/diulang. Penyimpanan sesi, mitigasi CSRF dan XSS, serta transmisi HTTPS harus didesain sesuai kemampuan deployment yang **benar-benar teruji**; jangan menganggap GAS otomatis mendukung cookie `HttpOnly` yang dapat diatur aplikasi.
- **FR-037** Percobaan login gagal dibatasi dan diaudit tanpa menulis password/token; mitigasi *credential stuffing*, penebakan, dan brute-force tidak boleh hanya berupa penundaan di UI.
- **FR-038** Akun seed pertama: satu Admin; tiga Petugas di masing-masing cabang; sembilan Juri dibagi tiga per cabang. Jumlah juri *wajib* yang aktif untuk penilaian dapat menjadi 2–3 per cabang dan dikunci sebelum penjurian; akun cadangan yang tidak ditugaskan harus dinonaktifkan/dibatasi dan tidak dihitung dalam perataan.
- **FR-039** Akun pemilik Google Apps Script, Sheets dan Drive **tetap akun Google pribadi pemilik proyek** untuk operasional backend; identitas ini terpisah dari login internal Admin/Petugas/Juri. Berkas sumber Sheets/Drive tidak dibagi kepada juri atau publik. Portal publik tetap tanpa login.

**Kriteria penerimaan:** masing-masing akun awal memiliki role/branch yang tepat; password salah/nonaktif ditolak secara generik; rahasia tidak muncul pada repo/browser/log; sesi bisa berakhir dan dicabut; lintas cabang ditolak server; juri tidak dapat membuka Sheets langsung; pengujian keamanan platform lolos AUTH-GATE. **13 akun adalah kebutuhan provisioning, bukan akun aktif saat PRD ditulis.**

## F.5 MOD-05 — Skema kriteria dinamis (P0)

- **FR-040** Admin membuat, mengubah, mengurutkan, menonaktifkan kriteria saat status skema DRAFT.
- **FR-041** Masing-masing kriteria memiliki `criterion_id`, nama, deskripsi/rubrik opsional, urutan, `max_points`, format integer, batas minimum 0.
- **FR-042** Total `max_points` dalam skema wajib tepat 100 sebelum diterbitkan.
- **FR-043** Skema awal Mendongeng 25/25/20/15/15; Tahfidz 40/30/20/10; Mewarnai 25/25/25/25.
- **FR-044** Skema diterbitkan sebagai versi tidak dapat diedit langsung; panel juri dan mesin rekap memakai `scheme_version_id` sama.
- **FR-045** Ketika sesi penjurian telah dibuka, penyuntingan skema aktif dilarang. Revisi resmi membutuhkan versi baru, persetujuan, prosedur migrasi/pengulangan penilaian bila perlu, dan audit.
- **FR-046** Admin dapat mengatur metode nilai seri per cabang: prioritas kriteria untuk Tahfidz; musyawarah dewan juri untuk Mendongeng/Mewarnai.

**Kriteria penerimaan:** skema total 99 atau 101 tidak bisa dipublikasi; perubahan draft tidak memengaruhi skor atau klasemen aktif; skema terdahulu tetap dapat diaudit.

## F.6 MOD-06 — Panel juri blind judging (P0)

- **FR-050** Juri hanya mengakses nomor start pada cabangnya; endpoint penilaian **tidak mengirim** nama, sekolah, file identitas, atau atribut sumber lain.
- **FR-051** Kolom input numerik per kriteria, validasi integer 0 sampai `max_points` secara real-time dan ulang di server.
- **FR-052** Nilai total juri = **jumlah poin mentah seluruh kriteria**; tidak ada perkalian bobot lagi.
- **FR-053** Juri dapat menyimpan DRAFT yang dapat dilanjutkan dan memfinalisasi saat semua kriteria lengkap.
- **FR-054** Setelah FINAL, skor terkunci dan tidak dapat diedit biasa. Koreksi melalui workflow permintaan buka kembali, alasan, audit, dan penghitungan ulang.
- **FR-055** Juri tidak dapat melihat nilai juri lain selama sesi penilaian; halaman juri tidak menyediakan pencarian nama/sekolah.
- **FR-056** Satu penilaian unik per `event + competition + participant + judge + scheme_version`; cegah finalisasi ganda dan tulis parsial.
- **FR-057** Bila koneksi gagal, aplikasi menampilkan kegagalan dengan jujur; status berhasil hanya setelah respons server. Draft lokal sementara, jika dipakai, tidak boleh dianggap sebagai data server.
- **FR-058** Nomor yang belum check-in tidak bisa dinilai normal, kecuali jalur pengecualian Admin terdokumentasi.

**Kriteria penerimaan:** memasukkan 41 pada kriteria maksimal 40 ditolak; input 35+27+18+8 menghasilkan 88; respons data juri tidak memuat informasi nama/sekolah.

## F.7 MOD-07 — Perhitungan, nilai seri, dan hasil (P0)

- **FR-060** Total per juri `Tj = Σ poin_k` (0–100). Nilai peserta `Final = (Σ Tj)/n_wajib` hanya jika semua `n_wajib` juri berstatus FINAL.
- **FR-061** Perhitungan peringkat menggunakan presisi penuh (pembilang dan penyebut bila diperlukan), bukan angka display dua desimal.
- **FR-062** Ketika tie Tahfidz terjadi, bandingkan rata-rata poin Kelancaran, lalu Tajwid, Fashohah/Makhroj, dan Irama sesuai juknis; jika semua identik, penanganan melalui keputusan dewan juri yang tercatat.
- **FR-063** Tie Mendongeng/Mewarnai pada posisi yang membutuhkan keputusan juara memunculkan status `PERLU_MUSYAWARAH`; admin mencatat keputusan, alasan, bukti/berita acara, dan pengesah; aplikasi tidak memilih juara otomatis secara arbitrer.
- **FR-064** Penetapan enam posisi juara per cabang dilakukan setelah pemeriksaan hasil dan keputusan seri; posisi boleh kosong jika kebijakan panitia memerlukannya, tetapi harus beralasan.
- **FR-065** Koreksi skor yang sah menandai hasil/snapshot lama kedaluwarsa; snapshot baru diterbitkan setelah dihitung ulang secara konsisten.
- **FR-066** Juri aktif tidak diberi akses dashboard peringkat internal yang dapat memengaruhi independensi penjurian, kecuali kebijakan tertulis panitia mengubahnya.

**Kriteria penerimaan:** 2 dari 3 juri FINAL tidak menghasilkan peringkat publik peserta; jumlah 88+91+85 / 3 menghasilkan 88.00; tie sesuai urutan prioritas dan tidak salah karena pembulatan.

## F.8 MOD-08 — Portal publik dua fase (P0)

- **FR-070** Portal dapat dibuka tanpa login dan memiliki halaman per cabang, pencarian nomor, indikator pembaruan, dan status sementara/resmi.
- **FR-071** Saat penjurian berlangsung, seluruh data publik untuk hasil sementara menggunakan **nomor peserta**, skor akhir, dan peringkat sementara; tidak ada nama atau sekolah di payload, HTML, metadata, unduhan, cache, atau tautan publik.
- **FR-072** Peserta hanya muncul bila semua juri wajib memfinalisasi skor sesuai versi skema yang aktif.
- **FR-073** Saat Admin menutup dan mengesahkan hasil satu cabang, sistem mengubah fase publikasi cabang tersebut menjadi RESMI sehingga nama dan sekolah dapat dirilis untuk cabang itu saja.
- **FR-074** Data resmi minimal: nomor start, nama peserta, asal sekolah, nilai akhir, peringkat/gelar, status pengesahan; tidak menampilkan telepon, alamat, tanggal lahir lengkap, bukti sekolah, atau identitas wali.
- **FR-075** Tampilkan waktu pembaruan terakhir dan label penjelas bahwa peringkat sementara bisa berubah.
- **FR-076** Publikasi harus memakai snapshot hasil publik aman; cache harus dipisahkan menurut cabang, versi, dan fase agar identitas tidak bocor sebelum rilis.
- **FR-077** Berkas/foto/dokumen pendaftaran tetap privat; tautan dokumen resmi hanya muncul setelah rilis Admin.

**Kriteria penerimaan:** sebelum pengesahan tidak ada cara publik mengambil nama+nomor lewat API, source halaman, respons cache, download, atau URL file; sesudah pengesahan identitas tampil hanya cabang yang disahkan.

## F.9 MOD-09 — Berita acara dan dokumen resmi (P1, ada jalur minimum wajib)

- **FR-080** Admin dapat membuka satu berita acara per cabang dengan template berisi event, tempat, tanggal, juri, jumlah peserta, sistem penilaian, daftar enam juara, dan klausul pengesahan.
- **FR-081** Admin dapat mengedit narasi dan menyimpan DRAFT; otomatisasi data tidak boleh mencantumkan hasil yang belum disahkan sebagai hasil resmi.
- **FR-082** Template dapat diekspor melalui Google Docs menjadi PDF; sebagai alternatif minimum Admin dapat mengunggah PDF hasil tanda tangan manual.
- **FR-083** Upload PDF final melalui validasi file/ukuran/otorisasi, rekam versi, dan kontrol penerbitan eksplisit.
- **FR-084** PDF resmi yang telah diterbitkan terlihat publik; versi draft, file kerja, tanda tangan digital belum sah, atau sumber privat tidak terbuka publik.
- **FR-085** Penggantian dokumen resmi menuntut alasan, versi baru, waktu, dan log audit.

**Kriteria penerimaan:** publik hanya melihat PDF yang berstatus `PUBLISHED`; hasil enam juara dalam berita acara cocok dengan hasil resmi terbit.

## F.10 MOD-10 — Audit, backup, dan administrasi kesalahan (P0 minimum)

- **FR-090** Tindakan penting dicatat: impor, revisi data identitas, check-in, alokasi nomor, perubahan peran, penerbitan skema, draft/final/koreksi nilai, keputusan seri, pengesahan hasil, publikasi dokumen.
- **FR-091** Log merekam siapa, kapan, jenis tindakan, ID entitas, perubahan status, alasan untuk tindakan sensitif; log tidak memuat token atau rahasia.
- **FR-092** Ekspor data peserta, check-in, skor per juri, rekap hasil, dan log dapat dilakukan Admin ke penyimpanan privat.
- **FR-093** Tersedia prosedur manual saat jaringan Google terganggu, dan langkah rekonsiliasi yang hanya boleh dilakukan Admin setelah sistem pulih.
- **FR-094** Admin dapat menutup dan mengarsipkan event tanpa menghapus skor historis.

# G. ATURAN MATEMATIS DAN PERINGKAT

## G.1 Input poin langsung

Untuk kriteria `k`, bilangan bulat `s_k` harus memenuhi `0 ≤ s_k ≤ M_k`, dengan `M_k` berupa poin maksimal kriteria tersebut. Konfigurasi harus memenuhi `Σ M_k = 100`. Skor setiap juri `T_j = Σ s_k` sehingga `0 ≤ T_j ≤ 100`.

## G.2 Rata-rata antardewan juri

Bila terdapat `n` juri wajib dan semua telah final, `NilaiAkhir = (T_1 + ... + T_n)/n`. Nilai disimpan dengan presisi cukup; disajikan dua angka desimal di UI. Pengurutan dan tie menggunakan nilai eksak sebelum pembulatan tampilan.

## G.3 Contoh Tahfidz

Kelancaran 35/40; Tajwid 27/30; Fashohah 18/20; Irama 8/10 menghasilkan **88/100** untuk seorang juri. Jika tiga juri memberi total 88, 91, 85, skor akhir = 88.00.

## G.4 Kriteria seri

1. Periksa kesamaan rata-rata nilai akhir secara eksak.
2. Tahfidz: bandingkan rata-rata poin mentah per kriteria menurut prioritas juknis. Jika seluruhnya seri, minta keputusan formal dewan juri.
3. Mendongeng/Mewarnai: tampilkan indikator seri pada posisi juara; Admin mencatat hasil musyawarah berikut dasar/otorisasi serta lampiran bila diperlukan.
4. Hasil belum dapat disahkan bila masih ada sengketa/seri yang berdampak pada enam posisi penghargaan.

# H. DESAIN DATA DAN INTEGRITAS

## H.1 Struktur penyimpanan konseptual

| Tabel/Sheet | Field inti (minimum) | Batasan penting |
|---|---|---|
| `events` | id, title, organizer, date, venue, status | id unik |
| `competitions` | id, event_id, code, name, required_judges, status, phase | unik (event, code) |
| `schools` | id, normalized_name, display_name | tidak menggunakan nama mentah sebagai kunci permanen |
| `participants` | id, external_source_id, full_name, school_id, competition_id, verification_status | ID peserta stabil; privat |
| `registrations` | id, participant_id, competition_id, start_no, attended_at, operator_id, status | unik (event, competition, start_no); unik participant per event |
| `users` | id, username, display_name, active, password_hash, password_salt, password_algorithm, password_params, must_rotate, last_login_at | username unik; hash+salt aman; tanpa password plaintext |
| `auth_sessions` | id, user_id, token_verifier_hash, issued_at, expires_at, revoked_at, last_seen_at | identitas sesi tak dapat ditebak; diverifikasi & bisa dicabut |
| `login_attempts` | id, login_identifier_digest, time_bucket, outcome, source_risk_tag | pembatasan brute force tanpa password/token atau IP mentah tak perlu |
| `role_assignments` | id, user_id, role, competition_id, active | evaluasi server-side |
| `scoring_schemes` | id, competition_id, status, active_version_id | satu versi aktif per cabang |
| `scoring_scheme_versions` | id, scheme_id, version, sum_max, activated_at, locked_at | tidak berubah setelah aktif |
| `scoring_criteria` | id, version_id, name, order_no, max_points, tie_priority | kriteria stabil per versi |
| `score_headers` | id, participant_id, judge_id, version_id, status, finalized_at | unik kombinasi penilaian |
| `score_details` | id, score_header_id, criterion_id, points | 0..max integer |
| `results` | id, participant_id, version_id, completed_judge_count, exact_score, rank, status | hasil konsisten versi |
| `tie_resolutions` | id, competition_id, involved_participants, decision, reasons, approved_by, approved_at | wajib jejak keputusan |
| `publication_snapshots` | id, competition_id, phase, version, payload_ref, published_at | publik aman per fase |
| `minutes` | id, competition_id, revision, body_ref, pdf_ref, status, published_at | PDF hanya PUBLISHED |
| `audit_logs` | id, actor_id, action, entity_type, entity_id, timestamp, before_after_ref | append-only konseptual |

`Audit_logs` berbasis Sheets tidak berarti *tamper-proof*. Pemilik atau editor langsung spreadsheet masih dapat mengubah data; minimalkan editor data mentah, lakukan backup/ekspor berkala, dan jangan menjanjikan keamanan setara database transaksional.

## H.2 Prinsip pemisahan identitas

- Data identitas berada pada master peserta; tabel skor hanya menyimpan referensi ID internal.
- Juri hanya menerima *projection* aman `{start_no, competition_label, scoring_criteria, own_scores, status}`.
- Nama dan sekolah tidak berada di respons juri, metadata HTML, log frontend juri, cache juri, maupun berkas publik sebelum rilis.
- Portal publik menggunakan dua bentuk snapshot berbeda: `ANONYMOUS` dan `OFFICIAL`; keputusan pindah fase memerlukan pengesahan Admin.

## H.3 Transaksi kritis di Google Sheets

Google Sheets bukan database dengan constraint SQL dan transaksi ACID penuh. Aplikasi harus menjaga konsistensi secara eksplisit dengan validasi, penguncian eksekusi, ID permintaan idempoten, penulisan kelompok data yang terkontrol, dan rekonsiliasi kesalahan parsial. `LockService.getScriptLock()` merupakan kandidat untuk alokasi nomor dan operasi bersama, bukan jaminan otomatis seluruh operasi menjadi transaksional.

# I. ARSITEKTUR TEKNIS DAN KEPUTUSAN GO/NO-GO

## I.1 Kandidat utama

- **Frontend:** HTML/CSS/JavaScript pada web app; pola mobile-first, elemen Neo-Brutalism yang ringan.
- **Server aplikasi:** Google Apps Script untuk administrasi, otorisasi, penomoran, penilaian, perhitungan, publikasi, audit.
- **Data:** Google Sheets sebagai penyimpanan terstruktur berbasis tab.
- **Dokumen:** Google Drive privat dan Google Docs untuk template berita acara, ekspor PDF untuk rilis.
- **Identitas internal:** 13 akun awal username/password yang diprovisikan aman, role/cabang server-side; Gmail pemilik proyek digunakan hanya untuk kepemilikan platform Google.
- **Alamat:** URL deployment gratis platform; tanpa membeli domain sendiri.


## I.2 Risiko autentikasi internal dan AUTH-GATE wajib

Keputusan login internal **tidak** menghilangkan risiko GAS. Sebagai *execute-as-owner* web app, seluruh operasi baca/tulis pada Sheets dan Drive berpotensi berjalan dengan izin pemilik. Karena itu, pemisahan peran harus teruji di server pada **setiap** operasi, dan API publik harus hanya menyajikan proyeksi yang aman.

**Prinsip teknis yang wajib dibuktikan (belum merupakan implementasi):**

1. **Provisioning** — generator kredensial unik yang aman untuk 13 username seed; distribusi privat; bootstrap Admin sekali pakai; rotasi saat login pertama; pengamanan prosedur pemulihan ketika Admin lupa password.
2. **Password hashing** — adaptif dan salted dengan pustaka/primitive teruji serta parameter yang tidak membebani kuota GAS berlebihan. Argon2id menjadi preferensi bila benar-benar tersedia; alternatif PBKDF2-HMAC-SHA-256 harus dievaluasi secara teknis, tidak diadopsi asal-asalan. Tidak boleh menyimpan password plaintext, mengenkripsi reversibel sebagai satu-satunya perlindungan, atau memakai SHA-256 tunggal.
3. **Manajemen sesi** — token acak kriptografis, terikat pengguna, TTL dan rotasi/revokasi, logout, kontrol penyimpanan aman di browser, anti-CSRF sesuai model autentikasi dan proteksi XSS. GAS HTML Service/iframe dan batas kontrol header/cookie perlu diuji. `Utilities.getUuid()` saja tidak diasumsikan memenuhi kebutuhan token kriptografis.
4. **Otorisasi** — role/cabang diambil dari state server, bukan dari parameter/claim yang dapat diubah browser; setiap action dibatasi. Juri dan publik tidak memperoleh akses file Sheets/Drive.
5. **Perlindungan penyalahgunaan** — rate limit/lockout proporsional dan audit minimal atas login gagal, logout, reset password; tanpa pengungkapan keberadaan username dan tanpa mencatat password/token.
6. **Publik terpisah** — pengguna anonim hanya boleh membaca *snapshot* nomor-only saat penjurian dan hasil resmi setelah disahkan. Semua operasi tulis harus menolak akses anonim.
7. **Perangkat lapangan** — uji login/logout dan sesi pada minimal dua HP/browser serta akses serentak tanpa menyimpan kredensial bersama.

**Gerbang AUTH-GATE (HARUS PASS sebelum membangun modul bisnis):**

- Pengujian 13 akun awal menggunakan data fiktif: 1 Admin, 3 Petugas, 9 Juri; login yang sah dialihkan sesuai cabang.
- Password salah, username tidak terdaftar, akun nonaktif, force logout, sesi kedaluwarsa, ganti password, token palsu, dan *replay* ditolak dengan benar.
- Proteksi brute-force dan penyimpanan hash benar-benar berfungsi pada stack yang dipilih; tes XSS/CSRF sesuai ancaman tersedia.
- Petugas cabang lain ditolak saat mengakses data, juri tidak dapat membaca data identitas maupun skor juri lain, sumber Sheets tetap privat.
- Tidak ada kredensial maupun token autentikasi di repository publik, payload yang tak semestinya, berkas log, atau URL.
- Browser HP mampu menggunakan alur lengkap tanpa membagikan akses Google produksi.

**Jika GAS murni tidak mampu mencapai autentikasi yang aman dalam batas gratis/kuota:** tetapkan **NO-GO**, dokumentasikan bukti, dan ajukan arsitektur alternatif gratis untuk persetujuan pemilik. Jangan menyiasatinya dengan password default bersama, login berbasis URL rahasia, validasi password di JavaScript klien, atau penyimpanan session token jangka panjang secara tidak aman. Perubahan deployment tetap memerlukan keputusan eksplisit.

## I.3 Deployment dan pemisahan publik–internal

Desain logis satu sistem dengan data sentral dan dua permukaan akses: INTERNAL (login + role) dan PUBLIK (anonim + proyeksi aman). Pemisahan deployment atau endpoint disesuaikan hasil AUTH-GATE. Rute `/admin`, `/juri`, `/registrasi`, `/hasil/...` di dokumen ini adalah rute produk konseptual, bukan janji URL path literal di hosting Apps Script.

## I.4 Batasan platform dan performa

Google Apps Script mempunyai batas durasi eksekusi dan kuota, dapat berubah sewaktu-waktu. Per desain, gunakan batch reads/writes, cache snapshot publik, hindari query seluruh Sheets setiap refresh, dan batasi frekuensi pembaruan. Portal ditargetkan menyegarkan secara berkala (awal 30–60 detik, disesuaikan uji beban), bukan koneksi WebSocket permanen. Uji akses serentak mencakup jumlah petugas/juri aktual dan beban publik realistis; tidak ada klaim bebas biaya tanpa batas.

# J. STATUS DAN TRANSISI

## J.1 Status cabang

`DRAFT → READY → JUDGING_OPEN → REVIEW → OFFICIAL → ARCHIVED`.

- READY: data/skema/juri tervalidasi, belum ada penilaian.
- JUDGING_OPEN: konfigurasi aktif terkunci, juri menilai, hasil sementara nomor-only.
- REVIEW: input tertutup, Admin memeriksa hasil lengkap, sengketa, dan berita acara.
- OFFICIAL: hasil disahkan, nama/sekolah boleh dipublikasikan.
- ARCHIVED: tidak ada penulisan skor biasa; arsip dibuat.

Transisi balik dari OFFICIAL menuju REVIEW merupakan koreksi luar biasa dengan alasan dan versi publikasi baru, bukan edit normal.

## J.2 Status peserta

`IMPORTED → VERIFIED → CHECKED_IN` atau `ABSENT/WITHDRAWN`. Status keikutsertaan dan urutan tampil terpisah dari nomor start; peserta Tahfidz yang dipindah ke akhir tidak berganti nomor ID Card.

## J.3 Status penilaian

`NOT_STARTED → DRAFT → FINAL`; koreksi khusus `FINAL → REOPEN_REQUESTED → DRAFT_REOPENED → FINAL_REVISED`. Semua perubahan final harus tercatat; status INVALID/VOID hanya lewat prosedur Admin yang disetujui.

## J.4 Status publikasi dan berita acara

`ANONYMOUS_LIVE → OFFICIAL_RELEASED` untuk hasil. Berita acara: `DRAFT → PDF_PREPARED → SIGNED_UPLOADED → PUBLISHED`, dengan revisi terkontrol.

# K. UI/UX MOBILE-FIRST — NEO-BRUTALISM

## K.1 Identitas visual

- Gaya: Neo-Brutalism fungsional, kontur jelas, garis tebal sekitar 2 px, blok warna solid, bayangan keras seperlunya, tanpa animasi yang mengganggu input.
- Palet **usulan** sampai logo resmi disediakan: krem `#FFF8E8`, kuning `#F9CF45`, hijau lime `#D5F18A`, gelap `#202020`. Palet bukan keputusan identitas final sebelum audit branding.
- Tipografi: keluarga sans-serif dengan keterbacaan tinggi; tidak mengandalkan satu font berbayar.
- Aksesibilitas: kontras minimum yang layak, navigasi keyboard, teks status selain warna, fokus jelas, `prefers-reduced-motion`, target sentuh minimal 44×44 px.

## K.2 Breakpoint prioritas dan pola

Prioritaskan lebar 360, 375, 390, 430 px; lalu tablet 768 px dan desktop. Petugas/juri menggunakan layout satu kolom. Admin boleh memakai tabel desktop yang dipadatkan namun fitur kritis tetap bisa diakses HP. Hindari scroll horizontal pada formulir penilaian; nilai input memunculkan keypad numerik.

## K.3 Inventaris layar minimum

| ID | Layar | Komponen inti | Peran |
|---|---|---|---|
| UX-01 | Publik / beranda | Branding, status tiga cabang, navigasi hasil | Publik |
| UX-02 | Hasil per cabang (sementara) | Pencarian nomor, peringkat nomor-only, status update | Publik |
| UX-03 | Hasil resmi | Nama, sekolah, nomor, peringkat, PDF berita acara | Publik |
| UX-04 | Login internal | Username, password tertutup, status gagal generik, ganti password awal, logout | Internal |
| UX-05 | Dashboard petugas | Nama cabang terkunci, jumlah hadir, nomor berikutnya | Petugas |
| UX-06 | Cari dan konfirmasi peserta | Pencarian nama+sekolah, identitas, satu tombol konfirmasi | Petugas |
| UX-07 | Dashboard juri | Cabang terkunci, cari nomor, jumlah selesai | Juri |
| UX-08 | Formulir poin langsung | Nomor besar, kriteria, maksimum poin, input integer, draft/final | Juri |
| UX-09 | Admin / peserta dan impor | Upload, pemetaan, validasi, preview, commit | Admin |
| UX-10 | Admin / akun dan penugasan | Username, peran, cabang, status aktif, reset/revoke tanpa menampilkan password | Admin |
| UX-11 | Admin / skema | CRUD kriteria, maks poin, total 100, publish/lock | Admin |
| UX-12 | Admin / hasil dan tie | Kelengkapan, skor, audit, keputusan seri, pengesahan | Admin |
| UX-13 | Admin / berita acara | Editor, PDF, unggah, publish, histori revisi | Admin |
| UX-14 | Admin / audit & ekspor | Filter log, ekspor cadangan, status event | Admin |

## K.4 Copy dan pola interaksi yang harus konsisten

- Tindakan registrasi: **Konfirmasi & Tetapkan Nomor**, lalu notifikasi `Nomor 027 berhasil ditetapkan`.
- Tindakan juri: **Simpan Draft** dan **Periksa & Finalisasi**; finalisasi menampilkan ringkasan seluruh poin dan peringatan skor terkunci.
- Sumber kesalahan: `Nilai melebihi maksimal 40 poin`, `Nomor peserta tidak ditemukan`, `Peserta belum registrasi ulang`, `Akses cabang tidak diizinkan`, `Gagal menyimpan, coba lagi`.
- Portal: `HASIL SEMENTARA — NOMOR SAJA` versus `HASIL RESMI — TELAH DISAHKAN`.
- Indikator jaringan: loading, berhasil, gagal, dan `Terakhir diperbarui ...`.

# L. PRIVASI, KEAMANAN, DAN INTEGRITAS LAPANGAN

## L.1 Penjurian anonim secara operasional

- Juri tidak memperoleh nama dan sekolah melalui aplikasi, dokumen penilaian, atau data unduhan internal.
- Nomor peserta tampil pada ID Card; nama/sekolah tidak dicetak pada sisi kartu yang terlihat juri.
- Pengumuman di arena sebaiknya menggunakan nomor, bukan menyebut sekolah. Karya Mewarnai memakai label nomor saja. Naskah Mendongeng yang diserahkan kepada juri sebaiknya dibersihkan dari identitas lembaga.
- Anonimitas tidak dapat dijamin mutlak pada lomba luring jika juri secara pribadi mengenali peserta; panitia perlu pernyataan konflik kepentingan dan prosedur penanganannya.

## L.2 Privasi data anak

Karena peserta TK/RA tergolong anak, data pribadi diproses secara minimum. Publikasi identitas memerlukan dasar pemberitahuan/persetujuan wali yang layak sesuai kebijakan dan ketentuan hukum berlaku. Sebelum pengesahan, nomor saja; sesudah pengesahan, maksimal nama, sekolah, nomor, nilai, dan peringkat. Tidak memublikasikan surat aktif sekolah, kontak orang tua, alamat, tanggal lahir lengkap, atau bukti administrasi.

Bila persetujuan rilis identitas belum dipastikan, Admin harus memiliki kemampuan menahan identitas peserta terkait dari publikasi, disertai tindak lanjut oleh panitia; jangan mengabaikan hak privasi semata-mata untuk memenuhi jadwal publikasi.

## L.3 Kontrol keamanan

- Validasi username/password memakai hash adaptif dan salted; sesi serta otorisasi diverifikasi server untuk setiap tindakan.
- Tolak akses langsung ke Sheets/Drive bagi akun juri dan publik.
- Rahasia token/konfigurasi tidak dikirim ke browser atau disimpan di tabel yang dapat diakses petugas.
- Mitigasi penebakan/penyalahgunaan endpoint, pembatasan akses berulang, pengurangan data pada log.
- Audit append-only konseptual dan backup privat berkala.
- Keluaran HTML/teks pengguna disanitasi untuk mencegah injeksi konten.
- Buat instruksi pelaporan kesalahan skor, konflik kepentingan, dan koreksi yang dapat diaudit.

# M. NON-FUNCTIONAL REQUIREMENTS (NFR)

| ID | Aspek | Syarat ukur atau pengujian |
|---|---|---|
| NFR-01 | Mobile | Seluruh alur P0 terbaca pada 360 px, tanpa horizontal scroll pada form |
| NFR-02 | Usability | Registrasi normal: cari → periksa → konfirmasi; juri: nomor → skor → final |
| NFR-03 | Aksesibilitas | Target sentuh ≥44×44 px; kontrol memiliki label dan indikator fokus |
| NFR-04 | Integritas nomor | Tidak ada nomor ganda per cabang saat uji concurrent; retry idempoten |
| NFR-05 | Integritas skor | Nilai di luar 0..max dan skor belum lengkap ditolak finalisasi |
| NFR-06 | Konsistensi hasil | Hasil cocok dengan perhitungan manual contoh dan uji properti |
| NFR-07 | Privasi | Nol field nama/sekolah pada respons juri; nol identitas pada hasil sementara |
| NFR-08 | Ketahanan jaringan | UI membedakan pending/success/failure; retry tanpa duplikasi |
| NFR-09 | Kinerja | Pengukuran nyata pada HP dan koneksi event; target diatur sesudah baseline test |
| NFR-10 | Kuota | Tidak melebihi kuota GAS pada skenario puncak teruji; strategi fallback |
| NFR-11 | Audit | Tindakan sensitif dapat ditelusuri ke aktor, waktu, dan alasan |
| NFR-12 | Cadangan | Ekspor data dan latihan rekonsiliasi manual berhasil sebelum acara |
| NFR-13 | Keamanan login | Username/password teruji, hash salted adaptif, sesi dapat dicabut, anti-bruteforce; pengujian akses negatif |
| NFR-14 | Publikasi | Snapshot publik berlabel waktu/versi dan tidak mencampur fase |

Angka SLA/latensi final dan kapasitas pengunjung publik tidak diklaim sebelum uji beban dengan data serta perangkat yang representatif.

# N. ACCEPTANCE TEST & UAT (GATES)

| Tes | Skenario | Hasil yang wajib terjadi |
|---|---|---|
| AT-01 | Impor 200 data dan impor ulang | Tidak ada duplikasi berdasarkan ID sumber |
| AT-02 | Nama sama, sekolah berbeda | Dua peserta tetap terpisah |
| AT-03 | Petugas Mewarnai akses peserta Tahfidz | Ditolak server |
| AT-04 | Dua permintaan registrasi peserta sama | Tetap satu nomor |
| AT-05 | 20 registrasi serentak simulasi | Semua nomor unik, tanpa nomor hilang akibat double-commit |
| AT-06 | Nomor peserta Tahfidz dipindah urutan tampil | Nomor tetap, urutan tampil berubah |
| AT-07 | Juri Tahfidz mencari 027 | Hanya nomor dan skema penilaian; nama/sekolah tidak dikirim |
| AT-08 | Skor Kelancaran 41/40 | Ditolak klien dan server |
| AT-09 | Skor 35/40+27/30+18/20+8/10 | Total juri 88 |
| AT-10 | Skor 2/3 juri sudah final | Peserta belum masuk klasemen |
| AT-11 | Skor 3/3 final (88,91,85) | Nilai akhir 88.00 |
| AT-12 | Tie Tahfidz berbeda kriteria prioritas | Urutan sesuai juknis sebelum pembulatan |
| AT-13 | Tie Mendongeng posisi juara | Status menunggu musyawarah; tidak diumumkan juara sembarang |
| AT-14 | Admin mengubah draft poin 100→99 | Tidak dapat menerbitkan skema |
| AT-15 | Admin mencoba edit skema saat JUDGING_OPEN | Ditolak, arahkan prosedur revisi |
| AT-16 | Publik membuka halaman sebelum pengesahan | Nomor, skor, peringkat saja; tidak ada identitas pada payload/cache |
| AT-17 | Cabang Tahfidz disahkan, dua cabang lain aktif | Identitas terbuka hanya pada Tahfidz |
| AT-18 | Juri mencoba membaca skor juri lain | Ditolak server |
| AT-19 | Username tidak terdaftar, password salah atau akun dinonaktifkan | Ditolak tanpa mengungkap status keberadaan akun dan tanpa akses data |
| AT-20 | Admin unggah PDF berita acara final | Bisa dibuka publik sesudah publish; draft tetap privat |
| AT-21 | Koneksi terputus saat simpan Draft | Tidak ada pesan sukses palsu; retry aman |
| AT-22 | Koreksi nilai FINAL yang terotorisasi | Audit tercatat; snapshot lama diganti sesuai prosedur |
| AT-23 | Tampilan ponsel 360 px | Tidak ada elemen penting terpotong atau harus zoom |
| AT-24 | Ekspor/latihan backup dan pemulihan | Data konsisten dan dapat direkonsiliasi |
| AT-25 | Provision 13 akun seed pada lingkungan uji | Tercipta 1 Admin, 3 Petugas, 9 Juri dengan username unik dan role/cabang tepat, tanpa password hard-coded |
| AT-26 | Verifikasi password/penyimpanan | Tidak ada plaintext atau hash cepat tunggal; salt unik; algoritma/parameter dapat diaudit |
| AT-27 | Login pertama dan reset password | Kredensial sementara diwajibkan rotasi, reset terotorisasi, sesi lama tercabut |
| AT-28 | Session expiry, logout, disabled user | Aksi terproteksi dengan sesi lama ditolak server |
| AT-29 | Token palsu, replay dan akses lintas cabang | Ditolak server, tidak mengandalkan pengecekan antarmuka |
| AT-30 | 20+ percobaan login gagal dengan variasi username | Pembatasan penyalahgunaan aktif; respons generik; audit tidak merekam password |
| AT-31 | Penanganan cookie/penyimpanan token di HP | Sesi aman menurut threat model browser/GAS; XSS dan CSRF diuji |
| AT-32 | Browser anonim mengakses fungsi internal | Ditolak, sedangkan hasil publik aman tetap terbuka |
| AT-33 | Admin menjalankan bootstrap pertama | Tidak ada admin password universal di kode/repo; prosedur owner-only teruji |

**Definisi lulus:** seluruh tes P0 PASS; tidak ada isu integritas, kebocoran identitas, atau otorisasi yang masih terbuka. Kegagalan AUTH-GATE berarti NO-GO untuk rilis sistem digital penuh, meski UI terlihat selesai.

# O. ROADMAP IMPLEMENTASI STEP-BY-STEP (TANPA MEMULAI KODE DALAM PRD INI)

## STEP 00 — Serah-terima sumber & pemeriksaan kesiapan (pra-implementasi)

**Input:** PRD V1.5, PDF juknis privat, template Excel sintetis 30 peserta, daftar 13 akun seed berbasis username/role/cabang, pemilik akun Google deployment, keputusan addendum juri dan kebijakan publikasi.  
**Keluaran:** daftar aset, mapping data, catatan kekurangan, register risiko, dan matriks keputusan.  
**Gate:** sumber memadai dan pemegang keputusan ditentukan.


## STEP 01 — Proof-of-concept autentikasi internal username/password (AUTH-GATE)

**Pekerjaan:** buktikan pada lingkungan uji apakah GAS dapat menjalankan bootstrap 13 akun internal, hash password adaptif, sesi dengan revokasi, rate-limiting, dan otorisasi per cabang secara aman; uji login/logout pada HP, pemisahan Sheets dan portal publik anonim.  
**Keluaran:** bukti PASS/FAIL, evaluasi kriptografi dan lifecycle sesi, pilihan mode deployment, diagram alur login/pemulihan dan mitigasi brute force.  
**Gate:** semua syarat I.2 dan rencana `docs/operations/STEP01_AUTH_GATE_PLAN.md` lolos; bila tidak, STOP, rekomendasikan alternatif tanpa biaya, dan minta persetujuan.

## STEP 02 — Validasi skema data & migrasi awal

**Pekerjaan:** skema Sheets, ID stabil, impor contoh Excel, normalisasi sekolah, validasi delegasi, pemeriksaan duplikasi, kebijakan backup.  
**Keluaran:** data awal teruji dan laporan impor.  
**Gate:** AT-01/02 dan integritas data PASS.

## STEP 03 — Aplikasi registrasi ulang mobile

**Pekerjaan:** dashboard petugas per cabang, cari nama/sekolah, konfirmasi hadir, alokasi nomor atomik, status kartu, log.  
**Keluaran:** modul check-in operasional.  
**Gate:** AT-03/04/05/06 PASS pada multi-operator.

## STEP 04 — Admin konfigurasi skema dan juri

**Pekerjaan:** CRUD kriteria dinamis, maksimum poin, jumlah juri, versi, publish & lock, penugasan.  
**Keluaran:** tiga skema resmi 100 poin dan penugasan teruji.  
**Gate:** AT-14/15 PASS.

## STEP 05 — Panel juri blind judging mobile

**Pekerjaan:** pencarian nomor, poin langsung, draft, final, pengamanan API, audit dan koreksi.  
**Keluaran:** panel juri tiap cabang.  
**Gate:** AT-07/08/09/18/21 PASS; tidak ada kebocoran identitas.

## STEP 06 — Mesin hasil & publikasi anonim

**Pekerjaan:** kelengkapan juri, rata-rata presisi, tie, snapshot publik aman, progres, cache.  
**Keluaran:** klasemen sementara per cabang.  
**Gate:** AT-10/11/12/13/16 PASS.

## STEP 07 — Pengesahan hasil dan publikasi identitas

**Pekerjaan:** review Admin, musyawarah, transisi OFFICIAL, rilis nama/sekolah selektif per cabang.  
**Keluaran:** pengumuman resmi.  
**Gate:** AT-17 dan pengujian privasi PASS.

## STEP 08 — Berita acara, PDF, arsip

**Pekerjaan:** editor templat, PDF, unggah berita acara bertanda tangan, publikasi, ekspor cadangan.  
**Keluaran:** PDF final masing-masing cabang dan paket arsip.  
**Gate:** AT-20/24 PASS.

## STEP 09 — UAT, pengamanan, latihan operasional

**Pekerjaan:** perangkat HP nyata, beban serentak, uji ketahanan koneksi, pengujian manual vs hitung sistem, simulasi alur hari H, latihan fallback.  
**Keluaran:** UAT register dan keputusan GO/NO-GO bertanda tangan penanggung jawab.  
**Gate:** seluruh P0 PASS; sistem layak pelaksanaan.

## STEP 10 — Deployment rilis dan pasca-acara

**Pekerjaan:** versi rilis dikunci, konfigurasi produksi, pengawasan awal, dukungan lapangan, ekspor final, arsip dan laporan evaluasi.  
**Keluaran:** rilis operasional dan closeout event.  
**Gate:** dokumen hasil resmi konsisten, backup aman, akses ditutup sesuai prosedur.

**Keterbatasan jadwal:** dokumentasi ini dibuat 18 Oktober 2026, enam hari sebelum event 24 Oktober. Roadmap adalah urutan logis, **bukan janji seluruh fitur pasti rampung dalam enam hari**. Jika waktu tidak cukup, rilis hanya boleh dilakukan jika keamanan dan integritas P0 lolos; berita acara minimum via unggah PDF dapat digunakan sebagai jalur penyederhanaan resmi, tanpa menghapusnya dari ruang lingkup final.

# P. RISIKO DAN MITIGASI

| ID | Risiko | Tingkat | Mitigasi / keputusan |
|---|---|---|---|
| R-01 | Autentikasi username/password atau sesi tidak dapat diimplementasikan secara aman dalam GAS | Kritis | Uji hash adaptif, entropi token, cookie/iframe, proteksi brute force pada AUTH-GATE; NO-GO bila gagal |
| R-02 | Data peserta ganda/nama sama | Tinggi | ID sumber stabil, pratinjau impor, normalisasi sekolah tanpa auto-merge |
| R-03 | Dua petugas menetapkan nomor sama | Kritis | lock, idempotensi, validasi ulang, uji concurrent |
| R-04 | Kebocoran nama/sekolah selama penjurian | Kritis | projection API, pemisahan snapshot, tes kebocoran payload/cache/export |
| R-05 | Konfigurasi poin diubah setelah penilaian | Kritis | freeze skema, versioning, change request resmi |
| R-06 | Koreksi nilai tidak terlacak | Tinggi | draft/final workflow, otorisasi, audit dan alasan |
| R-07 | Kuota GAS/jaringan saat puncak | Tinggi | batch/caching, load test, backup manual dan rekonsiliasi |
| R-08 | Dua juri padahal juknis menyatakan tiga | Tinggi | addendum keputusan panitia sebelum lomba |
| R-09 | Identitas anak dirilis tanpa pemberitahuan/persetujuan yang layak | Tinggi | verifikasi kebijakan wali, data minimization, pilihan tahan identitas |
| R-10 | Hasil sementara disalahartikan resmi | Sedang | label tegas, waktu update, pemisahan status, pengesahan eksplisit |
| R-11 | Berita acara tidak cocok dengan hasil | Tinggi | data ditarik dari versi OFFICIAL; tes kesesuaian dan review Admin |
| R-12 | Desain Neo-Brutalism mengurangi keterbacaan di HP | Sedang | uji 360px, contrast, kontrol satu kolom, prioritas kegunaan |

# Q. OPEN ISSUES / DETAIL NON-BLOKING YANG HARUS DIISI SAAT STEP 00

Berikut bukan alasan untuk membuka kembali keputusan inti, melainkan parameter lapangan yang belum tersedia dalam percakapan:

1. Berkas ekspor Google Form dan nama kolom aktual; akses ke spreadsheet sumber, jika diperlukan.
2. Username awal sudah ditetapkan (13 akun) dan pemilik Google deployment adalah akun Google pribadi pemilik proyek. Identitas pengguna operasional sebenarnya, distribusi password privat, serta penetapan jumlah juri yang benar-benar aktif diselesaikan sebelum go-live.
3. Jumlah juri faktual pada setiap cabang dan bukti addendum bila ada cabang memakai dua juri.
4. Logo resmi, palet acara, dan format kop berita acara.
5. Jumlah perkiraan pengunjung publik serentak dan mutu jaringan lokasi acara.
6. Dokumen/ketentuan pemberitahuan kepada wali untuk publikasi nama/sekolah.
7. Ketentuan tandatangan pengesahan, nomor berita acara, daftar pejabat, dan kebijakan arsip.
8. Teks bantuan operasional dan nomor petugas dukungan pada hari H (ditetapkan panitia, tidak dicetak publik tanpa izin).

# R. REGISTER KEPUTUSAN TERKUNCI

| ID | Keputusan final produk | Status |
|---|---|---|
| DEC-01 | Satu sistem web untuk Tahfidz, Mendongeng, Mewarnai | LOCKED |
| DEC-02 | Tanpa PHP, domain dan hosting berbayar; GAS kandidat utama | LOCKED kebutuhan, uji platform |
| DEC-03 | Data peserta hasil Google Form diimpor; tanpa self-registration peserta | LOCKED |
| DEC-04 | Petugas mencari nama+sekolah, lalu nomor start berurutan per cabang | LOCKED |
| DEC-05 | Petugas/juri hanya beroperasi dalam cabang yang ditugaskan | LOCKED |
| DEC-06 | Login internal username/password; 13 akun seed; role/cabang server-side; tanpa self-registration | LOCKED produk; implementasi menunggu AUTH-GATE |
| DEC-07 | Blind judging: akun juri hanya menerima nomor peserta | LOCKED |
| DEC-08 | Admin mengelola kriteria, urutan, maksimal poin, versi dan jumlah juri | LOCKED |
| DEC-09 | Input skor bilangan bulat 0..maks tiap kriteria; total poin maksimum 100 | LOCKED |
| DEC-10 | Skema awal Mendongeng 25/25/20/15/15 | LOCKED |
| DEC-11 | Skema awal Tahfidz 40/30/20/10 | LOCKED |
| DEC-12 | Skema awal Mewarnai 25/25/25/25 | LOCKED |
| DEC-13 | Setiap juri menilai seluruh kriteria; total juri dijumlah; nilai akhir dirata-rata | LOCKED |
| DEC-14 | Jumlah juri 2–3 ditetapkan sebelum penjurian; perbedaan juknis diaddendum | LOCKED |
| DEC-15 | Hanya peserta dengan seluruh juri FINAL masuk klasemen sementara | LOCKED |
| DEC-16 | Tie Tahfidz mengikuti prioritas juknis; tie cabang lain musyawarah | LOCKED |
| DEC-17 | Selama penjurian, publik melihat hasil nomor-only | LOCKED |
| DEC-18 | Nama dan sekolah tampil setelah hasil cabang disahkan | LOCKED, tunduk privasi anak |
| DEC-19 | Admin mengelola berita acara, PDF dapat dipublikasikan setelah resmi | LOCKED |
| DEC-20 | Mobile-first Neo-Brutalism untuk petugas, juri dan publik | LOCKED |
| DEC-21 | Langkah berikut mengikuti gerbang STEP 00–10, tanpa loncat tahap | LOCKED |
| DEC-22 | Akun pemilik GAS/Sheets/Drive tetap Google pribadi pemilik proyek, terpisah dari akun internal | LOCKED |
| DEC-23 | Password unik per akun, salted adaptive hash, sesi aman dan bisa dicabut, proteksi login gagal | LOCKED persyaratan keamanan; teknologi menunggu uji |
| DEC-24 | Tidak ada password bawaan bersama, kredensial di GitHub, atau pembagian Sheet kepada petugas/juri | LOCKED |

# S. RUJUKAN DAN BATAS KEABSAHAN

## S.1 Sumber internal utama

1. **MIS Tarbiyatul Mubtadiin**, *Petunjuk Teknis Umum Lomba Tarmudi Fest 2026*, hlm. 1–2, PDF yang disampaikan panitia.
2. **MIS Tarbiyatul Mubtadiin**, *Petunjuk Teknis Khusus Mewarnai*, hlm. 3, dalam PDF yang sama.
3. **MIS Tarbiyatul Mubtadiin**, *Petunjuk Teknis Khusus Mendongeng*, hlm. 4–5, dalam PDF yang sama.
4. **MIS Tarbiyatul Mubtadiin**, *Petunjuk Teknis Khusus Tahfidz*, hlm. 6–7, dalam PDF yang sama.
5. **Keputusan perancangan Tarmudi Fest 2026**, percakapan penetapan baseline V1.0–V1.5 pada 18 Oktober 2026. Keputusan ini dicatat sebagai keputusan produk, bukan kutipan dari juknis.

## S.2 Rujukan teknis resmi

- Google Apps Script — Web Apps: https://developers.google.com/apps-script/guides/web
- Google Apps Script — Session: https://developers.google.com/apps-script/reference/base/session
- Google Apps Script — Web app execution settings: https://developers.google.com/apps-script/manifest/web-app-api-executable
- OWASP — Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP — Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP — Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- Google Apps Script — LockService: https://developers.google.com/apps-script/reference/lock/lock-service
- Google Apps Script — Quotas: https://developers.google.com/apps-script/guides/services/quotas

**Batas keabsahan:** rincian layanan Google dapat berubah; verifikasi kembali dokumentasi resmi dan lakukan proof-of-concept sebelum menetapkan konfigurasi produksi. Dokumen ini adalah PRD yang siap menjadi baseline kerja, bukan bukti aplikasi telah berjalan atau sistem keamanan telah lolos audit.

---

**PENUTUP — PERINTAH KERJA SELANJUTNYA**

PRD V1.5 adalah baseline aktif yang dikunci melalui perubahan terotorisasi, menggantikan V1.4 sebagai sumber kerja; V1.4 tetap tersedia sebagai arsip. **Jangan membuat modul aplikasi, deployment, atau pengubahan data produksi sebelum STEP 00 selesai dan AUTH-GATE (STEP 01) dinyatakan PASS.** Setelah setiap langkah, susun catatan hasil, pengujian, temuan, dan keputusan GO/NO-GO sebelum melanjutkan tahap berikutnya.
