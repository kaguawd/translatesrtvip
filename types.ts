
export interface SRTBlock {
  index: string;
  timestamp: string;
  content: string;
}

export interface ProcessingState {
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface ProcessingResult {
  originalSRT: SRTBlock[];
  rewrittenSRT: string;
}
