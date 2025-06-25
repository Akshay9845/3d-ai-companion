/**
 * Human Female Character Configuration
 * Modular character data for human female model with facial expressions and lipsync
 */

import { CharacterSettings, CharacterType, VoiceType } from '../types/characters';

export const humanFemaleCharacter: CharacterSettings = {
  // Basic character info
  id: 'human_female',
  name: 'Aria (Human)',
  type: CharacterType.HUMAN_FEMALE,

  // Model configuration
  modelPath: '/characters/human-female/aria.glb', // Future model path

  // Capabilities - Human has full facial expressions and lipsync
  usesFacialAnimations: true,
  usesLipSync: true,

  // Voice configuration
  voiceType: VoiceType.HUMAN_FEMALE,
  voiceSettings: {
    pitch: 1.1,
    rate: 1.0,
    // No robotic processing for human characters
  },

  // Default animation mappings for human behaviors
  defaultAnimations: {
    idle: 'idle_breathing',
    greeting: 'wave_friendly',
    talking: 'talking_animated',
    thinking: 'thinking_hand_to_chin',
    confused: 'confused_head_scratch',
    happy: 'smile_big',
    excited: 'jump_celebration',
    sad: 'sad_expression',
    angry: 'angry_gesture',
    farewell: 'wave_goodbye',
  },

  // Human-specific metadata
  metadata: {
    description: 'Aria is a compassionate human survivor with advanced communication abilities and full facial expressions.',
    capabilities: [
      'Full facial animations',
      'Realistic lip synchronization',
      'Natural human voice',
      'Complex emotional expressions',
      'Gesture-based communication',
    ],
    personality: {
      traits: ['empathetic', 'expressive', 'articulate', 'warm'],
      backstory: 'Aria is a former communications specialist who now helps coordinate survivor communities with her exceptional people skills.',
    },
    voiceProfiles: [
      { id: 'natural', name: 'Natural Voice', description: 'Clear, natural human speech' },
      { id: 'warm', name: 'Warm Tone', description: 'Friendly and welcoming voice' },
      { id: 'professional', name: 'Professional', description: 'Clear and articulate speaking voice' },
    ],
  },
};
