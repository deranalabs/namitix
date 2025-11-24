// Client skeleton for integrating with Walrus storage.
// Fill in the HTTP/API calls based on the official Walrus docs:
// https://github.com/MystenLabs/walrus

import type { Ticket } from "../types";

// Default Walrus testnet endpoints from official docs example.
const DEFAULT_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";
const DEFAULT_AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";

const PUBLISHER_URL =
  process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL ?? DEFAULT_PUBLISHER_URL;
const AGGREGATOR_URL =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ?? DEFAULT_AGGREGATOR_URL;

export interface TicketMetadata {
  eventId: string;
  ownerAddress: string;
  purchaseDate: string;
  txDigest?: string;
  ticketId: string;
}

/** Build a public URL to view a Walrus blob via the configured aggregator. */
export function getWalrusBlobUrl(blobId: string): string {
  return `${AGGREGATOR_URL}/v1/blobs/${blobId}`;
}

/**
 * Map a Ticket from the app into the metadata shape that will be
 * stored in Walrus. Extend this as needed when you add more fields.
 */
export function toTicketMetadata(ticket: Ticket): TicketMetadata {
  return {
    eventId: ticket.eventId,
    ownerAddress: ticket.ownerAddress,
    purchaseDate: ticket.purchaseDate,
    txDigest: ticket.txDigest,
    ticketId: ticket.id,
  };
}

/**
 * Store ticket metadata in Walrus and return a real blobId.
 *
 * Uses the Walrus publisher HTTP API, following the official
 * blob_upload_download_webapi example. By default it targets the
 * public Walrus testnet publisher, but you can override the URLs
 * via NEXT_PUBLIC_WALRUS_PUBLISHER_URL.
 */
export async function storeTicketMetadata(
  metadata: TicketMetadata,
): Promise<string> {
  if (!PUBLISHER_URL) {
    throw new Error("Walrus publisher URL is not configured");
  }

  // We store ticket metadata as a JSON blob.
  const json = JSON.stringify(metadata);
  const body = new Blob([json], { type: "application/json" });

  const epochs = 1; // keep for one Walrus epoch; adjust if needed

  const response = await fetch(
    `${PUBLISHER_URL}/v1/blobs?epochs=${epochs}`,
    {
      method: "PUT",
      body,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Walrus store failed: ${response.status} ${response.statusText}`,
    );
  }

  const storageInfo = await response.json();

  // Mirror the logic from the official example: handle both
  // newlyCreated and alreadyCertified shapes.
  if ("alreadyCertified" in storageInfo) {
    return storageInfo.alreadyCertified.blobId as string;
  }

  if ("newlyCreated" in storageInfo) {
    return storageInfo.newlyCreated.blobObject.blobId as string;
  }

  throw new Error("Unexpected Walrus response shape when storing blob");
}

/**
 * Fetch ticket metadata from Walrus given a blobId.
 */
export async function fetchTicketMetadata(
  blobId: string,
): Promise<TicketMetadata> {
  if (!AGGREGATOR_URL) {
    throw new Error("Walrus aggregator URL is not configured");
  }

  const response = await fetch(`${AGGREGATOR_URL}/v1/blobs/${blobId}`);

  if (!response.ok) {
    throw new Error(
      `Walrus fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  // We expect the blob to contain the JSON we previously stored.
  const text = await response.text();

  try {
    const parsed = JSON.parse(text) as TicketMetadata;
    return parsed;
  } catch (error) {
    throw new Error("Walrus blob is not valid TicketMetadata JSON");
  }
}
