"use client";

import React from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";

interface PlaylistOption { id: string; title: string }

interface Props {
  // sort
  sortBy: 'added'|'title'|'duration';
  sortDir: 'desc'|'asc';
  sortOpen: boolean;
  setSortOpen: (b:boolean)=>void;
  setSortBy: (s:'added'|'title'|'duration')=>void;
  setSortDir: (d:'desc'|'asc')=>void;
  // component will manage its own refs for popovers

  // singer
  singerFilter: string | null;
  singerOpen: boolean;
  singerQuery: string;
  singerOptions: string[];
  setSingerFilter: (s:string|null)=>void;
  setSingerOpen: (b:boolean)=>void;
  setSingerQuery: (s:string)=>void;

  // date — props retained for compatibility with the caller, but the dead Date sort/filter
  // UI has been removed (MediaInfo has no createdAt, so date filtering always returned empty).
  datePickerOpen: boolean;
  customDate: string | null;
  dateFilterType: 'all'|'last7'|'last30'|'custom';
  calendarMonth: Date;
  setCalendarMonth: (d:Date)=>void;
  setDatePickerOpen: (b:boolean)=>void;
  setCustomDate: (d:string|null)=>void;
  setDateFilterType: (t:'all'|'last7'|'last30'|'custom')=>void;
  monthDays: (y:number,m:number)=>Array<{day:number|null;date?:string}>;
  formatDateLabel: (iso:string|null)=>string|null;

  // playlist
  playlistFilter: string | null;
  playlistOpen: boolean;
  playlistQuery: string;
  playlistOptions: PlaylistOption[];
  setPlaylistFilter: (s:string|null)=>void;
  setPlaylistOpen: (b:boolean)=>void;
  setPlaylistQuery: (s:string)=>void;
  setActiveCategory: (c:string)=>void;

  // creator
  creatorFilter: string | null;
  creatorOpen: boolean;
  creatorQuery: string;

  creatorOptions: string[];
  setCreatorFilter: (s:string|null)=>void;
  setCreatorOpen: (b:boolean)=>void;
  setCreatorQuery: (s:string)=>void;
}

export default function AudioTriageBar(props: Props) {
  const {
    sortBy, sortDir, setSortOpen, setSortBy, setSortDir,
  } = props;

  // Sort segmented control retains only the functional controllers (Title / Duration).
  // The "Date" option and the date-range dropdown were removed because the API MediaInfo
  // object has no timestamp, so they produced empty result sets.

  return (
    <div className="px-4 sm:px-8 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort segmented control */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md shadow-sm bg-white border border-gray-100">
            <button
              onClick={() => setSortBy('title')}
              className={cn(
                'px-3 py-1 text-sm font-medium focus:outline-none',
                sortBy === 'title' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              )}
              aria-pressed={sortBy === 'title'}
            >
              Title
            </button>
            <button
              onClick={() => setSortBy('duration')}
              className={cn(
                'px-3 py-1 text-sm font-medium focus:outline-none',
                sortBy === 'duration' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              )}
              aria-pressed={sortBy === 'duration'}
            >
              Duration
            </button>
          </div>

          <button
            onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
            className="ml-2 p-2 rounded-md border border-gray-100 bg-white text-gray-600 hover:bg-gray-50"
            title={sortDir === 'desc' ? 'Sort descending' : 'Sort ascending'}
            aria-label={sortDir === 'desc' ? 'Sort descending' : 'Sort ascending'}
          >
            {sortDir === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {/* Right: active filter badges and reset */}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            {props.singerFilter && (<div className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-800">Singer: {props.singerFilter}</div>)}
            {props.playlistFilter && (<div className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-800">Playlist: {props.playlistFilter}</div>)}
            {props.creatorFilter && (<div className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-800">Creator: {props.creatorFilter}</div>)}
          </div>
          {
            // show the reset action only when there are active filters
            (!!props.singerFilter || !!props.playlistFilter || !!props.creatorFilter) && (
              <button
                onClick={() => {
                  // singer
                  (props as Partial<Props>).setSingerFilter?.(null);
                  (props as Partial<Props>).setSingerQuery?.('');
                  (props as Partial<Props>).setSingerOpen?.(false);
                  // playlist
                  (props as Partial<Props>).setPlaylistFilter?.(null);
                  (props as Partial<Props>).setPlaylistQuery?.('');
                  (props as Partial<Props>).setPlaylistOpen?.(false);
                  (props as Partial<Props>).setActiveCategory?.('All');
                  // creator
                  (props as Partial<Props>).setCreatorFilter?.(null);
                  (props as Partial<Props>).setCreatorQuery?.('');
                  (props as Partial<Props>).setCreatorOpen?.(false);
                  // sort defaults
                  setSortBy('title');
                  setSortDir('desc');
                  setSortOpen(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-2"
              >
                <RefreshCw size={14} className="text-gray-500" />
                Reset filters
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
}
