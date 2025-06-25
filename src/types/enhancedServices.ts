/**
 * Type definitions for the enhanced Echo AI Companion services
 */

// GROQ Service Types
export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponseContent {
  speech: string;
  action: string;
  details?: {
    emotion?: string;
    intensity?: number;
    speed?: number;
    [key: string]: any;
  };
}

export interface GroqApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    index: number;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Azure Speech Service Types
export interface SpeechOptions {
  voice?: string;
  style?: string;
  rate?: number;
  pitch?: number;
  emotive?: boolean;
  cache?: boolean;
}

export interface VisemeData {
  time: number;
  visemeId: number;
}

// Animation System Types
export interface AnimationOptions {
  loop?: boolean;
  clamp?: boolean;
  duration?: number;
  timeScale?: number;
  blendDuration?: number;
  weight?: number;
}

export interface AnimationMetadata {
  name: string;
  path: string;
  keywords: string[];
  emotions: string[];
  actions: string[];
  priority: number;
  options: AnimationOptions;
}

// Character Learning Types
export type MemoryType =
  | 'conversation'
  | 'observation'
  | 'user_preference'
  | 'factual';

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  timestamp: number;
  context?: string;
  associatedWords?: string[];
}

export interface UserProfile {
  name?: string;
  preferences: Record<string, any>;
  traits: Record<string, number>;
  facts: string[];
  lastUpdated: number;
}

// Unified Perception Types
export interface FaceData {
  faceDetected: boolean;
  dominantEmotion?: string;
  age?: number;
  gender?: string;
  landmarks?: any;
  confidence?: number;
}

export interface ObjectDetection {
  label: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TextDetection {
  text: string;
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SceneData {
  description?: string;
  labels?: string[];
  confidence?: number;
}

export interface PerceptionOptions {
  includeMediaPipe?: boolean;
  includeAzure?: boolean;
  includeGoogle?: boolean;
  includeFace?: boolean;
  resolution?: {
    width: number;
    height: number;
  };
}

export interface PerceptionResult {
  timestamp: number;
  face: FaceData;
  objects: ObjectDetection[];
  text: TextDetection[];
  scene: SceneData;
  source?: string;
  raw?: any;
  summary?: string;
}

// Echo Model Manager Types
export interface ModelLoadOptions {
  useFallback?: boolean;
  textureQuality?: 'low' | 'medium' | 'high';
  animationsPath?: string;
}

export interface EchoCharacterState {
  isLoaded: boolean;
  isAnimating: boolean;
  currentAnimation?: string;
  currentEmotion?: string;
  loadProgress: number;
  error?: string;
}
