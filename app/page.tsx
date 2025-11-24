"use client";

import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-black/5">
              <img
                src="/images/seagile.png"
                alt="Namitix logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-neuebit text-2xl tracking-tight text-slate-900">
              Nami<span className="text-teal-500">tix</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs md:text-sm font-neuebit uppercase tracking-wide hover:bg-slate-800 transition-colors"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-center">
        <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 md:grid-cols-[1.1fr_minmax(0,0.9fr)] items-center">
          <div>
            <h1 className="font-neuebit text-4xl md:text-6xl tracking-tight text-slate-900 mb-4">
              Encrypted tickets
              <br className="hidden md:block" /> on Sui + Walrus.
            </h1>
            <p className="text-slate-600 text-sm md:text-base max-w-xl mb-6">
              Namitix mints hackathon tickets as on-chain objects on Sui testnet
              and stores their metadata as blobs on Walrus. Each ticket links
              directly to its Sui transaction and Walrus blob for verifiable
              provenance.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="px-5 py-2.5 rounded-full bg-teal-500 text-white text-xs md:text-sm font-neuebit uppercase tracking-wide hover:bg-teal-600 transition-colors"
              >
                Launch Namitix
              </Link>
              <a
                href="https://github.com/deranalabs/namitix"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full border border-slate-300 text-xs md:text-sm text-slate-700 hover:bg-white font-neuebit uppercase tracking-wide"
              >
                View on GitHub
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-300/30 blur-3xl rounded-full" />
            <div className="relative bg-white border border-slate-200 rounded-3xl shadow-xl p-5 md:p-6 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-[0.2em] mb-1 font-neuebit">
                    Upcoming Event
                  </p>
                  <h2 className="font-neuebit text-lg text-slate-900">
                    Sui Basecamp 2025
                  </h2>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-mono border border-emerald-200">
                  VALID
                </span>
              </div>
              <div className="aspect-square rounded-2xl bg-slate-900 flex items-center justify-center mb-4">
                <div className="w-24 h-24 bg-slate-50 rounded-md flex items-center justify-center">
                  <div className="w-16 h-16 bg-slate-900" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mb-1 font-mono">
                On-chain Tx · Walrus Blob
              </p>
              <p className="text-[11px] text-slate-600 font-mono break-all mb-4">
                tx: 0x... · blob: walrus://...
              </p>
              <p className="text-[11px] text-slate-500">
                Connect your Sui wallet, mint a ticket, and verify its metadata
                directly on Walrus.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

