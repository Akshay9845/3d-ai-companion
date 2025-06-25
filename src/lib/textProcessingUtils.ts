/**
 * Advanced Text Processing Utilities for Natural TTS
 * 
 * Handles:
 * - Text cleaning and symbol removal
 * - Emotion detection and enhancement
 * - Natural speech pattern injection
 * - Laughter and breathing effects
 * - SSML generation for expressive speech
 */

export interface ProcessedText {
  cleanedText: string;
  hasEmotion: boolean;
  emotionType: string;
  emotionIntensity: number;
  naturalPauses: number[];
  laughterPoints: number[];
  breathingPoints: number[];
  ssmlText?: string;
}

export interface EmotionConfig {
  type: string;
  intensity: number;
  voiceModulation: {
    pitch: number;
    rate: number;
    volume: number;
  };
  naturalEffects: string[];
}

/**
 * Comprehensive text cleaning for TTS - removes all symbols and formatting
 */
export function cleanTextForTTS(text: string): string {
  if (!text) return '';
  
  return text
    // Remove markdown and formatting symbols
    .replace(/[*_`~#]/g, '') // Remove asterisks, underscores, backticks, tildes, hashes
    .replace(/[\[\](){}]/g, '') // Remove brackets and parentheses
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[|\\]/g, '') // Remove pipes and backslashes
    .replace(/[!?]/g, '') // Remove question marks and exclamation marks
    .replace(/[;:]/g, '') // Remove semicolons and colons
    .replace(/["']/g, '') // Remove quotes
    .replace(/[.,]/g, ' ') // Replace commas and periods with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^\s+|\s+$/g, '') // Trim leading/trailing spaces
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\t+/g, ' ') // Replace tabs with spaces
    // Remove common formatting patterns
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic formatting
    .replace(/`([^`]+)`/g, '$1') // Remove code formatting
    .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/-{3,}/g, '') // Remove horizontal rules
    .replace(/\|/g, '') // Remove table separators
    .replace(/^>\s*/gm, '') // Remove blockquotes
    .replace(/^\d+\.\s*/gm, '') // Remove numbered lists
    .replace(/^[-*+]\s*/gm, '') // Remove bullet lists
    // Remove emoji shortcodes
    .replace(/:\w+:/g, '') // Remove :smile:, :heart:, etc.
    // Clean up any remaining artifacts
    .replace(/\s{2,}/g, ' ') // Multiple spaces to single
    .trim();
}

/**
 * Normalize laugh text for natural TTS pronunciation
 * Converts robotic "H-A-H-A" into natural "Haha!" speech
 */
export function normalizeLaughs(text: string): string {
  if (!text) return text;
  
  return text
    // Convert various laugh patterns to natural speech
    .replace(/(😂|🤣|lol|lmao|rofl|heh|hihi|ha ha|hahaha|haha)/gi, 'Haha!')
    .replace(/(😆|😹|hehe|heehee)/gi, 'Hehe!')
    .replace(/(😄|😊|😃)/g, 'Haha!')
    .replace(/(😅|😆)/g, 'Hehe!')
    
    // Multi-language laugh normalization
    // Hindi
    .replace(/(हाहा|हीही|हा हा|हाहाहा)/gi, 'Haha!')
    .replace(/(ही|हीही)/gi, 'Hehe!')
    
    // Telugu
    .replace(/(హాహా|హీహీ|హా హా|హాహాహా)/gi, 'Haha!')
    .replace(/(హీ|హీహీ)/gi, 'Hehe!')
    
    // Kannada
    .replace(/(ಹಾಹಾ|ಹೀಹೀ|ಹಾ ಹಾ|ಹಾಹಾಹಾ)/gi, 'Haha!')
    .replace(/(ಹೀ|ಹೀಹೀ)/gi, 'Hehe!')
    
    // Tamil
    .replace(/(ஹாஹா|ஹீஹீ|ஹா ஹா|ஹாஹாஹா)/gi, 'Haha!')
    .replace(/(ஹீ|ஹீஹீ)/gi, 'Hehe!')
    
    // Clean up multiple exclamation marks
    .replace(/!{2,}/g, '!')
    .replace(/\s+!/g, '!')
    
    // Add natural spacing
    .replace(/Haha!Haha!/g, 'Haha! Haha!')
    .replace(/Hehe!Hehe!/g, 'Hehe! Hehe!')
    
    // Ensure proper capitalization
    .replace(/haha!/gi, 'Haha!')
    .replace(/hehe!/gi, 'Hehe!');
}

/**
 * Predictive response patterns for immediate TTS start
 */
export const PREDICTIVE_RESPONSES = {
  // Common acknowledgment patterns
  acknowledgments: [
    'I understand',
    'That\'s interesting',
    'I see what you mean',
    'That makes sense',
    'You\'re right',
    'Absolutely',
    'Definitely',
    'Of course',
    'Sure thing',
    'Got it'
  ],
  
  // Thinking patterns
  thinking: [
    'Let me think about that',
    'That\'s a good question',
    'Interesting point',
    'Hmm, let me consider',
    'That\'s worth thinking about',
    'I\'ll give that some thought',
    'That\'s an interesting perspective',
    'Let me process that',
    'That\'s something to consider',
    'Good question'
  ],
  
  // Agreement patterns
  agreement: [
    'I agree',
    'You\'re absolutely right',
    'That\'s exactly right',
    'I think so too',
    'Definitely',
    'Absolutely',
    'You\'ve got a point',
    'That makes perfect sense',
    'I couldn\'t agree more',
    'Spot on'
  ],
  
  // Laughter patterns
  laughter: [
    'Haha!',
    'Hehe!',
    'That\'s funny!',
    'Good one!',
    'That\'s hilarious!',
    'Haha, I see what you did there!',
    'Hehe, that\'s clever!',
    'That made me laugh!',
    'Haha, you got me!',
    'That\'s a good joke!'
  ]
};

/**
 * Get predictive response based on user input
 */
export function getPredictiveResponse(userInput: string): string | null {
  if (!userInput) return null;
  
  const lowerInput = userInput.toLowerCase();
  
  // Check for story requests
  if (lowerInput.includes('story') || 
      lowerInput.includes('tell me about') || 
      lowerInput.includes('narrative') || 
      lowerInput.includes('tale')) {
    const storyStarters = [
      'Let me tell you a story',
      'Here\'s an interesting story',
      'Once upon a time',
      'I have a great story for you',
      'This reminds me of a story'
    ];
    return storyStarters[Math.floor(Math.random() * storyStarters.length)];
  }
  
  // Check for explanation requests
  if (lowerInput.includes('explain') || 
      lowerInput.includes('how does') || 
      lowerInput.includes('what is') || 
      lowerInput.includes('describe')) {
    const explanationStarters = [
      'Let me explain that',
      'I\'ll break that down for you',
      'Here\'s how it works',
      'Let me clarify that',
      'I\'ll explain this step by step'
    ];
    return explanationStarters[Math.floor(Math.random() * explanationStarters.length)];
  }
  
  // Check for question patterns
  if (lowerInput.includes('?') || 
      lowerInput.includes('what') || 
      lowerInput.includes('how') || 
      lowerInput.includes('why') || 
      lowerInput.includes('when') || 
      lowerInput.includes('where') || 
      lowerInput.includes('who') || 
      lowerInput.includes('which')) {
    return PREDICTIVE_RESPONSES.thinking[Math.floor(Math.random() * PREDICTIVE_RESPONSES.thinking.length)];
  }
  
  // Check for agreement patterns
  if (lowerInput.includes('agree') || 
      lowerInput.includes('right') || 
      lowerInput.includes('correct') || 
      lowerInput.includes('true') || 
      lowerInput.includes('yes')) {
    return PREDICTIVE_RESPONSES.agreement[Math.floor(Math.random() * PREDICTIVE_RESPONSES.agreement.length)];
  }
  
  // Check for humor/laughter patterns
  if (lowerInput.includes('funny') || 
      lowerInput.includes('joke') || 
      lowerInput.includes('laugh') || 
      lowerInput.includes('haha') || 
      lowerInput.includes('lol') || 
      lowerInput.includes('😂') || 
      lowerInput.includes('🤣') || 
      lowerInput.includes('😄') || 
      lowerInput.includes('😆')) {
    return PREDICTIVE_RESPONSES.laughter[Math.floor(Math.random() * PREDICTIVE_RESPONSES.laughter.length)];
  }
  
  // Check for greetings
  if (lowerInput.includes('hello') || 
      lowerInput.includes('hi') || 
      lowerInput.includes('hey') || 
      lowerInput.includes('good morning') || 
      lowerInput.includes('good afternoon') || 
      lowerInput.includes('good evening')) {
    const greetings = [
      'Hello there!',
      'Hi! How can I help you?',
      'Hey! Nice to see you!',
      'Good to see you!',
      'Hello! What can I do for you?'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Default acknowledgment - but less generic
  const contextualAcknowledments = [
    'I\'m here to help',
    'Let me assist you with that',
    'I\'ll do my best to help',
    'I\'m listening',
    'Tell me more'
  ];
  return contextualAcknowledments[Math.floor(Math.random() * contextualAcknowledments.length)];
}

/**
 * Enhanced text processing with predictive response support
 */
export function processTextForNaturalSpeech(text: string): string {
  if (!text) return text;
  
  // First normalize laughs for natural pronunciation
  let processedText = normalizeLaughs(text);
  
  // Then apply comprehensive cleaning
  processedText = cleanTextForTTS(processedText);
  
  // Add natural speech patterns
  processedText = addNaturalSpeechPatterns(processedText);
  
  return processedText;
}

/**
 * Add natural speech patterns and pauses with minimal interruption
 */
export function addNaturalSpeechPatterns(text: string): string {
  if (!text) return text;
  
  return text
    // Add minimal pauses after laughter (reduced from longer pauses)
    .replace(/(Haha!|Hehe!)([A-Z])/g, '$1 $2')
    
    // Add minimal emphasis for exclamations
    .replace(/(\w+!)([A-Z])/g, '$1 $2')
    
    // Add very brief pauses for breathing (reduced duration)
    .replace(/(sigh|hmm|um|uh)([A-Z])/gi, '$1 $2')
    
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate natural laugh SSML with expressive prosody
 */
export function generateLaughSSML(text: string): string {
  if (!text) return text;
  
  // Check if text contains laughter
  const hasLaughter = /Haha!|Hehe!/i.test(text);
  
  if (!hasLaughter) {
    return text;
  }
  
  // Generate SSML with joyful prosody for laughter
  return text
    .replace(/(Haha!|Hehe!)/gi, (match) => {
      const isHaha = match.toLowerCase() === 'haha!';
      const pitch = isHaha ? '+15%' : '+10%';
      const rate = isHaha ? '+20%' : '+15%';
      
      return `<prosody pitch="${pitch}" rate="${rate}" volume="+10%">${match}</prosody>`;
    })
    .replace(/^(.+)$/, '<speak>$1</speak>');
}

/**
 * Enhanced emotion detection with laugh normalization and minimal pauses
 */
export function detectEmotionAndEnhance(text: string): ProcessedText {
  if (!text) return {
    cleanedText: '',
    hasEmotion: false,
    emotionType: '',
    emotionIntensity: 0,
    naturalPauses: [],
    laughterPoints: [],
    breathingPoints: []
  };

  // First normalize laughs for better detection
  let normalizedText = normalizeLaughs(text);
  let cleanedText = normalizedText;
  let hasEmotion = false;
  let emotionType = '';
  let emotionIntensity = 0;
  const naturalPauses: number[] = [];
  const laughterPoints: number[] = [];
  const breathingPoints: number[] = [];

  // Enhanced laughter patterns (now using normalized text)
  const laughterPatterns = [
    // Normalized laughter
    { pattern: /Haha!/gi, replacement: 'Haha!', intensity: 0.7 },
    { pattern: /Hehe!/gi, replacement: 'Hehe!', intensity: 0.6 },
    
    // Multi-language normalized laughter
    // Hindi
    { pattern: /हाहा/gi, replacement: 'Haha!', intensity: 0.7 },
    { pattern: /हीही/gi, replacement: 'Hehe!', intensity: 0.6 },
    // Telugu
    { pattern: /హాహా/gi, replacement: 'Haha!', intensity: 0.7 },
    { pattern: /హీహీ/gi, replacement: 'Hehe!', intensity: 0.6 },
    // Kannada
    { pattern: /ಹಾಹಾ/gi, replacement: 'Haha!', intensity: 0.7 },
    { pattern: /ಹೀಹೀ/gi, replacement: 'Hehe!', intensity: 0.6 },
    // Tamil
    { pattern: /ஹாஹா/gi, replacement: 'Haha!', intensity: 0.7 },
    { pattern: /ஹீஹீ/gi, replacement: 'Hehe!', intensity: 0.6 }
  ];

  // Enhanced breathing patterns
  const breathingPatterns = [
    // English
    { pattern: /sigh/gi, replacement: 'sigh', intensity: 0.8 },
    { pattern: /breath/gi, replacement: 'breath', intensity: 0.6 },
    { pattern: /inhale/gi, replacement: 'inhale', intensity: 0.7 },
    { pattern: /exhale/gi, replacement: 'exhale', intensity: 0.7 },
    { pattern: /pause/gi, replacement: 'pause', intensity: 0.5 },
    { pattern: /wait/gi, replacement: 'wait', intensity: 0.4 },
    { pattern: /hmm/gi, replacement: 'hmm', intensity: 0.6 },
    { pattern: /um/gi, replacement: 'um', intensity: 0.5 },
    { pattern: /uh/gi, replacement: 'uh', intensity: 0.5 },
    // Hindi
    { pattern: /आह/gi, replacement: 'sigh', intensity: 0.8 },
    { pattern: /हम्म/gi, replacement: 'hmm', intensity: 0.6 },
    // Telugu
    { pattern: /ఆహ్/gi, replacement: 'sigh', intensity: 0.8 },
    { pattern: /హమ్మ్/gi, replacement: 'hmm', intensity: 0.6 },
    // Kannada
    { pattern: /ಆಹ್/gi, replacement: 'sigh', intensity: 0.8 },
    { pattern: /ಹಮ್ಮ್/gi, replacement: 'hmm', intensity: 0.6 },
    // Tamil
    { pattern: /ஆஹ்/gi, replacement: 'sigh', intensity: 0.8 },
    { pattern: /ஹம்ம்/gi, replacement: 'hmm', intensity: 0.6 }
  ];

  // Process laughter patterns
  for (const { pattern, replacement, intensity } of laughterPatterns) {
    if (pattern.test(cleanedText)) {
      hasEmotion = true;
      emotionType = 'laughter';
      emotionIntensity = Math.max(emotionIntensity, intensity);
      cleanedText = cleanedText.replace(pattern, replacement);
      
      // Add laughter point at the position
      const match = cleanedText.match(replacement);
      if (match) {
        laughterPoints.push(match.index || 0);
      }
    }
  }

  // Process breathing patterns
  for (const { pattern, replacement, intensity } of breathingPatterns) {
    if (pattern.test(cleanedText)) {
      hasEmotion = true;
      emotionType = 'breathing';
      emotionIntensity = Math.max(emotionIntensity, intensity);
      cleanedText = cleanedText.replace(pattern, replacement);
      
      // Add breathing point at the position
      const match = cleanedText.match(replacement);
      if (match) {
        breathingPoints.push(match.index || 0);
      }
    }
  }

  // Detect other emotions
  const emotionKeywords = {
    happy: ['happy', 'great', 'wonderful', 'excellent', 'amazing', 'fantastic', 'awesome', 'love', 'joy'],
    sad: ['sad', 'sorry', 'unfortunate', 'disappointed', 'upset', 'depressed', 'unhappy'],
    angry: ['angry', 'frustrated', 'upset', 'mad', 'annoyed', 'irritated', 'furious'],
    surprised: ['surprised', 'shocked', 'amazed', 'astonished', 'wow', 'incredible', 'unbelievable'],
    fearful: ['scared', 'afraid', 'fear', 'terrified', 'worried', 'anxious', 'nervous'],
    disgusted: ['disgusted', 'gross', 'nasty', 'revolting', 'yuck', 'awful', 'terrible']
  };

  const lowerText = cleanedText.toLowerCase();
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        if (!hasEmotion || emotionIntensity < 0.5) {
          hasEmotion = true;
          emotionType = emotion;
          emotionIntensity = 0.5;
        }
        break;
      }
    }
  }

  // Add minimal natural pauses at sentence boundaries (reduced frequency)
  const sentences = cleanedText.split(/[.!?]+/);
  let currentPos = 0;
  for (let i = 0; i < sentences.length - 1; i++) {
    currentPos += sentences[i].length;
    // Only add pauses for longer sentences to maintain flow
    if (sentences[i].length > 50) {
      naturalPauses.push(currentPos);
    }
  }

  // Final cleaning and natural speech processing with minimal pauses
  cleanedText = cleanTextForTTS(cleanedText);
  cleanedText = addNaturalSpeechPatterns(cleanedText);

  return {
    cleanedText,
    hasEmotion,
    emotionType,
    emotionIntensity,
    naturalPauses,
    laughterPoints,
    breathingPoints
  };
}

/**
 * Generate SSML for expressive speech synthesis
 */
export function generateSSML(text: string, emotion: string, intensity: number = 0.5): string {
  const emotionConfigs: Record<string, EmotionConfig> = {
    laughter: {
      type: 'laughter',
      intensity,
      voiceModulation: { pitch: 1.2, rate: 1.1, volume: 1.0 },
      naturalEffects: ['<break time="200ms"/>', '<prosody pitch="+20%" rate="+10%">']
    },
    breathing: {
      type: 'breathing',
      intensity,
      voiceModulation: { pitch: 0.9, rate: 0.8, volume: 0.8 },
      naturalEffects: ['<break time="500ms"/>', '<prosody pitch="-10%" rate="-20%">']
    },
    happy: {
      type: 'happy',
      intensity,
      voiceModulation: { pitch: 1.1, rate: 1.05, volume: 1.0 },
      naturalEffects: ['<prosody pitch="+10%" rate="+5%">']
    },
    sad: {
      type: 'sad',
      intensity,
      voiceModulation: { pitch: 0.9, rate: 0.9, volume: 0.8 },
      naturalEffects: ['<prosody pitch="-10%" rate="-10%">']
    },
    angry: {
      type: 'angry',
      intensity,
      voiceModulation: { pitch: 1.3, rate: 1.2, volume: 1.2 },
      naturalEffects: ['<prosody pitch="+30%" rate="+20%" volume="+20%">']
    },
    surprised: {
      type: 'surprised',
      intensity,
      voiceModulation: { pitch: 1.4, rate: 1.3, volume: 1.1 },
      naturalEffects: ['<prosody pitch="+40%" rate="+30%">']
    }
  };

  const config = emotionConfigs[emotion] || emotionConfigs.happy;
  
  let ssmlText = '<speak>';
  
  if (config.naturalEffects.length > 0) {
    ssmlText += config.naturalEffects.join('');
  }
  
  ssmlText += text;
  
  if (config.naturalEffects.length > 0) {
    ssmlText += '</prosody>';
  }
  
  ssmlText += '</speak>';
  
  return ssmlText;
}

/**
 * Add natural breathing and laughter effects to text
 */
export function injectNaturalEffects(text: string, emotionType: string): string {
  if (!text || !emotionType) return text;

  switch (emotionType) {
    case 'laughter':
      // Add natural laughter sounds
      return text.replace(/(hɑ hɑ|he he)/gi, (match) => {
        return `<break time="100ms"/>${match}<break time="200ms"/>`;
      });
    
    case 'breathing':
      // Add breathing pauses
      return text.replace(/(sigh|hmm)/gi, (match) => {
        return `<break time="300ms"/>${match}<break time="400ms"/>`;
      });
    
    default:
      return text;
  }
}

/**
 * Smart text buffering with predictive response integration and larger chunks to reduce cuts
 */
export function bufferTextForTTS(text: string, maxChunkSize: number = 300): string[] {
  if (!text || text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    // If adding this sentence would exceed chunk size, start a new chunk
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Check if text should trigger immediate response
 */
export function shouldStartImmediateResponse(text: string): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Start immediately for questions, agreements, or short responses
  return lowerText.includes('?') || 
         lowerText.length < 50 || 
         lowerText.includes('yes') || 
         lowerText.includes('no') || 
         lowerText.includes('ok') || 
         lowerText.includes('sure') ||
         lowerText.includes('thanks') ||
         lowerText.includes('thank you');
}

/**
 * Wait for full LLM response before TTS
 */
export function shouldWaitForFullResponse(text: string): boolean {
  // Check if response seems incomplete
  const lastChar = text.trim().slice(-1);
  const hasEndingPunctuation = /[.!?]/.test(lastChar);
  const hasMinimumLength = text.length > 20;
  const hasCompleteThought = text.includes('.') || text.includes('!') || text.includes('?');
  
  return hasEndingPunctuation && hasMinimumLength && hasCompleteThought;
}

/**
 * Get emotion configuration for TTS
 */
export function getEmotionConfig(emotion: string, intensity: number = 0.5): EmotionConfig {
  const baseConfigs: Record<string, EmotionConfig> = {
    neutral: {
      type: 'neutral',
      intensity: 0,
      voiceModulation: { pitch: 1.0, rate: 1.0, volume: 1.0 },
      naturalEffects: []
    },
    happy: {
      type: 'happy',
      intensity,
      voiceModulation: { pitch: 1.1, rate: 1.05, volume: 1.0 },
      naturalEffects: []
    },
    sad: {
      type: 'sad',
      intensity,
      voiceModulation: { pitch: 0.9, rate: 0.9, volume: 0.8 },
      naturalEffects: []
    },
    angry: {
      type: 'angry',
      intensity,
      voiceModulation: { pitch: 1.3, rate: 1.2, volume: 1.2 },
      naturalEffects: []
    },
    laughter: {
      type: 'laughter',
      intensity,
      voiceModulation: { pitch: 1.2, rate: 1.1, volume: 1.0 },
      naturalEffects: []
    },
    breathing: {
      type: 'breathing',
      intensity,
      voiceModulation: { pitch: 0.9, rate: 0.8, volume: 0.8 },
      naturalEffects: []
    }
  };

  return baseConfigs[emotion] || baseConfigs.neutral;
} 