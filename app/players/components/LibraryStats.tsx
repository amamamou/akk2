"use client";

import React from "react";
import { Music, Disc3 } from "lucide-react";
import Link from "next/link";

export default function LibraryStats({
  totalTracks = 6,
  totalPlaylists = 0,
}: {
  totalTracks?: number;
  totalPlaylists?: number;
}) {
  return (
    <Link href="/library">
      <div className="grid grid-cols-2 gap-3">
        {/* Tracks Card */}
        <div className="rounded-lg border border-gray-200 bg-white hover:shadow-md hover:border-gray-300 transition-all duration-150 cursor-pointer p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Disc3 size={16} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Total Tracks</p>
          <p className="text-lg font-semibold text-gray-900">{totalTracks}</p>
        </div>

        {/* Playlists Card */}
        <div className="rounded-lg border border-gray-200 bg-white hover:shadow-md hover:border-gray-300 transition-all duration-150 cursor-pointer p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Music size={16} className="text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Playlists</p>
          <p className="text-lg font-semibold text-gray-900">{totalPlaylists}</p>
        </div>
      </div>
    </Link>
  );
}
