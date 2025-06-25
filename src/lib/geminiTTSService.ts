/**
 * Simplified TTS Service - Browser Speech Only v2.0
 * Uses only browser's built-in speech synthesis with nice voice selection
 * NO ELEVENLABS - BROWSER ONLY
 */

export interface SimpleTTSRequest {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export class SimpleBrowserTTSService {
  private isCurrentlySpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isStreamingActive: boolean = false;
  private streamingQueue: string[] = [];
  private onSpeechEndCallback: (() => void) | null = null;

  constructor() {
    // Initialize browser speech synthesis
    this.initializeBrowserTTS();
    console.log('🎵 SimpleBrowserTTSService v2.0 initialized - NO ELEVENLABS');
  }

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
   * Speak text using browser TTS with nice voice
   */
  public async speak(text: string, options: Partial<SimpleTTSRequest> = {}): Promise<void> {
    if (!text.trim()) return;

    // Stop any current speech
      this.stopAudio();
      
    return new Promise((resolve, reject) => {
      try {
        if (!('speechSynthesis' in window)) {
          reject(new Error('Browser speech synthesis not supported'));
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text.trim());
        
        // Select the best voice
        const voice = this.selectBestVoice();
        if (voice) {
          utterance.voice = voice;
          console.log('🎤 Using voice:', voice.name);
        }

        // Configure speech parameters for natural sound
        utterance.rate = options.rate || 0.9; // Slightly slower for clarity
        utterance.pitch = options.pitch || 0.9; // Slightly lower for warmth
        utterance.volume = options.volume || 0.9;

        utterance.onstart = () => {
          console.log('🎵 Browser TTS started');
          this.isCurrentlySpeaking = true;
        };

        utterance.onend = () => {
          console.log('✅ Browser TTS completed');
          this.isCurrentlySpeaking = false;
          this.currentUtterance = null;
          
          // Call speech end callback if set
          if (this.onSpeechEndCallback) {
            console.log('🎭 Calling speech end callback');
            this.onSpeechEndCallback();
          }
          
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('❌ Browser TTS error:', event.error);
          this.isCurrentlySpeaking = false;
          this.currentUtterance = null;
          reject(new Error(`Browser TTS failed: ${event.error}`));
        };

        // Store reference and start speaking
        this.currentUtterance = utterance;
        speechSynthesis.speak(utterance);
        
      } catch (error) {
        console.error('❌ Browser TTS setup failed:', error);
        this.isCurrentlySpeaking = false;
        reject(error);
      }
    });
  }

  /**
   * Select the best available voice
   */
  private selectBestVoice(): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // Priority order for voice selection - prefer nice, natural voices
    const voicePreferences = [
      // Premium/Neural voices (usually sound better)
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('neural') && v.lang.startsWith('en'),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('premium') && v.lang.startsWith('en'),
      
      // High-quality English voices
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('samantha') && v.lang.startsWith('en'),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('alex') && v.lang.startsWith('en'),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('daniel') && v.lang.startsWith('en'),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('karen') && v.lang.startsWith('en'),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('moira') && v.lang.startsWith('en'),
      
      // Gender-neutral pleasant voices
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('google') && v.lang.startsWith('en'),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('microsoft') && v.lang.startsWith('en'),
      
      // Fallback to any English voice
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en-US'),
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en-GB'),
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
    ];

    for (const preference of voicePreferences) {
      const selectedVoice = voices.find(preference);
      if (selectedVoice) {
        return selectedVoice;
      }
    }

    // Use first available voice as last resort
    return voices[0];
  }

  /**
   * Stop current speech
   */
  public stopAudio(): void {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    this.isCurrentlySpeaking = false;
    this.currentUtterance = null;
    console.log('🛑 Browser TTS stopped');
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking || speechSynthesis.speaking;
  }

  /**
   * Check if streaming TTS is active
   */
  public isStreamingActive(): boolean {
    return this.isStreamingActive || this.isSpeaking();
  }

  /**
   * Set callback for when speech ends
   */
  public setSpeechEndCallback(callback: (() => void) | null): void {
    this.onSpeechEndCallback = callback;
  }

  // Legacy methods for compatibility
  public async initialize(): Promise<void> {
    this.initializeBrowserTTS();
  }

  public isReady(): boolean {
    return 'speechSynthesis' in window;
  }

  public isConfigured(): boolean {
    return true;
  }

  // Streaming TTS methods (simplified to regular speech)
  public startStreamingTTS(): void {
    console.log('🌊 Streaming TTS started (using browser speech)');
    this.isStreamingActive = true;
    this.streamingQueue = [];
  }

  public async addToStreamingTTS(text: string): Promise<void> {
    if (!this.isStreamingActive) {
      this.startStreamingTTS();
    }
    this.streamingQueue.push(text);
    await this.speak(text);
  }

  public async finishStreamingTTS(): Promise<void> {
    console.log('🌊 Streaming TTS finished');
    this.isStreamingActive = false;
    this.streamingQueue = [];
  }

  public stopStreamingTTS(): void {
    console.log('🛑 Stopping streaming TTS');
    this.isStreamingActive = false;
    this.streamingQueue = [];
    this.stopAudio();
  }
}

// Export singleton instance
export const geminiTTSService = new SimpleBrowserTTSService(); 

// Backward compatibility export
export { SimpleBrowserTTSService as GeminiTTSService };
