import { pipeline } from '@xenova/transformers';

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  source: 'whisper';
}

class WhisperSTTNoFallback {
  private pipeline: any = null;
  public isInitialized = false;
  private modelName: string = '';
  private initializationError: string = '';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🎤 Initializing Whisper STT (No Fallback Mode)...');
    
    try {
      await this.tryLoadWhisperModels();
      
      if (!this.pipeline) {
        throw new Error('Failed to load any Whisper models and no fallback allowed');
      }
      
      this.isInitialized = true;
      console.log(`✅ Whisper STT initialized successfully with ${this.modelName}`);
    } catch (error) {
      this.initializationError = error.message;
      console.error('❌ Failed to initialize Whisper STT:', error);
      throw error;
    }
  }

  private async tryLoadWhisperModels(): Promise<void> {
    // Try different model configurations with detailed logging
    const modelConfigs = [
      { name: 'Xenova/whisper-tiny.en', timeout: 30000 },
      { name: 'openai/whisper-tiny.en', timeout: 30000 },
      { name: 'microsoft/whisper-tiny.en', timeout: 30000 },
      { name: 'Xenova/whisper-base.en', timeout: 45000 }
    ];
    
    for (const config of modelConfigs) {
      try {
        console.log(`🔄 Attempting to load Whisper model: ${config.name}`);
        console.log(`⏱️ Timeout set to: ${config.timeout}ms`);
        
        // First check if we can reach the model
        await this.checkModelFiles(config.name);
        
        // Try to load the model with detailed configuration
        const loadPromise = this.loadModelWithDetailedLogging(config.name);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Model loading timeout after ${config.timeout}ms`)), config.timeout)
        );
        
        this.pipeline = await Promise.race([loadPromise, timeoutPromise]);
        this.modelName = config.name;
        console.log(`✅ Successfully loaded Whisper model: ${config.name}`);
        return;
        
      } catch (error) {
        console.error(`❌ Failed to load Whisper model ${config.name}:`, {
          error: error.message,
          stack: error.stack,
          name: error.name
        });
        continue;
      }
    }
    
    throw new Error('All Whisper models failed to load');
  }

  private async checkModelFiles(modelName: string): Promise<void> {
    console.log(`🔍 Checking model files for ${modelName}...`);
    
    const filesToCheck = [
      'config.json',
      'tokenizer.json',
      'model.onnx'
    ];
    
    for (const file of filesToCheck) {
      try {
        const url = `https://huggingface.co/${modelName}/resolve/main/onnx/${file}`;
        console.log(`🔍 Checking: ${url}`);
        
        const response = await fetch(url, { method: 'HEAD' });
        console.log(`📁 ${file}: HTTP ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          console.warn(`⚠️ File ${file} not accessible: HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to check ${file}:`, error.message);
      }
    }
  }

  private async loadModelWithDetailedLogging(modelName: string): Promise<any> {
    console.log(`📥 Starting model load for ${modelName}...`);
    
    try {
      // Set up transformers.js environment
      console.log('🔧 Configuring transformers.js environment...');
      
      // Try different loading strategies
      const loadingStrategies = [
        // Strategy 1: Default loading
        async () => {
          console.log('📦 Strategy 1: Default loading');
          return await pipeline('automatic-speech-recognition', modelName);
        },
        
        // Strategy 2: Explicit ONNX backend
        async () => {
          console.log('📦 Strategy 2: Explicit ONNX backend');
          return await pipeline('automatic-speech-recognition', modelName, {
            device: 'cpu',
            dtype: 'fp32'
          });
        },
        
        // Strategy 3: With custom cache settings
        async () => {
          console.log('📦 Strategy 3: Custom cache settings');
          return await pipeline('automatic-speech-recognition', modelName, {
            cache_dir: './models/',
            local_files_only: false,
            revision: 'main'
          });
        }
      ];
      
      for (let i = 0; i < loadingStrategies.length; i++) {
        try {
          console.log(`🎯 Trying loading strategy ${i + 1}...`);
          const result = await loadingStrategies[i]();
          console.log(`✅ Strategy ${i + 1} succeeded!`);
          return result;
        } catch (error) {
          console.warn(`❌ Strategy ${i + 1} failed:`, error.message);
          if (i === loadingStrategies.length - 1) {
            throw error;
          }
        }
      }
      
    } catch (error) {
      console.error('❌ All loading strategies failed:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Whisper STT not initialized');
    }

    if (!this.pipeline) {
      throw new Error('No Whisper pipeline available');
    }

    try {
      console.log(`🎤 Transcribing audio with Whisper (${this.modelName})...`);
      
      // Convert blob to audio buffer
      const audioBuffer = await this.blobToAudioBuffer(audioBlob);
      console.log(`🔊 Audio buffer prepared: ${audioBuffer.length} samples`);
      
      // Run transcription
      console.log('🤖 Running Whisper inference...');
      const result = await this.pipeline(audioBuffer);
      
      const transcribedText = result.text || '';
      console.log('✅ Whisper transcription completed:', transcribedText);
      
      return transcribedText;
      
    } catch (error) {
      console.error('❌ Whisper transcription failed:', error);
      throw error;
    }
  }

  private async blobToAudioBuffer(blob: Blob): Promise<Float32Array> {
    try {
      console.log('🔄 Converting audio blob to buffer...');
      
      const arrayBuffer = await blob.arrayBuffer();
      console.log(`📊 Array buffer size: ${arrayBuffer.byteLength} bytes`);
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log(`🎵 Audio decoded: ${audioBuffer.duration}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`);
      
      // Convert to Float32Array (mono, 16kHz for Whisper)
      const channelData = audioBuffer.getChannelData(0);
      
      // Resample to 16kHz if needed
      const targetSampleRate = 16000;
      let processedData = channelData;
      
      if (audioBuffer.sampleRate !== targetSampleRate) {
        console.log(`🔧 Resampling from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz...`);
        processedData = this.resampleAudio(channelData, audioBuffer.sampleRate, targetSampleRate);
      }
      
      const result = new Float32Array(processedData);
      console.log(`✅ Audio buffer ready: ${result.length} samples at ${targetSampleRate}Hz`);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to convert audio blob:', error);
      throw new Error(`Failed to process audio data: ${error.message}`);
    }
  }

  private resampleAudio(audioData: Float32Array, originalSampleRate: number, targetSampleRate: number): Float32Array {
    if (originalSampleRate === targetSampleRate) {
      return audioData;
    }
    
    const ratio = originalSampleRate / targetSampleRate;
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

  // Debug methods
  async runDiagnostics(): Promise<object> {
    const diagnostics = {
      isInitialized: this.isInitialized,
      modelName: this.modelName,
      initializationError: this.initializationError,
      hasPipeline: !!this.pipeline,
      transformersVersion: null,
      onnxSupport: false,
      webglSupport: false
    };

    try {
      // Check transformers.js version
      const transformers = await import('@xenova/transformers');
      diagnostics.transformersVersion = transformers.env?.version || 'unknown';
    } catch (error) {
      console.warn('Failed to get transformers version:', error);
    }

    // Check ONNX support
    try {
      const ort = await import('onnxruntime-web');
      diagnostics.onnxSupport = true;
    } catch (error) {
      console.warn('ONNX Runtime not available:', error);
    }

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      diagnostics.webglSupport = !!gl;
    } catch (error) {
      console.warn('WebGL not available:', error);
    }

    return diagnostics;
  }

  isReady(): boolean {
    return this.isInitialized && !!this.pipeline;
  }

  getMode(): string {
    if (!this.isInitialized) return 'not-initialized';
    return `whisper-${this.modelName}`;
  }

  getStatus(): string {
    if (!this.isInitialized) {
      return this.initializationError ? `Failed: ${this.initializationError}` : 'Not initialized';
    }
    return `Ready (Whisper: ${this.modelName})`;
  }
}

export const whisperSTTNoFallback = new WhisperSTTNoFallback(); 