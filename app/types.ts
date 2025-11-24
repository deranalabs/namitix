export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  price: number;
  imageUrl: string;
  blobId: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  purchaseDate: string;
  ownerAddress: string;
  isRevealed: boolean;
  txDigest?: string;
  blobId?: string;
}
