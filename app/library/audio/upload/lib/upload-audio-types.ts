export type UploadQueueStatus = "pending" | "uploading" | "success" | "error";

export type UploadQueueItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  status: UploadQueueStatus;
  progress: number;
  error?: string;
  title: string;
  titleTouched: boolean;
  artist: string;
  artistTouched: boolean;
  category: string;
  categoryTouched: boolean;
  tags: string[];
  playlistId: string | null;
  previewUrl: string;
  durationSeconds: number | null;
};
