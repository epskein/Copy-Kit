export interface FileData {
  id: string;
  name: string;
  content: string;
  topic?: string;
  uploadedAt: Date;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  fileIds?: string[];
}

export interface ConversationPrompt {
  text: string;
  order: number;
  sourceFile: string;
  timestamp?: string;
}

export interface ExtractedPattern {
  prompts: Array<{ text: string; frequency: number; sourceFile: string }>;
  phrases: Array<{ text: string; frequency: number; sourceFiles: string[] }>;
  conversation: ConversationPrompt[];
}

export interface AnalysisState {
  isAnalyzing: boolean;
  results: ExtractedPattern | null;
  error: string | null;
}
