export interface DocumentSummary {
  documentId: string;
  fileModifiedAtMs?: number;
  layerCount: number;
  name: string;
  openedAtMs: number;
  path: string;
  updatedAtMs?: number;
}

export interface DocumentClock {
  documentId: string;
  fileModifiedAtMs: number;
  updatedAtMs: number;
}

export interface FablecraftError {
  code: string;
  details: string | null;
  message: string;
}
