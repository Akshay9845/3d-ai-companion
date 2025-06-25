// Re-export enhanced service types
export * from './enhancedServices';
export * from './characters';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export enum EmotionType {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  SURPRISED = 'surprised',
}

export interface AvatarState {
  isSpeaking: boolean;
  emotion: EmotionType;
  blinkRate: number;
}

export interface ConversationRow {
  id: string;
  title: string;
  created_at: string;
  user_id?: string | null;
}

export type InsertConversationRow = Omit<ConversationRow, 'id' | 'created_at'>;
