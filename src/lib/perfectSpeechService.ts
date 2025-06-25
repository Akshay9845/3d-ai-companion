// Types for the perfect speech system
interface SpeechConfig {
  elevenLabsApiKey?: string;
  preferredVoice?: string;
  enableStreaming?: boolean;
  enableChunking?: boolean;
  maxChunkSize?: number;
  enableFallback?: boolean;
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

interface AudioPlaybackResult {
  success: boolean;
  method: 'elevenLabs' | 'browser' | 'hybrid';
  duration: number;
  error?: string;
}

class _PerfectSpeechService {
  private elevenlabs: any = null;
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private isPreWarmed = false;
  private availableVoices: any[] = [];
  private currentVoiceId: string | null = null;
  private config: SpeechConfig;

  constructor() {
    this.config = {
      enableStreaming: true,
      enableChunking: true,
      maxChunkSize: 150,
      enableFallback: true,
    };
  }

  async initialize(config: SpeechConfig = {}): Promise<void> {
    this.config = { ...this.config, ...config };
    this.initializeElevenLabs();
    this.initializeAudioContext();
    await this.loadAvailableVoices();
  }

  private initializeElevenLabs(): void {
    const apiKey = this.config.elevenLabsApiKey || 
                   import.meta.env.VITE_ELEVENLABS_API_KEY ||
                   localStorage.getItem('elevenLabsApiKey');
    
    if (apiKey) {
      try {
        // Use dynamic import with proper error handling
        import('elevenlabs').then((module) => {
          // Handle both default and named exports - use ElevenLabsClient
          const ElevenLabsClient = module.default || module.ElevenLabsClient || module.ElevenLabsAPI;
          
          if (typeof ElevenLabsClient === 'function') {
            this.elevenlabs = new ElevenLabsClient({
              apiKey: apiKey
            });
            console.log('✅ ElevenLabs initialized successfully');
            this.loadAvailableVoices();
          } else {
            console.warn('⚠️ ElevenLabsClient constructor not found');
          }
        }).catch(error => {
          console.warn('⚠️ Failed to initialize ElevenLabs:', error);
        });
      } catch (error) {
        console.warn('⚠️ Failed to initialize ElevenLabs:', error);
      }
    } else {
      console.log('ℹ️ ElevenLabs not configured, browser TTS only');
    }
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('✅ Audio context initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize audio context:', error);
    }
  }

  private async loadAvailableVoices(): Promise<void> {
    if (!this.elevenlabs) return;

    try {
      const response = await this.elevenlabs.voices.getAll();
      this.availableVoices = Array.isArray(response) ? response : (response.voices || []);
      
      // Auto-select best male voice if none selected
      if (!this.currentVoiceId && this.availableVoices.length > 0) {
        const maleVoices = this.availableVoices.filter(voice => 
          voice.labels?.gender === 'male' || 
          voice.name.toLowerCase().includes('male')
        );
        
        this.currentVoiceId = maleVoices.length > 0 
          ? maleVoices[0].voice_id 
          : this.availableVoices[0].voice_id;
        
        console.log('🎯 Auto-selected voice:', this.getCurrentVoice()?.name);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load voices:', error);
    }
  }

  /**
   * Main speech synthesis method - the perfect speech interface
   */
  async speak(text: string): Promise<AudioPlaybackResult> {
    console.log('🎤 Speaking:', text);
    
    try {
      // Try ElevenLabs first
      if (this.elevenlabs && this.currentVoiceId) {
        return await this.speakWithElevenLabs(text);
      }
    } catch (error: any) {
      console.warn('⚠️ ElevenLabs failed, falling back to browser TTS:', error);
      
      // If it's an authentication error, log a helpful message
      if (error?.message?.includes('Authentication error')) {
        console.warn('🔑 ElevenLabs API key appears to be invalid. Please check your VITE_ELEVENLABS_API_KEY environment variable.');
      }
    }

    // Fallback to browser TTS
    return await this.speakWithBrowserTTS(text);
  }

  private async speakWithElevenLabs(text: string): Promise<AudioPlaybackResult> {
    if (!this.elevenlabs || !this.currentVoiceId) {
      throw new Error('ElevenLabs not available');
    }

    const optimalSettings: VoiceSettings = {
      stability: 0.7,
      similarity_boost: 0.85,
      style: 0.2,
      use_speaker_boost: true
    };

    if (this.config.enableChunking && text.length > this.config.maxChunkSize!) {
      return await this.speakWithChunking(text, optimalSettings);
    } else {
      return await this.speakSingleChunk(text, this.currentVoiceId!, "eleven_multilingual_v2");
    }
  }

  private async speakSingleChunk(text: string, voiceId: string, modelId: string): Promise<AudioPlaybackResult> {
    try {
      console.log(`🎤 Speaking: "${text}"`);
      
      const audioResponse = await this.elevenlabs.textToSpeech.convert(voiceId, {
        text,
        modelId,
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true
        }
      });

      // Convert response to proper ArrayBuffer
      let audioBuffer: ArrayBuffer;
      if (audioResponse instanceof ArrayBuffer) {
        audioBuffer = audioResponse;
      } else if (audioResponse instanceof Uint8Array) {
        audioBuffer = audioResponse.buffer.slice(audioResponse.byteOffset, audioResponse.byteOffset + audioResponse.byteLength);
      } else if (audioResponse instanceof Blob) {
        audioBuffer = await audioResponse.arrayBuffer();
      } else if (audioResponse && typeof audioResponse.arrayBuffer === 'function') {
        audioBuffer = await audioResponse.arrayBuffer();
      } else {
        throw new Error(`Invalid audio response format from ElevenLabs: ${typeof audioResponse}`);
      }

      if (!audioBuffer || audioBuffer.byteLength === 0) {
        throw new Error('Empty audio buffer received');
      }

      console.log(`✅ Generated ${audioBuffer.byteLength} bytes of audio`);
      await this.playAudioBuffer(audioBuffer);

      return {
        success: true,
        method: 'elevenLabs',
        duration: 0
      };

    } catch (error: any) {
      console.error('❌ ElevenLabs synthesis failed:', error);
      
      // Check if it's an authentication error
      if (error?.message?.includes('401') || error?.status === 401) {
        console.warn('⚠️ ElevenLabs API authentication failed. Please check your API key.');
        throw new Error('ElevenLabs synthesis failed: Authentication error - please check your API key');
      }
      
      throw new Error(`ElevenLabs synthesis failed: ${error?.message || error}`);
    }
  }

  private async speakWithChunking(text: string, settings: VoiceSettings): Promise<AudioPlaybackResult> {
    const chunks = this.splitTextIntoChunks(text);
    console.log(`📝 Split text into ${chunks.length} chunks for optimal streaming`);

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`🔊 Processing chunk ${i + 1}/${chunks.length}`);
        
        const audioResponse = await this.elevenlabs!.textToSpeech.convert(this.currentVoiceId!, {
          text: chunk,
          modelId: "eleven_multilingual_v2",
          voice_settings: settings
        });

        // Convert response to proper ArrayBuffer
        let audioBuffer: ArrayBuffer;
        if (audioResponse instanceof ArrayBuffer) {
          audioBuffer = audioResponse;
        } else if (audioResponse instanceof Uint8Array) {
          audioBuffer = audioResponse.buffer.slice(audioResponse.byteOffset, audioResponse.byteOffset + audioResponse.byteLength);
        } else if (audioResponse instanceof Blob) {
          audioBuffer = await audioResponse.arrayBuffer();
        } else if (audioResponse && typeof audioResponse.arrayBuffer === 'function') {
          audioBuffer = await audioResponse.arrayBuffer();
        } else if (audioResponse instanceof ReadableStream) {
          // Convert ReadableStream to ArrayBuffer
          const reader = audioResponse.getReader();
          const chunks: Uint8Array[] = [];
          let done = false;
          
          while (!done) {
            const { value, done: streamDone } = await reader.read();
            done = streamDone;
            if (value) {
              chunks.push(value);
            }
          }
          
          // Combine all chunks into a single ArrayBuffer
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const combinedArray = new Uint8Array(totalLength);
          let offset = 0;
          
          for (const chunk of chunks) {
            combinedArray.set(chunk, offset);
            offset += chunk.length;
          }
          
          audioBuffer = combinedArray.buffer;
        } else {
          throw new Error(`Invalid audio response format from ElevenLabs: ${typeof audioResponse}`);
        }

        if (audioBuffer && audioBuffer.byteLength > 0) {
          await this.playAudioBuffer(audioBuffer);
          
          // Small pause between chunks for natural flow
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 150));
          }
        }
      }

      return {
        success: true,
        method: 'elevenLabs'
      };

    } catch (error: any) {
      throw new Error(`Chunked synthesis failed: ${error.message}`);
    }
  }

  private splitTextIntoChunks(text: string): string[] {
    const maxSize = this.config.maxChunkSize!;
    
    if (text.length <= maxSize) {
      return [text];
    }

    // Split by sentences first
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if (currentChunk.length + trimmed.length > maxSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmed;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }

  private async playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
    // Try Web Audio API first (best quality)
    if (this.audioContext) {
      try {
        await this.playWithWebAudio(audioBuffer);
        return;
      } catch (error) {
        console.warn('⚠️ Web Audio failed, trying HTML Audio:', error);
      }
    }

    // Fallback to HTML Audio Element
    await this.playWithHTMLAudio(audioBuffer);
  }

  private async playWithWebAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.audioContext) {
          throw new Error('Audio context not available');
        }

        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const decodedBuffer = await this.audioContext.decodeAudioData(audioBuffer);
        const source = this.audioContext.createBufferSource();
        
        this.currentSource = source;
        source.buffer = decodedBuffer;
        source.connect(this.audioContext.destination);

        source.onended = () => {
          this.currentSource = null;
          this.isPlaying = false;
          resolve();
        };

        this.isPlaying = true;
        source.start(0);

      } catch (error: any) {
        this.currentSource = null;
        this.isPlaying = false;
        reject(error);
      }
    });
  }

  private async playWithHTMLAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        this.currentAudio = audio;

        const cleanup = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          this.isPlaying = false;
        };

        audio.onended = () => {
          cleanup();
          resolve();
        };

        audio.onerror = (err) => {
          cleanup();
          reject(new Error('HTML Audio playback failed'));
        };

        audio.oncanplaythrough = async () => {
          try {
            this.isPlaying = true;
            await audio.play();
          } catch (playError) {
            cleanup();
            reject(playError);
          }
        };

        audio.load();

      } catch (error: any) {
        this.isPlaying = false;
        this.currentAudio = null;
        reject(error);
      }
    });
  }

  private async speakWithBrowserTTS(text: string): Promise<AudioPlaybackResult> {
    return new Promise((resolve) => {
      console.log('🔄 Using browser TTS fallback');

      if (!window.speechSynthesis) {
        resolve({
          success: false,
          method: 'browser',
          error: 'Browser TTS not available'
        });
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      // Select best available voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = [
        'Google US English Male',
        'Microsoft David Desktop',
        'Alex',
        'Daniel'
      ];

      let selectedVoice = null;
      for (const preferred of preferredVoices) {
        selectedVoice = voices.find(voice => voice.name.includes(preferred));
        if (selectedVoice) break;
      }

      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('man')
        );
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🎯 Using browser voice:', selectedVoice.name);
      }

      utterance.onend = () => {
        this.isPlaying = false;
        resolve({
          success: true,
          method: 'browser',
          duration: 0
        });
      };

      utterance.onerror = (error) => {
        this.isPlaying = false;
        resolve({
          success: false,
          method: 'browser',
          duration: 0,
          error: error.error
        });
      };

      this.isPlaying = true;
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stop all speech immediately
   */
  stop(): void {
    console.log('🔇 Stopping all speech...');

    // Stop Web Audio
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        // Ignore
      }
      this.currentSource = null;
    }

    // Stop HTML Audio
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (error) {
        // Ignore
      }
      this.currentAudio = null;
    }

    // Stop browser TTS
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }

    this.isPlaying = false;
  }

  /**
   * Check if speech is currently playing
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying || 
           (this.currentAudio && !this.currentAudio.paused) ||
           (window.speechSynthesis?.speaking || false);
  }

  /**
   * Get all available voices
   */
  getAvailableVoices() {
    return this.availableVoices.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      description: voice.description || '',
      gender: voice.labels?.gender || 'unknown',
      accent: voice.labels?.accent || 'unknown'
    }));
  }

  /**
   * Change the current voice
   */
  setVoice(voiceId: string): boolean {
    const voice = this.availableVoices.find(v => v.voice_id === voiceId);
    if (voice) {
      this.currentVoiceId = voiceId;
      this.isPreWarmed = false; // Reset pre-warming
      console.log('🎯 Voice changed to:', voice.name);
      return true;
    }
    return false;
  }

  /**
   * Get current voice info
   */
  getCurrentVoice() {
    if (!this.currentVoiceId) return null;
    const voice = this.availableVoices.find(v => v.voice_id === this.currentVoiceId);
    return voice ? {
      id: voice.voice_id,
      name: voice.name,
      description: voice.description || '',
      gender: voice.labels?.gender || 'unknown',
      accent: voice.labels?.accent || 'unknown'
    } : null;
  }

  /**
   * Pre-warm the API for faster first response
   */
  async preWarm(): Promise<boolean> {
    if (this.isPreWarmed || !this.elevenlabs || !this.currentVoiceId) {
      return false;
    }

    try {
      console.log('🔥 Pre-warming speech engine...');
      
      const warmupResponse = await this.elevenlabs.textToSpeech.convert(this.currentVoiceId, {
        text: "Hello",
        modelId: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.85,
          style: 0.2,
          use_speaker_boost: true
        }
      });

      // Convert response to proper ArrayBuffer
      let warmupAudio: ArrayBuffer;
      if (warmupResponse instanceof ArrayBuffer) {
        warmupAudio = warmupResponse;
      } else if (warmupResponse instanceof Uint8Array) {
        warmupAudio = warmupResponse.buffer.slice(warmupResponse.byteOffset, warmupResponse.byteOffset + warmupResponse.byteLength);
      } else if (warmupResponse instanceof Blob) {
        warmupAudio = await warmupResponse.arrayBuffer();
      } else if (warmupResponse && typeof warmupResponse.arrayBuffer === 'function') {
        warmupAudio = await warmupResponse.arrayBuffer();
      } else if (warmupResponse instanceof ReadableStream) {
        // Convert ReadableStream to ArrayBuffer
        const reader = warmupResponse.getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            chunks.push(value);
          }
        }
        
        // Combine all chunks into a single ArrayBuffer
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedArray = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          combinedArray.set(chunk, offset);
          offset += chunk.length;
        }
        
        warmupAudio = combinedArray.buffer;
      } else {
        throw new Error(`Invalid audio response format from ElevenLabs: ${typeof warmupResponse}`);
      }

      if (warmupAudio && warmupAudio.byteLength > 0) {
        this.isPreWarmed = true;
        console.log('✅ Speech engine pre-warmed successfully');
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Pre-warming failed:', error);
    }

    return false;
  }

  /**
   * Test the connection and setup
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.elevenlabs) {
        console.log('ℹ️ ElevenLabs not configured, browser TTS only');
        return true;
      }

      await this.loadAvailableVoices();
      
      if (this.availableVoices.length === 0) {
        throw new Error('No voices available');
      }

      console.log('✅ Speech service connection test passed');
      return true;

    } catch (error) {
      console.warn('⚠️ Speech service connection test failed:', error);
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SpeechConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Re-initialize for API key changes
    if (newConfig.elevenLabsApiKey) {
      this.initializeElevenLabs();
    }
  }
}

export const perfectSpeechService = new _PerfectSpeechService();
export type PerfectSpeechService = _PerfectSpeechService;

// Export types
export type { AudioPlaybackResult, SpeechConfig };
