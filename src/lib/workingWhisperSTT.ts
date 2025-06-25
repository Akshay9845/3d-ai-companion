// Working Whisper STT - uses only verified models
import { env, pipeline } from '@xenova/transformers';

// Configure transformers.js for browser use
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

class WorkingWhisperSTT {
  private pipeline: any = null;
  private isInitialized = false;
  private modelName = 'Xenova/whisper-tiny.en';
  private initError = '';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🎤 Initializing Working Whisper STT...');

    try {
      console.log(`🔄 Loading model: ${this.modelName}`);
      
      // Only use the verified working model
      this.pipeline = await pipeline('automatic-speech-recognition', this.modelName, {
        quantized: true, // Use quantized version for faster loading
        progress_callback: (progress: any) => {
          if (progress.status === 'downloading') {
            console.log(`📥 Downloading ${progress.name}: ${Math.round(progress.progress)}%`);
          } else if (progress.status === 'loading') {
            console.log(`🔄 Loading ${progress.name}...`);
          }
        }
      });
      
      this.isInitialized = true;
      console.log(`✅ Whisper STT ready with ${this.modelName}`);
      
    } catch (error) {
      this.initError = error.message;
      console.error('❌ Whisper STT initialization failed:', error);
      throw error;
    }
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isInitialized || !this.pipeline) {
      throw new Error('Whisper not initialized');
    }

    try {
      console.log('🎤 Transcribing audio with Whisper...');
      
      // Convert blob to audio array
      const audioArray = await this.blobToAudioArray(audioBlob);
      console.log(`🔊 Audio prepared: ${audioArray.length} samples`);
      
      // Run transcription
      const result = await this.pipeline(audioArray, {
        language: 'english',
        task: 'transcribe'
      });
      
      const text = result.text || '';
      console.log('✅ Whisper transcription:', text);
      
      return text.trim();
      
    } catch (error) {
      console.error('❌ Whisper transcription failed:', error);
      throw error;
    }
  }

  private async blobToAudioArray(blob: Blob): Promise<Float32Array> {
    try {
      console.log('🔄 Converting audio blob...');
      
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log(`🎵 Audio: ${audioBuffer.duration}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`);
      
      // Get mono channel data
      const channelData = audioBuffer.getChannelData(0);
      
      // Resample to 16kHz (Whisper requirement)
      const targetSampleRate = 16000;
      let processedData = channelData;
      
      if (audioBuffer.sampleRate !== targetSampleRate) {
        console.log(`🔧 Resampling from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz`);
        processedData = this.resample(channelData, audioBuffer.sampleRate, targetSampleRate);
      }
      
      const result = new Float32Array(processedData);
      console.log(`✅ Audio ready: ${result.length} samples at ${targetSampleRate}Hz`);
      
      return result;
      
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

  // For real-time speech recognition (fallback to Web Speech API)
  async startLiveRecognition(): Promise<string> {
    console.log('🎤 Starting live speech recognition...');
    
    return new Promise((resolve, reject) => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          reject(new Error('Web Speech API not supported'));
          return;
        }
        
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
            console.log('✅ Live transcription:', text);
            resolve(text);
          }
        };

        recognition.onerror = (event) => {
          if (!hasResult) {
            console.error('❌ Speech recognition error:', event.error);
            reject(new Error(`Speech recognition failed: ${event.error}`));
          }
        };

        recognition.onend = () => {
          if (!hasResult) {
            console.log('⚠️ Speech recognition ended without result');
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
        console.error('❌ Live recognition setup failed:', error);
        reject(error);
      }
    });
  }

  isReady(): boolean {
    return this.isInitialized && !!this.pipeline;
  }

  getStatus(): string {
    if (this.initError) return `Error: ${this.initError}`;
    if (!this.isInitialized) return 'Not initialized';
    return `Ready (${this.modelName})`;
  }

  getMode(): string {
    if (!this.isInitialized) return 'not-initialized';
    return 'whisper-tiny-en';
  }
}

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const workingWhisperSTT = new WorkingWhisperSTT(); 