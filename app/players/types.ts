import type { PlayerConnectionStatus } from "./lib/player-status";

export type Track = { id: string; title: string; duration: number };

export type Upcoming = { id: string; title: string; time?: string } | null;

export type PlayerViewModel = {
  id: string;
  roomId: string;
  roomName: string;
  playerName: string;
  status: PlayerConnectionStatus;
  playlist: Track[];
  playlistIndex: number;
  nowPlaying?: Track | null;
  isPlaying?: boolean;
  nextEvent?: Upcoming;
  playingProgress?: number;
  tenantId?: string;
  clientName?: string;
  locationName?: string;
  createdAt?: string;
  updatedAt?: string;
};
