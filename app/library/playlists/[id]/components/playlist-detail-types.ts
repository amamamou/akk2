export type TrackPreviewState = {
  isPreviewing: boolean;
  isPlaying: boolean;
  streamError: string | null;
};

export type PreviewPlayerState = {
  trackTitle: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progressPercent: number;
  streamError: string | null;
};
