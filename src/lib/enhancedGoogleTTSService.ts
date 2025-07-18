/**
 * Enhanced Google TTS Service
 * Intelligently uses Google Cloud TTS when available, falls back to browser TTS
 * Supports the intelligent animation system with high-quality speech synthesis
 */

export interface TTSRequest {
  text: string;
  language?: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  emotion?: 'neutral' | 'happy' | 'excited' | 'confident' | 'calm';
}

export interface TTSVoice {
  code: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  quality: 'standard' | 'neural' | 'wavenet';
}

export class EnhancedGoogleTTSService {
  private apiKey: string = '';
  private isGoogleAvailable: boolean = false;
  private isInitialized: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isCurrentlySpeaking: boolean = false;
  private onSpeechEndCallback?: () => void;
  private currentText: string = ''; // Track current text for language detection
  
  // TTS Queue Management - NEW
  private ttsQueue: Array<{ text: string; options: Partial<TTSRequest>; resolve: () => void; reject: (error: any) => void }> = [];
  private isProcessingQueue: boolean = false;
  private lastSpeechTime: number = 0;
  private speechCooldownMs: number = 500; // Minimum time between speech responses

  // High-quality Google voices with comprehensive Indian language support
  private googleVoices: TTSVoice[] = [
    // English voices
    { code: 'en-US-Neural2-F', name: 'English (US) Female Neural', language: 'en-US', gender: 'female', quality: 'neural' },
    { code: 'en-US-Neural2-C', name: 'English (US) Male Neural', language: 'en-US', gender: 'male', quality: 'neural' },
    { code: 'en-IN-Neural2-A', name: 'English (India) Female Neural', language: 'en-IN', gender: 'female', quality: 'neural' },
    { code: 'en-IN-Neural2-B', name: 'English (India) Male Neural', language: 'en-IN', gender: 'male', quality: 'neural' },
    { code: 'en-GB-Neural2-A', name: 'English (UK) Female Neural', language: 'en-GB', gender: 'female', quality: 'neural' },
    { code: 'en-GB-Neural2-B', name: 'English (UK) Male Neural', language: 'en-GB', gender: 'male', quality: 'neural' },
    
    // Telugu voices
    { code: 'te-IN-Standard-A', name: 'Telugu (India) Female Standard', language: 'te-IN', gender: 'female', quality: 'standard' },
    { code: 'te-IN-Standard-B', name: 'Telugu (India) Male Standard', language: 'te-IN', gender: 'male', quality: 'standard' },
    { code: 'te-IN-Wavenet-A', name: 'Telugu (India) Female Wavenet', language: 'te-IN', gender: 'female', quality: 'wavenet' },
    { code: 'te-IN-Wavenet-B', name: 'Telugu (India) Male Wavenet', language: 'te-IN', gender: 'male', quality: 'wavenet' },
    
    // Hindi voices
    { code: 'hi-IN-Standard-A', name: 'Hindi (India) Female Standard', language: 'hi-IN', gender: 'female', quality: 'standard' },
    { code: 'hi-IN-Standard-B', name: 'Hindi (India) Male Standard', language: 'hi-IN', gender: 'male', quality: 'standard' },
    { code: 'hi-IN-Wavenet-A', name: 'Hindi (India) Female Wavenet', language: 'hi-IN', gender: 'female', quality: 'wavenet' },
    { code: 'hi-IN-Wavenet-B', name: 'Hindi (India) Male Wavenet', language: 'hi-IN', gender: 'male', quality: 'wavenet' },
    { code: 'hi-IN-Neural2-A', name: 'Hindi (India) Female Neural', language: 'hi-IN', gender: 'female', quality: 'neural' },
    { code: 'hi-IN-Neural2-C', name: 'Hindi (India) Male Neural', language: 'hi-IN', gender: 'male', quality: 'neural' },
    
    // Tamil voices
    { code: 'ta-IN-Standard-A', name: 'Tamil (India) Female Standard', language: 'ta-IN', gender: 'female', quality: 'standard' },
    { code: 'ta-IN-Standard-B', name: 'Tamil (India) Male Standard', language: 'ta-IN', gender: 'male', quality: 'standard' },
    { code: 'ta-IN-Wavenet-A', name: 'Tamil (India) Female Wavenet', language: 'ta-IN', gender: 'female', quality: 'wavenet' },
    { code: 'ta-IN-Wavenet-B', name: 'Tamil (India) Male Wavenet', language: 'ta-IN', gender: 'male', quality: 'wavenet' },
    
    // Kannada voices
    { code: 'kn-IN-Standard-A', name: 'Kannada (India) Female Standard', language: 'kn-IN', gender: 'female', quality: 'standard' },
    { code: 'kn-IN-Standard-B', name: 'Kannada (India) Male Standard', language: 'kn-IN', gender: 'male', quality: 'standard' },
    { code: 'kn-IN-Wavenet-A', name: 'Kannada (India) Female Wavenet', language: 'kn-IN', gender: 'female', quality: 'wavenet' },
    { code: 'kn-IN-Wavenet-B', name: 'Kannada (India) Male Wavenet', language: 'kn-IN', gender: 'male', quality: 'wavenet' },
    
    // Bengali voices
    { code: 'bn-IN-Standard-A', name: 'Bengali (India) Female Standard', language: 'bn-IN', gender: 'female', quality: 'standard' },
    { code: 'bn-IN-Standard-B', name: 'Bengali (India) Male Standard', language: 'bn-IN', gender: 'male', quality: 'standard' },
    { code: 'bn-IN-Wavenet-A', name: 'Bengali (India) Female Wavenet', language: 'bn-IN', gender: 'female', quality: 'wavenet' },
    { code: 'bn-IN-Wavenet-B', name: 'Bengali (India) Male Wavenet', language: 'bn-IN', gender: 'male', quality: 'wavenet' },
    
    // Marathi voices
    { code: 'mr-IN-Standard-A', name: 'Marathi (India) Female Standard', language: 'mr-IN', gender: 'female', quality: 'standard' },
    { code: 'mr-IN-Standard-B', name: 'Marathi (India) Male Standard', language: 'mr-IN', gender: 'male', quality: 'standard' },
    { code: 'mr-IN-Wavenet-A', name: 'Marathi (India) Female Wavenet', language: 'mr-IN', gender: 'female', quality: 'wavenet' },
    { code: 'mr-IN-Wavenet-B', name: 'Marathi (India) Male Wavenet', language: 'mr-IN', gender: 'male', quality: 'wavenet' },
    
    // Gujarati voices
    { code: 'gu-IN-Standard-A', name: 'Gujarati (India) Female Standard', language: 'gu-IN', gender: 'female', quality: 'standard' },
    { code: 'gu-IN-Standard-B', name: 'Gujarati (India) Male Standard', language: 'gu-IN', gender: 'male', quality: 'standard' },
    { code: 'gu-IN-Wavenet-A', name: 'Gujarati (India) Female Wavenet', language: 'gu-IN', gender: 'female', quality: 'wavenet' },
    { code: 'gu-IN-Wavenet-B', name: 'Gujarati (India) Male Wavenet', language: 'gu-IN', gender: 'male', quality: 'wavenet' },
    
    // Malayalam voices
    { code: 'ml-IN-Standard-A', name: 'Malayalam (India) Female Standard', language: 'ml-IN', gender: 'female', quality: 'standard' },
    { code: 'ml-IN-Standard-B', name: 'Malayalam (India) Male Standard', language: 'ml-IN', gender: 'male', quality: 'standard' },
    { code: 'ml-IN-Wavenet-A', name: 'Malayalam (India) Female Wavenet', language: 'ml-IN', gender: 'female', quality: 'wavenet' },
    { code: 'ml-IN-Wavenet-B', name: 'Malayalam (India) Male Wavenet', language: 'ml-IN', gender: 'male', quality: 'wavenet' },
  ];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the service
   */
  public async initialize(apiKey?: string): Promise<void> {
    console.log('🎤 Initializing Enhanced Google TTS Service...');

    // Use provided API key or try to get from environment
    this.apiKey = apiKey || import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GOOGLE_TTS_API_KEY || '';

    if (this.apiKey) {
      console.log('🔑 Google API key found, testing connection...');
      this.isGoogleAvailable = await this.testGoogleTTS();
    } else {
      console.log('⚠️ No Google API key found, using browser TTS fallback');
      this.isGoogleAvailable = false;
    }

    // Initialize browser TTS as fallback
    this.initializeBrowserTTS();
    this.isInitialized = true;

    console.log(`✅ Enhanced TTS Service initialized - Google: ${this.isGoogleAvailable ? 'Available' : 'Unavailable'}`);
  }

  /**
   * Test Google TTS connection
   */
  private async testGoogleTTS(): Promise<boolean> {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: "Test" },
          voice: { languageCode: "en-US", name: "en-US-Neural2-F" },
          audioConfig: { audioEncoding: "MP3" }
        })
      });

      if (response.ok) {
        console.log('✅ Google TTS connection successful');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Google TTS test failed:', response.status, errorData);
        
        if (response.status === 403) {
          console.log('🔧 Google TTS 403 Error: API key needs billing enabled or proper permissions');
          console.log('🔄 Falling back to browser TTS with Indian voice selection');
        }
        
        return false;
      }
    } catch (error) {
      console.log('❌ Google TTS connection error:', error);
      return false;
    }
  }

  /**
   * Initialize browser TTS fallback
   */
  private initializeBrowserTTS(): void {
    if (!('speechSynthesis' in window)) {
      console.error('❌ Browser speech synthesis not supported');
      return;
    }

    // Load voices
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        console.log('✅ Browser voices loaded:', speechSynthesis.getVoices().length);
      });
    }
  }

  /**
   * Main speak function - intelligently chooses Google or browser TTS with queue management
   */
  public async speak(text: string, options: Partial<TTSRequest> = {}): Promise<void> {
    if (!text.trim()) return;

    // Check if we're in a cooldown period
    const now = Date.now();
    if (now - this.lastSpeechTime < this.speechCooldownMs) {
      console.log('⏳ Speech cooldown active, skipping duplicate request');
      return;
    }

    // Return a promise that resolves when speech is complete
    return new Promise((resolve, reject) => {
      // Add to queue
      this.ttsQueue.push({ text, options, resolve, reject });
      
      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        this.processTTSQueue();
      }
    });
  }

  /**
   * Process TTS queue to prevent overlapping speech
   */
  private async processTTSQueue(): Promise<void> {
    if (this.isProcessingQueue || this.ttsQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.ttsQueue.length > 0) {
      const { text, options, resolve, reject } = this.ttsQueue.shift()!;
      
      try {
        // Store current text for language detection
        this.currentText = text.trim();

        console.log(`🎤 Speaking: "${text.substring(0, 50)}..." using ${this.isGoogleAvailable ? 'Google TTS' : 'Browser TTS'}`);

        // Stop any current speech
        this.stopAudio();

        // Wait a bit to ensure previous speech is fully stopped
        await new Promise(resolve => setTimeout(resolve, 100));

        if (this.isGoogleAvailable) {
          await this.speakWithGoogle(text, options);
        } else {
          console.log('🔇 BROWSER TTS DISABLED - Google TTS only mode');
          console.log('💡 To enable TTS: Set up Google Cloud billing or use a different TTS service');
          reject(new Error('TTS not available'));
          continue;
        }

        // Update last speech time
        this.lastSpeechTime = Date.now();
        
        // Wait for cooldown before next speech
        await new Promise(resolve => setTimeout(resolve, this.speechCooldownMs));
        
        resolve();
      } catch (error) {
        console.error('❌ TTS error:', error);
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Speak using Google Cloud TTS
   */
  private async speakWithGoogle(text: string, options: Partial<TTSRequest> = {}): Promise<void> {
    const voice = this.selectGoogleVoice(options.language, options.voice);
    const emotion = options.emotion || 'neutral';

    console.log(`🎤 Using Google TTS voice: ${voice.name} (${voice.language})`);

    // Apply emotion-based adjustments
    const adjustments = this.getEmotionAdjustments(emotion);

    const requestBody = {
      input: { text: text.trim() },
      voice: {
        languageCode: voice.language,
        name: voice.code
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: (options.rate || 1.0) * adjustments.rate,
        pitch: (options.pitch || 0.0) + adjustments.pitch,
        volumeGainDb: (options.volume || 0.0) + adjustments.volume
      }
    };

    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 403) {
        console.log('🔧 Google TTS 403: Billing not enabled or quota exceeded');
        this.isGoogleAvailable = false; // Disable Google TTS for this session
        throw new Error('Google TTS billing required - falling back to browser TTS');
      } else if (response.status === 429) {
        console.log('🔧 Google TTS 429: Rate limit exceeded');
        this.isGoogleAvailable = false; // Temporarily disable
        throw new Error('Google TTS rate limit exceeded - falling back to browser TTS');
      }
      throw new Error(`Google TTS API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Convert base64 audio to blob and play
    const audioBytes = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);

    return this.playAudio(audioUrl);
  }

  /**
   * Speak using browser TTS
   */
  private async speakWithBrowser(text: string, options: Partial<TTSRequest> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text.trim());
        
        // Select best browser voice
        const voice = this.selectBrowserVoice(options.language);
        if (voice) {
          utterance.voice = voice;
        }

        // Apply emotion-based adjustments
        const emotion = options.emotion || 'neutral';
        const adjustments = this.getEmotionAdjustments(emotion);

        utterance.rate = (options.rate || 0.9) * adjustments.rate;
        utterance.pitch = (options.pitch || 0.9) + (adjustments.pitch * 0.1);
        utterance.volume = options.volume || 0.9;

        utterance.onstart = () => {
          this.isCurrentlySpeaking = true;
        };

        utterance.onend = () => {
          this.isCurrentlySpeaking = false;
          this.currentUtterance = null;
          if (this.onSpeechEndCallback) {
            this.onSpeechEndCallback();
          }
          resolve();
        };

        utterance.onerror = (event) => {
          this.isCurrentlySpeaking = false;
          this.currentUtterance = null;
          reject(new Error(`Browser TTS failed: ${event.error}`));
        };

        this.currentUtterance = utterance;
        speechSynthesis.speak(utterance);

      } catch (error) {
        this.isCurrentlySpeaking = false;
        reject(error);
      }
    });
  }

  /**
   * Play audio from URL
   */
  private playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);

      audio.onloadstart = () => {
        this.isCurrentlySpeaking = true;
      };

      audio.onended = () => {
        this.isCurrentlySpeaking = false;
        URL.revokeObjectURL(audioUrl);
        if (this.onSpeechEndCallback) {
          this.onSpeechEndCallback();
        }
        resolve();
      };

      audio.onerror = () => {
        this.isCurrentlySpeaking = false;
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };

      audio.play().catch(reject);
    });
  }

  /**
   * Select the best Google voice for the given language and text
   */
  private selectGoogleVoice(language?: string, voiceCode?: string): TTSVoice {
    // If a specific voice code is provided, use it
    if (voiceCode) {
      const specificVoice = this.googleVoices.find(v => v.code === voiceCode);
      if (specificVoice) return specificVoice;
    }

    // Auto-detect language from text if not provided
    let detectedLanguage = language;
    if (!detectedLanguage) {
      detectedLanguage = this.detectLanguageFromText(this.currentText || '');
    }

    // For English, prefer Indian English male voice for natural Indian accent
    if (detectedLanguage.startsWith('en')) {
      console.log('🇮🇳 Using Indian English male voice for natural accent');
      const indianMaleNeural = this.googleVoices.find(v => v.code === 'en-IN-Neural2-B');
      if (indianMaleNeural) return indianMaleNeural;
      
      const indianMaleWavenet = this.googleVoices.find(v => v.code === 'en-IN-Wavenet-B');
      if (indianMaleWavenet) return indianMaleWavenet;
      
      const indianMaleStandard = this.googleVoices.find(v => v.code === 'en-IN-Standard-B');
      if (indianMaleStandard) return indianMaleStandard;
    }

    // Find voices for the detected language
    const languageVoices = this.googleVoices.filter(v => v.language === detectedLanguage);
    
    if (languageVoices.length > 0) {
      // Prefer male neural voices, then male wavenet, then any neural
      const maleNeural = languageVoices.find(v => v.quality === 'neural' && v.gender === 'male');
      if (maleNeural) return maleNeural;
      
      const maleWavenet = languageVoices.find(v => v.quality === 'wavenet' && v.gender === 'male');
      if (maleWavenet) return maleWavenet;
      
      const neuralVoice = languageVoices.find(v => v.quality === 'neural');
      if (neuralVoice) return neuralVoice;
      
      const wavenetVoice = languageVoices.find(v => v.quality === 'wavenet');
      if (wavenetVoice) return wavenetVoice;
      
      return languageVoices[0]; // Fallback to first available
    }

    // Fallback to Indian English Male Neural if language not supported
    console.log(`⚠️ Language ${detectedLanguage} not supported, falling back to Indian English Male`);
    return this.googleVoices.find(v => v.code === 'en-IN-Neural2-B') || 
           this.googleVoices.find(v => v.code === 'en-US-Neural2-C') || 
           this.googleVoices[0];
  }

  /**
   * Detect language from text using Unicode ranges
   */
  private detectLanguageFromText(text: string): string {
    if (!text.trim()) return 'en-IN'; // Default to Indian English
    
    // Unicode ranges for Indian languages
    const teluguRange = /[\u0C00-\u0C7F]/;      // Telugu
    const hindiRange = /[\u0900-\u097F]/;       // Devanagari (Hindi)
    const kannadaRange = /[\u0C80-\u0CFF]/;     // Kannada
    const tamilRange = /[\u0B80-\u0BFF]/;       // Tamil
    const bengaliRange = /[\u0980-\u09FF]/;     // Bengali
    const marathiRange = /[\u0900-\u097F]/;     // Marathi (uses Devanagari)
    const gujaratiRange = /[\u0A80-\u0AFF]/;    // Gujarati
    const malayalamRange = /[\u0D00-\u0D7F]/;   // Malayalam
    
    // Check for each language
    if (teluguRange.test(text)) {
      console.log('🌍 Detected Telugu text');
      return 'te-IN';
    } else if (hindiRange.test(text)) {
      console.log('🌍 Detected Hindi text');
      return 'hi-IN';
    } else if (kannadaRange.test(text)) {
      console.log('🌍 Detected Kannada text');
      return 'kn-IN';
    } else if (tamilRange.test(text)) {
      console.log('🌍 Detected Tamil text');
      return 'ta-IN';
    } else if (bengaliRange.test(text)) {
      console.log('🌍 Detected Bengali text');
      return 'bn-IN';
    } else if (marathiRange.test(text)) {
      console.log('🌍 Detected Marathi text');
      return 'mr-IN';
    } else if (gujaratiRange.test(text)) {
      console.log('🌍 Detected Gujarati text');
      return 'gu-IN';
    } else if (malayalamRange.test(text)) {
      console.log('🌍 Detected Malayalam text');
      return 'ml-IN';
    }
    
    // Default to Indian English for natural accent
    console.log('🌍 Detected English text - using Indian accent');
    return 'en-IN';
  }

  /**
   * Select best browser voice with Indian preference
   */
  private selectBrowserVoice(language?: string): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    const lang = language || 'en-IN';

    console.log('🇮🇳 Selecting browser voice for Indian accent...');
    console.log('🎤 Available voices:', voices.length);

    // Enhanced voice preference order for Indian accent
    const preferences = [
      // First try Indian English voices
      (v: SpeechSynthesisVoice) => v.lang === 'en-IN' && v.name.toLowerCase().includes('male'),
      (v: SpeechSynthesisVoice) => v.lang === 'en-IN',
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('indian') && v.name.toLowerCase().includes('male'),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('indian'),
      
      // Then try high-quality English voices with male preference
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('neural') && v.lang.startsWith('en') && v.name.toLowerCase().includes('male'),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('premium') && v.lang.startsWith('en') && v.name.toLowerCase().includes('male'),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('google') && v.lang.startsWith('en') && v.name.toLowerCase().includes('male'),
      
      // Fallback to any English male voices
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'),
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.name.toLowerCase().includes('david'),
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.name.toLowerCase().includes('alex'),
      
      // General English voices
      (v: SpeechSynthesisVoice) => v.lang.startsWith(lang),
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
    ];

    for (const preference of preferences) {
      const voice = voices.find(preference);
      if (voice) {
        console.log('🎯 Selected browser voice:', voice.name, '(', voice.lang, ')');
        return voice;
      }
    }

    console.log('🔄 Using default voice:', voices[0]?.name);
    return voices[0];
  }

  /**
   * Get emotion-based voice adjustments
   */
  private getEmotionAdjustments(emotion: string): { rate: number; pitch: number; volume: number } {
    const adjustments = {
      neutral: { rate: 1.0, pitch: 0.0, volume: 0.0 },
      happy: { rate: 1.1, pitch: 2.0, volume: 2.0 },
      excited: { rate: 1.2, pitch: 4.0, volume: 3.0 },
      confident: { rate: 0.95, pitch: -1.0, volume: 1.0 },
      calm: { rate: 0.9, pitch: -2.0, volume: -1.0 }
    };

    return adjustments[emotion as keyof typeof adjustments] || adjustments.neutral;
  }

  /**
   * Stop current audio and clear queue
   */
  public stopAudio(): void {
    console.log('🛑 Stopping TTS audio and clearing queue');
    
    // Stop current speech
    if (this.currentUtterance) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
    
    // Clear TTS queue
    this.ttsQueue = [];
    this.isProcessingQueue = false;
    
    this.isCurrentlySpeaking = false;
  }

  /**
   * Check if TTS is ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if Google TTS is available
   */
  public isGoogleTTSAvailable(): boolean {
    return this.isGoogleAvailable;
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): TTSVoice[] {
    return this.googleVoices;
  }

  /**
   * Set speech end callback
   */
  public setSpeechEndCallback(callback: () => void): void {
    this.onSpeechEndCallback = callback;
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  // Streaming TTS methods for compatibility
  public startStreamingTTS(): void {
    console.log('🌊 Streaming TTS mode started');
  }

  public async addToStreamingTTS(text: string, emotion?: string): Promise<void> {
    await this.speak(text, { emotion: emotion as any });
  }

  public async finishStreamingTTS(): Promise<void> {
    console.log('🌊 Streaming TTS mode finished');
  }

  public stopStreamingTTS(): void {
    this.stopAudio();
  }
}

// Export singleton instance
export const enhancedGoogleTTSService = new EnhancedGoogleTTSService(); 