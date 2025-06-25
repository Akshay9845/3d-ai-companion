export interface TTSOptions {
  voice?: string;
  speed?: number;
  emotion?: 'happy' | 'sad' | 'angry' | 'neutral' | 'excited';
  language?: string;
}

export interface TTSResult {
  audio: ArrayBuffer;
  duration: number;
  sampleRate: number;
}

class CoquiTTS {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🎵 Initializing Coqui TTS...');
    
    try {
      // Check if Web Speech API is available
      if ('speechSynthesis' in window) {
        this.isInitialized = true;
        console.log('✅ Coqui TTS initialized successfully (using Web Speech API)');
      } else {
        throw new Error('Speech synthesis not supported');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Coqui TTS:', error);
      throw error;
    }
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      voice = 'default',
      speed = 1.0,
      language = 'en'
    } = options;

    console.log(`🎤 Speaking: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings
        utterance.rate = speed;
        utterance.lang = language;
        
        // Try to find a specific voice
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Use first available voice for the language
          const preferredVoice = voices.find(v => v.lang.startsWith(language)) || voices[0];
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
          console.log('✅ TTS speech completed');
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('❌ TTS speech failed:', event.error);
          reject(new Error(`Speech synthesis failed: ${event.error}`));
        };

        speechSynthesis.speak(utterance);

      } catch (error) {
        console.error('❌ TTS synthesis failed:', error);
        reject(error);
      }
    });
  }

  getAvailableVoices(): string[] {
    if (!this.isInitialized) return [];
    
    const voices = speechSynthesis.getVoices();
    return voices.map(voice => voice.name);
  }

  getAvailableLanguages(): string[] {
    if (!this.isInitialized) return ['en'];
    
    const voices = speechSynthesis.getVoices();
    const languages = [...new Set(voices.map(voice => voice.lang))];
    return languages.length > 0 ? languages : ['en'];
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  stop(): void {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  }
}

export const coquiTTS = new CoquiTTS(); 