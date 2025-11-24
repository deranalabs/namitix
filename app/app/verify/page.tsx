"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";
import { getWalrusBlobUrl } from "../../lib/walrusClient";
import { Navbar } from "../../components/Navbar";

export default function AppVerifyPage() {
  const [blobId, setBlobId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blobId.trim()) return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const url = getWalrusBlobUrl(blobId.trim());
      const res = await fetch(url);

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(
          `Walrus aggregator returned ${res.status} ${res.statusText}.`,
        );
        return;
      }

      setStatus("ok");
    } catch (error) {
      console.error("Verify blob failed", error);
      setStatus("error");
      setErrorMessage("Failed to reach Walrus aggregator.");
    }
  };

  const blobUrl = blobId.trim() ? getWalrusBlobUrl(blobId.trim()) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-200/40">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="mx-auto max-w-2xl w-full">
          <h1 className="font-neuebit text-3xl md:text-4xl tracking-tight text-slate-900 mb-3">
            Verify Walrus Blob
          </h1>
          <p className="text-slate-600 text-sm md:text-base mb-6 max-w-xl">
            Paste a Walrus blob ID from a Namitix ticket to quickly check if the
            blob exists on the Walrus testnet aggregator. This is a minimal
            check-in tool for organizers and auditors.
          </p>

          <form onSubmit={handleVerify} className="mb-6 space-y-3">
            <label className="block text-xs font-medium text-slate-600 uppercase tracking-[0.18em]">
              Walrus Blob ID
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={blobId}
                onChange={(e) => setBlobId(e.target.value)}
                placeholder="2dwWryNUc8p61nU3rLC3xJzCtmIQ6_7L3I_Nqj5gOa4"
                className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs md:text-sm font-neuebit uppercase tracking-wide bg-teal-500 text-white hover:bg-teal-600 transition-colors disabled:opacity-60"
                disabled={status === "loading"}
              >
                <Search className="w-4 h-4" />
                {status === "loading" ? "Checking..." : "Verify"}
              </button>
            </div>
          </form>

          {status !== "idle" && (
            <div className="rounded-2xl border bg-white px-4 py-3 text-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                {status === "ok" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <p className="font-medium text-slate-900">
                    {status === "ok"
                      ? "Blob found on Walrus aggregator."
                      : "Blob could not be verified."}
                  </p>
                  <p className="text-xs text-slate-500">
                    {status === "ok"
                      ? "You can open the blob in a new tab to inspect the raw ticket metadata JSON."
                      : errorMessage ?? "Double-check the blob ID and try again."}
                  </p>
                </div>
              </div>
              {status === "ok" && blobUrl && (
                <a
                  href={blobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-4 text-[11px] font-mono text-teal-600 hover:text-teal-700 underline underline-offset-2"
                >
                  Open blob
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
