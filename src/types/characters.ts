/**
 * Character System Types
 * These types define the structure for different character models
 * that can be used in the application.
 */

export enum CharacterType {
  ROBOT = 'robot',
  HUMAN_MALE = 'human_male',
  HUMAN_FEMALE = 'human_female',
  CUSTOM = 'custom',
}

export enum VoiceType {
  ROBOT_MALE = 'robot_male',
  ROBOT_FEMALE = 'robot_female',
  HUMAN_MALE = 'human_male',
  HUMAN_FEMALE = 'human_female',
}

export interface CharacterSettings {
  // Basic character info
  id: string;
  name: string;
  type: CharacterType;

  // Model paths
  modelPath: string;

  // Animation settings
  usesFacialAnimations: boolean;
  usesLipSync: boolean;
  usesBodyAnimations?: boolean;
  usesHandGestures?: boolean;
  usesEyeTracking?: boolean;
  usesBlinking?: boolean;
  usesBreathing?: boolean;

  // Voice settings
  voiceType: VoiceType;
  voiceSettings: {
    // Voice pitch (0-2, where 1 is normal)
    pitch: number;
    // Voice rate (0-2, where 1 is normal)
    rate: number;
    // Voice volume (0-1)
    volume?: number;
    // For robot voices: how robotic the voice sounds (0-1)
    roboticLevel?: number;
    // For human voices: naturalness and clarity
    naturalness?: number;
    clarity?: number;
  };

  // Default animations mapping
  defaultAnimations: {
    idle: string;
    greeting: string;
    talking: string;
    thinking: string;
    confused: string;
    happy: string;
    excited: string;
    sad: string;
    angry: string;
    farewell: string;
    // Additional animations for advanced characters
    breathing?: string;
    blinking?: string;
    listening?: string;
    nodding?: string;
    shaking_head?: string;
    pointing?: string;
    shrugging?: string;
    hand_gestures?: string;
    leaning_forward?: string;
    leaning_back?: string;
    agreement?: string;
    disagreement?: string;
    understanding?: string;
    micro_smile?: string;
    eyebrow_raise?: string;
    lip_press?: string;
    eye_squint?: string;
  };

  // Facial expression mappings for realistic emotions
  facialExpressions?: {
    [emotion: string]: {
      mouth: string;
      eyes: string;
      eyebrows: string;
      cheeks: string;
    };
  };

  // Lip sync configuration for realistic speech
  lipSync?: {
    enabled: boolean;
    intensity: number; // 0-1
    smoothing: number; // 0-1
    phonemeMapping: {
      [phoneme: string]: string;
    };
  };

  // Eye tracking and blinking for realism
  eyeBehavior?: {
    enabled: boolean;
    blinkRate: number; // Blinks per second
    blinkDuration: number; // Seconds per blink
    eyeMovementSpeed: number; // Speed of eye movements
    saccadeFrequency: number; // Eye movement frequency
    focusDistance: number; // Default focus distance
  };

  // Breathing animation for life-like movement
  breathing?: {
    enabled: boolean;
    rate: number; // Breaths per second
    intensity: number; // 0-1
    variation: number; // Natural variation
  };

  // Model-specific settings
  modelSettings?: {
    scale: [number, number, number];
    position: [number, number, number];
    rotation: [number, number, number];
    shadowCasting?: boolean;
    shadowReceiving?: boolean;
    castShadows?: boolean;
    receiveShadows?: boolean;
  };

  // Performance optimization settings
  performance?: {
    lodEnabled?: boolean;
    maxDistance?: number;
    animationQuality?: 'low' | 'medium' | 'high';
    textureQuality?: 'low' | 'medium' | 'high';
    shadowQuality?: 'low' | 'medium' | 'high';
  };

  // Optional character metadata
  metadata?: {
    description?: string;
    capabilities?: string[];
    personality?: {
      traits?: string[];
      backstory?: string;
      communication_style?: string;
    };
    voiceProfiles?: Array<{
      id: string;
      name: string;
      description: string;
      characteristics?: string[];
    }>;
    technical_specs?: {
      model_format?: string;
      polygon_count?: string;
      texture_resolution?: string;
      animation_bones?: string;
      facial_bones?: string;
      blend_shapes?: string;
    };
    // LangChain-specific metadata
    langchainFeatures?: {
      supportedModels?: string[];
      defaultTemperature?: number;
      maxContextLength?: number;
      toolCategories?: string[];
      memoryTypes?: string[];
      agentCapabilities?: string[];
    };
  };

  // LangChain-specific enhancements
  langchain?: {
    enabled: boolean;
    preferredModel: 'groq' | 'gemini' | 'openai';
    capabilities: string[];
    tools: string[];
    memoryConfig: {
      type: 'buffer' | 'summary' | 'vector' | 'hybrid';
      maxTokens?: number;
      vectorStoreSize?: number;
    };
    agentConfig: {
      enableReasoningChains: boolean;
      maxReasoningSteps: number;
      toolSelectionStrategy: 'auto' | 'guided' | 'selective';
    };
  };
  
  // Enhanced personality and behavioral configs
  behaviorProfile?: {
    proactivity: number; // 0-1, how often to initiate conversations
    curiosity: number; // 0-1, tendency to ask follow-up questions
    helpfulness: number; // 0-1, eagerness to assist with tasks
    emotionalIntelligence: number; // 0-1, understanding of human emotions
    knowledgeSeeking: number; // 0-1, tendency to research and learn
  };
  
  // Advanced conversation capabilities
  conversationEnhancements?: {
    contextAwareness: boolean;
    multiModalUnderstanding: boolean;
    longTermMemory: boolean;
    personalityConsistency: boolean;
    adaptiveTone: boolean;
  };
}

// Enhanced Character Settings interface
export interface EnhancedCharacterSettings extends CharacterSettings {
  langchain: NonNullable<CharacterSettings['langchain']>;
  behaviorProfile: NonNullable<CharacterSettings['behaviorProfile']>;
  conversationEnhancements: NonNullable<CharacterSettings['conversationEnhancements']>;
}

// List of available characters in the system
export const availableCharacters: Record<string, CharacterSettings> = {
  robot_assistant: {
    id: 'robot_assistant',
    name: 'Echo',
    type: CharacterType.ROBOT,
    modelPath: '/ECHO/source/Echo.glb',
    usesFacialAnimations: false,
    usesLipSync: false,
    voiceType: VoiceType.ROBOT_MALE,
    voiceSettings: {
      pitch: 0.9,
      rate: 1.0,
      roboticLevel: 0.7,
    },
    defaultAnimations: {
      idle: 'idle',
      greeting: 'wave_hand',
      talking: 'talking',
      thinking: 'thoughtful',
      confused: 'confused',
      happy: 'happy',
      excited: 'dance',
      sad: 'defeated',
      angry: 'angry',
      farewell: 'wave_hand',
    },
    metadata: {
      description: 'Original Echo robot assistant from Bunker 17',
      capabilities: ['Body animations only', 'Robotic voice processing'],
    },
  },
  // Note: Additional characters are now loaded from modular configuration files
  // See /src/characters/ directory for individual character configurations
};
