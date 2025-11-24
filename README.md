# Namitix – Encrypted Tickets on Sui + Walrus

Namitix is a minimal ticketing dApp built for the **Walrus Haulout Hackathon**.
It showcases an end-to-end flow where each ticket purchase:

- Mints a `Ticket` object on **Sui testnet** via a custom Move module.
- Stores ticket metadata as a JSON blob on **Walrus**.
- Verifies and displays the metadata on ticket reveal.

The goal is to demonstrate **data security and verifiable storage** by combining
Sui smart contracts with Walrus blobs, with a UX that feels like a modern event
ticket wallet.

---

## Demo & Key Links

- App (local dev): http://localhost:3000
- GitHub repository: https://github.com/deranalabs/namitix
- Detailed build notes: [`Build.md`](./Build.md)
- Example Sui transaction: _add a real tx link here before submission_
- Example Walrus blob: _add a real Walrus aggregator URL here before submission_

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
Seal encryption and Nautilus analytics jobs), see [`Build.md`](./Build.md).

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
