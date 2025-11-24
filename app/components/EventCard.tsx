"use client";

import React from "react";
import { Calendar, MapPin, Zap } from "lucide-react";
import { Event } from "../types";

interface EventCardProps {
  event: Event;
  onBuy: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onBuy }) => {
  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-teal-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-slate-200">
          <span className="font-neuebit text-[11px] md:text-xs tracking-wide text-slate-900">
            {event.price} SUI
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <div className="text-teal-400 text-[10px] md:text-xs font-mono mb-3 flex items-center gap-2 opacity-80">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          BLOB: {event.blobId}
        </div>

        <h3 className="font-neuebit text-lg md:text-3xl text-white mb-3 leading-tight drop-shadow-sm">
          {event.title}
        </h3>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-slate-100 text-sm">
            <Calendar className="w-4 h-4 text-slate-200" />
            {new Date(event.date).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="flex items-center gap-2 text-slate-100 text-sm">
            <MapPin className="w-4 h-4 text-slate-200" />
            {event.location}
          </div>
        </div>

        <button
          onClick={() => onBuy(event)}
          className="w-full bg-teal-500 text-white py-3 rounded-xl font-neuebit text-xs md:text-sm uppercase tracking-wide hover:bg-teal-600 transition-colors duration-300 flex items-center justify-center gap-2 shadow-sm"
        >
          <Zap className="w-4 h-4" />
          Buy Ticket
        </button>
      </div>
    </div>
  );
};

