# GAS/OOP — Modul, Port, DTO, dan Contract Tests

**Status:** BLUEPRINT ONLY; tidak ada berkas `src/` yang dibuat.  
**Baseline:** PRD V1.5 dan ADR-0004.

## Rancangan struktur sumber (untuk STEP implementasi nanti)

```text
src/
  server/
    bootstrap/                 composition root
    interfaces/                doGet/doPost/allowlisted RPC boundary
    domain/
      identity/                user, roles, password policy, session policies
      participants/            participant, school, import
      registration/            number and check-in invariants
      scoring/                 scoring scheme, criterion, score
      results/                 completeness, rankings, ties, publication
      documents/               minutes lifecycle
      shared/                  value objects/errors
    application/
      commands/                mutating use cases
      queries/                 read-only use cases
      ports/                   repository/lock/clock/crypto/session contracts
    infrastructure/
      gas/
        sheets/                bounded batched adapters
        locking/               script lock
        cache/                 public snapshot only
        docs-drive/            private minutes/PDF
        auth/                  vetted primitives (unapproved until test)
  client/
    admin/
    registrar/
    judge/
    public/
  shared/contracts/
tests/
  unit/
  application/
  contract/
  security/
  integration-gas/
  e2e-mobile/
```

## Modul use case dan tanggung jawab

| Modul | Contoh use case (belum diimplementasi) | Boundary yang wajib |
|---|---|---|
| Identity | `AuthenticateUser`, `ProvisionSeedAccounts`, `RevokeSession`, `ResetCredential` | 13 akun; hash salted adaptif, session server-side dan role/cabang; AUTH-GATE dulu |
| Import | `PreviewParticipantImport`, `CommitParticipantImport` | Validasi lima kolom ADR-0002, ID stabil, overwrite hanya sebelum operasi |
| Registration | `ConfirmAttendance`, `AllocateStartNumber` | Idempotency+lock; sequential per cabang |
| Configuration | `PublishScoringScheme`, `LockScheme` | Total kriteria tepat 100, immutable setelah aktif |
| Judging | `SaveJudgeDraft`, `FinalizeJudgeScore` | Nomor saja, integer 0..max, juri hanya nilai sendiri |
| Results | `CalculateCompetitionResults`, `ResolveTie` | Seluruh juri wajib FINAL, rata-rata presisi, musyawarah tercatat |
| Publication | `PublishInterimSnapshot`, `ApproveOfficialResults` | Interim nomor-only; identitas hanya setelah pengesahan |
| Documents | `GenerateMinutes`, `PublishSignedPdf` | Hanya final dan authorized yang menjadi publik |
| Audit | `RecordAudit`, `ExportBackup` | Tidak mencatat password/token atau data anak yang tidak perlu |

## Allowlist DTO — fail closed

**Judge DTO**: `competition_code`, `start_number`, `scoring_scheme_version`, `criteria[{criterion_id,label,max_points,order_no}]`, `own_status`, `own_draft_scores`. **NO** `name`, `school`, `guardian_phone`, source-IDs yang dapat ditautkan ke identitas, skor juri lain.

**Public INTERIM DTO**: `competition_code`, `start_number`, `mean_score`, `rank`, `generated_at`, `phase=INTERIM`; **NO** name/school.

**Public OFFICIAL DTO**: nama/sekolah dapat dibuka setelah `competition.status=OFFICIAL`, otorisasi dan kebijakan publikasi data anak terkonfirmasi. Hanya output yang telah diberi versi; jangan mengembalikan raw Sheet row.

**Import**: `ID_PENDAFTARAN,NAMA_PESERTA,ASAL_SEKOLAH,CABANG_LOMBA,STATUS_VERIFIKASI` dalam template sintetis; ID pendaftaran **bukan** nomor start.

## OOP dan GAS tests

- Domain tidak mengakses global `SpreadsheetApp`, `DriveApp`, `CacheService`, `PropertiesService`.
- Composition root membuat use case dengan port adapter; bukan singleton global per pengguna.
- Parser hanya menerima tipe dan panjang input sesuai schema, tidak menerima `role` atau `competition_id` sebagai otoritas. Validasi server mendahului setiap tulis.
- Fungsi yang callable via `google.script.run` adalah permukaan serangan; trailing `_` pada nama fungsi hanya menyembunyikan pemanggilan langsung, bukan keamanan.
- Semua operasi mutasi meminta operation ID dan memproses retry dengan aman; response sukses hanya jika penulisan server berhasil.
- `Score` invalid jika desimal, negatif, melebihi `max_points`, atau tanpa kriteria wajib.
- Untuk tahfidz `35/40 + 27/30 + 18/20 + 8/10 = 88` (bukan pembobotan kedua).
- Uji 20 check-in bersamaan; 20 nomor unik dan request ulang tidak menggandakan nomor.
- Uji panggilan juri lintas cabang, upaya melihat nama/sekolah dan nilai juri lain ditolak sebelum pengembalian data.
- Uji Admin mengganti skema saat `JUDGING_OPEN`: wajib ditolak.
- Uji data sintetik pada HP dan pemulihan koneksi; tidak ada klaim sukses sebelum konfirmasi server.

## Interoperabilitas Apps Script

V8 tidak langsung mendukung ES modules. Build TypeScript menghasilkan output GAS-compatible, dengan global `doGet`/RPC terdaftar eksplisit; jangan mengandalkan `Node crypto`, `window`, `fetch`, `SubtleCrypto`, atau timers di sisi server. `google.script.run` asinkron dan dapat menyelesaikan panggilan dengan urutan berbeda. `LockService.getDocumentLock()` bisa null pada standalone app.

Kontrak/struktur ini **belum menjadi source code**. Tidak ada perubahan PRD bisnis.
