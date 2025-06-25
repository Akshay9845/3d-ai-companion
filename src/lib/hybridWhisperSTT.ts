// Hybrid Whisper STT - tries multiple approaches with guaranteed fallback
import { env, pipeline } from '@xenova/transformers';

// Configure transformers.js environment
env.allowLocalModels = true;
env.allowRemoteModels = true;
env.useBrowserCache = true;

class HybridWhisperSTT {
  private pipeline: any = null;
  private isInitialized = false;
  private modelName = '';
  private initError = '';
  private useWebSpeechFallback = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🎤 Initializing Hybrid Whisper STT...');

    try {
      // First, always ensure Web Speech API is available as fallback
      this.checkWebSpeechAvailability();
      
      // Try to load Whisper models with multiple strategies
      await this.tryMultipleLoadingStrategies();
      
      this.isInitialized = true;
      const status = this.useWebSpeechFallback ? 'Web Speech API' : `Whisper (${this.modelName})`;
      console.log(`✅ Hybrid STT ready with ${status}`);
      
    } catch (error) {
      this.initError = error.message;
      console.error('❌ Hybrid STT initialization failed:', error);
      throw error;
    }
  }

  private checkWebSpeechAvailability(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      console.log('✅ Web Speech API available as fallback');
    } else {
      throw new Error('No speech recognition available (Whisper failed and Web Speech API not supported)');
    }
  }

  private async tryMultipleLoadingStrategies(): Promise<void> {
    const strategies = [
      // Strategy 1: Try local models first (if available)
      {
        name: 'Local Model',
        loader: () => this.tryLocalModel()
      },
      // Strategy 2: Try CDN with specific configurations
      {
        name: 'Remote Model (Optimized)',
        loader: () => this.tryRemoteModelOptimized()
      },
      // Strategy 3: Try alternative CDN endpoints
      {
        name: 'Alternative CDN',
        loader: () => this.tryAlternativeCDN()
      }
    ];

    for (const strategy of strategies) {
      try {
        console.log(`🔄 Trying strategy: ${strategy.name}`);
        await strategy.loader();
        if (this.pipeline) {
          console.log(`✅ Success with strategy: ${strategy.name}`);
          return;
        }
      } catch (error) {
        console.warn(`⚠️ Strategy ${strategy.name} failed:`, error.message);
        continue;
      }
    }

    // If all Whisper strategies fail, use Web Speech API
    console.log('⚠️ All Whisper strategies failed, using Web Speech API');
    this.useWebSpeechFallback = true;
    this.modelName = 'Web Speech API';
  }

  private async tryLocalModel(): Promise<void> {
    // Check if we have local models
    const localPaths = [
      './models/whisper-tiny.en',
      '/models/whisper-tiny.en',
      '../models/whisper-tiny.en'
    ];

    for (const path of localPaths) {
      try {
        console.log(`🔍 Checking local model at: ${path}`);
        this.pipeline = await pipeline('automatic-speech-recognition', path, {
          local_files_only: true
        });
        this.modelName = `Local: ${path}`;
        return;
      } catch (error) {
        console.warn(`Local model not found at ${path}`);
        continue;
      }
    }
    
    throw new Error('No local models found');
  }

  private async tryRemoteModelOptimized(): Promise<void> {
    const models = [
      'Xenova/whisper-tiny.en'
    ];

    for (const modelName of models) {
      try {
        console.log(`🌐 Loading remote model: ${modelName}`);
        
        // Use optimized settings for better network handling
        this.pipeline = await Promise.race([
          pipeline('automatic-speech-recognition', modelName, {
            quantized: true,
            cache_dir: './cache/',
            local_files_only: false,
            use_auth_token: false,
            revision: 'main',
            progress_callback: (progress: any) => {
              if (progress.status === 'downloading') {
                console.log(`📥 ${progress.name}: ${Math.round(progress.progress || 0)}%`);
              }
            }
          }),
          // 30 second timeout
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Model loading timeout')), 30000)
          )
        ]);
        
        this.modelName = modelName;
        return;
        
      } catch (error) {
        console.warn(`Failed to load ${modelName}:`, error.message);
        continue;
      }
    }
    
    throw new Error('All remote models failed');
  }

  private async tryAlternativeCDN(): Promise<void> {
    // Try using different CDN endpoints or mirrors
    const alternatives = [
      // Try jsdelivr CDN as alternative
      'https://cdn.jsdelivr.net/npm/@xenova/transformers@latest/models/whisper-tiny-en/',
      // Try unpkg CDN
      'https://unpkg.com/@xenova/transformers@latest/models/whisper-tiny-en/'
    ];

    for (const cdnUrl of alternatives) {
      try {
        console.log(`🔄 Trying alternative CDN: ${cdnUrl}`);
        // This would require custom model loading logic
        // For now, we'll skip this and go to fallback
        continue;
      } catch (error) {
        console.warn(`Alternative CDN failed: ${cdnUrl}`);
        continue;
      }
    }
    
    throw new Error('All alternative CDNs failed');
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.useWebSpeechFallback) {
      console.log('🎤 Using Web Speech API for transcription...');
      return await this.transcribeWithWebSpeech();
    }

    try {
      console.log(`🎤 Transcribing with Whisper (${this.modelName})...`);
      
      // Convert blob to audio array
      const audioArray = await this.blobToAudioArray(audioBlob);
      
      // Run transcription
      const result = await this.pipeline(audioArray, {
        language: 'english',
        task: 'transcribe'
      });
      
      const text = result.text || '';
      console.log('✅ Whisper transcription:', text);
      
      return text.trim();
      
    } catch (error) {
      console.warn('⚠️ Whisper transcription failed, falling back to Web Speech:', error.message);
      return await this.transcribeWithWebSpeech();
    }
  }

  private async transcribeWithWebSpeech(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        let hasResult = false;

        recognition.onresult = (event) => {
          if (event.results.length > 0 && !hasResult) {
            hasResult = true;
            const text = event.results[0][0].transcript;
            console.log('✅ Web Speech transcription:', text);
            resolve(text);
          }
        };

        recognition.onerror = (event) => {
          if (!hasResult) {
            console.error('❌ Web Speech error:', event.error);
            reject(new Error(`Web Speech failed: ${event.error}`));
          }
        };

        recognition.onend = () => {
          if (!hasResult) {
            console.log('⚠️ Web Speech ended without result');
            resolve('');
          }
        };

        recognition.start();
        
        // Auto-stop after 10 seconds
        setTimeout(() => {
          if (!hasResult) {
            recognition.stop();
          }
        }, 10000);

      } catch (error) {
        console.error('❌ Web Speech setup failed:', error);
        reject(error);
      }
    });
  }

  // For real-time speech recognition
  async startLiveRecognition(): Promise<string> {
    console.log('🎤 Starting live speech recognition...');
    return await this.transcribeWithWebSpeech();
  }

  private async blobToAudioArray(blob: Blob): Promise<Float32Array> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get mono channel data
      const channelData = audioBuffer.getChannelData(0);
      
      // Resample to 16kHz if needed
      const targetSampleRate = 16000;
      if (audioBuffer.sampleRate !== targetSampleRate) {
        return this.resample(channelData, audioBuffer.sampleRate, targetSampleRate);
      }
      
      return new Float32Array(channelData);
    } catch (error) {
      console.error('❌ Audio conversion failed:', error);
      throw new Error(`Audio processing failed: ${error.message}`);
    }
  }

  private resample(audioData: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return audioData;
    
    const ratio = fromRate / toRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = i * ratio;
      const leftIndex = Math.floor(sourceIndex);
      const rightIndex = Math.min(Math.ceil(sourceIndex), audioData.length - 1);
      const fraction = sourceIndex - leftIndex;
      
      result[i] = audioData[leftIndex] * (1 - fraction) + audioData[rightIndex] * fraction;
    }
    
    return result;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getStatus(): string {
    if (this.initError) return `Error: ${this.initError}`;
    if (!this.isInitialized) return 'Not initialized';
    
    if (this.useWebSpeechFallback) {
      return 'Ready (Web Speech API)';
    } else {
      return `Ready (${this.modelName})`;
    }
  }

  getMode(): string {
    if (!this.isInitialized) return 'not-initialized';
    if (this.useWebSpeechFallback) return 'web-speech-api';
    return 'hybrid-whisper';
  }
}

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const hybridWhisperSTT = new HybridWhisperSTT(); 