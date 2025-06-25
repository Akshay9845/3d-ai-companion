// Reliable Whisper STT - prioritizes Web Speech API with Whisper as enhancement
import { pipeline } from '@xenova/transformers';

class ReliableWhisperSTT {
  private whisperPipeline: any = null;
  private isInitialized = false;
  private useWebSpeech = true; // Start with Web Speech as primary
  private whisperReady = false;
  private initError = '';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🎤 Initializing Reliable Whisper STT...');

    try {
      // First, ensure Web Speech API is available
      await this.initializeWebSpeech();
      
      // Then try to load Whisper in background (non-blocking)
      this.loadWhisperInBackground();
      
      this.isInitialized = true;
      console.log('✅ Reliable STT initialized (Web Speech ready, Whisper loading...)');
      
    } catch (error) {
      this.initError = error.message;
      console.error('❌ Failed to initialize STT:', error);
      throw error;
    }
  }

  private async initializeWebSpeech(): Promise<void> {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      throw new Error('Web Speech API not supported in this browser');
    }
    
    console.log('✅ Web Speech API available');
    this.useWebSpeech = true;
  }

  private async loadWhisperInBackground(): Promise<void> {
    // Don't block initialization - load Whisper in background
    setTimeout(async () => {
      try {
        console.log('🔄 Loading Whisper models in background...');
        
        const models = ['Xenova/whisper-tiny.en', 'Xenova/whisper-tiny'];
        
        for (const modelName of models) {
          try {
            console.log(`🔄 Trying ${modelName}...`);
            
            // Short timeout - don't wait too long
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 10000)
            );
            
            const loadPromise = pipeline('automatic-speech-recognition', modelName);
            
            this.whisperPipeline = await Promise.race([loadPromise, timeoutPromise]);
            this.whisperReady = true;
            
            console.log(`✅ Whisper model ${modelName} loaded successfully!`);
            console.log('🚀 Enhanced STT now available (Whisper + Web Speech)');
            return;
            
          } catch (error) {
            console.warn(`⚠️ Failed to load ${modelName}:`, error.message);
            continue;
          }
        }
        
        console.log('⚠️ Whisper models failed to load, continuing with Web Speech API');
        
      } catch (error) {
        console.warn('⚠️ Background Whisper loading failed:', error.message);
      }
    }, 100); // Start loading after 100ms
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Try Whisper first if available, otherwise use Web Speech
    if (this.whisperReady && this.whisperPipeline) {
      try {
        console.log('🎤 Using Whisper for transcription...');
        return await this.transcribeWithWhisper(audioBlob);
      } catch (error) {
        console.warn('⚠️ Whisper transcription failed, falling back to Web Speech:', error.message);
        return await this.transcribeWithWebSpeech();
      }
    } else {
      console.log('🎤 Using Web Speech API for transcription...');
      return await this.transcribeWithWebSpeech();
    }
  }

  private async transcribeWithWhisper(audioBlob: Blob): Promise<string> {
    // Convert blob to audio array
    const audioArray = await this.blobToAudioArray(audioBlob);
    
    // Run transcription
    const result = await this.whisperPipeline(audioArray);
    
    const text = result.text || '';
    console.log('✅ Whisper transcription:', text);
    
    return text;
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

  // Method for live speech recognition (always uses Web Speech for real-time)
  async startLiveRecognition(): Promise<string> {
    console.log('🎤 Starting live speech recognition (Web Speech API)...');
    return await this.transcribeWithWebSpeech();
  }

  private async blobToAudioArray(blob: Blob): Promise<Float32Array> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get mono channel data
    const channelData = audioBuffer.getChannelData(0);
    
    // Resample to 16kHz if needed
    if (audioBuffer.sampleRate !== 16000) {
      return this.resample(channelData, audioBuffer.sampleRate, 16000);
    }
    
    return new Float32Array(channelData);
  }

  private resample(audioData: Float32Array, fromRate: number, toRate: number): Float32Array {
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
    
    if (this.whisperReady) {
      return 'Ready (Whisper + Web Speech)';
    } else {
      return 'Ready (Web Speech API)';
    }
  }

  getMode(): string {
    if (!this.isInitialized) return 'not-initialized';
    if (this.whisperReady) return 'hybrid';
    return 'web-speech-api';
  }
}

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const reliableWhisperSTT = new ReliableWhisperSTT(); 