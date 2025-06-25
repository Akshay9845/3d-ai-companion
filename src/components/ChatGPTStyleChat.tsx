import { CustomerServiceOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GeminiTTSService } from '../lib/geminiTTSService';
import { groqService } from '../lib/groqService';

const { TextArea } = Input;

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatGPTStyleChatProps {
  className?: string;
}

export const ChatGPTStyleChat: React.FC<ChatGPTStyleChatProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [geminiTTS] = useState(() => new GeminiTTSService());

  // Auto-scroll to bottom
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
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };
    initializeServices();
  }, [geminiTTS]);

  // Handle scroll fade effect
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const container = messagesContainerRef.current;
      const messages = container.querySelectorAll('.chat-message');
      
      messages.forEach((message, index) => {
        const rect = message.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate distance from top of container
        const distanceFromTop = rect.top - containerRect.top;
        const fadeZone = 100; // Pixels from top where fade starts
        
        if (distanceFromTop < fadeZone) {
          const opacity = Math.max(0.1, distanceFromTop / fadeZone);
          (message as HTMLElement).style.opacity = opacity.toString();
        } else {
          (message as HTMLElement).style.opacity = '1';
        }
      });
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial call
      handleScroll();
      
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages]);

  const getAIResponse = async (message: string): Promise<string> => {
    try {
      let fullResponse = '';
      
      const response = await groqService.chatStream(message, (token: string) => {
        fullResponse += token;
        
        // Update the typing message in real-time
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.isTyping) {
            lastMessage.text = fullResponse;
          }
          return newMessages;
        });
      });
      
      return response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: '',
      sender: 'assistant',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prev => [...prev, typingMessage]);

    try {
      const aiResponse = await getAIResponse(userMessage.text);
      
      // Replace typing message with final response
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.isTyping) {
          lastMessage.text = aiResponse;
          lastMessage.isTyping = false;
        }
        return newMessages;
      });

      // Speak the response
      geminiTTS.startStreamingTTS();
      await geminiTTS.addToStreamingTTS(aiResponse, 'neutral', 0.5);
      await geminiTTS.finishStreamingTTS();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceRecognition = useCallback(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert('Web Speech API not supported');
      return;
    }

    if (currentRecognitionRef.current) {
      currentRecognitionRef.current.stop();
      currentRecognitionRef.current = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
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
        setInputValue(transcript.trim());
        setInterimTranscript('');
        recognition.stop();
      }
    };

    currentRecognitionRef.current = recognition;
    recognition.start();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`chatgpt-style-chat ${className}`}>
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="messages-container"
      >
        <div className="fade-overlay-top" />
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.sender}`}
          >
            <div className="message-avatar">
              {message.sender === 'user' ? (
                <div className="user-avatar">You</div>
              ) : (
                <div className="assistant-avatar">🤖</div>
              )}
            </div>
            
            <div className="message-content">
              <div className="message-text">
                {message.text}
                {message.isTyping && (
                  <span className="typing-cursor">|</span>
                )}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {/* Interim transcript display */}
        {interimTranscript && (
          <div className="chat-message user interim">
            <div className="message-avatar">
              <div className="user-avatar">You</div>
            </div>
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

      {/* Input Area */}
      <div className="input-container">
        <div className="input-wrapper">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={isLoading}
            className="chat-input"
          />
          
          <div className="input-actions">
            <Button
              icon={<CustomerServiceOutlined />}
              onClick={startVoiceRecognition}
              className={`voice-button ${isListening ? 'listening' : ''}`}
              disabled={isLoading}
              type={isListening ? 'primary' : 'text'}
            />
            
            <Button
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              type="primary"
              className="send-button"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .chatgpt-style-chat {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          background: #212121;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          position: relative;
          scroll-behavior: smooth;
        }

        .fade-overlay-top {
          position: sticky;
          top: 0;
          height: 60px;
          background: linear-gradient(to bottom, #212121 0%, transparent 100%);
          z-index: 10;
          pointer-events: none;
        }

        .chat-message {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          padding: 0 8px;
          transition: opacity 0.3s ease;
        }

        .chat-message.interim {
          opacity: 0.7;
        }

        .message-avatar {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .user-avatar {
          background: #10a37f;
          color: white;
        }

        .assistant-avatar {
          background: #444654;
          color: white;
          font-size: 16px;
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .message-text {
          color: #ececf1;
          font-size: 16px;
          line-height: 1.6;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .message-time {
          font-size: 12px;
          color: #8e8ea0;
          margin-top: 8px;
        }

        .typing-cursor {
          animation: blink 1s infinite;
          color: #10a37f;
        }

        .typing-indicator {
          animation: pulse 1.5s infinite;
          color: #8e8ea0;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .input-container {
          padding: 20px;
          background: #212121;
          border-top: 1px solid #444654;
        }

        .input-wrapper {
          position: relative;
          background: #40414f;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          border: 1px solid #565869;
        }

        .chat-input {
          flex: 1;
          background: transparent !important;
          border: none !important;
          color: white !important;
          font-size: 16px;
          resize: none;
          outline: none;
          box-shadow: none !important;
        }

        .chat-input::placeholder {
          color: #8e8ea0;
        }

        .input-actions {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .voice-button {
          border: none;
          background: transparent;
          color: #8e8ea0;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .voice-button:hover {
          background: #565869;
          color: white;
        }

        .voice-button.listening {
          color: #10a37f;
          background: rgba(16, 163, 127, 0.1);
        }

        .send-button {
          background: #10a37f;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .send-button:hover {
          background: #0d8f6f;
        }

        .send-button:disabled {
          background: #565869;
          color: #8e8ea0;
        }

        /* Custom scrollbar */
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #565869;
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #6f7081;
        }

        @media (max-width: 768px) {
          .chatgpt-style-chat {
            height: 100vh;
          }
          
          .messages-container {
            padding: 16px;
          }
          
          .input-container {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}; 