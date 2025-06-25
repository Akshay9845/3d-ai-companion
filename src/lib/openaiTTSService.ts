/**
 * OpenAI TTS Service
 * 
 * Provides high-quality text-to-speech with support for:
 * - 11 built-in voices optimized for English
 * - Multiple language support (following Whisper language support)
 * - Streaming audio output
 * - Customizable speech instructions
 */

export interface OpenAIVoice {
  id: string;
  name: string;
  description: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
}

export interface OpenAITTSConfig {
  model: 'gpt-4o-mini-tts' | 'tts-1' | 'tts-1-hd';
  voice: string;
  responseFormat: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
  speed?: number;
  instructions?: string;
}

export interface OpenAITTSRequest {
  text: string;
  language?: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm' | 'whisper';
  speed?: number;
  voice?: string;
}

export class OpenAITTSService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';
  private availableVoices: OpenAIVoice[] = [
    { id: 'alloy', name: 'Alloy', description: 'Balanced and versatile', language: 'en', gender: 'neutral' },
    { id: 'ash', name: 'Ash', description: 'Clear and professional', language: 'en', gender: 'male' },
    { id: 'ballad', name: 'Ballad', description: 'Warm and melodic', language: 'en', gender: 'female' },
    { id: 'coral', name: 'Coral', description: 'Bright and energetic', language: 'en', gender: 'female' },
    { id: 'echo', name: 'Echo', description: 'Deep and resonant', language: 'en', gender: 'male' },
    { id: 'fable', name: 'Fable', description: 'Storytelling voice', language: 'en', gender: 'neutral' },
    { id: 'nova', name: 'Nova', description: 'Modern and dynamic', language: 'en', gender: 'female' },
    { id: 'onyx', name: 'Onyx', description: 'Rich and powerful', language: 'en', gender: 'male' },
    { id: 'sage', name: 'Sage', description: 'Wise and thoughtful', language: 'en', gender: 'male' },
    { id: 'shimmer', name: 'Shimmer', description: 'Elegant and refined', language: 'en', gender: 'female' }
  ];

  private supportedLanguages = [
    'af', 'ar', 'hy', 'az', 'be', 'bs', 'bg', 'ca', 'zh', 'hr', 'cs', 'da', 'nl', 'en', 'et', 'fi', 'fr', 'gl', 'de', 'el', 'he', 'hi', 'hu', 'is', 'id', 'it', 'ja', 'kn', 'kk', 'ko', 'lv', 'lt', 'mk', 'ms', 'mr', 'mi', 'ne', 'no', 'fa', 'pl', 'pt', 'ro', 'ru', 'sr', 'sk', 'sl', 'es', 'sw', 'sv', 'tl', 'ta', 'th', 'tr', 'uk', 'ur', 'vi', 'cy'
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): OpenAIVoice[] {
    return this.availableVoices;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return this.supportedLanguages;
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.includes(languageCode.toLowerCase());
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(request: OpenAITTSRequest): Promise<ArrayBuffer> {
    try {
      const config: OpenAITTSConfig = {
        model: 'gpt-4o-mini-tts',
        voice: request.voice || 'coral',
        responseFormat: 'mp3',
        speed: request.speed || 1.0,
        instructions: this.generateInstructions(request)
      };

      const response = await fetch(`${this.baseURL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          input: request.text,
          voice: config.voice,
          response_format: config.responseFormat,
          speed: config.speed,
          instructions: config.instructions
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI TTS failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return arrayBuffer;
    } catch (error) {
      console.error('❌ OpenAI TTS generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate streaming speech (for real-time applications)
   */
  async generateStreamingSpeech(request: OpenAITTSRequest): Promise<ReadableStream<Uint8Array>> {
    try {
      const config: OpenAITTSConfig = {
        model: 'gpt-4o-mini-tts',
        voice: request.voice || 'coral',
        responseFormat: 'wav', // Use WAV for streaming
        speed: request.speed || 1.0,
        instructions: this.generateInstructions(request)
      };

      const response = await fetch(`${this.baseURL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          input: request.text,
          voice: config.voice,
          response_format: config.responseFormat,
          speed: config.speed,
          instructions: config.instructions
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI TTS streaming failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      return response.body as ReadableStream<Uint8Array>;
    } catch (error) {
      console.error('❌ OpenAI TTS streaming failed:', error);
      throw error;
    }
  }

  /**
   * Generate speech instructions based on emotion and language
   */
  private generateInstructions(request: OpenAITTSRequest): string {
    const instructions: string[] = [];

    // Add emotion-based instructions
    if (request.emotion) {
      switch (request.emotion) {
        case 'happy':
          instructions.push('Speak in a cheerful and positive tone with enthusiasm');
          break;
        case 'sad':
          instructions.push('Speak in a gentle and empathetic tone with slower pace');
          break;
        case 'excited':
          instructions.push('Speak with high energy and excitement, faster pace');
          break;
        case 'calm':
          instructions.push('Speak in a calm and soothing tone with measured pace');
          break;
        case 'whisper':
          instructions.push('Speak in a soft whisper tone');
          break;
        default:
          instructions.push('Speak in a natural and clear tone');
      }
    }

    // Add language-specific instructions
    if (request.language && request.language !== 'en') {
      instructions.push(`Speak in ${this.getLanguageName(request.language)} with appropriate accent and pronunciation`);
    }

    // Add speed instructions
    if (request.speed) {
      if (request.speed > 1.2) {
        instructions.push('Speak at a faster pace');
      } else if (request.speed < 0.8) {
        instructions.push('Speak at a slower, more deliberate pace');
      }
    }

    return instructions.join('. ') || 'Speak naturally and clearly';
  }

  /**
   * Get language name from language code
   */
  private getLanguageName(languageCode: string): string {
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'hi': 'Hindi',
      'ar': 'Arabic',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'pl': 'Polish',
      'tr': 'Turkish',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'tl': 'Tagalog',
      'ta': 'Tamil',
      'te': 'Telugu',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'bn': 'Bengali',
      'ur': 'Urdu',
      'fa': 'Persian',
      'ne': 'Nepali',
      'si': 'Sinhala',
      'my': 'Burmese',
      'km': 'Khmer',
      'lo': 'Lao',
      'mn': 'Mongolian',
      'ka': 'Georgian',
      'am': 'Amharic',
      'sw': 'Swahili',
      'zu': 'Zulu',
      'af': 'Afrikaans',
      'sq': 'Albanian',
      'hy': 'Armenian',
      'az': 'Azerbaijani',
      'eu': 'Basque',
      'be': 'Belarusian',
      'bs': 'Bosnian',
      'bg': 'Bulgarian',
      'ca': 'Catalan',
      'hr': 'Croatian',
      'cs': 'Czech',
      'et': 'Estonian',
      'gl': 'Galician',
      'el': 'Greek',
      'hu': 'Hungarian',
      'is': 'Icelandic',
      'ga': 'Irish',
      'kk': 'Kazakh',
      'ky': 'Kyrgyz',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'mk': 'Macedonian',
      'mt': 'Maltese',
      'mi': 'Maori',
      'mr': 'Marathi',
      'ro': 'Romanian',
      'sr': 'Serbian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'uk': 'Ukrainian',
      'cy': 'Welsh'
    };

    return languageNames[languageCode.toLowerCase()] || languageCode.toUpperCase();
  }

  /**
   * Test the service with a simple request
   */
  async test(): Promise<boolean> {
    try {
      const testAudio = await this.generateSpeech({
        text: 'Hello, this is a test of the OpenAI TTS service.',
        voice: 'coral'
      });
      
      console.log('✅ OpenAI TTS test successful');
      return testAudio.byteLength > 0;
    } catch (error) {
      console.error('❌ OpenAI TTS test failed:', error);
      return false;
    }
  }
}

export default OpenAITTSService; 