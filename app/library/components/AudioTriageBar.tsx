"use client";

import React, { useEffect, useRef } from "react";
import { ChevronsUpDown, ChevronDown, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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

  // date
  datePickerOpen: boolean;
  
  customDate: string | null;
  dateFilterType: 'all'|'last7';
  calendarMonth: Date;
  setCalendarMonth: (d:Date)=>void;
  setDatePickerOpen: (b:boolean)=>void;
  setCustomDate: (d:string|null)=>void;
  setDateFilterType: (t:'all'|'last7')=>void;
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
    sortBy, sortDir, sortOpen, setSortOpen, setSortBy, setSortDir,
    singerFilter, singerOpen, singerQuery, singerOptions, setSingerFilter, setSingerOpen, setSingerQuery,
    datePickerOpen, customDate, dateFilterType, calendarMonth, setCalendarMonth, setDatePickerOpen, setCustomDate, setDateFilterType, monthDays, formatDateLabel,
    playlistFilter, playlistOpen, playlistQuery, playlistOptions, setPlaylistFilter, setPlaylistOpen, setPlaylistQuery, setActiveCategory,
    creatorFilter, creatorOpen, creatorQuery, creatorOptions, setCreatorFilter, setCreatorOpen, setCreatorQuery,
  } = props;
  
  const sortRef = useRef<HTMLDivElement | null>(null);
  const singerRef = useRef<HTMLDivElement | null>(null);
  const dateRef = useRef<HTMLDivElement | null>(null);
  const playlistRef = useRef<HTMLDivElement | null>(null);
  const creatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!sortRef.current) return;
      if (sortRef.current.contains(e.target as Node)) return;
      if (sortOpen) setSortOpen(false);
    };
    if (sortOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [sortOpen, setSortOpen]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!singerRef.current) return;
      if (singerRef.current.contains(e.target as Node)) return;
      if (singerOpen) setSingerOpen(false);
    };
    if (singerOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [singerOpen, setSingerOpen]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!dateRef.current) return;
      if (dateRef.current.contains(e.target as Node)) return;
      if (datePickerOpen) setDatePickerOpen(false);
    };
    if (datePickerOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [datePickerOpen, setDatePickerOpen]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!playlistRef.current) return;
      if (playlistRef.current.contains(e.target as Node)) return;
      if (playlistOpen) setPlaylistOpen(false);
    };
    if (playlistOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [playlistOpen, setPlaylistOpen]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!creatorRef.current) return;
      if (creatorRef.current.contains(e.target as Node)) return;
      if (creatorOpen) setCreatorOpen(false);
    };
    if (creatorOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [creatorOpen, setCreatorOpen]);
  return (
    <div className="px-8 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div ref={sortRef} className="relative inline-flex items-center">
            <button onClick={() => setSortOpen(!sortOpen)} className="inline-flex items-center gap-2 px-3 py-1 border border-gray-100 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50">
              <ChevronsUpDown className="text-gray-500" size={14} />
              <span>{sortBy === 'added' ? 'Date added' : sortBy === 'title' ? 'Title' : 'Duration'}</span>
              <ChevronDown className="text-gray-400" size={14} />
            </button>

            {sortOpen && (
              <div className="absolute top-full mt-2 left-0 w-40 bg-white border border-gray-100 rounded-md shadow-sm z-40">
                <button onClick={() => { setSortBy('added'); setSortOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Date added</button>
                <button onClick={() => { setSortBy('title'); setSortOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Title</button>
                <button onClick={() => { setSortBy('duration'); setSortOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Duration</button>
              </div>
            )}
          </div>

          <button
            onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
            className={cn(
              "p-1.5 rounded-md border border-gray-100 text-sm flex items-center justify-center bg-white text-gray-600 hover:bg-gray-50",
              sortDir === 'desc' ? 'rotate-0' : 'rotate-180'
            )}
            title="Toggle sort direction"
            aria-label="Toggle sort direction"
          >
            <span className="sr-only">Toggle sort direction</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform">
              <path d="M6 9l6-6 6 6" />
              <path d="M6 15l6 6 6-6" />
            </svg>
          </button>
        </div>

        <div className="relative" ref={singerRef}>
          <button onClick={() => setSingerOpen(!singerOpen)} className="inline-flex items-center gap-2 px-3 py-1 border border-gray-100 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50">
            <span>{singerFilter ?? 'Artist'}</span>
            <ChevronDown className="text-gray-400" size={14} />
          </button>

            {singerOpen && (
            <div className="absolute mt-2 left-0 w-64 bg-white border border-gray-100 rounded-md shadow-sm z-40 p-2">
              <input value={singerQuery} onChange={(e) => setSingerQuery(e.target.value)} placeholder="Search singers..." className="w-full px-2 py-1 text-sm border border-gray-100 rounded" />
              <div className="max-h-48 overflow-auto mt-2">
                <button onClick={() => { setSingerFilter(null); setSingerOpen(false); setSingerQuery(''); }} className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50">All singers</button>
                {singerOptions.filter((s) => s.toLowerCase().includes(singerQuery.toLowerCase())).map((s) => (
                  <button key={s} onClick={() => { setSingerFilter(s); setSingerOpen(false); setSingerQuery(''); }} className={cn('w-full text-left px-2 py-1 text-sm', singerFilter === s ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div ref={dateRef} className="relative inline-flex items-center divide-x divide-gray-100 rounded-md border border-gray-100 bg-white">
            <div
              className="flex items-center gap-2 px-3 py-1 cursor-pointer"
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDatePickerOpen(!datePickerOpen); } }}
            >
              <Calendar className="text-gray-500" size={14} />
                <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{customDate ? formatDateLabel(customDate) : 'Date'}</span>
                {customDate && (
                  <button onClick={(e) => { e.stopPropagation(); setCustomDate(null); }} aria-label="Clear date" className="text-xs text-gray-500 hover:text-gray-700">×</button>
                )}
              </div>
            </div>

              <div className="inline-flex items-center px-2">
              <button onClick={(e) => { e.stopPropagation(); setDateFilterType('all'); setCustomDate(null); }} className={cn("px-2 py-1 text-sm rounded-md", (dateFilterType === 'all' && !customDate) ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50')}>All</button>
              <button onClick={(e) => { e.stopPropagation(); setDateFilterType('last7'); setCustomDate(null); }} className={cn("px-2 py-1 ml-1 text-sm rounded-md", dateFilterType === 'last7' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50')}>7d</button>
            </div>

            <div className="pl-2 pr-3">
              <button onClick={(e) => { e.stopPropagation(); setDatePickerOpen(!datePickerOpen); }} className="p-1.5 rounded-md text-gray-600 hover:bg-gray-50"><ChevronDown size={14} /></button>
            </div>

            {datePickerOpen && (
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-64 bg-white border border-gray-100 rounded-lg shadow-lg ring-1 ring-black/5 z-40 p-4">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-l border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <button onClick={(e) => { e.stopPropagation(); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)); }} className="p-1 text-gray-600 hover:bg-gray-50 rounded">
                    <ChevronLeft size={16} />
                  </button>
              <div className="text-sm font-medium text-gray-800">{calendarMonth.toLocaleString(undefined, { month: 'long' })} {calendarMonth.getFullYear()}</div>
                  <button onClick={(e) => { e.stopPropagation(); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)); }} className="p-1 text-gray-600 hover:bg-gray-50 rounded">
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mt-3 text-xs text-center text-gray-500">{['Su','Mo','Tu','We','Th','Fr','Sa'].map((d)=> (<div key={d}>{d}</div>))}</div>

                <div className="grid grid-cols-7 gap-1 mt-2">{monthDays(calendarMonth.getFullYear(), calendarMonth.getMonth()).map((c,i)=>{ if(!c.day) return <div key={i} className="h-9" />; const isSelected = customDate === c.date; const isToday = new Date().toISOString().slice(0,10) === c.date; return (<button key={i} onClick={(e)=>{ e.stopPropagation(); setCustomDate(c.date ?? null); setDatePickerOpen(false); setDateFilterType('all'); }} className={cn("h-9 flex items-center justify-center rounded text-sm ", isSelected ? 'bg-gray-800 text-white' : isToday ? 'bg-gray-100 text-gray-800' : 'text-gray-700 hover:bg-gray-50')}>{c.day}</button>); })}</div>

                <div className="flex justify-between items-center mt-3"><button onClick={(e)=>{ e.stopPropagation(); setCustomDate(null); setDatePickerOpen(false); }} className="text-sm text-gray-600">Clear</button><button onClick={(e)=>{ e.stopPropagation(); setDatePickerOpen(false); }} className="text-sm text-gray-800">Close</button></div>
              </div>
            )}
          </div>

            <div className="relative ml-2" ref={playlistRef}>
            <button onClick={() => setPlaylistOpen(!playlistOpen)} className="inline-flex items-center gap-2 px-3 py-1 border border-gray-100 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50">
              <span>{playlistFilter ? playlistOptions.find(pl=>pl.id===playlistFilter)?.title ?? playlistFilter : 'Playlist'}</span>
              <ChevronDown className="text-gray-400" size={14} />
            </button>

            {playlistOpen && (
              <div className="absolute mt-2 left-0 w-64 bg-white border border-gray-100 rounded-md shadow-sm z-40 p-2">
                <input value={playlistQuery} onChange={(e) => setPlaylistQuery(e.target.value)} placeholder="Search playlists..." className="w-full px-2 py-1 text-sm border border-gray-100 rounded" />
                <div className="max-h-48 overflow-auto mt-2">
                  <button onClick={() => { setPlaylistFilter(null); setPlaylistOpen(false); setPlaylistQuery(''); setActiveCategory('All'); }} className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50">All playlists</button>
                  {playlistOptions.filter((pl) => pl.title.toLowerCase().includes(playlistQuery.toLowerCase())).map((pl) => (
                    <button key={pl.id} onClick={() => { setPlaylistFilter(pl.id); setPlaylistOpen(false); setPlaylistQuery(''); setActiveCategory(`pl:${pl.id}`); }} className={cn('w-full text-left px-2 py-1 text-sm', playlistFilter === pl.id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>
                      {pl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative ml-2" ref={creatorRef}>
            <button onClick={() => setCreatorOpen(!creatorOpen)} className="inline-flex items-center gap-2 px-3 py-1 border border-gray-100 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50">
              <span>{creatorFilter ?? 'Creator'}</span>
              <ChevronDown className="text-gray-400" size={14} />
            </button>

            {creatorOpen && (
              <div className="absolute mt-2 left-0 w-64 bg-white border border-gray-100 rounded-md shadow-sm z-40 p-2">
                <input value={creatorQuery} onChange={(e) => setCreatorQuery(e.target.value)} placeholder="Search creators..." className="w-full px-2 py-1 text-sm border border-gray-100 rounded" />
                <div className="max-h-48 overflow-auto mt-2">
                  <button onClick={() => { setCreatorFilter(null); setCreatorOpen(false); setCreatorQuery(''); }} className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50">All creators</button>
                  {creatorOptions.filter((c) => c.toLowerCase().includes(creatorQuery.toLowerCase())).map((c) => (
                    <button key={c} onClick={() => { setCreatorFilter(c); setCreatorOpen(false); setCreatorQuery(''); }} className={cn('w-full text-left px-2 py-1 text-sm', creatorFilter === c ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

            <div className="ml-auto flex items-center gap-2">
            <div className="text-xs text-gray-500">Showing</div>
            <div className="bg-gray-50 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">{sortBy === 'added' ? 'Added' : 'Title'}</div>
            <div className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{sortDir === 'desc' ? '↓' : '↑'}</div>
            {dateFilterType === 'last7' && (
              <div className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <span>Last 7d</span>
                <button onClick={(e) => { e.stopPropagation(); setDateFilterType('all'); setCustomDate(null); }} aria-label="Clear date filter" className="text-gray-400 hover:text-gray-700">×</button>
              </div>
            )}
            {customDate && (
              <div className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <span>{formatDateLabel(customDate)}</span>
                <button onClick={(e) => { e.stopPropagation(); setCustomDate(null); setDateFilterType('all'); }} aria-label="Clear custom date" className="text-gray-400 hover:text-gray-700">×</button>
              </div>
            )}
            {singerFilter && (
              <div className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <span className="truncate max-w-xs">{singerFilter}</span>
                <button onClick={(e) => { e.stopPropagation(); setSingerFilter(null); setSingerQuery(''); }} aria-label="Clear singer filter" className="text-gray-400 hover:text-gray-700">×</button>
              </div>
            )}
            {creatorFilter && (
              <div className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <span className="truncate max-w-xs">{creatorFilter}</span>
                <button onClick={(e) => { e.stopPropagation(); setCreatorFilter(null); setCreatorQuery(''); }} aria-label="Clear creator filter" className="text-gray-400 hover:text-gray-700">×</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
