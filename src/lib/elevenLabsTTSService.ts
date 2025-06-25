/**
 * ElevenLabs TTS Service
 * 
 * High-quality text-to-speech using ElevenLabs API
 * Voice ID: Mgih2jslgx7pUv85yYYU
 * API Key: sk_029847ec88a4bbf91469ee5985414ed73ebcd658a503edd5
 */

export interface ElevenLabsTTSRequest {
  text: string;
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  output_format?: string;
  optimize_streaming_latency?: number;
}

export interface ElevenLabsTTSResponse {
  audio: ArrayBuffer;
  format: string;
  sampleRate: number;
  duration: number;
  provider: 'elevenlabs';
  metadata?: {
    voiceUsed: string;
    modelUsed: string;
    quality: string;
  };
}

export class ElevenLabsTTSService {
  private apiKey: string;
  private voiceId: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';
  private isInitialized: boolean = false;
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | AudioBufferSourceNode | null = null;

  constructor() {
    this.apiKey = 'sk_029847ec88a4bbf91469ee5985414ed73ebcd658a503edd5';
    this.voiceId = 'cjVigY5qzO86Huf0OWal'; // Eric - A smooth tenor pitch from a man in his 40s - perfect for agentic use cases
    this.initializeAudioContext();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.initializeAudioContext();
      await this.testConnection();
      this.isInitialized = true;
      console.log('🚀 ElevenLabs TTS Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ElevenLabs TTS Service:', error);
      throw error;
    }
  }

  private async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/voices/${this.voiceId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const voiceData = await response.json();
      console.log('✅ ElevenLabs voice loaded:', voiceData.name);
      return true;
    } catch (error) {
      console.error('❌ ElevenLabs connection test failed:', error);
      return false;
    }
  }

  private initializeAudioContext(): void {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public isReady(): boolean {
    return this.isInitialized && this.audioContext !== null;
  }

  public isConfigured(): boolean {
    return this.apiKey !== '' && this.voiceId !== '';
  }

  /**
   * Generate speech with retry logic for rate limiting
   */
  public async generateSpeech(request: ElevenLabsTTSRequest): Promise<ElevenLabsTTSResponse> {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        return await this.attemptSpeechGeneration(request);
      } catch (error: any) {
        const errorMessage = error.message || '';
        
        // Check if it's a rate limiting error
        if (errorMessage.includes('429') || errorMessage.includes('too_many_concurrent_requests')) {
          retryCount++;
          const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
          
          console.log(`🔄 Rate limited. Retrying in ${backoffTime/1000}s (attempt ${retryCount}/${maxRetries})`);
          
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            continue;
          }
        }
        
        // If it's not a rate limit error or we've exhausted retries, throw the error
        throw error;
      }
    }
    
    throw new Error('Max retries exceeded for ElevenLabs TTS');
  }

  /**
   * Attempt speech generation (original method)
   */
  private async attemptSpeechGeneration(request: ElevenLabsTTSRequest): Promise<ElevenLabsTTSResponse> {
    if (!this.isReady()) {
      throw new Error('ElevenLabs TTS Service not initialized');
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: request.text,
          model_id: request.model_id || 'eleven_monolingual_v1',
          voice_settings: request.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          },
          output_format: request.output_format || 'mp3_44100_128'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs TTS error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const duration = this.estimateDuration(audioBuffer.byteLength, 44100);

      return {
        audio: audioBuffer,
        format: 'mp3',
        sampleRate: 44100,
        duration: duration,
        provider: 'elevenlabs',
        metadata: {
          voiceUsed: this.voiceId,
          modelUsed: request.model_id || 'eleven_monolingual_v1',
          quality: 'high'
        }
      };
    } catch (error) {
      console.error('❌ ElevenLabs TTS generation failed:', error);
      throw error;
    }
  }

  private estimateDuration(bytes: number, sampleRate: number): number {
    // Rough estimation for MP3 at 128kbps
    const bitrate = 128000; // 128 kbps
    return (bytes * 8) / bitrate;
  }

  public async playAudio(audioBuffer: ArrayBuffer, format?: string): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    try {
      this.stopAudio();

      // Decode the audio buffer
      const audioBufferSource = await this.audioContext.decodeAudioData(audioBuffer);
      
      // Create and play the audio
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBufferSource;
      source.connect(this.audioContext.destination);
      
      this.currentAudio = source;
      source.start(0);
      
      console.log('🎵 Playing ElevenLabs audio');
    } catch (error) {
      console.error('❌ Failed to play ElevenLabs audio:', error);
      throw error;
    }
  }

  public stopAudio(): void {
    if (this.currentAudio) {
      if (this.currentAudio instanceof AudioBufferSourceNode) {
        this.currentAudio.stop();
      } else if (this.currentAudio instanceof HTMLAudioElement) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }
      this.currentAudio = null;
    }
  }

  public async speak(text: string, options: Partial<ElevenLabsTTSRequest> = {}): Promise<void> {
    try {
      const ttsRequest: ElevenLabsTTSRequest = {
        text,
        ...options
      };

      const response = await this.generateSpeech(ttsRequest);
      await this.playAudio(response.audio, response.format);
    } catch (error) {
      console.error('❌ ElevenLabs speak failed:', error);
      throw error;
    }
  }

  public async getAvailableVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('❌ Failed to fetch ElevenLabs voices:', error);
      return [];
    }
  }

  public async getVoiceDetails(voiceId?: string): Promise<any> {
    const targetVoiceId = voiceId || this.voiceId;
    
    try {
      const response = await fetch(`${this.baseUrl}/voices/${targetVoiceId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voice details: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch voice details:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const elevenLabsTTS = new ElevenLabsTTSService(); 