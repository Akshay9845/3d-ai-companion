import { useCallback, useEffect, useRef, useState } from 'react';
import {
    bufferTextForTTS,
    detectEmotionAndEnhance,
    generateLaughSSML,
    generateSSML,
    getEmotionConfig,
    getPredictiveResponse,
    normalizeLaughs,
    processTextForNaturalSpeech,
    shouldWaitForFullResponse
} from './textProcessingUtils';

interface StreamingTTSConfig {
  endpoint?: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  bufferSize?: number;
  enableEmotion?: boolean;
  enableSSML?: boolean;
}

interface StreamingTTSState {
  isPlaying: boolean;
  error: string | null;
  currentText: string;
  progress: number; // 0-100
  emotion: string;
  emotionIntensity: number;
}

export const useStreamingTTS = (config: StreamingTTSConfig = {}) => {
  const {
    endpoint = 'ws://localhost:8000/tts',
    voice = 'default',
    language = 'en-US',
    speed = 1.0,
    pitch = 1.0,
    volume = 1.0,
    bufferSize = 3, // Buffer 3 audio chunks before playing
    enableEmotion = true,
    enableSSML = true
  } = config;

  const [state, setState] = useState<StreamingTTSState>({
    isPlaying: false,
    error: null,
    currentText: '',
    progress: 0,
    emotion: 'neutral',
    emotionIntensity: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const textBufferRef = useRef<string>('');
  const isProcessingRef = useRef(false);
  const emotionConfigRef = useRef(getEmotionConfig('neutral'));

  const connectWebSocket = useCallback(() => {
    try {
      wsRef.current = new WebSocket(endpoint);
      
      wsRef.current.onopen = () => {
        console.log('TTS WebSocket connected');
        setState(prev => ({ ...prev, error: null }));
      };

      wsRef.current.onmessage = async (event) => {
        try {
          if (event.data instanceof Blob) {
            // Handle audio data
            const arrayBuffer = await event.data.arrayBuffer();
            const audioBuffer = await audioContextRef.current?.decodeAudioData(arrayBuffer);
            
            if (audioBuffer) {
              audioQueueRef.current.push(audioBuffer);
              
              // Start playing when we have enough buffered chunks
              if (audioQueueRef.current.length >= bufferSize && !isPlayingRef.current) {
                playNextAudioChunk();
              }
            }
          } else {
            // Handle JSON messages
            const data = JSON.parse(event.data);
            
            if (data.type === 'progress') {
              setState(prev => ({ ...prev, progress: data.progress }));
            } else if (data.type === 'complete') {
              setState(prev => ({ 
                ...prev, 
                isPlaying: false, 
                progress: 100,
                currentText: '',
                emotion: 'neutral',
                emotionIntensity: 0
              }));
              isProcessingRef.current = false;
            } else if (data.type === 'error') {
              setState(prev => ({ ...prev, error: data.message }));
              isProcessingRef.current = false;
            }
          }
        } catch (error) {
          console.error('Failed to process TTS message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('TTS WebSocket error:', error);
        setState(prev => ({ ...prev, error: 'WebSocket connection failed' }));
      };

      wsRef.current.onclose = () => {
        console.log('TTS WebSocket disconnected');
        setState(prev => ({ ...prev, isPlaying: false }));
      };
    } catch (error) {
      console.error('Failed to connect TTS WebSocket:', error);
      setState(prev => ({ ...prev, error: 'Failed to connect to TTS service' }));
    }
  }, [endpoint, bufferSize]);

  const playNextAudioChunk = useCallback(() => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0 || isPlayingRef.current) {
      return;
    }

    const audioBuffer = audioQueueRef.current.shift();
    if (!audioBuffer) return;

    isPlayingRef.current = true;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create gain node for volume control
    const gainNode = audioContextRef.current.createGain();
    const emotionConfig = emotionConfigRef.current;
    gainNode.gain.value = volume * emotionConfig.voiceModulation.volume;
    
    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    currentSourceRef.current = source;
    
    source.onended = () => {
      isPlayingRef.current = false;
      currentSourceRef.current = null;
      
      // Add small pause between chunks for smoother transitions
      setTimeout(() => {
        playNextAudioChunk(); // Play next chunk if available
      }, 50); // 50ms pause between chunks
    };
    
    source.start();
  }, [volume]);

  // Immediate predictive response for instant TTS start
  const startPredictiveResponse = useCallback(async (userInput: string) => {
    try {
      const predictiveText = getPredictiveResponse(userInput);
      if (predictiveText) {
        console.log('[TTS] Starting predictive response:', predictiveText);
        
        // Process predictive text for natural speech
        const processedText = processTextForNaturalSpeech(predictiveText);
        
        // Start TTS immediately with predictive response
        await play(processedText, {
          enableNaturalLaughs: true,
          continuousMode: true,
          predictiveMode: true // Mark as predictive response
        });
        
        return true; // Indicates predictive response was started
      }
      return false;
    } catch (error) {
      console.error('Failed to start predictive response:', error);
      return false;
    }
  }, [play]);

  const play = useCallback(async (text: string, options: {
    voice?: string;
    language?: string;
    speed?: number;
    pitch?: number;
    volume?: number;
    emotion?: string;
    waitForComplete?: boolean;
    enableNaturalLaughs?: boolean;
    continuousMode?: boolean;
    predictiveMode?: boolean;
  } = {}) => {
    try {
      // Stop any current playback only if not in continuous mode or predictive mode
      if (!options.continuousMode && !options.predictiveMode) {
        stop();
      }
      
      // Wait for full response if requested (but not for predictive responses)
      if (options.waitForComplete && !shouldWaitForFullResponse(text) && !options.predictiveMode) {
        console.log('Waiting for complete response before TTS...');
        return;
      }
      
      // Process text for natural speech and emotion
      let processedText = text;
      let emotion = options.emotion || 'neutral';
      let emotionIntensity = 0.5;
      
      if (enableEmotion) {
        // Use enhanced emotion detection with laugh normalization
        const processed = detectEmotionAndEnhance(text);
        processedText = processed.cleanedText;
        emotion = processed.hasEmotion ? processed.emotionType : emotion;
        emotionIntensity = processed.emotionIntensity;
        
        // Update emotion config
        emotionConfigRef.current = getEmotionConfig(emotion, emotionIntensity);
      } else {
        // Just clean the text with natural laugh processing
        processedText = processTextForNaturalSpeech(text);
      }
      
      // Enable natural laugh processing by default
      const enableNaturalLaughs = options.enableNaturalLaughs !== false;
      if (enableNaturalLaughs) {
        // Normalize laughs for natural pronunciation
        processedText = normalizeLaughs(processedText);
        console.log('[TTS] Normalized laughs for natural speech:', processedText);
      }
      
      if (!processedText.trim()) {
        console.log('No text to speak after processing');
        return;
      }
      
      // Optimized buffering for continuous conversation
      const textChunks = bufferTextForTTS(processedText, 200);
      
      // Initialize audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Connect WebSocket
      connectWebSocket();
      
      // Wait for connection
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        await new Promise<void>((resolve, reject) => {
          if (!wsRef.current) return reject(new Error('WebSocket not initialized'));
          
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
          
          wsRef.current!.onopen = () => {
            clearTimeout(timeout);
            resolve();
          };
          
          wsRef.current!.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Connection failed'));
          };
        });
      }
      
      // Send TTS request
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        isProcessingRef.current = true;
        
        // Apply emotion-based voice modulation
        const emotionConfig = emotionConfigRef.current;
        const finalSpeed = (options.speed || speed) * emotionConfig.voiceModulation.rate;
        const finalPitch = (options.pitch || pitch) * emotionConfig.voiceModulation.pitch;
        const finalVolume = (options.volume || volume) * emotionConfig.voiceModulation.volume;
        
        // Generate SSML with natural laugh support
        let finalText = processedText;
        if (enableSSML) {
          if (emotion === 'laughter' || /Haha!|Hehe!/i.test(processedText)) {
            // Use special laugh SSML for more expressive laughter
            finalText = generateLaughSSML(processedText);
            console.log('[TTS] Using laugh SSML:', finalText);
          } else if (emotion !== 'neutral') {
            // Use regular emotion SSML
            finalText = generateSSML(processedText, emotion, emotionIntensity);
          }
        }
        
        wsRef.current.send(JSON.stringify({
          type: 'synthesize',
          text: finalText,
          voice: options.voice || voice,
          language: options.language || language,
          speed: finalSpeed,
          pitch: finalPitch,
          volume: finalVolume,
          emotion: emotion,
          emotionIntensity: emotionIntensity,
          useSSML: enableSSML && (emotion !== 'neutral' || /Haha!|Hehe!/i.test(processedText)),
          enableNaturalLaughs: enableNaturalLaughs,
          continuousMode: options.continuousMode || false,
          predictiveMode: options.predictiveMode || false
        }));
        
        setState(prev => ({ 
          ...prev, 
          isPlaying: true, 
          currentText: processedText,
          progress: 0,
          error: null,
          emotion: emotion,
          emotionIntensity: emotionIntensity
        }));
      }
      
    } catch (error) {
      console.error('Failed to start TTS playback:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start TTS' 
      }));
      isProcessingRef.current = false;
    }
  }, [connectWebSocket, voice, language, speed, pitch, volume, enableEmotion, enableSSML]);

  const stop = useCallback(() => {
    // Stop current audio source
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (error) {
        // Ignore errors when stopping already stopped source
      }
      currentSourceRef.current = null;
    }
    
    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    isProcessingRef.current = false;
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      progress: 0,
      currentText: '',
      emotion: 'neutral',
      emotionIntensity: 0
    }));
  }, []);

  const pause = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (error) {
        // Ignore errors
      }
      currentSourceRef.current = null;
    }
    isPlayingRef.current = false;
    
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const resume = useCallback(() => {
    if (audioQueueRef.current.length > 0 && !isPlayingRef.current) {
      playNextAudioChunk();
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [playNextAudioChunk]);

  const reset = useCallback(() => {
    stop();
    setState({
      isPlaying: false,
      error: null,
      currentText: '',
      progress: 0,
      emotion: 'neutral',
      emotionIntensity: 0
    });
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return {
    ...state,
    play,
    startPredictiveResponse,
    stop,
    pause,
    resume,
    reset
  };
}; 