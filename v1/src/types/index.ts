export interface ConversationData {
  id: string;
  name: string;
  content: string;
  phrases: string[];
  uploadedAt: Date;
}

export interface Snippet {
  text: string;
  count: number;
  type: 'snippet' | 'block';
}

export interface Block {
  text: string;
  count: number;
  placeholders: string[];
}

export interface Topic {
  id: string;
  name: string;
  groupId?: string;
  snippets: Snippet[];
  blocks: Block[];
  prompts: Array<{ text: string; order: number }>;
  sourceFiles: string[];
}

export interface TopicGroup {
  id: string;
  name: string;
  topics: Topic[];
}

export interface PatternRepository {
  topics: Record<string, {
    snippets: Array<{ text: string; count: number }>;
    blocks: Array<{ text: string; count: number; placeholders?: string[] }>;
  }>;
}