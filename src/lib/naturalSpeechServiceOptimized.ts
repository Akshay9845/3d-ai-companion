/**
 * Optimized Natural Speech Service - Gemini-like Multilingual TTS
 * Enhanced with seamless code-switching and native pronunciation
 * Supports native Indian languages with clear, friendly robot voice
 */

interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  naturalSampleRateHertz?: number;
}

interface SpeechOptions {
  preferredGender?: 'male' | 'female';
  style?: 'default' | 'humanoid-robot';
  autoDetectLanguage?: boolean;
  language?: string;
}

interface LanguageSegment {
  text: string;
  lang: string;
  confidence: number;
}

class OptimizedNaturalSpeechService {
  private googleTTSApiKey: string;
  private isInitialized: boolean = false;
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  // Enhanced voice configurations for Gemini-like multilingual speech
  private voiceConfigs: Record<string, VoiceConfig> = {
    // Telugu - Native voices
    'te': {
      languageCode: 'te-IN',
      name: 'te-IN-Standard-A',
      ssmlGender: 'FEMALE',
      naturalSampleRateHertz: 24000
    },
    'te-male': {
      languageCode: 'te-IN',
      name: 'te-IN-Standard-B',
      ssmlGender: 'MALE',
      naturalSampleRateHertz: 24000
    },

    // Hindi - Native voices with WaveNet
    'hi': {
      languageCode: 'hi-IN',
      name: 'hi-IN-Wavenet-A',
      ssmlGender: 'FEMALE',
      naturalSampleRateHertz: 24000
    },
    'hi-male': {
      languageCode: 'hi-IN',
      name: 'hi-IN-Wavenet-B',
      ssmlGender: 'MALE',
      naturalSampleRateHertz: 24000
    },

    // Tamil - Native voices
    'ta': {
      languageCode: 'ta-IN',
      name: 'ta-IN-Standard-A',
      ssmlGender: 'FEMALE',
      naturalSampleRateHertz: 24000
    },
    'ta-male': {
      languageCode: 'ta-IN',
      name: 'ta-IN-Standard-B',
      ssmlGender: 'MALE',
      naturalSampleRateHertz: 24000
    },

    // Kannada - Native voices
    'kn': {
      languageCode: 'kn-IN',
      name: 'kn-IN-Standard-A',
      ssmlGender: 'FEMALE',
      naturalSampleRateHertz: 24000
    },
    'kn-male': {
      languageCode: 'kn-IN',
      name: 'kn-IN-Standard-B',
      ssmlGender: 'MALE',
      naturalSampleRateHertz: 24000
    },

    // Malayalam - Native voices
    'ml': {
      languageCode: 'ml-IN',
      name: 'ml-IN-Standard-A',
      ssmlGender: 'FEMALE',
      naturalSampleRateHertz: 24000
    },

    // Bengali - Native voices
    'bn': {
      languageCode: 'bn-IN',
      name: 'bn-IN-Standard-A',
      ssmlGender: 'FEMALE',
      naturalSampleRateHertz: 24000
    },

    // Marathi - Native voices
    'mr': {
      languageCode: 'mr-IN',
      name: 'mr-IN-Standard-A',
      ssmlGender: 'FEMALE',
      naturalSampleRateHertz: 24000
    },

    // Gujarati - Native voices
    'gu': {
      languageCode: 'gu-IN',
      name: 'gu-IN-Standard-A',
      ssmlGender: 'FEMALE',
      naturalSampleRateHertz: 24000
    },

    // English (India) - With Indian accent for seamless transitions
    'en-IN': {
      languageCode: 'en-IN',
      name: 'en-IN-Wavenet-A',
      ssmlGender: 'FEMALE',
      naturalSampleRateHertz: 24000
    },
    'en-IN-male': {
      languageCode: 'en-IN',
      name: 'en-IN-Wavenet-B',
      ssmlGender: 'MALE',
      naturalSampleRateHertz: 24000
    },

    // English (US) - Fallback
    'en': {
      languageCode: 'en-US',
      name: 'en-US-Wavenet-F',
      ssmlGender: 'FEMALE',
      naturalSampleRateHertz: 24000
    }
  };

  // Language detection patterns using Unicode ranges
  private languageDetectors = [
    { lang: 'te', regex: /[\u0C00-\u0C7F\s\u0C00-\u0C7F]+/g, name: 'Telugu' },
    { lang: 'hi', regex: /[\u0900-\u097F\s\u0900-\u097F]+/g, name: 'Hindi/Devanagari' },
    { lang: 'ta', regex: /[\u0B80-\u0BFF\s\u0B80-\u0BFF]+/g, name: 'Tamil' },
    { lang: 'kn', regex: /[\u0C80-\u0CFF\s\u0C80-\u0CFF]+/g, name: 'Kannada' },
    { lang: 'ml', regex: /[\u0D00-\u0D7F\s\u0D00-\u0D7F]+/g, name: 'Malayalam' },
    { lang: 'bn', regex: /[\u0980-\u09FF\s\u0980-\u09FF]+/g, name: 'Bengali' },
    { lang: 'gu', regex: /[\u0A80-\u0AFF\s\u0A80-\u0AFF]+/g, name: 'Gujarati' },
    { lang: 'mr', regex: /[\u0900-\u097F\s\u0900-\u097F]+/g, name: 'Marathi' },
  ];

  constructor() {
    this.googleTTSApiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      console.log('🎵 Optimized Natural Speech Service initialized with Web Audio API');
    } catch (error) {
      console.warn('Web Audio API not available, falling back to basic audio:', error);
      this.isInitialized = true;
    }
  }

  /**
   * Advanced text segmentation for Gemini-like multilingual synthesis
   * Detects language boundaries and maintains context
   */
  private segmentTextByLanguage(text: string): LanguageSegment[] {
    const segments: LanguageSegment[] = [];
    const matches: Array<{ index: number; text: string; lang: string; name: string }> = [];

    // Find all script matches
    for (const detector of this.languageDetectors) {
      let match;
      while ((match = detector.regex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          text: match[0].trim(),
          lang: detector.lang,
          name: detector.name
        });
      }
    }

    // Sort matches by position
    matches.sort((a, b) => a.index - b.index);

    let lastIndex = 0;

    for (const match of matches) {
      // Add English segment before current match
      if (match.index > lastIndex) {
        const englishText = text.slice(lastIndex, match.index).trim();
        if (englishText) {
          segments.push({
            text: englishText,
            lang: 'en',
            confidence: 0.9
          });
        }
      }

      // Add current language segment
      if (match.text) {
        segments.push({
          text: match.text,
          lang: match.lang,
          confidence: 0.95
        });
        console.log(`🧩 Detected ${match.name} segment: "${match.text.substring(0, 30)}..."`);
      }

      lastIndex = match.index + match.text.length;
    }

    // Add remaining English text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex).trim();
      if (remainingText) {
        segments.push({
          text: remainingText,
          lang: 'en',
          confidence: 0.9
        });
      }
    }

    // If no segments found, treat entire text as English
    if (segments.length === 0) {
      segments.push({
        text: text.trim(),
        lang: 'en',
        confidence: 0.8
      });
    }

    return segments;
  }

  /**
   * Generate SSML for Gemini-like humanoid robot voice
   */
  private generateRobotSSML(text: string, language: string): string {
    // Escape special characters for SSML
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Gemini-style robot voice parameters
    const robotSettings = {
      rate: language.startsWith('en') ? 'medium' : 'slow', // Slower for Indian languages
      pitch: 'medium',
      volume: 'loud',
      emphasis: 'moderate'
    };

    return `
      <speak>
        <prosody rate="${robotSettings.rate}" pitch="${robotSettings.pitch}" volume="${robotSettings.volume}">
          <emphasis level="${robotSettings.emphasis}">
            ${escapedText}
          </emphasis>
        </prosody>
      </speak>
    `.trim();
  }

  /**
   * Generate speech audio for a single segment
   */
  private async generateSegmentAudio(segment: LanguageSegment, options: SpeechOptions): Promise<Blob | null> {
    try {
      // Determine language code for TTS
      let langCode = segment.lang;
      if (langCode === 'en') {
        langCode = 'en-IN'; // Prefer Indian English for seamless voice transitions
      }

      // Select voice configuration
      let voiceConfig = this.voiceConfigs[langCode] || this.voiceConfigs['en-IN'];
      
      // Apply gender preference
      if (options.preferredGender === 'male') {
        const maleVoiceKey = `${langCode}-male`;
        if (this.voiceConfigs[maleVoiceKey]) {
          voiceConfig = this.voiceConfigs[maleVoiceKey];
        }
      }

      // Generate SSML based on style
      const ssml = options.style === 'humanoid-robot' 
        ? this.generateRobotSSML(segment.text, langCode)
        : `<speak><prosody rate="0.95">${segment.text}</prosody></speak>`;

      console.log(`🎵 Generating ${langCode} audio for: "${segment.text.substring(0, 30)}..."`);

      // Call Google TTS API
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleTTSApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { ssml },
          voice: {
            languageCode: voiceConfig.languageCode,
            name: voiceConfig.name,
            ssmlGender: voiceConfig.ssmlGender
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0,
            sampleRateHertz: voiceConfig.naturalSampleRateHertz || 24000,
            effectsProfileId: ['headphone-class-device']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google TTS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.audioContent) {
        const audioBytes = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });
        console.log(`✅ Generated ${langCode} audio (${audioBlob.size} bytes)`);
        return audioBlob;
      }

      throw new Error('No audio content received');

    } catch (error) {
      console.error(`❌ Failed to generate audio for ${segment.lang} segment:`, error);
      return null;
    }
  }

  /**
   * Concatenate audio blobs for seamless playback
   */
  private concatenateAudioBlobs(blobs: Blob[]): Blob {
    return new Blob(blobs, { type: 'audio/mp3' });
  }

  /**
   * Play audio with enhanced processing
   */
  private async playAudio(audioBlob: Blob): Promise<void> {
    const audioUrl = URL.createObjectURL(audioBlob);
    
    try {
      // Stop any current audio
      this.stopCurrentAudio();

      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.preload = 'auto';
      this.currentAudio.volume = 1.0;

      // Enhanced audio processing if Web Audio API is available
      if (this.audioContext && this.audioContext.state === 'running') {
        try {
          const source = this.audioContext.createMediaElementSource(this.currentAudio);
          const gainNode = this.audioContext.createGain();
          
          source.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
          gainNode.gain.value = 1.1; // Slight volume boost for clarity
        } catch (audioContextError) {
          console.warn('Audio context processing failed, using basic playback:', audioContextError);
        }
      }

      // Play audio and return promise
      return new Promise((resolve, reject) => {
        if (!this.currentAudio) return reject(new Error('Audio not initialized'));
        
        this.currentAudio.onended = () => {
          resolve();
          this.cleanup(audioUrl);
        };
        
        this.currentAudio.onerror = (error) => {
          console.error('Audio playback error:', error);
          reject(error);
          this.cleanup(audioUrl);
        };
        
        this.currentAudio.play().catch(reject);
      });

    } catch (error) {
      this.cleanup(audioUrl);
      throw error;
    }
  }

  /**
   * Main speak method with Gemini-like multilingual synthesis
   */
  public async speak(text: string, options: SpeechOptions | string = {}): Promise<void> {
    // Normalize options
    const normalizedOptions: SpeechOptions = typeof options === 'string' 
      ? { preferredGender: options as 'male' | 'female' }
      : {
          preferredGender: 'male',
          style: 'humanoid-robot',
          autoDetectLanguage: true,
          ...options
        };

    console.log('🗣️ Starting Gemini-style multilingual synthesis:', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      options: normalizedOptions
    });

    try {
      // Segment text by language
      const segments = this.segmentTextByLanguage(text);
      console.log(`🧩 Text segmented into ${segments.length} language parts`);

      // Generate audio for each segment
      const audioBlobs: Blob[] = [];
      
      for (const segment of segments) {
        const audioBlob = await this.generateSegmentAudio(segment, normalizedOptions);
        if (audioBlob) {
          audioBlobs.push(audioBlob);
        }
      }

      if (audioBlobs.length === 0) {
        throw new Error('No audio generated for any segments');
      }

      // Concatenate and play audio
      const combinedAudio = this.concatenateAudioBlobs(audioBlobs);
      console.log(`🎵 Playing concatenated audio (${combinedAudio.size} bytes, ${audioBlobs.length} segments)`);
      
      await this.playAudio(combinedAudio);
      console.log('✅ Gemini-style multilingual speech synthesis completed successfully');

    } catch (error) {
      console.error('❌ Multilingual speech synthesis failed:', error);
      
      // Fallback to browser TTS
      try {
        console.log('🔄 Falling back to browser TTS...');
        await this.fallbackToBrowserTTS(text, normalizedOptions);
      } catch (fallbackError) {
        console.error('❌ Browser TTS fallback also failed:', fallbackError);
        throw new Error('All speech synthesis methods failed');
      }
    }
  }

  /**
   * Fallback to browser TTS
   */
  private async fallbackToBrowserTTS(text: string, options: SpeechOptions): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      throw new Error('Browser TTS not available');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = options.preferredGender === 'male' ? 0.95 : 1.1;
      utterance.volume = 1.0;

      // Try to find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en-IN') || voice.lang.includes('en-US')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stop current audio playback
   */
  public stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(audioUrl: string): void {
    try {
      URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.warn('Error cleaning up audio URL:', error);
    }
  }

  /**
   * Test multilingual capabilities
   */
  public async testMultilingual(): Promise<void> {
    const testText = "Hello, my name is Echo. నేను తెలుగు మాట్లాడగలను. मैं हिंदी भी बोल सकता हूँ। I can switch between languages seamlessly.";
    console.log('🧪 Testing multilingual synthesis...');
    await this.speak(testText, {
      preferredGender: 'male',
      style: 'humanoid-robot',
      autoDetectLanguage: true
    });
  }

  /**
   * Get supported languages
   */
  public getSupportedLanguages(): string[] {
    return Object.keys(this.voiceConfigs).filter(key => !key.includes('-male'));
  }
}

// Export singleton instance
export const optimizedNaturalSpeechService = new OptimizedNaturalSpeechService();
export default optimizedNaturalSpeechService;
