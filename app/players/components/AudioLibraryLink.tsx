"use client";

import React from "react";
import { Music, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AudioLibraryLink() {
  return (
    <Link href="/library">
      <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-md hover:border-gray-300 transition-all duration-150 cursor-pointer p-6 flex items-center justify-between">
        {/* Left content */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center flex-shrink-0 group-hover:shadow-md transition-all">
            <Music size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Audio Library</h3>
            <p className="text-xs text-gray-500 mt-1">
              Manage your audio content and playlists
            </p>
          </div>
        </div>

        {/* Right arrow */}
        <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">
          <ArrowRight size={20} />
        </div>
      </div>
    </Link>
  );
}
