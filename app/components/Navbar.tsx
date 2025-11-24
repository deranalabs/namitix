"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@mysten/dapp-kit";

interface NavbarProps {
  currentView?: "browse" | "wallet";
  setCurrentView?: (view: "browse" | "wallet") => void;
  ticketCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  ticketCount,
}) => {
  const router = useRouter();

  const handleMyTicketsClick = () => {
    if (setCurrentView) {
      setCurrentView("wallet");
    } else {
      router.push("/app/tickets");
    }
  };

  const handleBrandClick = () => {
    if (setCurrentView) {
      setCurrentView("browse");
    } else {
      router.push("/app");
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-3 group focus:outline-none"
          onClick={handleBrandClick}
          aria-label="Go to events browse view"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg overflow-hidden flex items-center justify-center bg-black/5 group-hover:shadow-[0_0_15px_rgba(45,212,191,0.4)] transition-all">
            <img
              src="/images/seagile.png"
              alt="Namitix logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-neuebit text-2xl md:text-3xl tracking-tight leading-none text-slate-900">
            Nami<span className="text-teal-500">tix</span>
          </span>
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={handleMyTicketsClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs md:text-sm font-neuebit uppercase tracking-wide transition-colors ${
              currentView === "wallet"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>My Tickets</span>
            {(ticketCount ?? 0) > 0 && (
              <span className="bg-teal-500 text-[10px] px-1.5 py-0.5 rounded-full text-white min-w-[1.25rem] text-center">
                {ticketCount}
              </span>
            )}
          </button>

          <Link
            href="/app/verify"
            className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-full border border-slate-200 text-xs md:text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-neuebit uppercase tracking-wide"
          >
            Verify
          </Link>

          <div
            className="flex items-center"
            style={{
              fontFamily:
                'PPNeueBit, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            <ConnectButton
              className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm uppercase tracking-wide transition-colors !bg-slate-900 !text-white !border-transparent hover:!bg-slate-800 hover:!text-white"
              style={{
                fontFamily:
                  'PPNeueBit, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};
