// Simple Whisper STT implementation with robust error handling
import { env, pipeline } from '@xenova/transformers';

// Configure transformers.js environment
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useFSCache = false;

class SimpleWhisperSTT {
  private pipeline: any = null;
  private isInitialized = false;
  private modelName = '';
  private initError = '';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🎤 Initializing Simple Whisper STT...');

    try {
      // Try the most reliable model first
      await this.loadModel();
      this.isInitialized = true;
      console.log(`✅ Whisper STT ready with ${this.modelName}`);
    } catch (error) {
      this.initError = error.message;
      console.error('❌ Whisper STT initialization failed:', error);
      throw error;
    }
  }

  private async loadModel(): Promise<void> {
    // Try different models in order of reliability
    const models = [
      'Xenova/whisper-tiny.en',
      'Xenova/whisper-tiny',
      'openai/whisper-tiny.en'
    ];

    for (const modelName of models) {
      try {
        console.log(`🔄 Trying model: ${modelName}`);
        
        // Set a reasonable timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 20000)
        );
        
        const loadPromise = pipeline('automatic-speech-recognition', modelName);
        
        this.pipeline = await Promise.race([loadPromise, timeoutPromise]);
        this.modelName = modelName;
        console.log(`✅ Loaded model: ${modelName}`);
        return;
        
      } catch (error) {
        console.warn(`⚠️ Failed to load ${modelName}:`, error.message);
        continue;
      }
    }
    
    throw new Error('All Whisper models failed to load');
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isInitialized || !this.pipeline) {
      throw new Error('Whisper not initialized');
    }

    try {
      console.log('🎤 Transcribing with Whisper...');
      
      // Convert blob to audio array
      const audioArray = await this.blobToAudioArray(audioBlob);
      
      // Run transcription
      const result = await this.pipeline(audioArray);
      
      const text = result.text || '';
      console.log('✅ Transcription result:', text);
      
      return text;
      
    } catch (error) {
      console.error('❌ Transcription failed:', error);
      throw error;
    }
  }

  private async blobToAudioArray(blob: Blob): Promise<Float32Array> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get mono channel data
    const channelData = audioBuffer.getChannelData(0);
    
    // Resample to 16kHz if needed (Whisper expects 16kHz)
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
    return this.isInitialized && !!this.pipeline;
  }

  getStatus(): string {
    if (this.initError) return `Error: ${this.initError}`;
    if (!this.isInitialized) return 'Not initialized';
    return `Ready (${this.modelName})`;
  }
}

export const simpleWhisperSTT = new SimpleWhisperSTT(); 