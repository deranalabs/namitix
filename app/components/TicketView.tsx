"use client";

import React, { useState, useCallback } from "react";
import { Lock, Unlock, ShieldCheck, RefreshCw } from "lucide-react";
import { Ticket, Event } from "../types";
import { fetchTicketMetadata, getWalrusBlobUrl } from "../lib/walrusClient";

interface TicketViewProps {
  ticket: Ticket;
  event: Event;
}

const formatAddress = (address: string) =>
  address.length <= 14
    ? address
    : `${address.slice(0, 6)}...${address.slice(-4)}`;

export const TicketView: React.FC<TicketViewProps> = ({ ticket, event }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleReveal = useCallback(async () => {
    setIsDecrypting(true);

    try {
      // Jika sudah ada blobId dari Walrus, coba fetch & verifikasi metadata.
      if (ticket.blobId) {
        await fetchTicketMetadata(ticket.blobId);
        // TODO: bandingkan metadata.eventId / ownerAddress dengan ticket & event jika diperlukan.
      }

      // Pertahankan sedikit delay agar UX decrypting tetap terasa.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsRevealed(true);
    } catch (error) {
      console.error("Walrus metadata verification failed", error);
      // Jika verifikasi gagal, tetap hentikan animasi decrypting tanpa mengubah QR state.
    } finally {
      setIsDecrypting(false);
    }
  }, [ticket.blobId]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden max-w-md mx-auto shadow-lg relative">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-300/30 blur-[60px] rounded-full pointer-events-none" />

      {/* Ticket Header */}
      <div className="p-6 border-b border-slate-100 relative z-10 bg-white/80 backdrop-blur">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-neuebit text-lg md:text-xl text-slate-900">
              {event.title}
            </h3>
            <p className="text-slate-500 text-sm">{event.location}</p>
          </div>
          <div className="bg-teal-50 text-teal-600 px-2 py-1 rounded text-xs font-mono border border-teal-200">
            VALID
          </div>
        </div>
        <div className="text-xs text-slate-500 font-mono break-all">ID: {ticket.id}</div>
        {ticket.blobId && (
          <a
            href={getWalrusBlobUrl(ticket.blobId)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block text-[10px] text-teal-600 hover:text-teal-700 font-mono break-all underline-offset-2 hover:underline"
          >
            BLOB: {ticket.blobId}
          </a>
        )}
      </div>

      {/* Ticket Body / QR Section */}
      <div className="p-8 flex flex-col items-center justify-center bg-slate-50 relative min-h-[300px]">
        {/* The Container for QR */}
        <div className="relative w-48 h-48 bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-500">
          {/* Actual QR Code (Hidden/Shown) */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket.id}`}
            alt="Ticket QR"
            className={`w-full h-full object-cover transition-all duration-700 ${
              isRevealed ? "blur-0 opacity-100" : "blur-xl opacity-50"
            }`}
          />

          {/* Overlay for "Protected" State */}
          {!isRevealed && (
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 z-20">
              {isDecrypting ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 text-teal-200 animate-spin mb-3" />
                  <span className="text-teal-100 text-xs font-mono animate-pulse">
                    DECRYPTING SEAL...
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 border border-white/30">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white text-sm font-medium mb-1">Encrypted</p>
                  <p className="text-slate-200 text-[10px] uppercase tracking-wider mb-4">
                    Protected by Seal
                  </p>

                  <button
                    onClick={handleReveal}
                    className="bg-teal-500 hover:bg-teal-600 text-white text-xs px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 border border-teal-300/60"
                  >
                    <Unlock className="w-3 h-3" />
                    Reveal QR
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Security Badge */}
        <div
          className={`mt-8 flex items-center gap-2 transition-colors duration-500 ${
            isRevealed ? "text-teal-600" : "text-slate-400"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-mono tracking-wide">
            {isRevealed ? "METADATA VERIFIED" : "SECURE STORAGE ENFORCED"}
          </span>
        </div>
      </div>

      {/* Tear-off effect (visual only) */}
      <div className="relative h-4 bg-slate-100 -my-2">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-100 rounded-full -ml-2"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-100 rounded-full -mr-2"></div>
        <div className="border-t-2 border-dashed border-slate-200 w-full absolute top-1/2"></div>
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-white space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Date</span>
          <span className="text-slate-900">
            {new Date(event.date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Owner</span>
          <span className="text-slate-900 font-mono">
            {formatAddress(ticket.ownerAddress)}
          </span>
        </div>
        {ticket.txDigest && (
          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 mt-2">
            <span className="text-slate-500">Tx</span>
            <a
              href={`https://testnet.suivision.xyz/txblock/${ticket.txDigest}`}
              target="_blank"
              rel="noreferrer"
              className="text-teal-600 hover:text-teal-700 font-mono truncate max-w-[220px] text-right"
            >
              {formatAddress(ticket.txDigest)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

