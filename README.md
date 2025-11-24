# Namitix – Encrypted Tickets on Sui + Walrus

Namitix is a focused ticketing dApp built for the **Walrus Haulout Hackathon**.
It demonstrates an end-to-end flow where each ticket purchase:

- Mints a `Ticket` object on **Sui testnet** via a custom Move module.
- Stores ticket metadata as a JSON blob on **Walrus**.
- Verifies and displays the metadata on ticket reveal.

The goal is to showcase **data security and verifiable storage** by combining
Sui smart contracts with Walrus blobs, with a UX that feels like a modern event
ticket wallet.

---

## Demo & Key Links

- App (local dev): http://localhost:3000
- GitHub repository: https://github.com/deranalabs/namitix
- Live demo: https://namitix.vercel.app/
- Example Sui transaction: https://testnet.suivision.xyz/txblock/Casnur7iMgvp7hicJ2oDXcbTayummBvs6wAdbnQhY7fu
- Example Walrus blob: https://testnet.suivision.xyz/package/0x66e74e301666655b56fd4f9366a6e883669442f763557824969bf5a247d14eb6

---

## How It Works

### On-chain components

- **Move package**: `contracts_namitix` on Sui testnet.
- **Module**: `namitix_ticket`.
- **Entry function**:

  ```text
  0x66e74e301666655b56fd4f9366a6e883669442f763557824969bf5a247d14eb6::namitix_ticket::mint_ticket
  ```

When the user clicks **“Buy Ticket”** in the UI:

1. The frontend builds a `Transaction` using `@mysten/dapp-kit` and calls
   `mint_ticket` on **Sui testnet**.
2. The resulting transaction digest (`txDigest`) is stored in the local
   `Ticket` model and surfaced in the UI under each ticket, with a link to a
   Sui explorer.

### Walrus integration

After the Sui transaction succeeds, Namitix:

1. Builds a `TicketMetadata` JSON object:

   ```jsonc
   {
     "eventId": "e1-...",
     "ownerAddress": "0x...",
     "purchaseDate": "2025-10-04T...Z",
     "txDigest": "...",
     "ticketId": "..."
   }
   ```

2. Calls `storeTicketMetadata` from `app/lib/walrusClient.ts`:
   - Issues a `PUT` request to the Walrus **publisher**:

     ```text
     https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=1
     ```

     (or `NEXT_PUBLIC_WALRUS_PUBLISHER_URL` if overridden).

   - Parses the response following the official
     `blob_upload_download_webapi` example and extracts the `blobId` from:

     - `storageInfo.alreadyCertified.blobId`, or
     - `storageInfo.newlyCreated.blobObject.blobId`.

   - Stores that `blobId` on the ticket.

3. Each ticket in **My Wallet** shows:

   - **Tx** – shortened `txDigest` with a link to a Sui explorer.
   - **BLOB** – the Walrus `blobId` as a clickable link to the Walrus
     **aggregator**:

     ```text
     https://aggregator.walrus-testnet.walrus.space/v1/blobs/<blobId>
     ```

### Reveal & verification

When the user clicks **“Reveal QR”** on a ticket:

1. `TicketView` calls `fetchTicketMetadata(blobId)` from `walrusClient.ts`.
   - This issues a `GET` request to:

     ```text
     https://aggregator.walrus-testnet.walrus.space/v1/blobs/<blobId>
     ```

     (or `NEXT_PUBLIC_WALRUS_AGGREGATOR_URL` if overridden).

   - The blob is expected to contain the same JSON `TicketMetadata` that was
     originally uploaded.

2. On success, the UI transitions from the "Encrypted / Protected by Seal"
   state to showing the QR code and the status `METADATA VERIFIED`.

This provides a complete story for judges: **on-chain provenance** via Sui,
plus **off-chain but verifiable storage** via Walrus, wired into a user-facing
ticket wallet.

---

## Tech Stack

- **Frontend**: Next.js (App Router), React, TailwindCSS.
- **Wallet / Blockchain**: `@mysten/dapp-kit`, Sui testnet.
- **Smart contracts**: Move package `contracts_namitix` with
  `namitix_ticket::Ticket` and `mint_ticket`.
- **Storage**: Walrus publisher + aggregator HTTP APIs on testnet.

For deeper architectural notes and development phases (including plans for
Seal encryption and Nautilus analytics jobs), see the **Future Work** section
below.

---

## Running Locally

### Prerequisites

- Node.js (LTS) and npm/yarn/pnpm.
- A Sui wallet (e.g. browser extension) connected to **Sui testnet** with some
  testnet SUI.

### Install and run

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

### Optional configuration

You can override the default Walrus endpoints with environment variables in
`.env.local`:

```bash
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

If these are not set, the defaults above are used.

---

## Future Work

- **Seal encryption** – encrypt ticket metadata with Seal before uploading to
  Walrus, and decrypt it during the reveal flow. This would turn Walrus into an
  encrypted data layer, aligning more strongly with the "Protected by Seal"
  UX.
- **Nautilus jobs** – background jobs that aggregate ticket metadata from
  Walrus/Sui and produce summary blobs or Sui objects for an organizer
  dashboard (unique wallets, tickets per event, etc.).
- **Organizer & check-in tools** – a verifier/check-in view that uses the
  ticket id, Sui tx digest, and Walrus blob to validate tickets at the door.

---

## Submission Notes (for Walrus Haulout judges)

- **Hackathon track fit**
  - Primary: **Data Security & Privacy**.
  - Also relevant: **Provably Authentic** (verifiable blobs linking to on-chain
    tickets).

- **What is implemented now**
  - Real Sui Move contract (`namitix_ticket::Ticket` + `mint_ticket`) deployed
    on **Sui testnet**.
  - Frontend calls this contract via `@mysten/dapp-kit` and displays tx digests
    with explorer links.
  - Ticket metadata JSON is uploaded to **Walrus testnet** publisher, and
    `blobId` is stored alongside the ticket in the UI.
  - My Wallet shows QR codes and a status `METADATA VERIFIED` when Walrus
    metadata fetch succeeds.
  - A `/app/verify` page lets organizers/auditors paste a `blobId` and confirm
    that the blob exists on the Walrus aggregator.

- **What is partially implemented**
  - On reconnect, the app queries Sui for all
    `namitix_ticket::Ticket { id, event_id, owner, blob_id }` objects owned by
    the connected address and restores them into My Wallet, decoding both the
    `event_id` and `blob_id` fields.
  - Existing tickets minted **before** the Walrus integration upgrade may have
    an empty `blob_id` field; these tickets appear in the wallet but do not
    show a Walrus blob id in the UI. Newly minted tickets store `blobId` both
    on-chain and in the frontend.

- **What is planned next (post-hackathon)**
  - Extend the on-chain `Ticket` or related objects with additional provenance
    fields (e.g. tx digest or issuer metadata) so explorers and third-party
    wallets can reconstruct even richer views from on-chain data alone.
  - Integrate Seal for client-side encryption of metadata before Walrus
    storage, and decryption on reveal.
  - Add Nautilus jobs that aggregate ticket data and power an organizer
    analytics dashboard.

- **How to evaluate the project quickly**
  1. Run the app locally (or open the deployed URL) and connect a Sui testnet
     wallet with some test SUI.
  2. Go to `/app` and purchase a ticket; confirm the Sui tx in your wallet.
  3. Open `/app/tickets` and verify that:
     - A new ticket appears with a tx digest and a Walrus BLOB link.
     - `Reveal QR` leads to `METADATA VERIFIED` once Walrus responds.
  4. Copy the blobId into `/app/verify` and confirm that Walrus returns 200 and
     that `Open blob` shows the raw JSON metadata.
  5. Optionally, reconnect the wallet and confirm that existing on-chain
     tickets are rediscovered in My Wallet.
