import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    cleanTextForTTS,
    detectEmotionAndEnhance,
    processTextForNaturalSpeech
} from '../lib/textProcessingUtils';
import { useEmotionDetection } from '../lib/useEmotionDetection';
import { useStreamingSTT } from '../lib/useStreamingSTT';
import { useStreamingTTS } from '../lib/useStreamingTTS';
import { useWakeWord } from '../lib/useWakeWord';
import { useStore } from '../store/useStore';

interface EnhancedVoiceAgentProps {
  onMessageAdd?: (message: { role: 'user' | 'assistant'; content: string }) => void;
  onStateChange?: (state: ChatState) => void;
  onEmotionChange?: (emotion: string) => void;
  className?: string;
}

type ChatState = 'idle' | 'wake-word-listening' | 'listening' | 'processing' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: string;
}

export const EnhancedVoiceAgent: React.FC<EnhancedVoiceAgentProps> = ({
  onMessageAdd,
  onStateChange,
  onEmotionChange,
  className = ''
}) => {
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get LLM service from store
  const { selectedLLMService } = useStore();
  
  // Initialize all hooks
  const stt = useStreamingSTT({
    endpoint: 'ws://localhost:8000/stt',
    language: 'en-US', // TODO: Support Telugu/English code-switching
    vadTimeout: 1500
  });
  
  const tts = useStreamingTTS({
    endpoint: 'ws://localhost:8000/tts',
    voice: 'default',
    language: 'en-US'
  });

  const wakeWord = useWakeWord({
    keyword: 'hey echo',
    sensitivity: 0.5,
    autoStart: wakeWordEnabled
  });

  const emotionDetection = useEmotionDetection({
    endpoint: 'ws://localhost:8000/emotion',
    autoStart: false
  });

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle state changes
  useEffect(() => {
    onStateChange?.(chatState);
  }, [chatState, onStateChange]);

  // Handle emotion changes
  useEffect(() => {
    const emotion = emotionDetection.currentEmotion;
    if (emotion !== currentEmotion) {
      setCurrentEmotion(emotion);
      onEmotionChange?.(emotion);
    }
  }, [emotionDetection.currentEmotion, currentEmotion, onEmotionChange]);

  // Handle wake word detection
  useEffect(() => {
    if (wakeWord.isDetected && wakeWordEnabled) {
      console.log('Wake word detected! Starting conversation...');
      setChatState('listening');
      stt.startListening();
      wakeWord.reset(); // Reset wake word detection
    }
  }, [wakeWord.isDetected, wakeWordEnabled, stt, wakeWord]);

  // Handle STT state changes
  useEffect(() => {
    if (stt.isListening && chatState !== 'listening') {
      setChatState('listening');
      setError(null);
    } else if (!stt.isListening && chatState === 'listening') {
      // STT stopped, check if we have a transcript
      if (stt.transcript.trim()) {
        handleUserMessage(stt.transcript);
      } else {
        setChatState(wakeWordEnabled ? 'wake-word-listening' : 'idle');
      }
    }
  }, [stt.isListening, stt.transcript, chatState, wakeWordEnabled]);

  // Handle TTS state changes
  useEffect(() => {
    if (tts.isPlaying && chatState !== 'speaking') {
      setChatState('speaking');
    } else if (!tts.isPlaying && chatState === 'speaking') {
      setChatState(wakeWordEnabled ? 'wake-word-listening' : 'idle');
      setIsInterrupted(false);
    }
  }, [tts.isPlaying, chatState, wakeWordEnabled]);

  // Handle errors
  useEffect(() => {
    const currentError = stt.error || tts.error || wakeWord.error || emotionDetection.error;
    if (currentError && currentError !== error) {
      setError(currentError);
      setChatState(wakeWordEnabled ? 'wake-word-listening' : 'idle');
    }
  }, [stt.error, tts.error, wakeWord.error, emotionDetection.error, error, wakeWordEnabled]);

  // Handle VAD-based interruption
  useEffect(() => {
    if (stt.isListening && tts.isPlaying) {
      // User started speaking while AI is talking - interrupt TTS
      tts.stop();
      setIsInterrupted(true);
      setChatState('listening');
    }
  }, [stt.isListening, tts.isPlaying, tts]);

  const handleUserMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      emotion: emotionDetection.currentEmotion
    };

    setMessages(prev => [...prev, userMessage]);
    onMessageAdd?.(userMessage);
    setChatState('processing');

    try {
      // Call LLM service with emotion context
      const response = await callLLMService(content, emotionDetection.currentEmotion);
      
      if (response) {
        // Enhanced emotion detection and text processing
        const processed = detectEmotionAndEnhance(response);
        const detectedEmotion = processed.hasEmotion ? processed.emotionType : emotionDetection.detectEmotionFromText(response);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          emotion: detectedEmotion
        };

        setMessages(prev => [...prev, assistantMessage]);
        onMessageAdd?.(assistantMessage);

        // Start TTS with enhanced emotion support and text cleaning
        await tts.play(response, {
          emotion: detectedEmotion,
          waitForComplete: true // Wait for full response before TTS
        });
      }
    } catch (error) {
      console.error('LLM processing failed:', error);
      setError('Failed to process message');
      setChatState(wakeWordEnabled ? 'wake-word-listening' : 'idle');
    }
  }, [onMessageAdd, tts, emotionDetection, wakeWordEnabled]);

  const callLLMService = useCallback(async (message: string, userEmotion: string): Promise<string> => {
    // Enhanced LLM service call with emotion context
    return new Promise((resolve) => {
      processingTimeoutRef.current = setTimeout(() => {
        // Generate more natural responses based on emotion
        let response = '';
        const cleanMessage = cleanTextForTTS(message);
        
        if (userEmotion === 'happy') {
          response = `That's wonderful! I'm so glad to hear that. "${cleanMessage}" sounds really exciting and I'm happy for you! 😊`;
        } else if (userEmotion === 'sad') {
          response = `I understand how you feel. "${cleanMessage}" must be really difficult, and I want you to know that it's okay to feel this way. I'm here to listen and support you.`;
        } else if (userEmotion === 'angry') {
          response = `I can see that you're frustrated about "${cleanMessage}". That's completely understandable, and your feelings are valid. Let's work through this together.`;
        } else {
          response = `I understand you said: "${cleanMessage}". This is a response from the ${selectedLLMService || 'default'} LLM service with enhanced emotion awareness.`;
        }
        
        resolve(response);
      }, 1000);
    });
  }, [selectedLLMService]);

  const startListening = useCallback(() => {
    if (chatState === 'idle' || chatState === 'wake-word-listening') {
      setError(null);
      setIsInterrupted(false);
      stt.startListening();
    }
  }, [chatState, stt]);

  const stopListening = useCallback(() => {
    if (chatState === 'listening') {
      stt.stopListening();
    }
  }, [chatState, stt]);

  const interrupt = useCallback(() => {
    if (chatState === 'speaking') {
      tts.stop();
      setIsInterrupted(true);
      setChatState(wakeWordEnabled ? 'wake-word-listening' : 'idle');
    }
  }, [chatState, tts, wakeWordEnabled]);

  const toggleWakeWord = useCallback(() => {
    setWakeWordEnabled(prev => !prev);
    if (wakeWordEnabled) {
      wakeWord.stopListening();
      setChatState('idle');
    } else {
      wakeWord.startListening();
      setChatState('wake-word-listening');
    }
  }, [wakeWordEnabled, wakeWord]);

  const reset = useCallback(() => {
    stt.reset();
    tts.reset();
    wakeWord.reset();
    emotionDetection.reset();
    setChatState(wakeWordEnabled ? 'wake-word-listening' : 'idle');
    setError(null);
    setIsInterrupted(false);
    setCurrentEmotion('neutral');
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, [stt, tts, wakeWord, emotionDetection, wakeWordEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const getStateIcon = () => {
    switch (chatState) {
      case 'wake-word-listening':
        return '👂';
      case 'listening':
        return '🎤';
      case 'processing':
        return '⚙️';
      case 'speaking':
        return '🔊';
      default:
        return '🎯';
    }
  };

  const getStateText = () => {
    switch (chatState) {
      case 'wake-word-listening':
        return `Listening for "${wakeWord.keyword}"...`;
      case 'listening':
        return isInterrupted ? 'Interrupted - Listening...' : 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Ready';
    }
  };

  // Enhanced TTS processing with minimal pauses
  const processTTS = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    try {
      console.log('🔊 Processing TTS:', text);
      setIsInterrupted(true);
      
      // Process text for natural speech including laugh normalization
      const processedText = processTextForNaturalSpeech(text);
      if (processedText) {
        // Use continuous mode for smoother conversation flow
        await tts.play(processedText, {
          emotion: currentEmotion,
          waitForComplete: true,
          continuousMode: true // Enable continuous mode
        });
      }
      
      // Minimal pause after speaking (reduced from longer pauses)
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error('TTS error:', error);
      setError('Failed to process message');
      setChatState(wakeWordEnabled ? 'wake-word-listening' : 'idle');
    } finally {
      setIsInterrupted(false);
    }
  }, [tts, currentEmotion, wakeWordEnabled]);

  // Enhanced voice chat loop with predictive responses and continuous flow
  const startVoiceChat = useCallback(async () => {
    if (chatState === 'idle' || chatState === 'wake-word-listening') {
      setError(null);
      setIsInterrupted(false);
      stt.startListening();
    }
  }, [chatState, stt]);

  return (
    <div className={`enhanced-voice-agent ${className}`}>
      {/* Messages Display */}
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-meta">
              <span className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </span>
              {message.emotion && (
                <span className="message-emotion">
                  {message.emotion} {getEmotionIcon(message.emotion)}
                </span>
              )}
            </div>
          </div>
        ))}
        
        {/* Partial transcript display */}
        {stt.partialTranscript && (
          <div className="message user-message partial">
            <div className="message-content">
              {stt.partialTranscript}
              <span className="typing-indicator">...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Control Panel */}
      <div className="control-panel">
        <div className="state-indicator">
          <span className="state-icon">{getStateIcon()}</span>
          <span className="state-text">{getStateText()}</span>
          {currentEmotion !== 'neutral' && (
            <span className="emotion-indicator">
              {currentEmotion} {getEmotionIcon(currentEmotion)}
            </span>
          )}
        </div>

        <div className="control-buttons">
          {(chatState === 'idle' || chatState === 'wake-word-listening') && (
            <button
              onClick={startVoiceChat}
              className="control-btn start-btn"
              disabled={stt.error !== null}
            >
              Start Listening
            </button>
          )}

          {chatState === 'listening' && (
            <button
              onClick={stopListening}
              className="control-btn stop-btn"
            >
              Stop Listening
            </button>
          )}

          {chatState === 'speaking' && (
            <button
              onClick={interrupt}
              className="control-btn interrupt-btn"
            >
              Interrupt
            </button>
          )}

          <button
            onClick={toggleWakeWord}
            className={`control-btn toggle-btn ${wakeWordEnabled ? 'enabled' : 'disabled'}`}
          >
            {wakeWordEnabled ? 'Disable' : 'Enable'} Wake Word
          </button>

          <button
            onClick={reset}
            className="control-btn reset-btn"
          >
            Reset
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Status Bar */}
        <div className="status-bar">
          <span>STT: {stt.isListening ? 'Active' : 'Inactive'}</span>
          <span>TTS: {tts.isPlaying ? 'Playing' : 'Stopped'}</span>
          <span>Wake: {wakeWord.isListening ? 'Listening' : 'Off'}</span>
          <span>Emotion: {currentEmotion}</span>
          <span>LLM: {selectedLLMService || 'Default'}</span>
        </div>
      </div>

      <style jsx>{`
        .enhanced-voice-agent {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 800px;
          margin: 0 auto;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 12px;
          overflow: hidden;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          padding: 12px 16px;
          border-radius: 12px;
          max-width: 80%;
          word-wrap: break-word;
        }

        .user-message {
          align-self: flex-end;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .assistant-message {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .partial {
          opacity: 0.7;
          border: 1px dashed rgba(255, 255, 255, 0.3);
        }

        .message-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .message-emotion {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .typing-indicator {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .control-panel {
          padding: 20px;
          background: rgba(0, 0, 0, 0.9);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .state-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .state-icon {
          font-size: 1.2rem;
        }

        .state-text {
          color: white;
          font-weight: 500;
          flex: 1;
        }

        .emotion-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #ffd700;
          font-size: 0.9rem;
        }

        .control-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .control-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-btn {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        .stop-btn {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          color: white;
        }

        .interrupt-btn {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
        }

        .toggle-btn.enabled {
          background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
          color: white;
        }

        .toggle-btn.disabled {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .reset-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .control-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 8px;
          color: #ff6b6b;
          margin-bottom: 16px;
        }

        .error-icon {
          font-size: 1.1rem;
        }

        .status-bar {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};

// Helper function to get emotion icons
const getEmotionIcon = (emotion: string): string => {
  switch (emotion) {
    case 'happy':
      return '😊';
    case 'sad':
      return '😢';
    case 'angry':
      return '😠';
    case 'fear':
      return '😨';
    case 'surprise':
      return '😲';
    case 'disgust':
      return '🤢';
    default:
      return '😐';
  }
}; 