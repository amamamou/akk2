/** Dashboard design system — one product, one language. */

export const dashboardPageClass = "flex-1 overflow-auto bg-white dark:bg-zinc-900";

export const dashboardContainerClass = "mx-auto max-w-[1440px] px-8 pb-10 pt-12 space-y-8";

/** Seamless header → KPI transition (no divider). */
export const dashboardHeroSectionClass = "pb-1";

export const dashboardCardClass =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-zinc-700/60 dark:bg-zinc-900 dark:shadow-none";

/** Lighter grouping surface — structure without heavy card weight. */
export const dashboardSubtlePanelClass =
  "overflow-hidden rounded-2xl border border-gray-100/80 bg-gray-50/40 dark:border-zinc-800/80 dark:bg-zinc-900/40";

export const dashboardCardPadding = "p-6";

export const dashboardGridGap = "gap-6";

/** 8/4 command-center: main column + sidebar (Stripe / Datadog pattern). */
export const dashboardCommandLayout =
  "grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-6 [&>*]:min-w-0";

export const dashboardMainColumn = "flex flex-col gap-6 lg:col-span-8";

export const dashboardSidebarColumn = "flex flex-col gap-6 lg:col-span-4";

export const dashboardHalfRow =
  "grid grid-cols-1 items-start gap-6 lg:grid-cols-2 [&>*]:h-fit [&>*]:self-start [&>*]:w-full";

/** @deprecated use dashboardCommandLayout */
export const dashboardPrimarySidebarRow =
  "grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-6";

export const dashboardMutedSurface =
  "rounded-xl bg-gray-50 dark:bg-zinc-800/50";

/* ── Brand gradients ── */
export const dashboardAccentGradient =
  "linear-gradient(135deg, #18181B 0%, #24243A 45%, #A473FF 100%)";

export const dashboardBrandGradient =
  "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)";

export const dashboardAccentShadow = "shadow-[0_12px_40px_rgba(164,115,255,0.22)]";

export const dashboardBrandGlow = "shadow-[0_8px_32px_rgba(164,115,255,0.18)]";

export const dashboardAccentText = "text-[#A473FF]";

export const dashboardAccentBg = "bg-[#A473FF]";

export const dashboardAccentIcon = "text-[#8B5CF6]";

export const dashboardAccentProgress = "bg-[#A473FF]";

export const dashboardAccentProgressTrack = "bg-[#A473FF]/15 dark:bg-[#A473FF]/20";

export const dashboardAccentProgressGlow =
  "shadow-[0_0_12px_rgba(164,115,255,0.45)]";

/** Micro-accents — icon chips, dots, progress fills (subtle brand layer). */
export const dashboardIconChip =
  "flex shrink-0 items-center justify-center rounded-lg bg-[#A473FF]/[0.07] ring-1 ring-[#A473FF]/10 dark:bg-[#A473FF]/12 dark:ring-[#A473FF]/15";

export const dashboardAccentDot =
  "inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#202538] to-[#A473FF]";

export const dashboardAccentBar =
  "bg-gradient-to-r from-[#202538] via-[#8B5CF6] to-[#A473FF]";

export const dashboardTimelineLine =
  "bg-gradient-to-b from-[#A473FF]/30 via-gray-200 to-gray-200 dark:via-zinc-700 dark:to-zinc-700";

export const dashboardMetricAccent =
  "text-[#7C3AED] dark:text-[#A473FF]";

/* ── Semantic status colors ── */
export const statusOkText = "text-emerald-600 dark:text-emerald-500";
export const statusOkBg = "bg-emerald-50 dark:bg-emerald-950/25";
export const statusOkBorder = "border-emerald-200 dark:border-emerald-900/40";
export const statusOkDot = "bg-emerald-500";
export const statusOkPing = "bg-emerald-400";

export const statusWarnText = "text-amber-600 dark:text-amber-500";
export const statusWarnBg = "bg-amber-50 dark:bg-amber-950/25";
export const statusWarnBorder = "border-amber-200 dark:border-amber-900/40";
export const statusWarnDot = "bg-amber-400";

export const statusCriticalText = "text-rose-600 dark:text-rose-500";
export const statusCriticalBg = "bg-rose-50 dark:bg-rose-950/25";
export const statusCriticalDot = "bg-rose-500";

export const statusNeutralText = "text-gray-500 dark:text-zinc-400";
export const statusNeutralBg = "bg-gray-50 dark:bg-zinc-800/40";
export const statusNeutralDot = "bg-gray-300 dark:bg-zinc-600";

export const statusUpcomingText = "text-[#7C3AED] dark:text-[#A473FF]";
export const statusUpcomingBg = "bg-[#F4EDFF] dark:bg-[#A473FF]/10";
export const statusUpcomingBorder = "border-[#E9DBFF] dark:border-[#A473FF]/25";

/* ── Typography ── */
export const dashboardPanelTitle =
  "text-[15px] font-semibold tracking-tight text-gray-950 dark:text-zinc-100";

export const dashboardPanelSubtitle =
  "mt-0.5 text-xs text-gray-500 dark:text-zinc-400";

export const dashboardSectionLabel =
  "text-[10px] font-medium uppercase tracking-wider text-gray-400";

export const dashboardLinkAction =
  "text-[11px] font-medium text-gray-400 transition-colors hover:text-[#8B5CF6] dark:hover:text-[#A473FF]";

export const dashboardMetricValue = "text-gray-950 dark:text-zinc-100";

export const statusPulseSoft =
  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-20";
