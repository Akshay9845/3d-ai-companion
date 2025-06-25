import { useCallback, useEffect, useRef, useState } from 'react';

interface StreamingSTTConfig {
  endpoint?: string;
  sampleRate?: number;
  vadThreshold?: number;
  vadTimeout?: number;
  language?: string;
}

interface StreamingSTTState {
  transcript: string;
  isListening: boolean;
  error: string | null;
  partialTranscript: string;
}

export const useStreamingSTT = (config: StreamingSTTConfig = {}) => {
  const {
    endpoint = 'ws://localhost:8000/stt',
    sampleRate = 16000,
    vadThreshold = 0.5,
    vadTimeout = 1000,
    language = 'en-US'
  } = config;

  const [state, setState] = useState<StreamingSTTState>({
    transcript: '',
    isListening: false,
    error: null,
    partialTranscript: ''
  });

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const vadRef = useRef<any>(null);
  const vadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize VAD
  useEffect(() => {
    const initVAD = async () => {
      try {
        // TODO: Import and initialize voice-activity-detection library
        // const { VoiceActivityDetection } = await import('voice-activity-detection');
        // vadRef.current = new VoiceActivityDetection({
        //   threshold: vadThreshold,
        //   timeout: vadTimeout
        // });
        console.log('VAD initialized (placeholder)');
      } catch (error) {
        console.warn('VAD initialization failed:', error);
      }
    };

    initVAD();
  }, [vadThreshold, vadTimeout]);

  const connectWebSocket = useCallback(() => {
    try {
      wsRef.current = new WebSocket(endpoint);
      
      wsRef.current.onopen = () => {
        console.log('STT WebSocket connected');
        setState(prev => ({ ...prev, error: null }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'partial') {
            setState(prev => ({ ...prev, partialTranscript: data.text }));
          } else if (data.type === 'final') {
            setState(prev => ({ 
              ...prev, 
              transcript: data.text,
              partialTranscript: ''
            }));
          } else if (data.type === 'error') {
            setState(prev => ({ ...prev, error: data.message }));
          }
        } catch (error) {
          console.error('Failed to parse STT message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('STT WebSocket error:', error);
        setState(prev => ({ ...prev, error: 'WebSocket connection failed' }));
      };

      wsRef.current.onclose = () => {
        console.log('STT WebSocket disconnected');
        setState(prev => ({ ...prev, isListening: false }));
      };
    } catch (error) {
      console.error('Failed to connect STT WebSocket:', error);
      setState(prev => ({ ...prev, error: 'Failed to connect to STT service' }));
    }
  }, [endpoint]);

  const startListening = useCallback(async () => {
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
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0);
          
          // Convert to 16-bit PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }

          // Send audio data to WebSocket
          wsRef.current.send(pcmData.buffer);

          // TODO: VAD processing
          // if (vadRef.current) {
          //   const isVoiceActive = vadRef.current.process(inputData);
          //   if (!isVoiceActive) {
          //     // Auto-stop after VAD timeout
          //     if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
          //     vadTimeoutRef.current = setTimeout(() => {
          //       stopListening();
          //     }, vadTimeout);
          //   }
          // }
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Connect WebSocket and start
      connectWebSocket();
      
      // Send configuration
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'config',
          language,
          sampleRate
        }));
      }

      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null,
        partialTranscript: '',
        transcript: ''
      }));

    } catch (error) {
      console.error('Failed to start listening:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to access microphone' 
      }));
    }
  }, [connectWebSocket, language, sampleRate]);

  const stopListening = useCallback(() => {
    // Clear VAD timeout
    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = null;
    }

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

    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setState({
      transcript: '',
      isListening: false,
      error: null,
      partialTranscript: ''
    });
  }, [stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    reset
  };
}; 