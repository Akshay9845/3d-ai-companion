import { CustomerServiceOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GeminiTTSService } from '../../lib/geminiTTSService';
import { groqService } from '../../lib/groqService';

const { TextArea: AntTextArea } = Input;

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ModernChatInputSimpleProps {
  className?: string;
  onUserInput?: (input: string) => void;
  onLLMResponse?: (response: string) => void;
  isProcessing?: boolean;
}

const ModernChatInputSimple: React.FC<ModernChatInputSimpleProps> = ({ className, onUserInput, onLLMResponse, isProcessing = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatState, setChatState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [groqConnected, setGroqConnected] = useState(false);
  const [groqMockMode, setGroqMockMode] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRecognitionRef = useRef<SpeechRecognition | null>(null);
  const isStartingRecognitionRef = useRef(false);
  const recognitionErrorCount = useRef(0);
  const [geminiTTS] = useState(() => new GeminiTTSService());
  const vadStreamRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await geminiTTS.initialize();
        
        // Initialize Groq service
        await groqService.initialize();
        
        // Refresh API key to pick up environment variables
        groqService.refreshApiKey();
        
        setGroqConnected(true);
        setGroqMockMode(groqService.isMockMode());
        
        console.log('✅ Groq service initialized');
        console.log('🤖 Groq mock mode:', groqService.isMockMode());
        
        if (groqService.isMockMode()) {
          console.log('⚠️ Groq is in mock mode - set API key in settings for real responses');
        } else {
          console.log('✅ Groq is connected with real API');
        }
        
        console.log('✅ All services initialized');
      } catch (error) {
        console.error('❌ Service initialization error:', error);
        setGroqConnected(false);
        setGroqMockMode(true);
      }
    };

    initializeServices();
  }, [geminiTTS]);

  // Function to refresh Groq status
  const refreshGroqStatus = useCallback(() => {
    if (groqService.isReady()) {
      setGroqConnected(true);
      setGroqMockMode(groqService.isMockMode());
      console.log('🔄 Groq status refreshed:', groqService.isMockMode() ? 'Mock Mode' : 'Connected');
    }
  }, []);

  // Listen for storage changes to refresh Groq status when API key is updated
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'GROQ_API_KEY') {
        console.log('🔄 Groq API key updated, refreshing status...');
        setTimeout(refreshGroqStatus, 500); // Small delay to ensure service is updated
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshGroqStatus]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (currentRecognitionRef.current) {
        currentRecognitionRef.current.stop();
        currentRecognitionRef.current = null;
      }
      isSpeakingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (chatState === 'speaking') {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        vadStreamRef.current = stream;
        
        // Custom VAD implementation using Web Audio API
        const audioContext = new AudioContext();
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
        let voiceStopTimeout: NodeJS.Timeout | null = null;
        let isVoiceActive = false;
        
        processor.onaudioprocess = (event) => {
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          
          // VAD threshold (adjust as needed)
          const threshold = 30;
          
          if (average > threshold) {
            // Voice detected
            if (!isVoiceActive) {
              isVoiceActive = true;
              if (voiceStopTimeout) {
                clearTimeout(voiceStopTimeout);
                voiceStopTimeout = null;
              }
              
              // Debounce voice start
              if (voiceStartTimeout) clearTimeout(voiceStartTimeout);
              voiceStartTimeout = setTimeout(() => {
                // User started speaking, interrupt TTS
                if (chatState === 'speaking') {
                  geminiTTS.stopAudio?.();
                  isSpeakingRef.current = false;
                  setChatState('listening');
                  // Start voice recognition
                  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
                    // Will trigger voice recognition start
                    setChatState('listening');
                  }
                }
              }, 200); // 200ms debounce
            }
          } else {
            // No voice detected
            if (isVoiceActive) {
              isVoiceActive = false;
              if (voiceStartTimeout) {
                clearTimeout(voiceStartTimeout);
                voiceStartTimeout = null;
              }
              
              // Debounce voice stop
              if (voiceStopTimeout) clearTimeout(voiceStopTimeout);
              voiceStopTimeout = setTimeout(() => {
                // Voice stopped
              }, 500); // 500ms debounce
            }
          }
        };
        
        // Store cleanup function
        vadStreamRef.current.cleanup = () => {
          if (voiceStartTimeout) clearTimeout(voiceStartTimeout);
          if (voiceStopTimeout) clearTimeout(voiceStopTimeout);
          processor.disconnect();
          analyser.disconnect();
          source.disconnect();
          audioContext.close();
        };
      }).catch((error) => {
        console.warn('VAD initialization failed:', error);
      });
    } else {
      // Cleanup VAD
      if (vadStreamRef.current) {
        if (vadStreamRef.current.cleanup) {
          vadStreamRef.current.cleanup();
        }
        vadStreamRef.current.getTracks().forEach((track: any) => track.stop());
        vadStreamRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (vadStreamRef.current) {
        if (vadStreamRef.current.cleanup) {
          vadStreamRef.current.cleanup();
        }
        vadStreamRef.current.getTracks().forEach((track: any) => track.stop());
        vadStreamRef.current = null;
      }
    };
  }, [chatState]);

  const getAIResponse = async (message: string): Promise<string> => {
    try {
      console.log('🤖 Getting AI response for:', message);
      
      let fullResponse = '';
      let tokenBuffer = '';
      let isFirstToken = true;
      
      // Use streaming for faster response
      const response = await groqService.chatStream(message, (token: string) => {
        fullResponse += token;
        tokenBuffer += token;
        
        // Start TTS on first token for instant response
        if (isFirstToken) {
          isFirstToken = false;
          console.log('🎯 First token received, starting TTS...');
          speakResponse(token); // Start speaking immediately
        } else {
          // Buffer tokens and speak when we have a complete phrase or sentence
          if (tokenBuffer.includes('.') || tokenBuffer.includes('!') || tokenBuffer.includes('?') || tokenBuffer.length > 50) {
            console.log('🎯 Speaking buffered tokens:', tokenBuffer);
            speakResponse(tokenBuffer);
            tokenBuffer = '';
          }
        }
      });
      
      // Speak any remaining buffered tokens
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
    // DISABLED: TTS functionality moved to parent AvatarChatOverlay to prevent duplicate speech
    console.log('🔇 TTS disabled in ModernChatInputSimple - handled by parent component');
    
    // Only set state, no actual TTS
    setChatState('speaking');
    isSpeakingRef.current = true;
    
    // Simulate speaking duration for state management
    setTimeout(() => {
      if (isSpeakingRef.current) {
        setChatState('idle');
        isSpeakingRef.current = false;
      }
    }, 2000); // 2 second simulation
    
    // Original TTS code (disabled):
    // try {
    //   console.log('🔊 Speaking response:', text);
    //   setChatState('speaking');
    //   isSpeakingRef.current = true;
    //   
    //   // Start synchronized speech animation
    //   const { synchronizedSpeechAnimationController } = await import('../../lib/synchronizedSpeechAnimationController');
    //   synchronizedSpeechAnimationController.startSynchronizedSpeech(text, null);
    //   
    //   // Use streaming TTS instead of old speak method to avoid dual voice issues
    //   geminiTTS.startStreamingTTS();
    //   await geminiTTS.addToStreamingTTS(text, 'neutral', 0.5);
    //   await geminiTTS.finishStreamingTTS();
    //   
    //   // Stop synchronized speech animation
    //   synchronizedSpeechAnimationController.onTTSCompleted();
    //   
    //   // Only set to idle if we're still speaking (not interrupted)
    //   if (isSpeakingRef.current) {
    //     setChatState('idle');
    //     isSpeakingRef.current = false;
    //   }
    // } catch (error) {
    //   console.error('❌ TTS error:', error);
    //   setChatState('idle');
    //   isSpeakingRef.current = false;
    //   
    //   // Stop animation on error
    //   try {
    //     const { synchronizedSpeechAnimationController } = await import('../../lib/synchronizedSpeechAnimationController');
    //     synchronizedSpeechAnimationController.onTTSCompleted();
    //   } catch (animError) {
    //     console.error('❌ Animation cleanup error:', animError);
    //   }
    // }
  };

  // Handle voice messages (for voice chat mode)
  const handleSendVoiceMessage = useCallback(async (transcript: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text: transcript, sender: 'user', timestamp: new Date() }]);
    
    // Trigger user input callback for animation
    onUserInput?.(transcript);
    
    setChatState('processing');
    try {
      const aiResponse = await getAIResponse(transcript);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiResponse, sender: 'ai', timestamp: new Date() }]);
      
      // Trigger LLM response callback for animation
      onLLMResponse?.(aiResponse);
      
      setChatState('speaking');
      await speakResponse(aiResponse);
    } catch (error) {
      setVoiceError('Error during voice chat.');
    } finally {
      setChatState('idle');
    }
  }, [getAIResponse, speakResponse, onUserInput, onLLMResponse]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMessage, sender: 'user', timestamp: new Date() }]);
    
    // Trigger user input callback for animation
    onUserInput?.(userMessage);
    
    setInputValue('');
    setChatState('processing');
    try {
      const aiResponse = await getAIResponse(userMessage);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiResponse, sender: 'ai', timestamp: new Date() }]);
      
      // Trigger LLM response callback for animation
      onLLMResponse?.(aiResponse);
      
      setChatState('speaking');
    await speakResponse(aiResponse);
    } catch (error) {
      setVoiceError('Error during chat.');
    } finally {
      setChatState('idle');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start voice chat (continuous listening)
  const startVoiceChat = useCallback(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert('Web Speech API not supported');
      return;
    }
    // Clean up any previous instance
    if (currentRecognitionRef.current) {
      currentRecognitionRef.current.onend = null;
      currentRecognitionRef.current.onerror = null;
      currentRecognitionRef.current.onresult = null;
      currentRecognitionRef.current.stop();
      currentRecognitionRef.current = null;
    }
    if (chatState !== 'idle' && chatState !== 'listening') return;
    if (isStartingRecognitionRef.current) return;
    isStartingRecognitionRef.current = true;
    setVoiceError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setChatState('listening');
      setInterimTranscript('');
      isStartingRecognitionRef.current = false;
      recognitionErrorCount.current = 0;
      setVoiceError(null);
    };
    recognition.onend = () => {
      if (chatState === 'listening') setChatState('idle');
      setInterimTranscript('');
      isStartingRecognitionRef.current = false;
    };
    recognition.onerror = (event) => {
      setInterimTranscript('');
      isStartingRecognitionRef.current = false;
      recognitionErrorCount.current += 1;
      if (recognitionErrorCount.current > 4) {
        setVoiceError('Voice chat encountered repeated errors. Please refresh the page or check your microphone permissions.');
        setChatState('idle');
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
        setChatState('processing');
        handleSendVoiceMessage(transcript.trim());
        recognition.stop();
      }
    };
    currentRecognitionRef.current = recognition;
    recognition.start();
  }, [chatState, handleSendVoiceMessage]);

  // Handle voice chat mode toggle
  const toggleVoiceChat = () => {
    if (chatState === 'listening') {
      setChatState('idle');
      if (currentRecognitionRef.current) {
        currentRecognitionRef.current.stop();
        currentRecognitionRef.current = null;
      }
    } else {
      startVoiceChat();
    }
  };

  // Show interim transcript in chat input if present
  const chatInputValue = interimTranscript || inputValue;

  return (
    <div className={`modern-chat-container ${className || ''}`}>
      {/* Error message for voice chat */}
      {voiceError && (
        <div style={{ color: 'red', textAlign: 'center', margin: '8px 0', fontWeight: 600 }}>
          {voiceError}
        </div>
      )}
      {/* Messages Area - Fixed height with scroll */}
      <div className="chat-messages-area">
        <div className="messages-list">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender}`}>
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Status Bar at Bottom */}
      <div className="voice-chat-status" style={{ position: 'fixed', bottom: 80, left: 0, width: '100%', textAlign: 'center', zIndex: 10 }}>
        <div className={`status-indicator ${chatState}`}>
          {chatState === 'listening' ? '🎤 Listening...' : 
           chatState === 'speaking' ? '🤖 Speaking...' : 
           chatState === 'processing' ? '⚙️ Processing...' : 
           '🎯 Ready'}
        </div>
      </div>

      {/* Groq Connection Status */}
      <div className="groq-status">
        <div className={`groq-indicator ${groqMockMode ? 'mock' : 'connected'}`}>
          {groqMockMode ? '🤖 Mock Mode' : '✅ Groq Connected'}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="chat-input-container">
        <div className="input-row">
          <TextArea
            value={chatInputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={chatState === 'listening' ? (interimTranscript ? '' : 'Speak to chat...') : 'Type a message...'}
            autoSize={{ minRows: 1, maxRows: 3 }}
            disabled={chatState === 'listening'}
            className="chat-input"
          />
          
          <div className="action-buttons">
            {/* Voice Chat Toggle Button */}
            <Tooltip title={chatState === 'listening' ? 'Stop voice chat' : 'Start voice chat'}>
              <Button
                type="primary"
                icon={<CustomerServiceOutlined />}
                onClick={toggleVoiceChat}
                loading={chatState === 'listening'}
                danger={chatState === 'listening'}
                className={`voice-chat-button ${chatState === 'listening' ? 'active' : ''}`}
              />
            </Tooltip>

            {/* Send Button */}
            <Tooltip title="Send message">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || chatState === 'listening'}
                className="send-button"
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernChatInputSimple;