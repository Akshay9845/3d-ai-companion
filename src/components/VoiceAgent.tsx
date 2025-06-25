import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStreamingSTT } from '../lib/useStreamingSTT';
import { useStreamingTTS } from '../lib/useStreamingTTS';
import { useStore } from '../store/useStore';

interface VoiceAgentProps {
  onMessageAdd?: (message: { role: 'user' | 'assistant'; content: string }) => void;
  onStateChange?: (state: ChatState) => void;
  className?: string;
}

type ChatState = 'idle' | 'listening' | 'processing' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  onMessageAdd,
  onStateChange,
  className = ''
}) => {
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInterrupted, setIsInterrupted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get LLM service from store
  const { selectedLLMService } = useStore();
  
  // Initialize streaming hooks
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
        setChatState('idle');
      }
    }
  }, [stt.isListening, stt.transcript, chatState]);

  // Handle TTS state changes
  useEffect(() => {
    if (tts.isPlaying && chatState !== 'speaking') {
      setChatState('speaking');
    } else if (!tts.isPlaying && chatState === 'speaking') {
      setChatState('idle');
      setIsInterrupted(false);
    }
  }, [tts.isPlaying, chatState]);

  // Handle errors
  useEffect(() => {
    const currentError = stt.error || tts.error;
    if (currentError && currentError !== error) {
      setError(currentError);
      setChatState('idle');
    }
  }, [stt.error, tts.error, error]);

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
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    onMessageAdd?.(userMessage);
    setChatState('processing');

    try {
      // Call LLM service
      const response = await callLLMService(content);
      
      if (response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        onMessageAdd?.(assistantMessage);

        // Start TTS
        await tts.play(response, {
          emotion: detectEmotion(response) // TODO: Implement emotion detection
        });
      }
    } catch (error) {
      console.error('LLM processing failed:', error);
      setError('Failed to process message');
      setChatState('idle');
    }
  }, [onMessageAdd, tts]);

  const callLLMService = useCallback(async (message: string): Promise<string> => {
    // TODO: Implement actual LLM service calls based on selectedLLMService
    // For now, return a placeholder response
    return new Promise((resolve) => {
      processingTimeoutRef.current = setTimeout(() => {
        resolve(`I understand you said: "${message}". This is a placeholder response from the ${selectedLLMService || 'default'} LLM service.`);
      }, 1000);
    });
  }, [selectedLLMService]);

  const detectEmotion = useCallback((text: string): string => {
    // TODO: Implement emotion detection using openSMILE/pyAudioAnalysis
    // For now, simple keyword-based detection
    const lowerText = text.toLowerCase();
    if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('wonderful')) {
      return 'happy';
    } else if (lowerText.includes('sad') || lowerText.includes('sorry') || lowerText.includes('unfortunate')) {
      return 'sad';
    } else if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('upset')) {
      return 'angry';
    }
    return 'neutral';
  }, []);

  const startListening = useCallback(() => {
    if (chatState === 'idle') {
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
      setChatState('idle');
    }
  }, [chatState, tts]);

  const reset = useCallback(() => {
    stt.reset();
    tts.reset();
    setChatState('idle');
    setError(null);
    setIsInterrupted(false);
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, [stt, tts]);

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

  return (
    <div className={`voice-agent ${className}`}>
      {/* Messages Display */}
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
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
        </div>

        <div className="control-buttons">
          {chatState === 'idle' && (
            <button
              onClick={startListening}
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
          <span>LLM: {selectedLLMService || 'Default'}</span>
        </div>
      </div>

      <style jsx>{`
        .voice-agent {
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

        .typing-indicator {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .message-timestamp {
          font-size: 0.75rem;
          opacity: 0.7;
          margin-top: 4px;
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
        }

        .control-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
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
        }
      `}</style>
    </div>
  );
}; 