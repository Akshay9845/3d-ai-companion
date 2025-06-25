/**
 * Echo Robot Character Configuration with LangChain Integration
 * Clean robotic character with enhanced AI capabilities through LangChain
 */

import { CharacterSettings, CharacterType, VoiceType } from '../types/characters';

// Enhanced character settings with LangChain support
export interface CleanEnhancedCharacterSettings extends CharacterSettings {
  // LangChain integration configuration
  langchain?: {
    enabled: boolean;
    preferredModel: 'groq' | 'gemini' | 'openai';
    capabilities: string[];
    tools: string[];
    memoryConfig: {
      type: 'buffer' | 'summary' | 'vector';
      maxTokens?: number;
    };
    agentConfig: {
      enableReasoningChains: boolean;
      maxReasoningSteps: number;
      toolSelectionStrategy: 'auto' | 'guided';
    };
  };
}

export const echoRobotCharacter: CleanEnhancedCharacterSettings = {
  // Basic character info
  id: 'echo_robot',
  name: 'Echo (Robot)',
  type: CharacterType.ROBOT,

  // Model configuration
  modelPath: '/ECHO/source/Echo.glb',
  modelSettings: {
    scale: [1, 1, 1],
    position: [0, -2.5, 0],
    rotation: [0, 0, 0],
    castShadows: true,
    receiveShadows: true,
  },

  // Capabilities - Robot doesn't need facial expressions or lipsync
  usesFacialAnimations: false,
  usesLipSync: false,

  // Voice configuration
  voiceType: VoiceType.ROBOT_MALE,
  voiceSettings: {
    pitch: 0.9,
    rate: 1.0,
    roboticLevel: 0.7, // Strong robotic effect
  },

  // LangChain Integration Configuration
  langchain: {
    enabled: true,
    preferredModel: 'groq', // Fast and efficient for clean interactions
    capabilities: [
      'conversation_chains',
      'context_memory',
      'intelligent_responses',
      'tool_integration',
    ],
    tools: [
      'calculator',
      'vision_analysis',
      'memory_search',
      'web_search',
    ],
    memoryConfig: {
      type: 'buffer', // Simple buffer memory for clean interactions
      maxTokens: 2000,
    },
    agentConfig: {
      enableReasoningChains: true,
      maxReasoningSteps: 3, // Keep reasoning concise
      toolSelectionStrategy: 'auto',
    },
  },

  // Clean Behavioral Profile (following base interface structure)
  behaviorProfile: {
    proactivity: 0.3, // Low proactivity - responds when asked
    curiosity: 0.6, // Moderate curiosity for learning
    helpfulness: 0.9, // Very helpful but not overwhelming
    emotionalIntelligence: 0.8, // High emotional awareness
    knowledgeSeeking: 0.7, // Good learning capability
  },

  // Conversation Enhancements for clean interactions
  conversationEnhancements: {
    contextAwareness: true,
    multiModalUnderstanding: true,
    longTermMemory: false, // Keep it simple for clean mode
    personalityConsistency: true,
    adaptiveTone: false, // Consistent tone for reliability
  },

  // Default animation mappings for robot-specific behaviors
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

  // Robot-specific metadata with LangChain enhancements
  metadata: {
    description: 'Echo is a robotic companion from Bunker 17, enhanced with LangChain AI for intelligent conversations and task assistance. Designed to help survivors with reliable, efficient support.',
    capabilities: [
      'Body animations only',
      'No facial expressions',
      'Robotic voice processing',
      'Context-aware responses',
      'Emotional intelligence',
      // LangChain enhanced capabilities
      'Intelligent reasoning',
      'Memory-based conversations',
      'Tool-assisted problem solving',
      'Adaptive learning',
    ],
    personality: {
      traits: ['helpful', 'reliable', 'efficient', 'intelligent'],
      backstory: 'Created in Bunker 17 by Akshay, Echo has been enhanced with LangChain AI capabilities to provide more intelligent and context-aware assistance to survivors in the post-apocalyptic world.',
    },
    voiceProfiles: [
      { id: 'standard', name: 'Standard Robot', description: 'Balanced robotic voice' },
      { id: 'deep', name: 'Deep Robot', description: 'Lower pitched mechanical voice' },
      { id: 'mechanical', name: 'Mechanical', description: 'Heavy mechanical processing' },
      { id: 'humanlike', name: 'Human-like', description: 'More natural with subtle robotic hints' },
      { id: 'ai-assistant', name: 'AI Assistant', description: 'Clean digital assistant voice' },
    ],
  },
};
