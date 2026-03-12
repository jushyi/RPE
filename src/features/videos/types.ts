/** Video attachment on a single set log */
export interface VideoAttachment {
  setLogId: string;
  localUri: string;
  thumbnailUri: string;
  videoUrl: string | null;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

/** Item in the MMKV-backed video upload queue */
export interface VideoUploadItem {
  setLogId: string;
  userId: string;
  localUri: string;
  thumbnailUri: string;
  createdAt: string;
}

/** Video entry for the gallery/history display */
export interface VideoGalleryItem {
  id: string;
  videoUrl: string;
  setNumber: number;
  weight: number;
  reps: number;
  unit: string;
  loggedAt: string;
  exerciseName: string;
  sessionDate: string;
}
