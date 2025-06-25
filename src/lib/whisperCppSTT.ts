// Whisper.cpp STT Service - Proper implementation using GGML models
// Based on https://github.com/ggml-org/whisper.cpp

interface WhisperCppStatus {
  isReady: boolean;
  modelName: string;
  modelSize: string;
  isQuantized: boolean;
  error?: string;
  fallbackActive: boolean;
}

interface WhisperCppConfig {
  language: string;
  threads: number;
  translate: boolean;
  maxLength: number;
}

export class WhisperCppSTT {
  private isInitialized = false;
  private status: WhisperCppStatus = {
    isReady: false,
    modelName: 'none',
    modelSize: '0MB',
    isQuantized: false,
    fallbackActive: false
  };
  
  // Model URLs
  private modelUrls: { [key: string]: string } = {
    'tiny': '/ggml-models/ggml-model-whisper-tiny.bin',
    'base': '/ggml-models/ggml-model-whisper-base.bin',
    'small': '/ggml-models/ggml-model-whisper-small.bin',
    'medium': '/ggml-models/ggml-model-whisper-medium.bin',
    'large-v3': '/ggml-models/ggml-model-whisper-large-v3.bin',
    'tiny.en-q5_1': '/ggml-models/ggml-model-whisper-tiny.en-q5_1.bin',
    'tiny.en': '/ggml-models/ggml-model-whisper-tiny.en.bin',
    'base.en-q5_1': '/ggml-models/ggml-model-whisper-base.en-q5_1.bin',
    'base.en': '/ggml-models/ggml-model-whisper-base.en.bin',
    'small.en-q5_1': '/ggml-models/ggml-model-whisper-small.en-q5_1.bin',
    'small.en': '/ggml-models/ggml-model-whisper-small.en.bin'
  };

  // Model sizes for display
  private modelSizes: { [key: string]: string } = {
    'tiny': '74MB',
    'base': '142MB', 
    'small': '465MB',
    'medium': '1.4GB',
    'large-v3': '2.9GB',
    'tiny.en': '74MB',
    'base.en': '142MB',
    'small.en': '465MB'
  };

  // Web Speech API fallback
  private recognition: any = null;
  private useWebSpeechFallback = false;
  
  // Callbacks for live transcription
  public onResult: (transcript: string, isFinal: boolean) => void = () => {};
  public onError: (error: any) => void = () => {};
  
  // Configuration
  private config: WhisperCppConfig = {
    language: 'auto',
    model: 'base',
    temperature: 0.0,
    maxTokens: 448,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0
  };

  // Preferred model for Indian languages
  private preferredModel: string | null = null;

  // Supported Indian languages
  private readonly INDIAN_LANGUAGES = {
    'hi': 'Hindi',
    'ta': 'Tamil', 
    'te': 'Telugu',
    'bn': 'Bengali',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'ur': 'Urdu',
    'or': 'Odia',
    'as': 'Assamese',
    'ne': 'Nepali',
    'si': 'Sinhala'
  };

  private wasmModule: any = null;
  private wasmReady: boolean = false;
  private wasmAudioContext: AudioContext | null = null;
  private wasmProcessor: ScriptProcessorNode | null = null;
  private wasmStream: MediaStream | null = null;
  private whisperInstance: any = null;
  private isRecording = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🎤 Initializing Whisper.cpp STT...');
    this.updateStatus('Initializing...', 'initialization');

    try {
      // Always ensure Web Speech API fallback is available
      this.setupWebSpeechFallback();
      
      // Try to load a GGML model
      await this.tryLoadGGMLModel();
      
      this.isInitialized = true;
      
      if (this.useWebSpeechFallback) {
        this.updateStatus('Ready with Web Speech API', 'web-speech', 'Web Speech API', '0MB', false, true);
        console.log('✅ Whisper.cpp STT ready with Web Speech API fallback');
      } else {
        console.log(`✅ Whisper.cpp STT ready with ${this.status.modelName} (${this.status.modelSize})`);
      }
      
    } catch (error) {
      this.status.error = error.message;
      console.error('❌ Whisper.cpp STT initialization failed:', error);
      throw error;
    }
  }

  private updateStatus(message: string, modelName: string = 'none', size: string = '0MB', quantized: boolean = false, fallback: boolean = false): void {
    this.status = {
      isReady: true,
      modelName: modelName,
      modelSize: size,
      isQuantized: quantized,
      error: message === 'Ready' ? undefined : message,
      fallbackActive: fallback
    };
  }

  private setupWebSpeechFallback(): void {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (typeof window !== 'undefined' && SpeechRecognition) {
      console.log('✅ Web Speech API available as fallback');
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.config.language === 'en' ? 'en-US' : this.config.language;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          this.onResult(finalTranscript.trim(), true);
        }
        if (interimTranscript) {
          this.onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('❌ Web Speech API error:', event.error);
        this.onError(event.error);
      };
    } else {
      console.warn('⚠️ Web Speech API not available');
    }
  }

  private async tryLoadGGMLModel(): Promise<void> {
    // Check if WASM is available first
    if (!this.isWasmAvailable()) {
      console.log('⚠️ WASM not available - GGML models require whisper.cpp WASM build');
      console.log('📝 Using Web Speech API fallback (WASM build incomplete)');
      this.useWebSpeechFallback = true;
      this.updateStatus('WASM Build Incomplete', 'web-speech', '0MB', false, true);
      return;
    }

    // Choose model order based on language
    let modelOrder: string[];
    if (this.config.language in this.INDIAN_LANGUAGES) {
      // Use multilingual models for Indian languages
      if (this.preferredModel && this.modelUrls[this.preferredModel]) {
        // Start with preferred model, then fallback to others
        modelOrder = [this.preferredModel, 'tiny', 'base', 'small', 'medium', 'large-v3'];
        // Remove duplicates
        modelOrder = [...new Set(modelOrder)];
      } else {
        modelOrder = ['tiny', 'base', 'small', 'medium', 'large-v3'];
      }
    } else {
      // Use English models for English
      if (this.preferredModel && this.modelUrls[this.preferredModel]) {
        modelOrder = [this.preferredModel, 'tiny.en-q5_1', 'tiny.en', 'base.en-q5_1', 'base.en'];
        modelOrder = [...new Set(modelOrder)];
      } else {
        modelOrder = ['tiny.en-q5_1', 'tiny.en', 'base.en-q5_1', 'base.en'];
      }
    }
    
    for (const modelName of modelOrder) {
      try {
        console.log(`🔄 Trying GGML model: ${modelName}`);
        const modelUrl = this.modelUrls[modelName];
        const isReachable = await this.checkModelReachability(modelUrl);
        if (isReachable) {
          console.log(`✅ GGML model ${modelName} is reachable and ready`);
          await this.loadWasmModule();
          // Initialize the model in WASM
          await this.initWasmModel(modelUrl);
          this.status.isReady = true;
          this.status.modelName = modelName;
          this.status.modelSize = this.modelSizes[modelName] || "N/A";
          this.status.isQuantized = modelName.includes('-q');
          this.status.fallbackActive = false;
          this.useWebSpeechFallback = false;
          this.updateStatus('GGML/WASM Ready', modelName, this.status.modelSize, this.status.isQuantized, false);
          return;
        }
      } catch (error) {
        console.log(`❌ Failed to load model ${modelName}:`, error);
        continue;
      }
    }
    // If no GGML models work, fall back to Web Speech API
    console.log('⚠️ No GGML models available, using Web Speech API fallback');
    this.useWebSpeechFallback = true;
    this.updateStatus('Web Speech API', 'fallback', '0MB', false, true);
  }

  private async initWasmModel(modelUrl: string): Promise<void> {
    // Wait for WASM module to be ready
    await this.loadWasmModule();
    if (!this.wasmModule._whisper_init_from_file) {
      // Use cwrap to wrap the C function
      this.wasmModule._whisper_init_from_file = this.wasmModule.cwrap('whisper_init_from_file', 'number', ['string']);
    }
    const modelPath = modelUrl.replace('/ggml-models/', ''); // WASM expects relative path
    const result = this.wasmModule._whisper_init_from_file(modelPath);
    if (result !== 0) {
      throw new Error('Failed to initialize Whisper model in WASM');
    }
    // Wrap the transcription function
    if (!this.wasmModule._whisper_full) {
      this.wasmModule._whisper_full = this.wasmModule.cwrap('whisper_full', 'string', ['array', 'number', 'string', 'number']);
    }
  }

  private async loadWasmModule(): Promise<void> {
    if (this.wasmReady) return;
    
    try {
      console.log('🔄 Loading Whisper.cpp WASM module...');
      
      // Check if Module is already available (from script tag)
      if ((window as any).Module && (window as any).Module.init) {
        this.wasmModule = (window as any).Module;
        this.wasmReady = true;
        console.log('✅ Whisper.cpp WASM module loaded from global scope');
        return;
      }

      // Load WASM module using the same pattern as the working example
      return new Promise((resolve, reject) => {
        let moduleInitialized = false;

        // Create script tag to load the WASM module
        const script = document.createElement('script');
        script.src = '/ggml-wasm/main.js';
        script.type = 'text/javascript';
        
        script.onload = () => {
          console.log('📜 WASM script loaded, waiting for initialization...');

          // Hook into the Module after it's created by main.js
          let attempts = 0;
          const maxAttempts = 20;
          const checkInterval = setInterval(() => {
            attempts++;
            
            if ((window as any).Module && !moduleInitialized) {
              // Hook into the existing Module object
              const originalMonitorRunDependencies = (window as any).Module.monitorRunDependencies || (() => {});

              (window as any).Module.monitorRunDependencies = (left: number) => {
                console.log(`WASM Dependencies: ${left} remaining`);
                if (left === 0 && !moduleInitialized) {
                  moduleInitialized = true;
                  this.wasmModule = (window as any).Module;
                  this.wasmReady = true;
                  console.log('✅ WASM dependencies loaded');
                  resolve();
                }
                originalMonitorRunDependencies(left);
              };

              // Also check if the module is already ready
              if ((window as any).Module.init) {
                clearInterval(checkInterval);
                moduleInitialized = true;
                this.wasmModule = (window as any).Module;
                this.wasmReady = true;
                console.log('✅ Whisper.cpp WASM module ready');
                resolve();
              }
            } else if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              console.error('❌ WASM module not ready after timeout');
              reject(new Error('WASM module not ready after timeout'));
            }
          }, 500);
        };

        script.onerror = (error) => {
          console.error('❌ Failed to load WASM script:', error);
          reject(new Error('Failed to load WASM script'));
        };

        document.head.appendChild(script);

        // Timeout after 15 seconds
        setTimeout(() => {
          if (!this.wasmReady) {
            console.error('❌ Timeout waiting for WASM module to load');
            reject(new Error('Timeout waiting for WASM module to load'));
          }
        }, 15000);
      });
    } catch (error) {
      console.error('❌ Error loading WASM module:', error);
      throw error;
    }
  }

  private isWasmAvailable(): boolean {
    // Check if WebAssembly is supported and the WASM files exist
    if (typeof WebAssembly === 'undefined') {
      console.log('⚠️ WebAssembly not supported in this browser');
      return false;
    }
    
    // Check if the WASM module is available and has required functions
    const Module = (window as any).Module;
    if (Module && Module.init && Module.full_default) {
      console.log('✅ WASM module available with required Whisper functions');
      return true;
    }
    
    console.log('⚠️ WASM module not loaded yet or missing required functions');
    return false;
  }

  private async checkModelReachability(modelUrl: string): Promise<boolean> {
    try {
      const response = await fetch(modelUrl, { method: 'HEAD' });
      console.log(`✅ Model is reachable: ${modelUrl}`);
      return response.ok;
    } catch (error) {
      console.log(`❌ Model not reachable: ${modelUrl}`);
      return false;
    }
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (this.isWasmAvailable()) {
      try {
        return await this.transcribeWithWasm(audioBlob);
      } catch (e) {
        console.warn('⚠️ WASM transcription failed, falling back to Web Speech API:', e);
        if (this.recognition) {
          return await this.transcribeWithWebSpeech(audioBlob);
        } else {
          throw new Error('No transcription pipeline available');
        }
      }
    }
    if (this.useWebSpeechFallback) {
      return await this.transcribeWithWebSpeech(audioBlob);
    }
    throw new Error('No transcription pipeline available');
  }

  private async transcribeWithWebSpeech(audioBlob: Blob): Promise<string> {
    if (!this.recognition) {
      throw new Error('Web Speech API not available');
    }

    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('✅ Web Speech API transcription:', transcript);
        URL.revokeObjectURL(audioUrl);
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('❌ Web Speech API error:', event.error);
        URL.revokeObjectURL(audioUrl);
        reject(new Error(`Web Speech API error: ${event.error}`));
      };

      this.recognition.onend = () => {
        URL.revokeObjectURL(audioUrl);
      };

      try {
        this.recognition.start();
        audio.play().catch(e => console.warn('Audio playback failed:', e));
      } catch (error) {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      }
    });
  }

  private async transcribeWithWasm(audioData: Float32Array): Promise<string> {
    if (!this.wasmModule || !this.wasmReady) {
      throw new Error('WASM module not ready');
    }

    try {
      console.log('🎯 Starting WASM transcription...');
      
      // Initialize whisper instance if not already done
      if (!this.whisperInstance) {
        // First, we need to load a model
        const modelName = this.getModelForLanguage(this.config.language);
        const modelUrl = this.modelUrls[modelName];
        
        if (!modelUrl) {
          throw new Error(`Model not found for language: ${this.config.language}`);
        }

        console.log(`📥 Loading model: ${modelName}`);
        
        // Download and store the model in WASM filesystem
        try {
          const response = await fetch(modelUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch model: ${response.statusText}`);
          }
          
          const modelData = await response.arrayBuffer();
          const modelBuffer = new Uint8Array(modelData);
          
          // Store model in WASM filesystem
          const modelFileName = 'whisper.bin';
          try {
            this.wasmModule.FS_unlink(modelFileName);
          } catch (e) {
            // File doesn't exist, ignore
          }
          
          this.wasmModule.FS_createDataFile("/", modelFileName, modelBuffer, true, true);
          console.log(`✅ Model stored in WASM filesystem: ${modelFileName} (${modelBuffer.length} bytes)`);
          
          // Initialize whisper instance
          this.whisperInstance = this.wasmModule.init(modelFileName);
          if (!this.whisperInstance) {
            throw new Error('Failed to initialize Whisper instance');
          }
          
          console.log(`✅ Whisper instance initialized: ${this.whisperInstance}`);
        } catch (error) {
          console.error('❌ Failed to load model:', error);
          throw error;
        }
      }

      // Perform transcription using the working example's API
      console.log(`🎤 Transcribing audio (${audioData.length} samples)...`);
      
      const language = this.config.language === 'auto' ? 'en' : this.config.language;
      const threads = 4; // Number of threads to use
      const translate = this.config.translate || false;
      
      // Call the transcription function
      const result = this.wasmModule.full_default(
        this.whisperInstance,
        audioData,
        language,
        threads,
        translate
      );
      
      if (result) {
        console.log('✅ Transcription completed');
        return result;
      } else {
        console.warn('⚠️ Transcription returned empty result');
        return '';
      }
      
    } catch (error) {
      console.error('❌ WASM transcription failed:', error);
      throw error;
    }
  }

  // Configuration methods
  setLanguage(language: string): void {
    if (language === 'auto' || language in this.INDIAN_LANGUAGES || language === 'en') {
      this.config.language = language;
      console.log(`🌍 Language set to: ${language === 'auto' ? 'Auto-detect' : this.INDIAN_LANGUAGES[language] || language}`);
    } else {
      console.warn(`⚠️ Language ${language} not supported. Using auto-detect.`);
      this.config.language = 'auto';
    }
  }

  setThreads(threads: number): void {
    this.config.threads = Math.max(1, Math.min(16, threads));
  }

  setTranslate(translate: boolean): void {
    this.config.translate = translate;
  }

  // Set preferred model for Indian languages
  setPreferredModel(modelName: string): void {
    if (this.modelUrls[modelName]) {
      this.preferredModel = modelName;
      console.log(`🎯 Set preferred model to: ${modelName}`);
    } else {
      console.warn(`⚠️ Model ${modelName} not found. Available models:`, Object.keys(this.modelUrls));
    }
  }

  // Get preferred model
  getPreferredModel(): string | null {
    return this.preferredModel;
  }

  // Get available models with sizes
  getAvailableModelsWithSizes(): { [key: string]: { url: string; size: string; quantized: boolean } } {
    const models: { [key: string]: { url: string; size: string; quantized: boolean } } = {};
    for (const [name, url] of Object.entries(this.modelUrls)) {
      models[name] = {
        url,
        size: this.modelSizes[name] || 'Unknown',
        quantized: name.includes('-q')
      };
    }
    return models;
  }

  isWebSpeechAvailable(): boolean {
    return !!this.recognition;
  }

  // Status methods
  isReady(): boolean {
    return this.status.isReady;
  }

  getStatus(): string {
    if (!this.isInitialized) {
      return this.status.error ? `Failed: ${this.status.error}` : 'Not initialized';
    }
    
    if (this.status.fallbackActive) {
      return `Ready (Web Speech API Fallback)`;
    }
    
    return `Ready (GGML: ${this.status.modelName})`;
  }

  getDetailedStatus(): WhisperCppStatus {
    return { ...this.status };
  }

  getAvailableModels(): { [key: string]: string } {
    return this.modelUrls;
  }

  getModelInfo(modelName: string): any {
    const modelUrl = this.modelUrls[modelName];
    if (!modelUrl) return null;

    // Return placeholder info
    return {
        url: modelUrl,
        size: this.modelSizes[modelName] || "N/A",
        quantized: modelName.includes('-q'),
    };
  }

  isUsingFallback(): boolean {
    return this.status.fallbackActive;
  }

  // Get configuration
  getConfig(): WhisperCppConfig {
    return { ...this.config };
  }

  // Get information about WASM requirements
  getWasmInfo(): { isAvailable: boolean; requirements: string[] } {
    const requirements = [
      'Emscripten toolchain installed',
      'whisper.cpp WASM build compiled',
      'WebAssembly support in browser',
      'GGML model files available'
    ];
    
    return {
      isAvailable: this.isWasmAvailable(),
      requirements
    };
  }

  // Get detailed information about current setup
  getSetupInfo(): { 
    currentMode: string; 
    reason: string; 
    nextSteps: string[];
    wasmInfo: { isAvailable: boolean; requirements: string[] };
  } {
    const wasmInfo = this.getWasmInfo();
    
    if (this.useWebSpeechFallback) {
      return {
        currentMode: 'Web Speech API',
        reason: 'WASM build incomplete - missing .wasm file',
        nextSteps: [
          'Rebuild whisper.cpp with Emscripten',
          'Ensure .wasm file is generated',
          'Copy .wasm file to public/ggml-wasm/',
          'Restart the application'
        ],
        wasmInfo
      };
    } else {
      return {
        currentMode: 'GGML/WASM (Whisper.cpp)',
        reason: 'WASM module loaded successfully',
        nextSteps: ['Ready to use!'],
        wasmInfo
      };
    }
  }

  async start(
    onResult: (result: string) => void,
    onError?: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (this.isRecording) {
      console.warn('⚠️ Already recording');
      return;
    }

    try {
      console.log('🎤 Starting Whisper.cpp STT...');
      
      // Try to load WASM module first
      await this.loadWasmModule();
      
      if (this.isWasmAvailable()) {
        console.log('🎯 Using Whisper.cpp WASM for transcription');
        await this.startWasmRecording(onResult, onError, onStart, onEnd);
      } else {
        console.log('🎤 Using Web Speech API fallback');
        await this.startWebSpeechRecording(onResult, onError, onStart, onEnd);
      }
    } catch (error) {
      console.error('❌ Failed to start STT:', error);
      if (onError) {
        onError(`Failed to start speech recognition: ${error}`);
      }
    }
  }

  private async startWasmRecording(
    onResult: (result: string) => void,
    onError?: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    try {
      console.log('🎯 Starting WASM-based recording...');
      
      this.wasmStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(this.wasmStream);
      
      // Create a script processor for real-time audio processing
      this.wasmProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      
      const audioBuffer: Float32Array[] = [];
      let bufferLength = 0;
      const maxBufferSeconds = 30; // Maximum recording length
      const sampleRate = 16000;
      const maxSamples = maxBufferSeconds * sampleRate;
      
      this.wasmProcessor.onaudioprocess = (event) => {
        if (!this.isRecording) return;
        
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Convert to Float32Array and add to buffer
        const chunk = new Float32Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          chunk[i] = inputData[i];
        }
        
        audioBuffer.push(chunk);
        bufferLength += chunk.length;
        
        // If we've reached the maximum buffer size, stop recording and transcribe
        if (bufferLength >= maxSamples) {
          this.stop();
        }
      };

      source.connect(this.wasmProcessor);
      this.wasmProcessor.connect(audioContext.destination);
      
      this.isRecording = true;
      
      if (onStart) {
        onStart();
      }
      
      console.log('✅ WASM recording started');
      
      // Set up stop handler
      const originalStop = this.stop.bind(this);
      this.stop = async () => {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        if (this.wasmProcessor) {
          this.wasmProcessor.disconnect();
          this.wasmProcessor = null;
        }
        
        if (this.wasmStream) {
          this.wasmStream.getTracks().forEach(track => track.stop());
          this.wasmStream = null;
        }
        
        if (audioContext.state !== 'closed') {
          await audioContext.close();
        }
        
        // Combine all audio chunks
        const totalLength = audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedAudio = new Float32Array(totalLength);
        let offset = 0;
        
        for (const chunk of audioBuffer) {
          combinedAudio.set(chunk, offset);
          offset += chunk.length;
        }
        
        console.log(`🎤 Audio captured: ${combinedAudio.length} samples (${(combinedAudio.length / sampleRate).toFixed(2)}s)`);
        
        if (combinedAudio.length > 0) {
          try {
            console.log('🎯 Starting WASM transcription...');
            const result = await this.transcribeWithWasm(combinedAudio);
            if (result && result.trim()) {
              onResult(result.trim());
            } else {
              console.warn('⚠️ Empty transcription result');
              onResult('');
            }
          } catch (error) {
            console.error('❌ WASM transcription failed:', error);
            if (onError) {
              onError(`Transcription failed: ${error}`);
            }
          }
        }
        
        if (onEnd) {
          onEnd();
        }
        
        // Restore original stop method
        this.stop = originalStop;
      };
      
    } catch (error) {
      console.error('❌ Failed to start WASM recording:', error);
      this.isRecording = false;
      if (onError) {
        onError(`Failed to start recording: ${error}`);
      }
    }
  }

  private async startWebSpeechRecording(
    onResult: (result: string) => void,
    onError?: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    // Implementation for starting Web Speech API recording
    // This is a placeholder and should be implemented based on your requirements
    if (onError) {
      onError('Web Speech API recording not implemented');
    }
  }

  stop() {
    if (this.recognition) {
      console.log('🛑 Stopping Web Speech API recognition...');
      this.recognition.stop();
    }
    
    // Stop WASM transcription
    if (this.wasmProcessor) {
      console.log('🛑 Stopping WASM transcription...');
      this.wasmProcessor.disconnect();
      this.wasmProcessor = null;
    }
    
    if (this.wasmAudioContext) {
      this.wasmAudioContext.close();
      this.wasmAudioContext = null;
    }
    
    if (this.wasmStream) {
      this.wasmStream.getTracks().forEach(track => track.stop());
      this.wasmStream = null;
    }
  }

  // Get list of supported Indian languages
  getSupportedIndianLanguages(): { [key: string]: string } {
    return this.INDIAN_LANGUAGES;
  }

  private getModelForLanguage(language: string): string {
    if (language in this.INDIAN_LANGUAGES) {
      return this.preferredModel || 'base';
    } else if (language === 'en') {
      return this.preferredModel || 'base.en';
    } else {
      throw new Error(`Language ${language} not supported`);
    }
  }
} 