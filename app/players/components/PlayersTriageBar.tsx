"use client";

import React, { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
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
    sortBy, sortDir, sortOpen, setSortOpen, setSortBy, setSortDir,
    datePickerOpen, customDate, dateFilterType, calendarMonth, setCalendarMonth, setDatePickerOpen, setCustomDate, setDateFilterType, monthDays, formatDateLabel,
  } = props;

  const sortRef = useRef<HTMLDivElement | null>(null);
  const dateRef = useRef<HTMLDivElement | null>(null);
  const today = new Date();
  const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

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
      if (!dateRef.current) return;
      if (dateRef.current.contains(e.target as Node)) return;
      if (datePickerOpen) setDatePickerOpen(false);
    };
    if (datePickerOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [datePickerOpen, setDatePickerOpen]);

  // Improved triage layout:
  // - Left: segmented sort control (Added / Title / Duration) with clear active state
  // - Middle: compact date filter dropdown with quick ranges and inline calendar for Custom
  // - Right: status (Showing X) and a soft "Reset filters" action

  return (
    <div className="px-4 sm:px-8 py-3 ">
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort segmented control */}
        <div className="flex items-center gap-2" ref={sortRef}>
          <div className="inline-flex rounded-md shadow-sm bg-white border border-gray-100">
            <button
              onClick={() => setSortBy('added')}
                className={cn(
                  'px-3 py-1 text-sm font-medium focus:outline-none',
                  sortBy === 'added' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                )}
              aria-pressed={sortBy === 'added'}
            >
              Date
            </button>
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

        {/* Date filter dropdown */}
  <div className="relative" ref={dateRef}>
          <button
            onClick={() => setDatePickerOpen(!datePickerOpen)}
            className="inline-flex items-center gap-3 px-3 py-1 border border-gray-100 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <Calendar className="text-gray-500" size={16} />
            <div className="text-sm">
              {dateFilterType === 'all' && !customDate && 'All dates'}
              {dateFilterType === 'last7' && 'Last 7 days'}
              {dateFilterType === 'last30' && 'Last 30 days'}
              {customDate && formatDateLabel(customDate)}
            </div>
            <div className="text-gray-400">▾</div>
          </button>

          {datePickerOpen && (
            <div className="absolute top-full mt-2 left-0 w-72 bg-white border border-gray-100 rounded-lg shadow-lg z-40 p-3">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => { setDateFilterType('all'); setCustomDate(null); setDatePickerOpen(false); }} className={cn('px-2 py-1 rounded text-sm', dateFilterType === 'all' && !customDate ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>All</button>
                <button onClick={() => { setDateFilterType('last7'); setCustomDate(null); setDatePickerOpen(false); }} className={cn('px-2 py-1 rounded text-sm', dateFilterType === 'last7' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>7d</button>
                <button onClick={() => { setDateFilterType('last30'); setCustomDate(null); setDatePickerOpen(false); }} className={cn('px-2 py-1 rounded text-sm', dateFilterType === 'last30' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>30d</button>
                <button onClick={() => { setDateFilterType('custom'); setCustomDate(customDate); }} className={cn('ml-auto px-2 py-1 rounded text-sm border border-gray-100 hover:bg-gray-50')}>Custom</button>
              </div>

              {dateFilterType === 'custom' && (
                <div className="mt-1">
                  <div className="flex items-center justify-between">
                    <button onClick={(e) => { e.stopPropagation(); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)); }} className="p-1 text-gray-600 hover:bg-gray-50 rounded" aria-label="Previous month"><ChevronLeft size={16} /></button>
                    <div className="text-sm font-medium text-gray-800">{calendarMonth.toLocaleString(undefined, { month: 'long' })} {calendarMonth.getFullYear()}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                        // Prevent navigating into future months
                        if (next > startOfCurrentMonth) return;
                        setCalendarMonth(next);
                      }}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      aria-label="Next month"
                    ><ChevronRight size={16} /></button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mt-3 text-xs text-center text-gray-500">{['Su','Mo','Tu','We','Th','Fr','Sa'].map((d)=> (<div key={d}>{d}</div>))}</div>
                  <div className="grid grid-cols-7 gap-1 mt-2">{monthDays(calendarMonth.getFullYear(), calendarMonth.getMonth()).map((c,i)=>{
                    if(!c.day) return <div key={i} className="h-9" />;
                    const isSelected = customDate === c.date;
                    const isToday = new Date().toISOString().slice(0,10) === c.date;
                    const isFuture = c.date ? (new Date(c.date) > today) : false;
                    // Use a custom purple for the selected date (#A473FF). Use inline style to avoid Tailwind purging
                    const baseClass = cn("h-9 flex items-center justify-center rounded text-sm ",
                      isSelected ? 'text-white' : isToday ? 'bg-gray-100 text-gray-800' : 'text-gray-700 hover:bg-gray-50'
                    );
                    // If future, render disabled style
                    if (isFuture) {
                      return (<button key={i} aria-disabled={true} disabled className={cn("h-9 flex items-center justify-center rounded text-sm text-gray-300 cursor-not-allowed bg-white")}>{c.day}</button>);
                    }
                    // When selected, apply inline background color #A473FF
                    if (isSelected) {
                      return (<button key={i} onClick={(e)=>{ e.stopPropagation(); setCustomDate(c.date ?? null); setDatePickerOpen(false); setDateFilterType('custom'); }} className={baseClass} style={{ background: '#A473FF' }}>{c.day}</button>);
                    }
                    return (<button key={i} onClick={(e)=>{ e.stopPropagation(); setCustomDate(c.date ?? null); setDatePickerOpen(false); setDateFilterType('custom'); }} className={baseClass}>{c.day}</button>);
                  })}</div>

                  <div className="flex justify-between items-center mt-3"><button onClick={(e)=>{ e.stopPropagation(); setCustomDate(null); setDatePickerOpen(false); setDateFilterType('all'); }} className="text-sm text-gray-600">Clear</button><button onClick={(e)=>{ e.stopPropagation(); setDatePickerOpen(false); }} className="text-sm text-gray-800">Close</button></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: status and reset */}
  <div className="ml-auto flex items-center gap-3">
          {/* Active filter badges */}
          <div className="flex items-center gap-2">
            {dateFilterType !== 'all' && (<div className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-800">{dateFilterType === 'last7' ? '7d' : dateFilterType === 'last30' ? '30d' : 'Custom'}</div>)}
            {props.singerFilter && (<div className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-800">Singer: {props.singerFilter}</div>)}
            {props.playlistFilter && (<div className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-800">Playlist: {props.playlistFilter}</div>)}
            {props.creatorFilter && (<div className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-800">Creator: {props.creatorFilter}</div>)}
          </div>
              {
                // show the reset action only when there are active filters
                (dateFilterType !== 'all' || customDate !== null || !!props.singerFilter || !!props.playlistFilter || !!props.creatorFilter) && (
                  <button
                    onClick={() => {
                      // reset all filter state we have access to
                      setDateFilterType('all');
                      setCustomDate(null);
                      setDatePickerOpen(false);
                      // singer (if caller provided setters)
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
                      setSortBy('added');
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
