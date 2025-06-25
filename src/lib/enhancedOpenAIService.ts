/**
 * Enhanced OpenAI Service
 * 
 * Integrates the latest OpenAI audio capabilities:
 * - GPT-4o mini TTS (text-to-speech)
 * - GPT-4o mini transcribe (speech-to-text)
 * - Streaming audio support
 * - Multi-language support
 * - Real-time transcription
 * 
 * Based on OpenAI's latest API documentation
 */

export interface OpenAIAudioConfig {
  // TTS Configuration
  ttsModel: 'gpt-4o-mini-tts' | 'tts-1' | 'tts-1-hd';
  ttsVoice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer';
  ttsResponseFormat: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
  ttsSpeed?: number;
  
  // STT Configuration
  sttModel: 'gpt-4o-mini-transcribe' | 'gpt-4o-transcribe' | 'whisper-1';
  sttResponseFormat: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  sttLanguage?: string;
  sttPrompt?: string;
  
  // Streaming Configuration
  enableStreaming: boolean;
  chunkSize: number;
}

export interface OpenAITTSRequest {
  text: string;
  voice?: string;
  language?: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm' | 'whisper';
  speed?: number;
  instructions?: string;
}

export interface OpenAISTTRequest {
  audioBlob: Blob;
  language?: string;
  prompt?: string;
  responseFormat?: string;
  timestampGranularities?: ('word' | 'segment')[];
}

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  segments?: {
    start: number;
    end: number;
    text: string;
  }[];
  words?: {
    start: number;
    end: number;
    text: string;
  }[];
}

export class EnhancedOpenAIService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';
  private config: OpenAIAudioConfig;

  // Supported languages (from OpenAI Whisper documentation)
  private supportedLanguages = [
    'af', 'ar', 'hy', 'az', 'be', 'bs', 'bg', 'ca', 'zh', 'hr', 'cs', 'da', 'nl', 'en', 'et', 'fi', 'fr', 'gl', 'de', 'el', 'he', 'hi', 'hu', 'is', 'id', 'it', 'ja', 'kn', 'kk', 'ko', 'lv', 'lt', 'mk', 'ms', 'mr', 'mi', 'ne', 'no', 'fa', 'pl', 'pt', 'ro', 'ru', 'sr', 'sk', 'sl', 'es', 'sw', 'sv', 'tl', 'ta', 'th', 'tr', 'uk', 'ur', 'vi', 'cy'
  ];

  constructor(apiKey: string, config: Partial<OpenAIAudioConfig> = {}) {
    this.apiKey = apiKey;
    this.config = {
      ttsModel: 'gpt-4o-mini-tts',
      ttsVoice: 'coral',
      ttsResponseFormat: 'mp3',
      ttsSpeed: 1.0,
      sttModel: 'gpt-4o-mini-transcribe',
      sttResponseFormat: 'json',
      enableStreaming: true,
      chunkSize: 1024,
      ...config
    };
  }

  /**
   * Generate speech using GPT-4o mini TTS
   */
  async generateSpeech(request: OpenAITTSRequest): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`${this.baseURL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.ttsModel,
          input: request.text,
          voice: request.voice || this.config.ttsVoice,
          response_format: this.config.ttsResponseFormat,
          speed: request.speed || this.config.ttsSpeed,
          instructions: this.generateInstructions(request)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI TTS failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('❌ OpenAI TTS generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate streaming speech for real-time applications
   */
  async generateStreamingSpeech(request: OpenAITTSRequest): Promise<ReadableStream<Uint8Array>> {
    try {
      const response = await fetch(`${this.baseURL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.ttsModel,
          input: request.text,
          voice: request.voice || this.config.ttsVoice,
          response_format: 'wav', // Use WAV for streaming
          speed: request.speed || this.config.ttsSpeed,
          instructions: this.generateInstructions(request)
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
   * Transcribe audio using GPT-4o mini transcribe
   */
  async transcribe(request: OpenAISTTRequest): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('file', request.audioBlob, 'audio.wav');
      formData.append('model', this.config.sttModel);
      formData.append('response_format', request.responseFormat || this.config.sttResponseFormat);
      
      if (request.language) {
        formData.append('language', request.language);
      }
      
      if (request.prompt) {
        formData.append('prompt', request.prompt);
      }

      // Add timestamp granularities for whisper-1
      if (this.config.sttModel === 'whisper-1' && request.timestampGranularities) {
        request.timestampGranularities.forEach(granularity => {
          formData.append('timestamp_granularities[]', granularity);
        });
      }

      const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI transcription failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      return {
        text: result.text,
        language: this.detectLanguage(result.text),
        confidence: this.calculateConfidence(result),
        segments: result.segments,
        words: result.words
      };
    } catch (error) {
      console.error('❌ OpenAI transcription failed:', error);
      throw error;
    }
  }

  /**
   * Stream transcription for real-time applications
   */
  async transcribeStream(request: OpenAISTTRequest): Promise<ReadableStream<Uint8Array>> {
    try {
      const formData = new FormData();
      formData.append('file', request.audioBlob, 'audio.wav');
      formData.append('model', this.config.sttModel);
      formData.append('response_format', 'text');
      formData.append('stream', 'true');
      
      if (request.language) {
        formData.append('language', request.language);
      }
      
      if (request.prompt) {
        formData.append('prompt', request.prompt);
      }

      const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI streaming transcription failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      return response.body as ReadableStream<Uint8Array>;
    } catch (error) {
      console.error('❌ OpenAI streaming transcription failed:', error);
      throw error;
    }
  }

  /**
   * Translate audio to English
   */
  async translate(request: OpenAISTTRequest): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('file', request.audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1'); // Only whisper-1 supports translation
      formData.append('response_format', request.responseFormat || 'json');
      
      if (request.prompt) {
        formData.append('prompt', request.prompt);
      }

      const response = await fetch(`${this.baseURL}/audio/translations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI translation failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      return {
        text: result.text,
        language: 'en', // Translation always outputs English
        confidence: this.calculateConfidence(result),
        segments: result.segments,
        words: result.words
      };
    } catch (error) {
      console.error('❌ OpenAI translation failed:', error);
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

    // Add custom instructions
    if (request.instructions) {
      instructions.push(request.instructions);
    }

    return instructions.join('. ');
  }

  /**
   * Get language name from code
   */
  private getLanguageName(languageCode: string): string {
    const languageNames: { [key: string]: string } = {
      'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
      'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese',
      'hi': 'Hindi', 'ar': 'Arabic', 'nl': 'Dutch', 'sv': 'Swedish', 'no': 'Norwegian',
      'da': 'Danish', 'fi': 'Finnish', 'pl': 'Polish', 'tr': 'Turkish', 'he': 'Hebrew',
      'th': 'Thai', 'vi': 'Vietnamese', 'id': 'Indonesian', 'ms': 'Malay', 'tl': 'Tagalog'
    };
    
    return languageNames[languageCode] || languageCode;
  }

  /**
   * Detect language from text
   */
  private detectLanguage(text: string): string {
    // Simple language detection based on common patterns
    const patterns: { [key: string]: RegExp } = {
      'zh': /[\u4e00-\u9fff]/,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
      'ko': /[\uac00-\ud7af]/,
      'ar': /[\u0600-\u06ff]/,
      'he': /[\u0590-\u05ff]/,
      'th': /[\u0e00-\u0e7f]/,
      'hi': /[\u0900-\u097f]/,
      'ru': /[\u0400-\u04ff]/,
      'el': /[\u0370-\u03ff]/
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(result: any): number {
    // For GPT-4o models, we don't have confidence scores
    // Return a default high confidence
    return 0.95;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return this.supportedLanguages;
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.includes(languageCode.toLowerCase());
  }

  /**
   * Get available TTS voices
   */
  getAvailableVoices(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'alloy', name: 'Alloy', description: 'Balanced and versatile' },
      { id: 'ash', name: 'Ash', description: 'Clear and professional' },
      { id: 'ballad', name: 'Ballad', description: 'Warm and melodic' },
      { id: 'coral', name: 'Coral', description: 'Bright and energetic' },
      { id: 'echo', name: 'Echo', description: 'Deep and resonant' },
      { id: 'fable', name: 'Fable', description: 'Storytelling voice' },
      { id: 'nova', name: 'Nova', description: 'Modern and dynamic' },
      { id: 'onyx', name: 'Onyx', description: 'Rich and powerful' },
      { id: 'sage', name: 'Sage', description: 'Wise and thoughtful' },
      { id: 'shimmer', name: 'Shimmer', description: 'Elegant and refined' }
    ];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OpenAIAudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenAIAudioConfig {
    return { ...this.config };
  }

  /**
   * Test the service
   */
  async test(): Promise<boolean> {
    try {
      // Test TTS
      const testText = "Hello, this is a test of the OpenAI TTS service.";
      const audioBuffer = await this.generateSpeech({ text: testText });
      
      if (audioBuffer.byteLength > 0) {
        console.log('✅ OpenAI TTS test passed');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ OpenAI service test failed:', error);
      return false;
    }
  }
} 