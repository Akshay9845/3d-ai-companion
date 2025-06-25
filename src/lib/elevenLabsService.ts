import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

// Fallback voice ID provided by user
const FALLBACK_VOICE_ID = "nPczCjzI2devNBz1zQrb";

if (!elevenLabsApiKey) {
  console.error('VITE_ELEVENLABS_API_KEY is not defined. Please set it in your .env file.');
}

const elevenlabs = new ElevenLabsClient({
  apiKey: elevenLabsApiKey,
});

let availableVoiceId: string | null = null;
let allAvailableVoices: any[] = [];
let isPreWarmed = false;
let currentAudio: HTMLAudioElement | null = null;
let currentAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isPlaying = false;

// Language support configuration
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  voices: string[];
  model: string;
  fallbackVoices?: string[];
}

// Comprehensive language support including Indian languages
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  // Indian Languages
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  // Other Major Languages
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    voices: ['Charlie', 'Brian', 'George', 'Liam', 'Will', 'Eric', 'Chris', 'Daniel', 'Bill', 'Callum'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlie', 'Brian']
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'fi',
    name: 'Finnish',
    nativeName: 'Suomi',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'cs',
    name: 'Czech',
    nativeName: 'Čeština',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'hu',
    name: 'Hungarian',
    nativeName: 'Magyar',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'bg',
    name: 'Bulgarian',
    nativeName: 'Български',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'hr',
    name: 'Croatian',
    nativeName: 'Hrvatski',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'sk',
    name: 'Slovak',
    nativeName: 'Slovenčina',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'sl',
    name: 'Slovenian',
    nativeName: 'Slovenščina',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'et',
    name: 'Estonian',
    nativeName: 'Eesti',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'lv',
    name: 'Latvian',
    nativeName: 'Latviešu',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'lt',
    name: 'Lithuanian',
    nativeName: 'Lietuvių',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'mt',
    name: 'Maltese',
    nativeName: 'Malti',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'el',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  },
  {
    code: 'fil',
    name: 'Filipino',
    nativeName: 'Filipino',
    voices: ['Charlotte', 'Sarah', 'Laura', 'Alice', 'Matilda'],
    model: 'eleven_multilingual_v2',
    fallbackVoices: ['Charlotte', 'Sarah']
  }
];

/**
 * Detect language from text using character analysis
 */
export function detectLanguage(text: string): LanguageConfig {
  const cleanText = text.trim();
  
  // Character-based language detection
  const charCounts: { [key: string]: number } = {};
  
  for (const char of cleanText) {
    const code = char.charCodeAt(0);
    
    // Telugu characters (0x0C00-0x0C7F)
    if (code >= 0x0C00 && code <= 0x0C7F) {
      charCounts.te = (charCounts.te || 0) + 1;
    }
    // Hindi/Devanagari characters (0x0900-0x097F)
    else if (code >= 0x0900 && code <= 0x097F) {
      charCounts.hi = (charCounts.hi || 0) + 1;
    }
    // Bengali characters (0x0980-0x09FF)
    else if (code >= 0x0980 && code <= 0x09FF) {
      charCounts.bn = (charCounts.bn || 0) + 1;
    }
    // Tamil characters (0x0B80-0x0BFF)
    else if (code >= 0x0B80 && code <= 0x0BFF) {
      charCounts.ta = (charCounts.ta || 0) + 1;
    }
    // Marathi characters (0x0900-0x097F) - same as Hindi
    else if (code >= 0x0900 && code <= 0x097F) {
      charCounts.mr = (charCounts.mr || 0) + 1;
    }
    // Gujarati characters (0x0A80-0x0AFF)
    else if (code >= 0x0A80 && code <= 0x0AFF) {
      charCounts.gu = (charCounts.gu || 0) + 1;
    }
    // Kannada characters (0x0C80-0x0CFF)
    else if (code >= 0x0C80 && code <= 0x0CFF) {
      charCounts.kn = (charCounts.kn || 0) + 1;
    }
    // Malayalam characters (0x0D00-0x0D7F)
    else if (code >= 0x0D00 && code <= 0x0D7F) {
      charCounts.ml = (charCounts.ml || 0) + 1;
    }
    // Punjabi characters (0x0A00-0x0A7F)
    else if (code >= 0x0A00 && code <= 0x0A7F) {
      charCounts.pa = (charCounts.pa || 0) + 1;
    }
    // Arabic characters (0x0600-0x06FF)
    else if (code >= 0x0600 && code <= 0x06FF) {
      charCounts.ar = (charCounts.ar || 0) + 1;
    }
    // Chinese characters (0x4E00-0x9FFF)
    else if (code >= 0x4E00 && code <= 0x9FFF) {
      charCounts.zh = (charCounts.zh || 0) + 1;
    }
    // Japanese Hiragana (0x3040-0x309F)
    else if (code >= 0x3040 && code <= 0x309F) {
      charCounts.ja = (charCounts.ja || 0) + 1;
    }
    // Japanese Katakana (0x30A0-0x30FF)
    else if (code >= 0x30A0 && code <= 0x30FF) {
      charCounts.ja = (charCounts.ja || 0) + 1;
    }
    // Korean characters (0xAC00-0xD7AF)
    else if (code >= 0xAC00 && code <= 0xD7AF) {
      charCounts.ko = (charCounts.ko || 0) + 1;
    }
    // Thai characters (0x0E00-0x0E7F)
    else if (code >= 0x0E00 && code <= 0x0E7F) {
      charCounts.th = (charCounts.th || 0) + 1;
    }
    // Cyrillic characters (0x0400-0x04FF)
    else if (code >= 0x0400 && code <= 0x04FF) {
      charCounts.ru = (charCounts.ru || 0) + 1;
    }
    // Greek characters (0x0370-0x03FF)
    else if (code >= 0x0370 && code <= 0x03FF) {
      charCounts.el = (charCounts.el || 0) + 1;
    }
    // Hebrew characters (0x0590-0x05FF)
    else if (code >= 0x0590 && code <= 0x05FF) {
      charCounts.he = (charCounts.he || 0) + 1;
    }
  }
  
  // Find the language with the most characters
  let detectedLanguage = 'en'; // Default to English
  let maxCount = 0;
  
  for (const [langCode, count] of Object.entries(charCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedLanguage = langCode;
    }
  }
  
  // If no special characters found, default to English
  if (maxCount === 0) {
    detectedLanguage = 'en';
  }
  
  // Find the language configuration
  const languageConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === detectedLanguage);
  
  if (languageConfig) {
    console.log(`🌍 Detected language: ${languageConfig.name} (${languageConfig.nativeName})`);
    return languageConfig;
  }
  
  // Fallback to English
  console.log('🌍 Language detection failed, defaulting to English');
  return SUPPORTED_LANGUAGES.find(lang => lang.code === 'en')!;
}

/**
 * Get the best voice for a specific language
 */
export function getBestVoiceForLanguage(languageConfig: LanguageConfig, availableVoices: any[]): string | null {
  // First try to find a voice that matches the language preferences
  for (const preferredVoice of languageConfig.voices) {
    const voice = availableVoices.find(v => v.name === preferredVoice);
    if (voice) {
      console.log(`🎯 Selected voice for ${languageConfig.name}: ${voice.name}`);
      // Try different possible voice_id properties
      const voiceId = voice.voice_id || voice.id || voice.voiceId;
      if (voiceId) {
        console.log(`🎯 Voice ID found: ${voiceId}`);
        return voiceId;
      } else {
        console.warn(`⚠️ Voice ${voice.name} found but no voice_id available`);
      }
    }
  }
  
  // If no preferred voice found, try fallback voices
  if (languageConfig.fallbackVoices) {
    for (const fallbackVoice of languageConfig.fallbackVoices) {
      const voice = availableVoices.find(v => v.name === fallbackVoice);
      if (voice) {
        console.log(`🔄 Using fallback voice for ${languageConfig.name}: ${voice.name}`);
        const voiceId = voice.voice_id || voice.id || voice.voiceId;
        if (voiceId) {
          console.log(`🔄 Fallback voice ID found: ${voiceId}`);
          return voiceId;
        } else {
          console.warn(`⚠️ Fallback voice ${voice.name} found but no voice_id available`);
        }
      }
    }
  }
  
  // If still no voice found, use the first available voice with a valid voice_id
  for (const voice of availableVoices) {
    const voiceId = voice.voice_id || voice.id || voice.voiceId;
    if (voiceId) {
      console.log(`⚠️ No specific voice found for ${languageConfig.name}, using: ${voice.name} (${voiceId})`);
      return voiceId;
    }
  }
  
  console.error(`❌ No voices with valid voice_id found for ${languageConfig.name}`);
  return null;
}

/**
 * Test ElevenLabs service connection by fetching available voices.
 */
export async function testElevenLabsConnection(): Promise<boolean> {
  if (!elevenLabsApiKey) {
    console.error('❌ ElevenLabs API key is missing.');
    return false;
  }
  
  try {
    console.log('🔍 Testing ElevenLabs service connection...');
    console.log('🔑 API Key format check:', elevenLabsApiKey.startsWith('sk_') ? '✅ Valid format' : '❌ Invalid format (should start with sk_)');
    console.log('🔑 API Key length:', elevenLabsApiKey.length);
    
    const voices = await elevenlabs.voices.getAll();
    console.log('📡 API Response received, processing voices...');
    
    // Handle different response formats
    let voicesArray = voices;
    if (voices && typeof voices === 'object' && !Array.isArray(voices)) {
      if (voices.voices && Array.isArray(voices.voices)) {
        voicesArray = voices.voices;
      } else {
        voicesArray = [];
      }
    }
    
    if (voicesArray && Array.isArray(voicesArray) && voicesArray.length > 0) {
      // Debug: Log the first voice object structure
      console.log('🔍 First voice object structure:', JSON.stringify(voicesArray[0], null, 2));
      
      console.log('✅ ElevenLabs service connection successful! Available voices:', `(${voicesArray.length})`, voicesArray.map(v => `${v.name} (${v.voice_id || v.id || v.voiceId || 'undefined'})`));
      
      allAvailableVoices = voicesArray;
      
      // Prefer male voices for better companion experience
      const maleVoiceNames = ['Brian', 'George', 'Liam', 'Will', 'Eric', 'Chris', 'Daniel', 'Bill', 'Charlie', 'Callum'];
      let selectedVoice = voicesArray.find(v => maleVoiceNames.includes(v.name));
      
      if (!selectedVoice) {
        selectedVoice = voicesArray[0];
      }
      
      // Try different possible voice_id properties
      const voiceId = selectedVoice.voice_id || selectedVoice.id || selectedVoice.voiceId;
      if (voiceId) {
        availableVoiceId = voiceId;
        console.log('🎯 Using voice:', `${selectedVoice.name} (${voiceId})`);
      } else {
        console.error('❌ Selected voice has no valid voice_id:', selectedVoice);
        // Try to find any voice with a valid voice_id
        for (const voice of voicesArray) {
          const vid = voice.voice_id || voice.id || voice.voiceId;
          if (vid) {
            availableVoiceId = vid;
            console.log('🎯 Using fallback voice:', `${voice.name} (${vid})`);
            break;
          }
        }
      }
      
      // Pre-warm the API after successful connection
      setTimeout(() => {
        preWarmElevenLabs().catch(err => 
          console.warn('⚠️ Pre-warming failed:', err.message || err)
        );
      }, 1000);
      
      return true;
    } else {
      console.log('❌ No voices found, trying fallback voice...');
      try {
        // Test fallback voice with proper audio generation
        const testAudio = await elevenlabs.textToSpeech.convert(FALLBACK_VOICE_ID, {
          text: "Test",
          modelId: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true
          }
        });
        
        // Convert the response to ArrayBuffer
        let audioBuffer: ArrayBuffer;
        if (testAudio instanceof ArrayBuffer) {
          audioBuffer = testAudio;
        } else if (testAudio instanceof Uint8Array) {
          audioBuffer = testAudio.buffer.slice(testAudio.byteOffset, testAudio.byteOffset + testAudio.byteLength);
        } else if (testAudio && typeof testAudio.arrayBuffer === 'function') {
          audioBuffer = await testAudio.arrayBuffer();
        } else {
          throw new Error('Invalid audio response format');
        }
        
        if (audioBuffer && audioBuffer.byteLength > 0) {
          availableVoiceId = FALLBACK_VOICE_ID;
          console.log('✅ Fallback voice works!');
          
          setTimeout(() => {
            preWarmElevenLabs().catch(err => 
              console.warn('⚠️ Pre-warming failed:', err.message || err)
            );
          }, 1000);
          
          return true;
        } else {
          console.log('❌ Fallback voice returned empty audio');
          return false;
        }
      } catch (fallbackError: any) {
        console.log('❌ Fallback voice failed:', fallbackError?.message || fallbackError);
        return false;
      }
    }
  } catch (error: any) {
    console.error('❌ ElevenLabs service connection failed:', error?.message || error);
    return false;
  }
}

/**
 * Synthesize speech using ElevenLabs with proper error handling and fallback.
 */
export async function synthesizeSpeech(text: string, options: { language?: string; voice?: string } = {}): Promise<void> {
    if (!text || text.trim() === '') {
        console.warn('⚠️ Empty text provided to synthesizeSpeech');
        return;
    }

    if (!elevenLabsApiKey) {
        console.warn("⚠️ ElevenLabs API key not found. Falling back to browser speech synthesis.");
        return speakWithBrowserFallback(text);
    }

    if (!availableVoiceId) {
        console.log('🔄 No voice available, testing connection...');
        const connectionSuccess = await testElevenLabsConnection();
        if (!connectionSuccess) {
            console.log('🔄 ElevenLabs connection failed, falling back to browser speech synthesis...');
            return speakWithBrowserFallback(text);
        }
    }

    // Detect language if not provided
    let languageConfig: LanguageConfig;
    if (options.language) {
        languageConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === options.language) || detectLanguage(text);
    } else {
        languageConfig = detectLanguage(text);
    }

    // Get the best voice for the detected language
    let voiceId = options.voice || availableVoiceId;
    if (!options.voice) {
        const bestVoiceId = getBestVoiceForLanguage(languageConfig, allAvailableVoices);
        if (bestVoiceId) {
            voiceId = bestVoiceId;
        }
    }

    // Validate voice ID
    if (!voiceId || voiceId === 'undefined') {
        console.error('❌ No valid voice ID available for speech synthesis');
        console.log('🔄 Falling back to browser speech synthesis...');
        return speakWithBrowserFallback(text);
    }

    console.log(`🎤 Synthesizing speech with ElevenLabs for: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    console.log(`🌍 Language: ${languageConfig.name} (${languageConfig.nativeName})`);
    console.log(`🎯 Voice ID: ${voiceId}`);
    
    try {
        // Stop any currently playing audio first
        stopSpeech();
        
        // Split text into smaller chunks for better performance and perceived speed
        const chunks = splitTextIntoChunks(text);
        console.log(`📝 Split text into ${chunks.length} chunks`);
        
        // Process chunks sequentially with proper error handling
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`🔊 Processing chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 50)}${chunk.length > 50 ? '...' : ''}"`);
            
            try {
                await synthesizeAndPlayChunk(chunk, voiceId!, languageConfig);
                
                // Small delay between chunks for natural speech flow
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (chunkError) {
                console.warn(`⚠️ Error processing chunk ${i + 1}, continuing with next chunk:`, chunkError);
                // Continue with next chunk instead of failing completely
            }
        }
        
        console.log('✅ Speech synthesis completed successfully');
        
    } catch (error: any) {
        console.error('❌ Error generating speech with ElevenLabs:', error?.message || error);
        console.log('🔄 Falling back to browser speech synthesis...');
        return speakWithBrowserFallback(text);
    }
}

/**
 * Split text into manageable chunks for better performance
 */
function splitTextIntoChunks(text: string): string[] {
    // Clean the text first
    const cleanText = text.trim();
    
    // If text is short enough, return as single chunk
    if (cleanText.length <= 150) {
        return [cleanText];
    }
    
    // Split by sentences first
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;
        
        // If adding this sentence would make the chunk too long
        if (currentChunk.length + trimmedSentence.length > 120) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = trimmedSentence;
        } else {
            currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
        }
    }
    
    // Add the last chunk
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    // If no chunks were created (edge case), return original text
    return chunks.length > 0 ? chunks : [cleanText];
}

/**
 * Synthesize and play a single chunk with robust error handling
 */
async function synthesizeAndPlayChunk(text: string, voiceId: string, languageConfig: LanguageConfig): Promise<void> {
    if (!text || text.trim() === '') {
        console.warn('⚠️ Empty chunk provided to synthesizeAndPlayChunk');
        return;
    }

    if (!voiceId || voiceId === 'undefined') {
        console.error('❌ Invalid voice ID provided to synthesizeAndPlayChunk:', voiceId);
        throw new Error(`Invalid voice ID: ${voiceId}`);
    }

    try {
        console.log(`🎵 Generating audio for chunk with voice ${voiceId} and model ${languageConfig.model}`);
        
        // Use the appropriate model for the language
        const audioResponse = await elevenlabs.textToSpeech.convert(voiceId, {
            text: text,
            modelId: languageConfig.model,
            voice_settings: {
                stability: 0.6,
                similarity_boost: 0.8,
                style: 0.3,
                use_speaker_boost: true
            }
        });

        // Convert the response to ArrayBuffer
        let audioBuffer: ArrayBuffer;
        if (audioResponse instanceof ArrayBuffer) {
            audioBuffer = audioResponse;
        } else if (audioResponse instanceof Uint8Array) {
            audioBuffer = audioResponse.buffer.slice(audioResponse.byteOffset, audioResponse.byteOffset + audioResponse.byteLength);
        } else if (audioResponse && typeof audioResponse.arrayBuffer === 'function') {
            audioBuffer = await audioResponse.arrayBuffer();
        } else {
            throw new Error('Invalid audio response format');
        }

        if (!audioBuffer || audioBuffer.byteLength === 0) {
            throw new Error('Empty audio buffer received');
        }

        console.log(`✅ Audio generated successfully: ${audioBuffer.byteLength} bytes`);

        // Play the audio with improved error handling
        await playAudioBuffer(audioBuffer, languageConfig);
        
    } catch (error: any) {
        console.error('❌ Error in synthesizeAndPlayChunk:', error?.message || error);
        throw error;
    }
}

/**
 * Play audio buffer with robust error handling and multiple fallback strategies
 */
async function playAudioBuffer(audioBuffer: ArrayBuffer, languageConfig: LanguageConfig): Promise<void> {
    try {
        // Validate audio buffer
        if (!audioBuffer || audioBuffer.byteLength === 0) {
            throw new Error('Invalid or empty audio buffer');
        }

        console.log(`🔊 Playing audio buffer (${audioBuffer.byteLength} bytes)`);
        
        // Try Web Audio API first (most reliable for binary audio data)
        try {
            await playWithWebAudioAPI(audioBuffer);
            return;
        } catch (webAudioError) {
            console.warn('⚠️ Web Audio API failed, trying HTML Audio Element:', webAudioError);
        }
        
        // Fallback to HTML Audio Element with multiple format attempts
        try {
            await playWithHTMLAudioElement(audioBuffer);
            return;
        } catch (htmlAudioError) {
            console.warn('⚠️ HTML Audio Element failed:', htmlAudioError);
        }
        
        // Final fallback to browser TTS
        console.log('🔄 All audio methods failed, using browser TTS as final fallback');
        await speakWithBrowserFallback(languageConfig.name, languageConfig.nativeName);
        
    } catch (error: any) {
        console.error('❌ Critical error in playAudioBuffer:', error?.message || error);
        throw error;
    }
}

/**
 * Play audio using Web Audio API (preferred method)
 */
async function playWithWebAudioAPI(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            // Create or reuse audio context
            if (!currentAudioContext) {
                currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            
            // Resume context if suspended
            if (currentAudioContext.state === 'suspended') {
                await currentAudioContext.resume();
            }
            
            // Ensure we have a proper ArrayBuffer
            let bufferToDecode: ArrayBuffer;
            if (audioBuffer instanceof ArrayBuffer) {
                bufferToDecode = audioBuffer;
            } else if (audioBuffer instanceof Uint8Array) {
                bufferToDecode = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength);
            } else {
                throw new Error('Invalid audio buffer format');
            }
            
            // Validate buffer has content
            if (bufferToDecode.byteLength === 0) {
                throw new Error('Empty audio buffer provided to Web Audio API');
            }
            
            // Decode audio data
            const decodedBuffer = await currentAudioContext.decodeAudioData(bufferToDecode);
            
            // Create source
            const source = currentAudioContext.createBufferSource();
            currentSource = source;
            source.buffer = decodedBuffer;
            source.connect(currentAudioContext.destination);
            
            // Set up event handlers
            source.onended = () => {
                console.log('✅ Audio playback finished (Web Audio API)');
                currentSource = null;
                isPlaying = false;
                resolve();
            };
            
            // Start playback
            isPlaying = true;
            source.start(0);
            
        } catch (error: any) {
            currentSource = null;
            isPlaying = false;
            reject(new Error(`Web Audio API error: ${error?.message || error}`));
        }
    });
}

/**
 * Play audio using HTML Audio Element (fallback method)
 */
async function playWithHTMLAudioElement(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            console.log('🎵 Trying HTML Audio Element...');
            
            // Create blob URL
            const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(blob);
            
            const audio = new Audio();
            let currentAudio = audio;
            
            const cleanup = () => {
                URL.revokeObjectURL(audioUrl);
                audio.removeEventListener('canplaythrough', onCanPlay);
                audio.removeEventListener('error', onError);
                audio.removeEventListener('ended', onEnded);
                currentAudio = null;
            };
            
            const onCanPlay = () => {
                console.log('🎵 HTML Audio can play, starting...');
                audio.play().then(() => {
                    console.log('✅ HTML Audio playing successfully');
                }).catch((playError) => {
                    console.warn('⚠️ HTML Audio play failed:', playError);
                    cleanup();
                    reject(new Error(`HTML Audio play failed: ${playError.message}`));
                });
            };
            
            const onError = (error: any) => {
                console.warn(`❌ HTML Audio error:`, error);
                cleanup();
                reject(new Error(`HTML Audio failed: ${error.message || 'Unknown error'}`));
            };
            
            const onEnded = () => {
                console.log('✅ HTML Audio finished');
                cleanup();
                resolve();
            };
            
            // Set up event listeners
            audio.addEventListener('canplaythrough', onCanPlay);
            audio.addEventListener('error', onError);
            audio.addEventListener('ended', onEnded);
            
            // Configure audio element
            audio.preload = 'auto';
            audio.volume = 0.8;
            
            // Set source and load
            audio.src = audioUrl;
            audio.load();
            
        } catch (error: any) {
            isPlaying = false;
            currentAudio = null;
            reject(new Error(`HTML Audio Element error: ${error?.message || error}`));
        }
    });
}

/**
 * Fallback to browser's built-in speech synthesis.
 */
function speakWithBrowserFallback(languageName: string, nativeName: string): Promise<void> {
    return new Promise((resolve) => {
        console.log("🔄 Using browser fallback TTS for:", languageName + " (" + nativeName + ")");
        
        // Stop any ElevenLabs audio first
        stopSpeech();
        
        if (!window.speechSynthesis) {
            console.warn('⚠️ Browser speech synthesis not available');
            resolve();
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(languageName + " (" + nativeName + ")");
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Try to find a good male voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoices = [
            'Google US English Male',
            'Microsoft David Desktop',
            'Alex',
            'Daniel',
            'Fred'
        ];
        
        let selectedVoice = null;
        for (const preferredName of preferredVoices) {
            selectedVoice = voices.find(voice => voice.name.includes(preferredName));
            if (selectedVoice) break;
        }
        
        // If no preferred voice found, try to find any male voice
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('male') || 
                voice.name.toLowerCase().includes('david') ||
                voice.name.toLowerCase().includes('alex')
            );
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('🎯 Using browser voice:', selectedVoice.name);
        }
        
        utterance.onend = () => {
            console.log('✅ Browser TTS finished');
            resolve();
        };
        
        utterance.onerror = (error) => {
            console.warn('⚠️ Browser TTS error:', error);
            resolve(); // Still resolve to prevent hanging
        };
        
        window.speechSynthesis.speak(utterance);
    });
}

/**
 * Stop all speech synthesis and audio playback.
 */
export function stopSpeech(): void {
    console.log('🔇 Stopping all speech...');
    
    // Stop Web Audio API
    if (currentSource) {
        try {
            currentSource.stop();
            currentSource.disconnect();
        } catch (e) {
            // Ignore errors when stopping
        }
        currentSource = null;
    }
    
    // Stop HTML Audio Element
    if (currentAudio) {
        try {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        } catch (e) {
            // Ignore errors when stopping
        }
        currentAudio = null;
    }
    
    // Stop browser speech synthesis
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    isPlaying = false;
    console.log('🔇 All speech stopped');
}

/**
 * Check if speech is currently playing.
 */
export function isSpeechPlaying(): boolean {
    return isPlaying || 
           (currentAudio && !currentAudio.paused) || 
           (window.speechSynthesis && window.speechSynthesis.speaking);
}

/**
 * Get all available voices from ElevenLabs.
 */
export function getAllAvailableVoices() {
    return allAvailableVoices;
}

/**
 * Change the current voice.
 */
export function changeVoice(voiceId: string): boolean {
    const voice = allAvailableVoices.find(v => v.voice_id === voiceId);
    if (voice) {
        availableVoiceId = voiceId;
        console.log('🎯 Voice changed to:', voice.name);
        return true;
    }
    return false;
}

/**
 * Get current voice information.
 */
export function getCurrentVoice() {
    if (!availableVoiceId) return null;
    return allAvailableVoices.find(v => v.voice_id === availableVoiceId);
}

/**
 * Pre-warm ElevenLabs API for faster first response.
 */
export async function preWarmElevenLabs(): Promise<void> {
    if (isPreWarmed || !availableVoiceId) return;
    
    try {
        console.log('🔥 Pre-warming ElevenLabs API...');
        
        const testAudio = await elevenlabs.textToSpeech.convert(availableVoiceId, {
            text: "Hi",
            modelId: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.6,
                similarity_boost: 0.8,
                style: 0.3,
                use_speaker_boost: true
            }
        });
        
        // Convert response to ArrayBuffer for validation
        let audioBuffer: ArrayBuffer;
        
        try {
            if (testAudio instanceof ArrayBuffer) {
                audioBuffer = testAudio;
            } else if (testAudio instanceof Uint8Array) {
                audioBuffer = testAudio.buffer.slice(testAudio.byteOffset, testAudio.byteOffset + testAudio.byteLength);
            } else if (testAudio && typeof testAudio.arrayBuffer === 'function') {
                audioBuffer = await testAudio.arrayBuffer();
            } else if (testAudio && typeof testAudio === 'object') {
                // Try to extract audio data from response object
                console.log('🔍 Pre-warm response type:', typeof testAudio, testAudio);
                throw new Error('Unexpected response format from ElevenLabs');
            } else {
                throw new Error('Invalid pre-warm response format');
            }
            
            if (audioBuffer && audioBuffer.byteLength > 0) {
                isPreWarmed = true;
                console.log('✅ ElevenLabs API pre-warmed successfully');
            } else {
                console.warn('⚠️ Pre-warming returned empty audio');
            }
        } catch (formatError) {
            console.warn('⚠️ Pre-warming failed: Invalid pre-warm response format');
            // Don't throw, just log the warning and continue
        }
    } catch (error: any) {
        console.warn('⚠️ Pre-warming failed:', error?.message || error);
        // Don't throw, just log the warning and continue
    }
}

/**
 * ElevenLabsService Class Wrapper
 * Provides a class-based interface for the free audio pipeline
 */
export class ElevenLabsService {
  private isInitialized = false;
  private voiceId: string | null = null;
  private currentLanguage: LanguageConfig | null = null;

  constructor() {
    // Initialize with default settings
  }

  /**
   * Initialize the ElevenLabs service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔧 Initializing ElevenLabs Service...');
    
    try {
      const connectionSuccess = await testElevenLabsConnection();
      if (connectionSuccess) {
        this.isInitialized = true;
        this.currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === 'en')!;
        console.log('✅ ElevenLabs Service initialized successfully');
      } else {
        throw new Error('Failed to connect to ElevenLabs API');
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize ElevenLabs Service:', error?.message || error);
      throw error;
    }
  }

  /**
   * Generate speech with automatic language detection
   */
  async generateSpeech(text: string, options: { voice?: string; language?: string; model?: string } = {}): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Detect or use specified language
    let languageConfig: LanguageConfig;
    if (options.language) {
      languageConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === options.language) || detectLanguage(text);
    } else {
      languageConfig = detectLanguage(text);
    }

    this.currentLanguage = languageConfig;

    // Get the best voice for the language
    let voiceId = options.voice || this.voiceId;
    if (!options.voice) {
      const bestVoiceId = getBestVoiceForLanguage(languageConfig, allAvailableVoices);
      if (bestVoiceId) {
        voiceId = bestVoiceId;
        this.voiceId = bestVoiceId;
      }
    }

    console.log(`🎤 Generating speech for ${languageConfig.name} (${languageConfig.nativeName}) with voice ${voiceId}`);

    // Use the enhanced synthesizeSpeech function
    await synthesizeSpeech(text, { 
      language: languageConfig.code, 
      voice: voiceId 
    });

    return `Generated speech for ${languageConfig.name}`;
  }

  /**
   * Get available voices for a specific language
   */
  async getAvailableVoices(languageCode?: string): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (languageCode) {
      const languageConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
      if (languageConfig) {
        return languageConfig.voices;
      }
    }

    return allAvailableVoices.map(v => v.name);
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Change voice for a specific language
   */
  async changeVoice(voiceId: string, languageCode?: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Verify the voice exists
    const voice = allAvailableVoices.find(v => v.voice_id === voiceId);
    if (!voice) {
      console.warn(`⚠️ Voice ${voiceId} not found`);
      return false;
    }

    this.voiceId = voiceId;
    
    if (languageCode) {
      this.currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || null;
    }

    console.log(`✅ Changed voice to ${voice.name} (${voiceId})`);
    return true;
  }

  /**
   * Get current voice information
   */
  getCurrentVoice(): any {
    if (!this.voiceId) return null;
    return allAvailableVoices.find(v => v.voice_id === this.voiceId);
  }

  /**
   * Get current language information
   */
  getCurrentLanguage(): LanguageConfig | null {
    return this.currentLanguage;
  }

  /**
   * Stop current speech
   */
  stopSpeech(): void {
    stopSpeech();
  }

  /**
   * Check if speech is currently playing
   */
  isSpeechPlaying(): boolean {
    return isSpeechPlaying();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    stopSpeech();
    this.isInitialized = false;
    this.voiceId = null;
    this.currentLanguage = null;
  }
} 