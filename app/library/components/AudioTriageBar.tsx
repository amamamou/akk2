"use client";

import React from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import { LIBRARY_TAG_FILTERS } from "@/lib/audio-library-tags";

interface PlaylistOption { id: string; title: string }

interface Props {
  activeCategory: string;
  // sort
  sortBy: 'added'|'title'|'duration';
  sortDir: 'desc'|'asc';
  sortOpen: boolean;
  setSortOpen: (b:boolean)=>void;
  setSortBy: (s:'added'|'title'|'duration')=>void;
  setSortDir: (d:'desc'|'asc')=>void;

  // singer
  singerFilter: string | null;
  singerOpen: boolean;
  singerQuery: string;
  singerOptions: string[];
  setSingerFilter: (s:string|null)=>void;
  setSingerOpen: (b:boolean)=>void;
  setSingerQuery: (s:string)=>void;

  // date — props retained for compatibility with the caller
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

function activeTagName(activeCategory: string): string | null {
  if (!activeCategory.startsWith("tag:")) return null;
  return activeCategory.slice(4) || null;
}

export default function AudioTriageBar(props: Props) {
  const {
    activeCategory,
    sortBy,
    sortDir,
    setSortOpen,
    setSortBy,
    setSortDir,
    setActiveCategory,
  } = props;

  const selectedTag = activeTagName(activeCategory);

  const toggleTag = (tag: string) => {
    const token = `tag:${tag}`;
    if (activeCategory === token) {
      setActiveCategory("All");
    } else {
      setActiveCategory(token);
    }
  };

  const hasActiveFilters =
    !!props.singerFilter ||
    !!props.playlistFilter ||
    !!props.creatorFilter ||
    !!selectedTag;

  return (
    <div className="px-4 sm:px-8 py-3 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex flex-col gap-3">
        {/* Tag filter chips */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400">
            Tags
          </span>
          <div
            className="flex flex-1 items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin"
            role="group"
            aria-label="Filter by tag"
          >
            {LIBRARY_TAG_FILTERS.map((tag) => {
              const isActive = selectedTag?.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={isActive}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-[#A473FF] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

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

          {/* Active filter badges and reset */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {selectedTag && (
                <div className="px-2 py-1 rounded-full bg-[#F3EEFF] text-xs text-[#7C3AED]">
                  Tag: {selectedTag}
                </div>
              )}
              {props.singerFilter && (
                <div className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-800">
                  Singer: {props.singerFilter}
                </div>
              )}
              {props.playlistFilter && (
                <div className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-800">
                  Playlist: {props.playlistFilter}
                </div>
              )}
              {props.creatorFilter && (
                <div className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-800">
                  Creator: {props.creatorFilter}
                </div>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  props.setSingerFilter(null);
                  props.setSingerQuery('');
                  props.setSingerOpen(false);
                  props.setPlaylistFilter(null);
                  props.setPlaylistQuery('');
                  props.setPlaylistOpen(false);
                  setActiveCategory('All');
                  props.setCreatorFilter(null);
                  props.setCreatorQuery('');
                  props.setCreatorOpen(false);
                  setSortBy('title');
                  setSortDir('desc');
                  setSortOpen(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-2 shrink-0"
              >
                <RefreshCw size={14} className="text-gray-500" />
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
