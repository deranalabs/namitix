# Namitix – Build Plan for Walrus Haulout Hackathon

## Executive Summary (for judges)

Namitix is a minimal but fully functional **ticketing dApp on Sui testnet** that
demonstrates end-to-end integration with **Walrus** for decentralized storage.

**Core on-chain flow**

- When a user clicks **“Buy Ticket”**:
  - The app calls the Move contract
    `0x66e74e301666655b56fd4f9366a6e883669442f763557824969bf5a247d14eb6::namitix_ticket::mint_ticket`
    on **Sui testnet** using `@mysten/dapp-kit` and `Transaction`.
  - The transaction digest is stored on the ticket object and displayed in the
    UI with a link to a Sui explorer.

- After the Sui transaction succeeds, the app constructs a `TicketMetadata`
  JSON object (event id, owner address, purchase date, tx digest, ticket id)
  and calls `storeTicketMetadata` in `walrusClient.ts`.
  - This issues a `PUT` request to the Walrus **publisher**
    `https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=1` with the
    JSON as the body (or to URLs configured via
    `NEXT_PUBLIC_WALRUS_PUBLISHER_URL`).
  - The response is parsed according to the official Walrus
    `blob_upload_download_webapi` example, and the resulting `blobId`
    (either `alreadyCertified.blobId` or
    `newlyCreated.blobObject.blobId`) is stored on the ticket.

- Each ticket in **My Wallet** shows:
  - **Tx**: shortened `txDigest` with a link to the Sui explorer.
  - **BLOB**: the Walrus `blobId` as a clickable link to the
    aggregator URL, e.g.
    `https://aggregator.walrus-testnet.walrus.space/v1/blobs/<blobId>`.

- When the user clicks **“Reveal QR”**:
  - `TicketView` calls `fetchTicketMetadata(blobId)`, which performs a
    `GET` request to the Walrus **aggregator**
    `https://aggregator.walrus-testnet.walrus.space/v1/blobs/<blobId>`
    (or the URL configured via `NEXT_PUBLIC_WALRUS_AGGREGATOR_URL`).
  - The blob is expected to contain the same JSON metadata, parsed back into a
    `TicketMetadata` object. If this succeeds, the UI transitions from the
    “Encrypted / Protected by Seal” state to showing the QR code with the
    status `METADATA VERIFIED`.

This means every ticket in Namitix has **real on-chain provenance (Sui
transaction)** and **real decentralized storage (Walrus blob)**, with direct
links exposed for auditors and judges.

**Seal and Nautilus**

- **Seal** is currently represented in the UX ("Encrypted" badge and
  "DECRYPTING SEAL" state). The next planned step is to encrypt the ticket
  metadata JSON with Seal before uploading it to Walrus, and to decrypt it via
  Seal on reveal. This would turn Walrus into an encrypted data layer, not just
  plain JSON storage.
- **Nautilus** is planned as a follow-up for organizer analytics: a Nautilus job
  could periodically aggregate ticket metadata (from Walrus and/or Sui) and
  publish summary blobs or Sui objects that power an organizer dashboard
  (attendance, unique wallets, per-event statistics).

The sections below keep the original, more detailed build notes and planning
used during development.

---

**Context sources:**
- `deepsurge.txt` – overview hackathon, tracks, prize structure
- `participanthandbook.txt` – format, schedule, requirements, resources
- `termsofservice.txt` – eligibility, pre-existing work policy, judgment & prizes

**Goal:**
Dalam ~3 jam ke depan, bawa Namitix dari prototype ke submission-ready untuk **Walrus Haulout Hackathon**, fokus utama track **Data Security & Privacy** dengan peluang **Best Tech Implementation (Walrus/Seal/Nautilus)**.

---

## High-level Positioning

- **What is Namitix?**
  A ticketing dApp on Sui where each ticket:
  - Dibeli via **real Sui transaction** (testnet sekarang, bisa upgrade ke mainnet kalau perlu).
  - Metadata tiket disimpan secara **terenkripsi di Walrus** (rencana final).
  - QR + status `METADATA VERIFIED` mencerminkan verifikasi terhadap data di Walrus.

- **Track yang ditargetkan (dari handbook & deepsurge):**
  - Utama: **Data Security & Privacy**
  - Bisa di-argue juga untuk: **Provably Authentic** (truth/verification) dan **Data Marketplaces** (jika nanti ada secondary market).

- **Alignment dengan TOS (termsofservice.txt):**
  - Semua code ada di repo publik dengan version control jelas.
  - Jelaskan di README & video: bagian mana yang dikerjakan selama Haulout.
  - Project akan dideploy minimal di Sui testnet dan terintegrasi dengan Walrus (real maupun staging sesuai docs Walrus).

---

## Phase 1 – Finalize Sui Transaction Layer (Status: **Done**)

**Tujuan:** Semua pembelian tiket mengirim **transaksi Sui nyata** di testnet dan ditampilkan dengan jelas di UI.

### Sudah dikerjakan

- `Providers.tsx`
  - `SuiClientProvider` default ke `testnet`.

- `App.tsx`
  - `useSignAndExecuteTransaction` + `Transaction` dari `@mysten/sui/transactions`.
  - Saat `handleBuyTicket`:
    - Buat `Transaction` baru.
    - `splitCoins(tx.gas, [tx.pure.u64(1)])` lalu `transferObjects` ke alamat pemilik.
    - Eksekusi dengan `signAndExecuteTransaction({ transaction: tx, chain: "sui:testnet" })`.
    - Simpan `txDigest` di objek `Ticket`.

- `TicketView.tsx`
  - Menampilkan `txDigest` (dipendekkan) dengan link ke explorer:
    - `https://testnet.suivision.xyz/txblock/${ticket.txDigest}`.

### Checklist verifikasi

- [ ] Wallet di testnet, ada SUI
- [ ] Klik **CONNECT WALLET**, lalu **BUY TICKET**
- [ ] Modal Processing → selesai tanpa error
- [ ] `My Wallet` menampilkan tiket baru + **Tx** field dengan link explorer yang valid

> Jika semua ini berjalan, Phase 1 sudah aman untuk demo dan memenuhi requirement “deployed/integrated with Network” dari TOS.

---

## Phase 2 – Walrus Integration Skeleton (Status: **Ready to Implement**)

**Tujuan:** Siapkan struktur kode untuk integrasi **Walrus** tanpa mock di dalam app (semua mock behaviour digeser ke lapisan walrusClient). Implementasi HTTP/SDK Walrus bisa diisi kemudian dengan panduan dari `https://github.com/MystenLabs/walrus`.

### Struktur yang sudah dibuat

- `app/lib/walrusClient.ts`

  ```ts
  export interface TicketMetadata {
    eventId: string;
    ownerAddress: string;
    purchaseDate: string;
    txDigest?: string;
    ticketId: string;
  }

  export function toTicketMetadata(ticket: Ticket): TicketMetadata { ... }

  export async function storeTicketMetadata(_metadata: TicketMetadata): Promise<string> {
    throw new Error("storeTicketMetadata is not implemented yet. Connect this to the Walrus API based on the official docs.");
  }

  export async function fetchTicketMetadata(_blobId: string): Promise<TicketMetadata> {
    throw new Error("fetchTicketMetadata is not implemented yet. Connect this to the Walrus API based on the official docs.");
  }
  ```

- `app/types.ts`
  - `Ticket` sekarang punya optional `blobId?: string`.

### Yang perlu dikerjakan (diisi berdasarkan docs Walrus)

1. **Konfigurasi environment** (di `.env.local`):
   - `WALRUS_BASE_URL` atau endpoint yang disarankan di docs.
   - API key / auth jika diperlukan.

2. **Implementasi `storeTicketMetadata`**:
   - Serialize `TicketMetadata` ke JSON.
   - Panggil endpoint Walrus (HTTP/SDK) untuk upload blob.
   - Terima `blobId` dan return.

3. **Implementasi `fetchTicketMetadata`**:
   - Panggil Walrus dengan `blobId`.
   - Ambil blob (mungkin JSON terenkripsi atau plaintext – bergantung nanti pada Seal).
   - Parse ke `TicketMetadata`.

4. **Wire ke `App.tsx`**:
   - Setelah Sui tx sukses dan sebelum `setTickets`:
     ```ts
     const meta = toTicketMetadata(newTicketDraft);
     const blobId = await storeTicketMetadata(meta);
     const newTicket: Ticket = { ...newTicketDraft, blobId };
     ```

5. **Gunakan `blobId` nyata di UI**:
   - `EventCard` / `TicketView` BLOB label menggunakan `ticket.blobId` (atau fallback ke mock saja kalau belum ada).

**Time budget (dalam 3 jam ini):**
- 30–45 menit: membaca contoh dari repo Walrus dan menentukan endpoint yang akan dipakai.
- 30–45 menit: implement `storeTicketMetadata` + `fetchTicketMetadata` + basic error handling.
- 15 menit: integrasi ke `App.tsx` dan test manual.

---

## Phase 3 – Real Encryption dengan Seal

**Tujuan:** Menggunakan **Seal** untuk benar-benar mengenkripsi metadata tiket sebelum disimpan di Walrus dan mendekripsinya saat verifikasi/reveal.

### Rencana integrasi (mapping ke `https://github.com/MystenLabs/seal`)

1. Dari repo Seal, tentukan:
   - Cara generate/kelola key (dev-mode key boleh cukup untuk hackathon).
   - API `encrypt(plaintext)` dan `decrypt(ciphertext)` yang akan dipakai di frontend / backend.

2. Update `walrusClient.ts`:
   - Dalam `storeTicketMetadata`:
     ```ts
     const plaintext = JSON.stringify(metadata);
     const ciphertext = await Seal.encrypt(plaintext); // pseudo
     // Upload ciphertext ke Walrus → blobId
     ```
   - Dalam `fetchTicketMetadata`:
     ```ts
     const ciphertext = await walrus.fetchBlob(blobId);
     const plaintext = await Seal.decrypt(ciphertext);
     const meta = JSON.parse(plaintext) as TicketMetadata;
     ```

3. Update UI:
   - `TicketView`:
     - `handleReveal` tidak lagi hanya `setTimeout`, tetapi:
       - Panggil `fetchTicketMetadata(ticket.blobId!)`.
       - Jika dekripsi sukses → `setIsRevealed(true)` dan teks `METADATA VERIFIED`.
       - Jika fail → tampilkan state error (`METADATA MISMATCH` atau sejenisnya).

**Time budget (realistis untuk hackathon):**
- Jika Seal punya client JS siap pakai: 60–90 menit.
- Kalau perlu backend perantara (server): planning tambahan mungkin dibutuhkan di luar 3 jam.

---

## Phase 4 – (Opsional tapi Kuat) Nautilus & Organizer Tools

**Tujuan:** Menggunakan **Nautilus** untuk job compute di atas data tiket (analytics / summary) dan menyiapkan tooling untuk event organizer.

### Ide minimum viable

1. **Nautilus job**
   - Job yang membaca metadata tiket dari Walrus / Sui, lalu menghitung:
     - Jumlah tiket per event.
     - Unique owners.
   - Simpan summary ke Walrus atau ke object Sui khusus.

2. **Organizer dashboard di Namitix**
   - Route `/organizer`:
     - Menampilkan summary dari job Nautilus (call API atau fetch dari Walrus/Sui).
   - Ini align dengan Data Security & Privacy + Data marketplaces (visibilitas data).

Karena waktu tersisa 3 jam, Phase 4 mungkin di-scope kecil atau dijadikan **future work** di README/ideo.

---

## Phase 5 – Compliance & Submission (DeepSurge + TOS)

**Tujuan:** Menyiapkan semua hal non-teknis yang dibutuhkan untuk submit sesuai `participanthandbook.txt` dan `termsofservice.txt`.

### Checklist dari Participant Handbook

- [ ] **GitHub repo** publik dengan:
  - README jelas (what, why, how to run).
  - Info track yang ditarget (Data Security & Privacy + Walrus focus).
  - Penjelasan singkat integrasi Sui/Walrus/Seal/Nautilus (yang sudah ada & future work).
- [ ] **Website / deployed app** (opsional tapi bagus):
  - Deploy ke Vercel/Netlify atau lainnya (`/` → app Namitix).
- [ ] **Demo video (<5 menit)**:
  - Alur yang ditunjukkan:
    1. Landing + connect wallet.
    2. Beli tiket → tunjukkan modal Sui + explorer link.
    3. My Wallet → Reveal QR → METADATA VERIFIED (terutama setelah integrasi Walrus/Seal).
    4. (Opsional) Organizer view / check-in.
- [ ] **Submission di DeepSurge**:
  - Nama project, logo, deskripsi, link repo, link demo, video.
  - Jelaskan bagian mana yang dikerjakan selama Haulout (sesuai TOS/pre-existing code rules).

### Checklist dari Terms of Service

- [ ] Pastikan semua anggota tim memenuhi syarat (usia, non-sanctioned, KYC).
- [ ] Repo menggunakan version control yang wajar (tidak single-comit raksasa).
- [ ] Dokumentasikan dengan jujur jika ada kode sebelum Hackathon Effective Date.

---

## Quick Timeboxed Plan for Next ~3 Hours

**0:00 – 0:30**
- Tes ulang flow Sui tx + UI.
- Catat bug kecil jika ada.

**0:30 – 1:30**
- Baca cepat docs Walrus.
- Implement `storeTicketMetadata` + `fetchTicketMetadata` di `walrusClient.ts`.
- Wire ke `App.tsx` (simpan `blobId` nyata di Ticket).
- Tampilkan `blobId` di UI (TicketView / EventCard) jika sudah siap.

**1:30 – 2:15**
- Eksplor Seal repo.
- Tentukan apakah bisa dipakai langsung di frontend; jika ya, mulai integrasi enkripsi di `walrusClient.ts`.
- Jika tidak sempat full, tulis jelas di README bahwa Walrus sudah real, Seal planned sebagai next step.

**2:15 – 3:00**
- Bersihkan UI kecil, tambah README/Build section.
- Draft outline untuk demo video.
- Pastikan semua lint error hilang.

---

Dengan `Build.md` ini, kamu punya peta jelas:
- Apa yang sudah real (Sui tx + UI),
- Apa yang perlu disambungkan ke Walrus/Seal/Nautilus,
- Dan langkah-langkah praktis menjelang submission di DeepSurge sesuai handbook & TOS.
