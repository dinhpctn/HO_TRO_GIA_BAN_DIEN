export interface KnowledgeDoc {
  id: string;
  name: string;
  content: string;
  effectiveDate: string; // ISO Date string YYYY-MM-DD
  uploadTimestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
}
