"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { EventCard } from "./components/EventCard";
import { TicketView } from "./components/TicketView";
import { Event, Ticket } from "./types";
import { toTicketMetadata, storeTicketMetadata } from "./lib/walrusClient";
import {
  Loader2,
  CheckCircle2,
  Database,
  Ticket as TicketIcon,
  AlertCircle,
} from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

// --- MOCK DATA ---
const MOCK_EVENTS: Event[] = [
  {
    id: "e1",
    title: "Sui Basecamp 2025",
    date: "2025-04-10T09:00:00",
    location: "Paris, France",
    price: 50,
    imageUrl: "/images/suibasecamp-2025.png",
    blobId: "9kgX...v8Js",
  },
  {
    id: "e2",
    title: "Walrus Builder Day",
    date: "2025-05-15T10:00:00",
    location: "San Francisco, CA",
    price: 0,
    imageUrl: "/images/walrusbuilder-day.png",
    blobId: "3mPz...kL9x",
  },
  {
    id: "e3",
    title: "Web3 Gaming Summit",
    date: "2025-06-20T13:00:00",
    location: "Singapore",
    price: 120,
    imageUrl: "/images/web3gaming-summit.png",
    blobId: "7fR2...qW4m",
  },
  {
    id: "e4",
    title: "DeFi Night",
    date: "2025-04-12T20:00:00",
    location: "New York, NY",
    price: 25,
    imageUrl: "/images/definight.png",
    blobId: "2hL5...nB1v",
  },
];

// --- PROCESSING MODAL COMPONENT ---
interface ProcessingModalProps {
  step: "idle" | "sui" | "walrus" | "complete";
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({ step }) => {
  if (step === "idle") return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
        <h3 className="font-neuebit text-2xl mb-6 text-center text-slate-900">
          {step === "complete" ? "Purchase Successful!" : "Processing Ticket"}
        </h3>

        <div className="space-y-6">
          {/* Step 1: Sui Payment */}
          <div
            className={`flex items-center gap-4 transition-all duration-300 ${
              step === "sui" ? "opacity-100 scale-100" : "opacity-50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === "sui"
                  ? "bg-black text-white"
                  : step === "walrus" || step === "complete"
                  ? "bg-teal-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step === "sui" ? (
                <Loader2 className="animate-spin" />
              ) : step === "walrus" || step === "complete" ? (
                <CheckCircle2 />
              ) : (
                <div className="w-3 h-3 bg-current rounded-full" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Sui Blockchain</p>
              <p className="text-xs text-slate-500">
                {step === "sui"
                  ? "Confirming transaction..."
                  : "Transaction confirmed"}
              </p>
            </div>
          </div>

          {/* Step 2: Walrus Storage */}
          <div
            className={`flex items-center gap-4 transition-all duration-300 ${
              step === "walrus"
                ? "opacity-100 scale-100"
                : step === "sui"
                ? "opacity-40"
                : "opacity-50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === "walrus"
                  ? "bg-black text-white"
                  : step === "complete"
                  ? "bg-teal-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step === "walrus" ? (
                <Database className="animate-pulse" />
              ) : step === "complete" ? (
                <CheckCircle2 />
              ) : (
                <div className="w-3 h-3 bg-current rounded-full" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Walrus Storage</p>
              <p className="text-xs text-slate-500">
                {step === "walrus"
                  ? "Encrypting & storing metadata..."
                  : step === "complete"
                  ? "Metadata stored securely"
                  : "Waiting for payment"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
interface AppProps {
  initialView?: "browse" | "wallet";
}

export default function App({ initialView = "browse" }: AppProps) {
  const [currentView, setCurrentView] = useState<"browse" | "wallet">(
    initialView,
  );
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [processingStep, setProcessingStep] = useState<
    "idle" | "sui" | "walrus" | "complete"
  >("idle");
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [showWalletNotice, setShowWalletNotice] = useState(false);

  const handleBuyTicket = async (event: Event) => {
    if (!currentAccount) {
      setShowWalletNotice(true);
      return;
    }

    setShowWalletNotice(false);

    // 1. Start Sui on-chain transaction on testnet (mint Namitix ticket object)
    setProcessingStep("sui");

    let txDigest: string | undefined;
    try {
      const tx = new Transaction();
      // Encode event id and (for now) empty blob id as bytes for the Move function
      const eventIdBytes = Array.from(new TextEncoder().encode(event.id));
      const emptyBlobIdBytes: number[] = [];

      tx.moveCall({
        target:
          "0x66e74e301666655b56fd4f9366a6e883669442f763557824969bf5a247d14eb6::namitix_ticket::mint_ticket",
        arguments: [
          tx.pure.vector("u8", eventIdBytes),
          tx.pure.vector("u8", emptyBlobIdBytes),
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx,
        chain: "sui:testnet",
      });

      txDigest = result.digest;
    } catch (error) {
      console.error("Sui transaction failed", error);
      setProcessingStep("idle");
      return;
    }

    // 2. Walrus storage: prepare metadata and try to store it via Walrus client
    const baseTicket: Ticket = {
      id: `${event.id}-${Date.now().toString(36).toUpperCase()}`,
      eventId: event.id,
      purchaseDate: new Date().toISOString(),
      ownerAddress: currentAccount.address,
      isRevealed: false,
      txDigest,
    };

    let blobId: string | undefined;
    try {
      const metadata = toTicketMetadata(baseTicket);
      blobId = await storeTicketMetadata(metadata);
    } catch (error) {
      console.error("Walrus storage failed", error);
    }

    // 3. Simulate Walrus step in UI, then add ticket with optional blobId
    setProcessingStep("walrus");

    setTimeout(() => {
      const newTicket: Ticket = {
        ...baseTicket,
        blobId,
      };

      setTickets((prev) => [...prev, newTicket]);
      setProcessingStep("complete");

      setTimeout(() => {
        setProcessingStep("idle");
        setCurrentView("wallet");
      }, 1500);
    }, 2000); // Walrus delay
  };

  // Load on-chain tickets for the connected wallet on mount / account change.
  useEffect(() => {
    const loadTickets = async () => {
      if (!currentAccount) {
        setTickets([]);
        return;
      }

      try {
        const objects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType:
              "0x66e74e301666655b56fd4f9366a6e883669442f763557824969bf5a247d14eb6::namitix_ticket::Ticket",
          },
          options: {
            showContent: true,
          },
        });

        const loaded: Ticket[] = [];

        for (const obj of objects.data) {
          const content = obj.data?.content;
          if (content?.dataType !== "moveObject") continue;

          const fields: any = content.fields;

          const eventIdBytes = fields.event_id as number[] | undefined;
          const eventId = eventIdBytes
            ? new TextDecoder().decode(Uint8Array.from(eventIdBytes))
            : "";

          const matchingEvent = MOCK_EVENTS.find((e) => e.id === eventId);
          if (!matchingEvent) continue;

          loaded.push({
            id: String(fields.id.id),
            eventId,
            purchaseDate: new Date().toISOString(),
            ownerAddress: currentAccount.address,
            isRevealed: false,
            // We currently do not store txDigest/blobId on-chain; they are
            // only available for newly purchased tickets in this session.
          });
        }

        setTickets((existing) => {
          // Merge: keep existing session tickets (with txDigest/blobId) and
          // add any on-chain tickets that are not yet in state.
          const existingIds = new Set(existing.map((t) => t.id));
          const merged = [...existing];
          for (const t of loaded) {
            if (!existingIds.has(t.id)) {
              merged.push(t);
            }
          }
          return merged;
        });
      } catch (error) {
        console.error("Failed to load on-chain tickets", error);
      }
    };

    loadTickets();
  }, [currentAccount, suiClient]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-200/40">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        ticketCount={tickets.length}
      />

      <main className="mx-auto max-w-6xl px-4 py-12">
        {showWalletNotice && (
          <div className="mb-6 rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-teal-500" />
              <span className="text-slate-700">
                Connect your Sui wallet to purchase and manage tickets.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowWalletNotice(false)}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {currentView === "browse" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h1 className="font-neuebit text-3xl md:text-5xl mb-3 tracking-tight text-slate-900">
                Upcoming Events
              </h1>
              <p className="text-slate-500">
                Discover and collect tickets on the decentralized web.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {MOCK_EVENTS.map((event) => (
                <EventCard key={event.id} event={event} onBuy={handleBuyTicket} />
              ))}
            </div>

            <p className="mt-6 text-[11px] md:text-xs text-slate-400 text-center">
              All tickets are minted on Sui testnet and their metadata is stored as
              blobs on Walrus. Each purchase creates a new on-chain ticket object
              and a Walrus blob that you can verify later.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
              <h1 className="font-neuebit text-3xl md:text-5xl mb-3 tracking-tight text-slate-900">
                My Wallet
              </h1>
              <p className="text-slate-500">Manage your encrypted tickets.</p>
              {tickets.length > 0 && (
                <p className="text-[11px] md:text-xs text-slate-400 mt-2">
                  You have {tickets.length} ticket{tickets.length > 1 ? "s" : ""}
                  . Each ticket links to a Sui transaction and a Walrus blob.
                </p>
              )}
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-white">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TicketIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">
                  No tickets yet
                </h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Purchase your first ticket to see the Walrus integration in
                  action.
                </p>
                <button
                  onClick={() => setCurrentView("browse")}
                  className="px-6 py-2 rounded-full font-neuebit text-xs md:text-sm uppercase tracking-wide bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tickets.map((ticket) => {
                  const event = MOCK_EVENTS.find((e) => e.id === ticket.eventId);
                  if (!event) return null;
                  return <TicketView key={ticket.id} ticket={ticket} event={event} />;
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <ProcessingModal step={processingStep} />
    </div>
  );
}

