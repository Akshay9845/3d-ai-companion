import { AudioOutlined, CustomerServiceOutlined, SettingOutlined } from '@ant-design/icons';
import { Badge, Button, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GeminiTTSService } from '../lib/geminiTTSService';
import { groqService } from '../lib/groqService';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  language?: 'en' | 'te';
  emotion?: string;
}

interface AvatarVoiceInterfaceProps {
  className?: string;
  onAvatarSpeak?: (text: string, emotion: string) => void;
  onAvatarListen?: (isListening: boolean) => void;
  onAvatarThink?: (isThinking: boolean) => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export const AvatarVoiceInterface: React.FC<AvatarVoiceInterfaceProps> = ({
  className = '',
  onAvatarSpeak,
  onAvatarListen,
  onAvatarThink
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRecognitionRef = useRef<SpeechRecognition | null>(null);
  const isStartingRecognitionRef = useRef(false);
  const recognitionErrorCount = useRef(0);
  const [geminiTTS] = useState(() => new GeminiTTSService());
  const vadStreamRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await geminiTTS.initialize();
        await groqService.initialize();
        groqService.refreshApiKey();
        setIsConnected(!groqService.isMockMode());
        console.log('✅ Avatar Voice Interface initialized');
      } catch (error) {
        console.error('❌ Service initialization error:', error);
        setError('Failed to initialize services');
      }
    };

    initializeServices();
  }, [geminiTTS]);

  // VAD for interruption
  useEffect(() => {
    if (voiceState === 'speaking') {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        vadStreamRef.current = stream;
        
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        source.connect(analyser);
        analyser.connect(processor);
        processor.connect(audioContext.destination);
        
        let voiceStartTimeout: NodeJS.Timeout | null = null;
        let isVoiceActive = false;
        
        processor.onaudioprocess = (event) => {
          analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const threshold = 30;
          
          if (average > threshold) {
            if (!isVoiceActive) {
              isVoiceActive = true;
              if (voiceStartTimeout) clearTimeout(voiceStartTimeout);
              voiceStartTimeout = setTimeout(() => {
                if (voiceState === 'speaking') {
                  geminiTTS.stopAudio?.();
                  isSpeakingRef.current = false;
                  setVoiceState('listening');
                  onAvatarListen?.(true);
                  startVoiceRecognition();
                }
              }, 200);
            }
          } else {
            isVoiceActive = false;
            if (voiceStartTimeout) {
              clearTimeout(voiceStartTimeout);
              voiceStartTimeout = null;
            }
          }
        };
        
        vadStreamRef.current.cleanup = () => {
          if (voiceStartTimeout) clearTimeout(voiceStartTimeout);
          processor.disconnect();
          analyser.disconnect();
          source.disconnect();
          audioContext.close();
        };
      }).catch((error) => {
        console.warn('VAD initialization failed:', error);
      });
    } else {
      if (vadStreamRef.current) {
        if (vadStreamRef.current.cleanup) {
          vadStreamRef.current.cleanup();
        }
        vadStreamRef.current.getTracks().forEach((track: any) => track.stop());
        vadStreamRef.current = null;
      }
    }
    
    return () => {
      if (vadStreamRef.current) {
        if (vadStreamRef.current.cleanup) {
          vadStreamRef.current.cleanup();
        }
        vadStreamRef.current.getTracks().forEach((track: any) => track.stop());
        vadStreamRef.current = null;
      }
    };
  }, [voiceState, geminiTTS, onAvatarListen]);

  const detectLanguage = (text: string): 'en' | 'te' => {
    // Simple Telugu detection - check for Telugu characters
    const teluguPattern = /[\u0C00-\u0C7F]/;
    return teluguPattern.test(text) ? 'te' : 'en';
  };

  const detectEmotion = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('wonderful')) {
      return 'happy';
    } else if (lowerText.includes('sad') || lowerText.includes('sorry') || lowerText.includes('unfortunate')) {
      return 'sad';
    } else if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('upset')) {
      return 'angry';
    }
    return 'neutral';
  };

  const getAIResponse = async (message: string): Promise<string> => {
    try {
      console.log('🤖 Getting AI response for:', message);
      
      let fullResponse = '';
      let tokenBuffer = '';
      let isFirstToken = true;
      
      const response = await groqService.chatStream(message, (token: string) => {
        fullResponse += token;
        tokenBuffer += token;
        
        if (isFirstToken) {
          isFirstToken = false;
          console.log('🎯 First token received, starting TTS...');
          speakResponse(token);
        } else {
          if (tokenBuffer.includes('.') || tokenBuffer.includes('!') || tokenBuffer.includes('?') || tokenBuffer.length > 50) {
            console.log('🎯 Speaking buffered tokens:', tokenBuffer);
            speakResponse(tokenBuffer);
            tokenBuffer = '';
          }
        }
      });
      
      if (tokenBuffer.trim()) {
        console.log('🎯 Speaking final buffered tokens:', tokenBuffer);
        speakResponse(tokenBuffer);
      }
      
      console.log('✅ Full AI response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting AI response:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  };

  const speakResponse = async (text: string) => {
    try {
      console.log('🔊 Speaking response:', text);
      setVoiceState('speaking');
      isSpeakingRef.current = true;
      onAvatarSpeak?.(text, currentEmotion);
      
      // Start synchronized speech animation
      const { synchronizedSpeechAnimationController } = await import('../lib/synchronizedSpeechAnimationController');
      synchronizedSpeechAnimationController.startSynchronizedSpeech(text, null);
      
      // Use streaming TTS instead of old speak method to avoid dual voice issues
      geminiTTS.startStreamingTTS();
      await geminiTTS.addToStreamingTTS(text, currentEmotion, 0.5);
      await geminiTTS.finishStreamingTTS();
      
      // Stop synchronized speech animation
      synchronizedSpeechAnimationController.onTTSCompleted();
      
      if (isSpeakingRef.current) {
        setVoiceState('idle');
        isSpeakingRef.current = false;
        onAvatarSpeak?.('', 'neutral');
      }
    } catch (error) {
      console.error('❌ TTS error:', error);
      setVoiceState('idle');
      isSpeakingRef.current = false;
      onAvatarSpeak?.('', 'neutral');
      
      // Stop animation on error
      try {
        const { synchronizedSpeechAnimationController } = await import('../lib/synchronizedSpeechAnimationController');
        synchronizedSpeechAnimationController.onTTSCompleted();
      } catch (animError) {
        console.error('❌ Animation cleanup error:', animError);
      }
    }
  };

  const handleSendVoiceMessage = useCallback(async (transcript: string) => {
    const language = detectLanguage(transcript);
    const emotion = detectEmotion(transcript);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: transcript,
      sender: 'user',
      timestamp: new Date(),
      language,
      emotion
    };

    setMessages(prev => [...prev, userMessage]);
    setVoiceState('processing');
    onAvatarThink?.(true);
    
    try {
      const aiResponse = await getAIResponse(transcript);
      const aiEmotion = detectEmotion(aiResponse);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        language: detectLanguage(aiResponse),
        emotion: aiEmotion
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentEmotion(aiEmotion);
      setVoiceState('speaking');
      onAvatarThink?.(false);
      await speakResponse(aiResponse);
    } catch (error) {
      setError('Error during voice chat.');
      setVoiceState('idle');
      onAvatarThink?.(false);
    }
  }, [getAIResponse, speakResponse, onAvatarThink]);

  const startVoiceRecognition = useCallback(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert('Web Speech API not supported');
      return;
    }
    
    if (currentRecognitionRef.current) {
      currentRecognitionRef.current.onend = null;
      currentRecognitionRef.current.onerror = null;
      currentRecognitionRef.current.onresult = null;
      currentRecognitionRef.current.stop();
      currentRecognitionRef.current = null;
    }
    
    if (voiceState !== 'idle' && voiceState !== 'listening') return;
    if (isStartingRecognitionRef.current) return;
    
    isStartingRecognitionRef.current = true;
    setError(null);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setVoiceState('listening');
      setInterimTranscript('');
      isStartingRecognitionRef.current = false;
      recognitionErrorCount.current = 0;
      setError(null);
      onAvatarListen?.(true);
    };
    
    recognition.onend = () => {
      if (voiceState === 'listening') setVoiceState('idle');
      setInterimTranscript('');
      isStartingRecognitionRef.current = false;
      onAvatarListen?.(false);
    };
    
    recognition.onerror = (event) => {
      setInterimTranscript('');
      isStartingRecognitionRef.current = false;
      recognitionErrorCount.current += 1;
      if (recognitionErrorCount.current > 4) {
        setError('Voice chat encountered repeated errors. Please refresh the page or check your microphone permissions.');
        setVoiceState('idle');
        onAvatarListen?.(false);
        return;
      }
    };
    
    recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinal = true;
        }
      }
      setInterimTranscript(transcript);
      if (isFinal && transcript.trim()) {
        setInterimTranscript('');
        setVoiceState('processing');
        onAvatarListen?.(false);
        handleSendVoiceMessage(transcript.trim());
        recognition.stop();
      }
    };
    
    currentRecognitionRef.current = recognition;
    recognition.start();
  }, [voiceState, handleSendVoiceMessage, onAvatarListen]);

  const toggleVoiceChat = () => {
    if (voiceState === 'listening') {
      setVoiceState('idle');
      onAvatarListen?.(false);
      if (currentRecognitionRef.current) {
        currentRecognitionRef.current.stop();
        currentRecognitionRef.current = null;
      }
    } else {
      startVoiceRecognition();
    }
  };

  const getStateIcon = () => {
    switch (voiceState) {
      case 'listening':
        return <AudioOutlined className="pulse-animation" />;
      case 'processing':
        return <div className="thinking-spinner" />;
      case 'speaking':
        return <div className="speaking-waveform" />;
      case 'error':
        return <div className="error-icon">⚠️</div>;
      default:
        return <CustomerServiceOutlined />;
    }
  };

  const getStateText = () => {
    switch (voiceState) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRecognitionRef.current) {
        currentRecognitionRef.current.stop();
        currentRecognitionRef.current = null;
      }
      isSpeakingRef.current = false;
    };
  }, []);

  return (
    <div className={`avatar-voice-interface ${className}`}>
      {/* 3D Avatar Area */}
      <div className="avatar-container">
        <div className="avatar-placeholder">
          <div className="avatar-glow" />
          <div className="avatar-status">
            {currentEmotion !== 'neutral' && (
              <span className="emotion-indicator">{currentEmotion}</span>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Overlay */}
      <div className="conversation-overlay">
        <div className="messages-container">
          {messages.slice(-3).map((message) => (
            <div
              key={message.id}
              className={`message-bubble ${message.sender} ${message.language || 'en'}`}
            >
              <div className="message-avatar">
                {message.sender === 'user' ? '🧍' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-meta">
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.emotion && message.emotion !== 'neutral' && (
                    <span className="message-emotion">{message.emotion}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Interim transcript */}
          {interimTranscript && (
            <div className="message-bubble user interim">
              <div className="message-avatar">🧍</div>
              <div className="message-content">
                <div className="message-text">
                  {interimTranscript}
                  <span className="typing-indicator">...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Status Control Bar */}
      <div className="voice-control-bar">
        <div className="control-left">
          <Tooltip title={voiceState === 'listening' ? 'Stop listening' : 'Start voice chat'}>
            <Button
              type="primary"
              icon={getStateIcon()}
              onClick={toggleVoiceChat}
              loading={voiceState === 'listening'}
              danger={voiceState === 'listening'}
              className={`voice-button ${voiceState === 'listening' ? 'active' : ''}`}
              size="large"
            />
          </Tooltip>
          
          <div className="state-indicator">
            <span className="state-text">{getStateText()}</span>
          </div>
        </div>

        <div className="control-right">
          <Badge 
            status={isConnected ? 'success' : 'error'} 
            text={isConnected ? 'Connected' : 'Disconnected'}
            className="connection-badge"
          />
          
          <Tooltip title="Settings">
            <Button
              icon={<SettingOutlined />}
              className="settings-button"
              size="large"
            />
          </Tooltip>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-overlay">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
            <Button 
              size="small" 
              onClick={() => setError(null)}
              className="error-close"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        .avatar-voice-interface {
          position: relative;
          width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .avatar-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 70%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .avatar-placeholder {
          position: relative;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(100, 150, 255, 0.1) 0%, rgba(50, 100, 200, 0.05) 100%);
          border: 2px solid rgba(100, 150, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          color: rgba(100, 150, 255, 0.8);
        }

        .avatar-glow {
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(100, 150, 255, 0.2) 0%, transparent 70%);
          animation: glow-pulse 3s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        .avatar-status {
          position: absolute;
          top: 20px;
          right: 20px;
        }

        .emotion-indicator {
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          color: #ffd700;
          backdrop-filter: blur(10px);
        }

        .conversation-overlay {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 400px;
          max-height: 60%;
          z-index: 10;
        }

        .messages-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 100%;
          overflow-y: auto;
          padding: 16px;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .message-bubble {
          display: flex;
          gap: 8px;
          animation: slide-in 0.3s ease-out;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .message-bubble.user {
          animation-delay: 0.1s;
        }

        .message-bubble.ai {
          animation-delay: 0.2s;
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .message-avatar {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .message-text {
          color: white;
          font-size: 0.9rem;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .message-bubble.te .message-text {
          font-family: 'Noto Sans Telugu', sans-serif;
        }

        .message-meta {
          display: flex;
          gap: 8px;
          margin-top: 4px;
          font-size: 0.7rem;
          opacity: 0.7;
        }

        .message-time {
          color: rgba(255, 255, 255, 0.6);
        }

        .message-emotion {
          color: #ffd700;
        }

        .interim {
          opacity: 0.7;
        }

        .typing-indicator {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .voice-control-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 10;
        }

        .control-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .voice-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          border: none;
          box-shadow: 0 4px 20px rgba(79, 172, 254, 0.3);
          transition: all 0.3s ease;
        }

        .voice-button.active {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          box-shadow: 0 4px 20px rgba(250, 112, 154, 0.3);
        }

        .voice-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(79, 172, 254, 0.4);
        }

        .state-indicator {
          color: white;
          font-weight: 500;
        }

        .control-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .connection-badge {
          color: white;
        }

        .settings-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
        }

        .pulse-animation {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .thinking-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .speaking-waveform {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 20px;
        }

        .speaking-waveform::before,
        .speaking-waveform::after {
          content: '';
          width: 3px;
          height: 100%;
          background: white;
          border-radius: 2px;
          animation: waveform 0.6s ease-in-out infinite;
        }

        .speaking-waveform::after {
          animation-delay: 0.3s;
        }

        @keyframes waveform {
          0%, 100% { height: 20px; }
          50% { height: 8px; }
        }

        .error-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 20;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 12px;
          color: #ff6b6b;
          backdrop-filter: blur(10px);
        }

        .error-icon {
          font-size: 1.2rem;
        }

        .error-close {
          background: none;
          border: none;
          color: #ff6b6b;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .conversation-overlay {
            width: calc(100% - 40px);
            right: 20px;
            left: 20px;
          }
          
          .voice-control-bar {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  );
}; 