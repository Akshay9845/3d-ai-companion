import { useCallback, useEffect, useRef, useState } from 'react';

interface EmotionDetectionConfig {
  endpoint?: string;
  sampleRate?: number;
  bufferSize?: number;
  autoStart?: boolean;
}

interface EmotionDetectionState {
  isListening: boolean;
  currentEmotion: string;
  confidence: number;
  error: string | null;
  emotions: EmotionScore[];
}

interface EmotionScore {
  emotion: string;
  score: number;
  confidence: number;
}

export const useEmotionDetection = (config: EmotionDetectionConfig = {}) => {
  const {
    endpoint = 'ws://localhost:8000/emotion',
    sampleRate = 16000,
    bufferSize = 4096,
    autoStart = false
  } = config;

  const [state, setState] = useState<EmotionDetectionState>({
    isListening: false,
    currentEmotion: 'neutral',
    confidence: 0,
    error: null,
    emotions: []
  });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const emotionEngineRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Initialize emotion detection engine
  const initializeEngine = useCallback(async () => {
    try {
      // TODO: Import and initialize emotion detection library
      // Example with openSMILE:
      // const { openSMILE } = await import('opensmile-js');
      // emotionEngineRef.current = new openSMILE({
      //   config: 'emotion_config.conf',
      //   sampleRate: sampleRate
      // });
      
      // Example with pyAudioAnalysis:
      // const { AudioAnalysis } = await import('pyaudioanalysis');
      // emotionEngineRef.current = new AudioAnalysis({
      //   model: 'emotion_model.pkl',
      //   features: ['mfcc', 'spectral', 'chroma']
      // });

      console.log('Emotion detection engine initialized');
      isInitializedRef.current = true;
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      console.error('Failed to initialize emotion detection engine:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to initialize emotion detection' 
      }));
    }
  }, [sampleRate]);

  // Initialize on mount
  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);

  const connectWebSocket = useCallback(() => {
    try {
      wsRef.current = new WebSocket(endpoint);
      
      wsRef.current.onopen = () => {
        console.log('Emotion WebSocket connected');
        setState(prev => ({ ...prev, error: null }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'emotion') {
            setState(prev => ({
              ...prev,
              currentEmotion: data.emotion,
              confidence: data.confidence,
              emotions: data.emotions || []
            }));
          } else if (data.type === 'error') {
            setState(prev => ({ ...prev, error: data.message }));
          }
        } catch (error) {
          console.error('Failed to parse emotion message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Emotion WebSocket error:', error);
        setState(prev => ({ ...prev, error: 'WebSocket connection failed' }));
      };

      wsRef.current.onclose = () => {
        console.log('Emotion WebSocket disconnected');
        setState(prev => ({ ...prev, isListening: false }));
      };
    } catch (error) {
      console.error('Failed to connect emotion WebSocket:', error);
      setState(prev => ({ ...prev, error: 'Failed to connect to emotion service' }));
    }
  }, [endpoint]);

  const startListening = useCallback(async () => {
    if (!isInitializedRef.current) {
      console.warn('Emotion detection engine not initialized');
      return;
    }

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      mediaStreamRef.current = stream;

      // Create audio context and processor
      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          // Send audio data to WebSocket for server-side processing
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          wsRef.current.send(pcmData.buffer);
        }

        // TODO: Client-side emotion detection
        // if (emotionEngineRef.current) {
        //   const result = emotionEngineRef.current.process(inputData);
        //   if (result.emotion) {
        //     setState(prev => ({
        //       ...prev,
        //       currentEmotion: result.emotion,
        //       confidence: result.confidence,
        //       emotions: result.emotions || []
        //     }));
        //   }
        // }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Connect WebSocket
      connectWebSocket();

      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null,
        currentEmotion: 'neutral',
        confidence: 0,
        emotions: []
      }));

    } catch (error) {
      console.error('Failed to start emotion listening:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to access microphone' 
      }));
    }
  }, [connectWebSocket, sampleRate, bufferSize]);

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

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isListening: false,
      currentEmotion: 'neutral',
      confidence: 0,
      emotions: []
    }));
  }, []);

  const detectEmotionFromText = useCallback((text: string): string => {
    // Simple keyword-based emotion detection for text
    const lowerText = text.toLowerCase();
    
    // Happy emotions
    if (lowerText.includes('happy') || lowerText.includes('great') || 
        lowerText.includes('wonderful') || lowerText.includes('excellent') ||
        lowerText.includes('amazing') || lowerText.includes('fantastic')) {
      return 'happy';
    }
    
    // Sad emotions
    if (lowerText.includes('sad') || lowerText.includes('sorry') || 
        lowerText.includes('unfortunate') || lowerText.includes('disappointed') ||
        lowerText.includes('upset') || lowerText.includes('depressed')) {
      return 'sad';
    }
    
    // Angry emotions
    if (lowerText.includes('angry') || lowerText.includes('frustrated') || 
        lowerText.includes('upset') || lowerText.includes('mad') ||
        lowerText.includes('annoyed') || lowerText.includes('irritated')) {
      return 'angry';
    }
    
    // Fear emotions
    if (lowerText.includes('scared') || lowerText.includes('afraid') || 
        lowerText.includes('fear') || lowerText.includes('terrified') ||
        lowerText.includes('worried') || lowerText.includes('anxious')) {
      return 'fear';
    }
    
    // Surprise emotions
    if (lowerText.includes('surprised') || lowerText.includes('shocked') || 
        lowerText.includes('amazed') || lowerText.includes('astonished') ||
        lowerText.includes('wow') || lowerText.includes('incredible')) {
      return 'surprise';
    }
    
    // Disgust emotions
    if (lowerText.includes('disgusted') || lowerText.includes('gross') || 
        lowerText.includes('nasty') || lowerText.includes('revolting') ||
        lowerText.includes('yuck') || lowerText.includes('awful')) {
      return 'disgust';
    }
    
    return 'neutral';
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setState({
      isListening: false,
      currentEmotion: 'neutral',
      confidence: 0,
      error: null,
      emotions: []
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
      if (emotionEngineRef.current) {
        // TODO: Cleanup emotion engine
        // emotionEngineRef.current.release();
      }
    };
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    reset,
    detectEmotionFromText
  };
}; 