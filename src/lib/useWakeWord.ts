import { useCallback, useEffect, useRef, useState } from 'react';

interface WakeWordConfig {
  keyword?: string;
  sensitivity?: number;
  autoStart?: boolean;
}

interface WakeWordState {
  isListening: boolean;
  isDetected: boolean;
  error: string | null;
  confidence: number;
}

export const useWakeWord = (config: WakeWordConfig = {}) => {
  const {
    keyword = 'hey echo',
    sensitivity = 0.5,
    autoStart = false
  } = config;

  const [state, setState] = useState<WakeWordState>({
    isListening: false,
    isDetected: false,
    error: null,
    confidence: 0
  });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const wakeWordEngineRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Initialize wake word detection engine
  const initializeEngine = useCallback(async () => {
    try {
      // TODO: Import and initialize Porcupine or Snowboy
      // Example with Porcupine:
      // const { Porcupine } = await import('@picovoice/porcupine-web');
      // wakeWordEngineRef.current = await Porcupine.create({
      //   keywords: [keyword],
      //   sensitivities: [sensitivity]
      // });
      
      // Example with Snowboy:
      // const { Snowboy } = await import('snowboy');
      // wakeWordEngineRef.current = new Snowboy({
      //   hotwords: [keyword],
      //   sensitivity: sensitivity
      // });

      console.log(`Wake word engine initialized with keyword: "${keyword}"`);
      isInitializedRef.current = true;
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      console.error('Failed to initialize wake word engine:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to initialize wake word detection' 
      }));
    }
  }, [keyword, sensitivity]);

  // Initialize on mount
  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);

  const startListening = useCallback(async () => {
    if (!isInitializedRef.current) {
      console.warn('Wake word engine not initialized');
      return;
    }

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      mediaStreamRef.current = stream;

      // Create audio context and processor
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (wakeWordEngineRef.current) {
          const inputData = event.inputBuffer.getChannelData(0);
          
          // TODO: Process audio with wake word engine
          // Example with Porcupine:
          // const result = wakeWordEngineRef.current.process(inputData);
          // if (result.keywordIndex !== -1) {
          //   setState(prev => ({ 
          //     ...prev, 
          //     isDetected: true, 
          //     confidence: result.confidence 
          //   }));
          // }

          // Example with Snowboy:
          // const result = wakeWordEngineRef.current.detect(inputData);
          // if (result.hotword) {
          //   setState(prev => ({ 
          //     ...prev, 
          //     isDetected: true, 
          //     confidence: result.confidence 
          //   }));
          // }
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null,
        isDetected: false,
        confidence: 0
      }));

    } catch (error) {
      console.error('Failed to start wake word listening:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to access microphone' 
      }));
    }
  }, []);

  const stopListening = useCallback(() => {
    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isListening: false,
      isDetected: false,
      confidence: 0
    }));
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setState({
      isListening: false,
      isDetected: false,
      error: null,
      confidence: 0
    });
  }, [stopListening]);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart && isInitializedRef.current && !state.isListening) {
      startListening();
    }
  }, [autoStart, state.isListening, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (wakeWordEngineRef.current) {
        // TODO: Cleanup wake word engine
        // wakeWordEngineRef.current.release();
      }
    };
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    reset,
    keyword
  };
}; 