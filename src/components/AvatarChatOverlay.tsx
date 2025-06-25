import { AudioOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import { MessageCircle, Settings, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaWaveSquare } from 'react-icons/fa';
import { SimpleBrowserTTSService } from '../lib/geminiTTSService';
import { groqService } from '../lib/groqService';
import { synchronizedSpeechAnimationController } from '../lib/synchronizedSpeechAnimationController';
import {
    detectEmotionAndEnhance
} from '../lib/textProcessingUtils';
import { CharacterSettings } from '../types/characters';
import ModernChatInputSimple from './Chat/ModernChatInputSimple';

const { TextArea } = Input;

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
  interrupted?: boolean;
}

interface AvatarChatOverlayProps {
  className?: string;
  characterConfig?: CharacterSettings;
  onStateChange?: (state: {
    isSpeaking: boolean;
    isListening: boolean;
    emotion: string;
    currentText: string;
  }) => void;
  onUserInput?: (input: string) => void;
  onLLMResponse?: (response: string) => void;
  isProcessing?: boolean;
}

export const AvatarChatOverlay: React.FC<AvatarChatOverlayProps> = ({ className = '', characterConfig, onStateChange, onUserInput, onLLMResponse, isProcessing = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [currentStreaming, setCurrentStreaming] = useState<AbortController | null>(null);
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [isTypingIndicator, setIsTypingIndicator] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [recognitionLanguage, setRecognitionLanguage] = useState<'te-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'en-US'>('te-IN'); // Default to Telugu
  const [autoLanguageDetection, setAutoLanguageDetection] = useState(true); // Enable auto-detection by default
  const [ttsNotification, setTtsNotification] = useState<string | null>(null);
  const [showTtsHelp, setShowTtsHelp] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [geminiTTS] = useState(() => new SimpleBrowserTTSService());
  const ttsBufferRef = useRef('');
  const ttsStartedRef = useRef(false);
  const ttsQueueRef = useRef<string[]>([]);
  const isTTSProcessingRef = useRef(false);

  // Voice chat loop logic
  const voiceChatLoopRef = useRef(false);

  // Notify parent component of state changes
  const notifyStateChange = useCallback((updates: Partial<{
    isSpeaking: boolean;
    isListening: boolean;
    emotion: string;
    currentText: string;
  }>) => {
    if (onStateChange) {
      onStateChange({
        isSpeaking: isTTSActive,
        isListening: isListening,
        emotion: 'neutral', // TODO: Implement emotion detection
        currentText: ttsBufferRef.current,
        ...updates
      });
    }
  }, [onStateChange, isTTSActive, isListening]);

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
        
        // Safety check: Ensure base idle is always active
        setTimeout(() => {
          if ((window as any).forceEchoBaseIdle) {
            (window as any).forceEchoBaseIdle();
            console.log('🚫 PREVENTING T-POSE: Forced base idle activation in chat overlay');
          }
        }, 1000);
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };
    initializeServices();
  }, [geminiTTS]);

  // Safety check: Monitor base idle every 10 seconds
  useEffect(() => {
    const baseIdleCheckInterval = setInterval(() => {
      // Check if base idle is active
      if ((window as any).getEchoAnimationState) {
        const state = (window as any).getEchoAnimationState();
        const hasActiveAnimations = state.activeAnimations && state.activeAnimations.length > 0;
        
        if (!hasActiveAnimations) {
          console.log('🚨 No active animations detected - forcing base idle');
          if ((window as any).forceEchoBaseIdle) {
            (window as any).forceEchoBaseIdle();
          }
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(baseIdleCheckInterval);
    };
  }, []);

  // Handle scroll fade effect
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const container = messagesContainerRef.current;
      const messages = container.querySelectorAll('.floating-message');
      
      messages.forEach((message, index) => {
        const rect = message.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate distance from bottom of container (messages rise up)
        const distanceFromBottom = containerRect.bottom - rect.bottom;
        const fadeZone = 150; // Pixels from bottom where fade starts
        
        if (distanceFromBottom > fadeZone) {
          const opacity = Math.max(0.1, 1 - (distanceFromBottom - fadeZone) / 200);
          (message as HTMLElement).style.opacity = opacity.toString();
        } else {
          (message as HTMLElement).style.opacity = '1';
        }
      });
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial call and periodic updates
      handleScroll();
      const interval = setInterval(handleScroll, 100);
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        clearInterval(interval);
      };
    }
  }, [messages]);

  // Enhanced TTS Queue processor with natural laugh support and minimal pauses (REMOVED - using streaming TTS instead)
  // const processTTSQueue = useCallback(async () => {
  //   // This function has been removed to prevent duplicate speech issues
  //   // Streaming TTS is used instead
  // }, [geminiTTS, notifyStateChange]);

  // Add text to TTS queue with natural laugh processing (DISABLED - using streaming TTS instead)
  const addToTTSQueue = useCallback((text: string) => {
    // Disabled old TTS queue system to prevent conflicts with streaming TTS
    console.log('⚠️ Old TTS queue system disabled - using streaming TTS instead');
    return;
    
    // Original code (disabled):
    // if (text && text.trim()) {
    //   // Process text for natural speech including laugh normalization
    //   const processedText = processTextForNaturalSpeech(text.trim());
    //   if (processedText) {
    //     ttsQueueRef.current.push(processedText);
    //     processTTSQueue();
    //   }
    // }
  }, []);

  // Stop TTS helper
  const stopTTS = useCallback(() => {
    if (geminiTTS && geminiTTS.stop) {
      geminiTTS.stop();
      // Also stop streaming TTS
      geminiTTS.stopStreamingTTS();
      setIsTTSActive(false);
      ttsStartedRef.current = false;
      ttsBufferRef.current = '';
      ttsQueueRef.current = [];
      isTTSProcessingRef.current = false;
    }
  }, [geminiTTS]);

  // Get AI response with streaming TTS
  const getAIResponse = useCallback(async (message: string, abortSignal: AbortSignal): Promise<string> => {
    try {
      let fullResponse = '';
      let isFirstToken = true;
      let lastSentIndex = 0;
      let processedChunks = new Set<string>(); // Track processed chunks to prevent duplicates
      let hasTtsError = false; // Track if we've had TTS errors
      let synchronizedControllerTriggered = false; // Track if synchronized controller was triggered
      
      console.log('🎭🎭🎭 AI RESPONSE STARTING - PREPARING TALKING ANIMATIONS 🎭🎭🎭');
      console.log('🎭 User asked:', message.substring(0, 50) + '...');
      
      // Start streaming TTS session
      geminiTTS.startStreamingTTS();
      
      // IMMEDIATE TRIGGER: Start talking animation as soon as AI starts responding
      // This ensures talking animation happens for ALL responses, regardless of content
      setTimeout(() => {
        if (!synchronizedControllerTriggered) {
          console.log('🎭🎭🎭 IMMEDIATE TRIGGER: Starting talking animation for ANY response 🎭🎭🎭');
          console.log('🎭 This ensures talking animation for ALL user inputs');
          synchronizedSpeechAnimationController.startSynchronizedSpeech('Starting response...', geminiTTS);
          synchronizedControllerTriggered = true;
        }
      }, 100); // Start talking animation immediately
      
      const response = await groqService.chatStream(message, async (token: string) => {
        fullResponse += token;
        
        if (isFirstToken) {
          isFirstToken = false;
          console.log('🎯 First token received, starting buffering...');
        }
        
        // Look for complete sentences from our last sent position
        const textToCheck = fullResponse.slice(lastSentIndex);
        
        // Find sentence boundaries with more precise regex
        const sentenceMatches = [...textToCheck.matchAll(/[.!?]\s+/g)];
        
        if (sentenceMatches.length > 0) {
          // Get the position of the last complete sentence
          const lastMatch = sentenceMatches[sentenceMatches.length - 1];
          const endPosition = lastMatch.index! + lastMatch[0].length;
          
          // Extract the text up to the last complete sentence
          const textToSend = textToCheck.slice(0, endPosition).trim();
          
          // Only send if we have substantial content (at least 5 words) and haven't processed it before
          const wordCount = textToSend.split(/\s+/).length;
          const chunkHash = textToSend.toLowerCase().replace(/\s+/g, ' ');
          
          if (wordCount >= 5 && !processedChunks.has(chunkHash)) {
            console.log('🎯 Adding chunk to streaming TTS:', textToSend.substring(0, 50) + '...');
            
            // Mark as processed
            processedChunks.add(chunkHash);
            
            // Trigger synchronized controller only once at the beginning
            if (!synchronizedControllerTriggered) {
              console.log('🎭🎭🎭 TRIGGERING SYNCHRONIZED CONTROLLER FOR FIRST CHUNK 🎭🎭🎭');
              console.log('🎭 This should start TALKING ANIMATIONS that change every 5-6 seconds');
              console.log('🎭 Text that will trigger talking:', textToSend.substring(0, 100) + '...');
              synchronizedSpeechAnimationController.startSynchronizedSpeech(textToSend, geminiTTS);
              synchronizedControllerTriggered = true;
            }
            
            // Process and add the content to streaming TTS
            const processed = detectEmotionAndEnhance(textToSend);
            if (processed.cleanedText) {
              console.log('🎤 TTS Text (after processing):', processed.cleanedText);
              try {
                await geminiTTS.addToStreamingTTS(processed.cleanedText, processed.emotionType, processed.emotionIntensity);
              } catch (ttsError) {
                if (!hasTtsError && ttsError instanceof Error && ttsError.message.includes('billing')) {
                  hasTtsError = true;
                  setTtsNotification('Google TTS API requires billing. Using fallback TTS. Click for help.');
                  
                  // Auto-dismiss notification after 10 seconds
                  setTimeout(() => {
                    setTtsNotification(null);
                  }, 10000);
                }
              }
            }
            
            // Update our tracking position
            lastSentIndex += endPosition;
          }
        }
        // Fallback: if we have a lot of text without sentence endings, send it anyway
        else if (textToCheck.length > 200) {
          const wordCount = textToCheck.split(/\s+/).length;
          const chunkHash = textToCheck.toLowerCase().replace(/\s+/g, ' ');
          
          if (wordCount >= 10 && !processedChunks.has(chunkHash)) {
            console.log('🎯 Adding long chunk to streaming TTS:', textToCheck.substring(0, 50) + '...');
            
            // Mark as processed
            processedChunks.add(chunkHash);
            
            // Trigger synchronized controller only once at the beginning
            if (!synchronizedControllerTriggered) {
              console.log('🎭🎭🎭 TRIGGERING SYNCHRONIZED CONTROLLER FOR FIRST CHUNK (fallback) 🎭🎭🎭');
              console.log('🎭 This should start TALKING ANIMATIONS (fallback mode)');
              console.log('🎭 Long text that will trigger talking:', textToCheck.substring(0, 100) + '...');
              synchronizedSpeechAnimationController.startSynchronizedSpeech(textToCheck, geminiTTS);
              synchronizedControllerTriggered = true;
            }
            
            const processed = detectEmotionAndEnhance(textToCheck.trim());
            if (processed.cleanedText) {
              console.log('🎤 TTS Text (fallback chunk):', processed.cleanedText);
              try {
                await geminiTTS.addToStreamingTTS(processed.cleanedText, processed.emotionType, processed.emotionIntensity);
              } catch (ttsError) {
                if (!hasTtsError && ttsError instanceof Error && ttsError.message.includes('billing')) {
                  hasTtsError = true;
                  setTtsNotification('Google TTS API requires billing. Using fallback TTS. Click for help.');
                  
                  // Auto-dismiss notification after 10 seconds
                  setTimeout(() => {
                    setTtsNotification(null);
                  }, 10000);
                }
              }
            }
            
            lastSentIndex = fullResponse.length;
          }
        }
      }, abortSignal);
      
      // Add any remaining content
      const remainingText = fullResponse.slice(lastSentIndex).trim();
      if (remainingText) {
        const chunkHash = remainingText.toLowerCase().replace(/\s+/g, ' ');
        
        if (!processedChunks.has(chunkHash)) {
          console.log('🎯 Adding final chunk to streaming TTS:', remainingText.substring(0, 50) + '...');
          
          // Trigger synchronized controller for final chunk if not triggered yet
          if (!synchronizedControllerTriggered) {
            console.log('🎭🎭🎭 TRIGGERING SYNCHRONIZED CONTROLLER FOR FINAL CHUNK 🎭🎭🎭');
            synchronizedSpeechAnimationController.startSynchronizedSpeech(remainingText, geminiTTS);
            synchronizedControllerTriggered = true;
          }
          
          const processed = detectEmotionAndEnhance(remainingText);
          if (processed.cleanedText) {
            console.log('🎤 TTS Text (final chunk):', processed.cleanedText);
            try {
              await geminiTTS.addToStreamingTTS(processed.cleanedText, processed.emotionType, processed.emotionIntensity);
            } catch (ttsError) {
              if (!hasTtsError && ttsError instanceof Error && ttsError.message.includes('billing')) {
                hasTtsError = true;
                setTtsNotification('Google TTS API requires billing. Using fallback TTS. Click for help.');
                
                // Auto-dismiss notification after 10 seconds
                setTimeout(() => {
                  setTtsNotification(null);
                }, 10000);
              }
            }
          }
        }
      }
      
      // Finish streaming TTS with any remaining content
      await geminiTTS.finishStreamingTTS();
      
      // Final fallback: if synchronized controller was never triggered, trigger it now
      if (!synchronizedControllerTriggered && fullResponse.trim()) {
        console.log('🎭🎭🎭 FINAL FALLBACK: TRIGGERING SYNCHRONIZED CONTROLLER 🎭🎭🎭');
        synchronizedSpeechAnimationController.startSynchronizedSpeech(fullResponse, geminiTTS);
        
        // REMOVED: Duplicate TTS processing - the synchronized controller will handle TTS
        // The streaming TTS is already handled above, no need to duplicate it here
        console.log('🎤 Synchronized controller will handle TTS for final fallback');
      }
      
      console.log('✅ Full AI response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting AI response:', error);
      // Stop streaming TTS on error
      geminiTTS.stopStreamingTTS();
      return 'Sorry, I encountered an error. Please try again.';
    }
  }, [groqService, geminiTTS]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Call onUserInput callback for animation triggering
    onUserInput?.(inputValue.trim());
    
    // Abort previous streaming and TTS
    if (currentStreaming) {
      currentStreaming.abort();
      setCurrentStreaming(null);
    }
    stopTTS();
    // Stop any ongoing streaming TTS
    geminiTTS.stopStreamingTTS();
    // Mark previous assistant message as interrupted
    setMessages(prev => {
      const newMessages = [...prev];
      for (let i = newMessages.length - 1; i >= 0; i--) {
        if (newMessages[i].sender === 'assistant' && newMessages[i].isTyping) {
          newMessages[i].interrupted = true;
          newMessages[i].isTyping = false;
          break;
        }
      }
      return newMessages;
    });
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: '',
      sender: 'assistant',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);
    // Start new streaming with abort controller
    const abortController = new AbortController();
    setCurrentStreaming(abortController);
    setIsTTSActive(false);
    setIsTypingIndicator(true);
    try {
      const aiResponse = await getAIResponse(userMessage.text, abortController.signal);
      
      // Call onLLMResponse callback for animation triggering
      handleLLMResponse(aiResponse);
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.isTyping) {
          lastMessage.text = aiResponse;
          lastMessage.isTyping = false;
        }
        return newMessages;
      });
      setIsTypingIndicator(false);
    } catch (error) {
      setIsTypingIndicator(false);
    } finally {
      setCurrentStreaming(null);
    }
  };

  // Voice recognition with robust error handling and Telugu support
  const startVoiceRecognition = useCallback(() => {
    console.log('[Voice] startVoiceRecognition called');
    try {
      if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        alert('Web Speech API not supported in this browser. Try Chrome.');
        return;
      }
      
      // Stop any existing recognition
      if (currentRecognitionRef.current) {
        currentRecognitionRef.current.stop();
        currentRecognitionRef.current = null;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Support both Telugu and English
      recognition.lang = recognitionLanguage;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        console.log('[Voice] Recognition started with Telugu support');
      };
      
      recognition.onend = () => {
        console.log('[Voice] Recognition ended');
        setIsListening(false);
        notifyStateChange({ isListening: false });
      };
      
      recognition.onerror = (event) => {
        setIsListening(false);
        setInterimTranscript('');
        console.error('[Voice] Recognition error:', event.error);
        // Don't show alert for no-speech errors, just log them
        if (event.error !== 'no-speech') {
          alert('Voice recognition error: ' + event.error);
        }
        // Clear the reference on error
        if (currentRecognitionRef.current === recognition) {
          currentRecognitionRef.current = null;
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
          console.log('[Voice] Got transcript:', transcript.trim());
          
          // Auto-detect language and switch if needed
          const detectedLanguage = detectLanguage(transcript.trim());
          autoSwitchLanguage(detectedLanguage);
          
          setInputValue(transcript.trim());
          setInterimTranscript('');
          recognition.stop();
        }
      };
      
      // Store the reference and start
      currentRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setInterimTranscript('');
      console.error('[Voice] Recognition exception:', err);
      alert('Voice recognition failed: ' + err);
    }
  }, [recognitionLanguage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Voice chat loop logic - COMPLETELY INDEPENDENT from microphone
  const startVoiceChatLoop = useCallback(() => {
    if (isVoiceChatActive) return;
    console.log('[Voice Chat] Starting voice chat loop');
    setIsVoiceChatActive(true);
    voiceChatLoopRef.current = true;
    
    const loop = async () => {
      while (voiceChatLoopRef.current) {
        console.log('[Voice Chat] Loop iteration starting');
        
        // Wait for speech recognition to complete and get input
        const userInput = await new Promise<string>((resolve) => {
          let recognitionCompleted = false;
          let finalTranscript = '';
          let voiceChatRecognition: SpeechRecognition | null = null;
          
          // Create a COMPLETELY SEPARATE recognition instance for voice chat
          if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
            alert('Web Speech API not supported in this browser. Try Chrome.');
            resolve('');
            return;
          }
          
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          voiceChatRecognition = new SpeechRecognition();
          
          // Support both Telugu and English for voice chat
          voiceChatRecognition.lang = recognitionLanguage;
          voiceChatRecognition.continuous = false;
          voiceChatRecognition.interimResults = true;
          voiceChatRecognition.maxAlternatives = 1;
          
          voiceChatRecognition.onstart = () => {
            setIsListening(true);
            setInterimTranscript('');
            console.log('[Voice Chat] Recognition started with Telugu support');
          };
          
          voiceChatRecognition.onend = () => {
            console.log('[Voice Chat] Recognition ended');
            setIsListening(false);
            notifyStateChange({ isListening: false });
            clearTimeout(recognitionTimeout);
            resolve(recognitionCompleted ? finalTranscript : '');
          };
          
          voiceChatRecognition.onerror = (event) => {
            setIsListening(false);
            setInterimTranscript('');
            console.error('[Voice Chat] Recognition error:', event.error);
            if (!recognitionCompleted) {
              resolve(''); // Resolve with empty string on error
            }
          };
          
          voiceChatRecognition.onresult = (event) => {
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
              console.log('[Voice Chat] Got transcript:', transcript.trim());
              finalTranscript = transcript.trim();
              
              // Auto-detect language and switch if needed
              const detectedLanguage = detectLanguage(transcript.trim());
              autoSwitchLanguage(detectedLanguage);
              
              setInterimTranscript('');
              recognitionCompleted = true;
              resolve(transcript.trim());
            }
          };
          
          // Start recognition
          voiceChatRecognition.start();
          setIsListening(true);
          notifyStateChange({ isListening: true });
          
          // Set timeout for recognition
          const recognitionTimeout = setTimeout(() => {
            console.log('[Voice Chat] Recognition timeout');
            voiceChatRecognition.stop();
            setIsListening(false);
            notifyStateChange({ isListening: false });
          }, 10000); // 10 second timeout
        });
        
        if (!voiceChatLoopRef.current) break;
        
        // Check if we got input
        if (userInput) {
          console.log('[Voice Chat] Got input:', userInput);
          
          // Create user message directly without using inputValue state
          const userMessage: ChatMessage = {
            id: Date.now().toString(),
            text: userInput,
            sender: 'user',
            timestamp: new Date()
          };
          
          // Add user message to chat
          setMessages(prev => [...prev, userMessage]);
          
          // Add typing indicator
          const typingMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: '',
            sender: 'assistant',
            timestamp: new Date(),
            isTyping: true
          };
          setMessages(prev => [...prev, typingMessage]);
          
          // Start new streaming with abort controller
          const abortController = new AbortController();
          setCurrentStreaming(abortController);
          setIsTTSActive(false);
          setIsTypingIndicator(true);
          
          try {
            const aiResponse = await getAIResponse(userInput, abortController.signal);
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.isTyping) {
                lastMessage.text = aiResponse;
                lastMessage.isTyping = false;
              }
              return newMessages;
            });
            setIsTypingIndicator(false);
          } catch (error) {
            setIsTypingIndicator(false);
            console.error('[Voice Chat] Error getting AI response:', error);
          } finally {
            setCurrentStreaming(null);
          }
          
          // Wait for TTS to finish before next iteration
          console.log('[Voice Chat] Waiting for TTS to finish');
          while (isTTSActive && voiceChatLoopRef.current) {
            await new Promise((r) => setTimeout(r, 200));
          }
          
          console.log('[Voice Chat] Ready for next iteration');
        } else {
          console.log('[Voice Chat] No input received, continuing loop');
        }
      }
      
      console.log('[Voice Chat] Loop ended');
      setIsVoiceChatActive(false);
    };
    
    loop();
  }, [isVoiceChatActive, isTTSActive, getAIResponse, recognitionLanguage]);

  const stopVoiceChatLoop = useCallback(() => {
    console.log('[Voice Chat] Stopping voice chat loop');
    voiceChatLoopRef.current = false;
    setIsVoiceChatActive(false);
    stopTTS();
    // Don't touch currentRecognitionRef - that's for the mic button only
  }, [stopTTS]);

  // Language detection function
  const detectLanguage = useCallback((text: string): 'te-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'en-US' => {
    if (!text.trim()) return recognitionLanguage;
    
    // Unicode ranges for Indian languages
    const teluguRange = /[\u0C00-\u0C7F]/;      // Telugu
    const hindiRange = /[\u0900-\u097F]/;       // Devanagari (Hindi)
    const kannadaRange = /[\u0C80-\u0CFF]/;     // Kannada
    const tamilRange = /[\u0B80-\u0BFF]/;       // Tamil
    
    // English and common punctuation
    const englishPattern = /^[a-zA-Z\s.,!?;:'"()-]+$/;
    
    // Check for each language
    const hasTelugu = teluguRange.test(text);
    const hasHindi = hindiRange.test(text);
    const hasKannada = kannadaRange.test(text);
    const hasTamil = tamilRange.test(text);
    const isEnglish = englishPattern.test(text.replace(/\s+/g, ''));
    
    // Priority order: Telugu > Hindi > Kannada > Tamil > English
    if (hasTelugu) {
      console.log('[Language Detection] Detected Telugu:', text);
      return 'te-IN';
    } else if (hasHindi) {
      console.log('[Language Detection] Detected Hindi:', text);
      return 'hi-IN';
    } else if (hasKannada) {
      console.log('[Language Detection] Detected Kannada:', text);
      return 'kn-IN';
    } else if (hasTamil) {
      console.log('[Language Detection] Detected Tamil:', text);
      return 'ta-IN';
    } else if (isEnglish) {
      console.log('[Language Detection] Detected English:', text);
      return 'en-US';
    }
    
    // Default to current language if unclear
    return recognitionLanguage;
  }, [recognitionLanguage]);

  // Auto-switch language based on detection
  const autoSwitchLanguage = useCallback((detectedLanguage: 'te-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'en-US') => {
    if (autoLanguageDetection && detectedLanguage !== recognitionLanguage) {
      console.log(`[Language Detection] Auto-switching from ${recognitionLanguage} to ${detectedLanguage}`);
      setRecognitionLanguage(detectedLanguage);
    }
  }, [autoLanguageDetection, recognitionLanguage]);

  // Language toggle button logic
  const cycleLanguage = useCallback(() => {
    const languages = ['te-IN', 'hi-IN', 'kn-IN', 'ta-IN', 'en-US'];
    const currentIndex = languages.indexOf(recognitionLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setRecognitionLanguage(languages[nextIndex] as 'te-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'en-US');
  }, [recognitionLanguage]);

  // Language display function
  const getLanguageDisplay = useCallback((language: 'te-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'en-US'): string => {
    switch (language) {
      case 'te-IN':
        return 'తెలుగు';
      case 'hi-IN':
        return 'हिन्दी';
      case 'kn-IN':
        return 'ಕನ್ನಡ';
      case 'ta-IN':
        return 'தமிழ்';
      case 'en-US':
        return 'English';
      default:
        return language;
    }
  }, []);

  // Language name function for tooltips
  const getLanguageName = useCallback((language: 'te-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'en-US'): string => {
    switch (language) {
      case 'te-IN':
        return 'Telugu';
      case 'hi-IN':
        return 'Hindi';
      case 'kn-IN':
        return 'Kannada';
      case 'ta-IN':
        return 'Tamil';
      case 'en-US':
        return 'English';
      default:
        return language;
    }
  }, []);

  // Animation testing helper
  const testAnimations = [
    { label: "Wave Hello", text: "Hi there!" },
    { label: "Happy", text: "I'm so happy!" },
    { label: "Excited", text: "I'm excited about this!" },
    { label: "Yes/Agree", text: "Yes, I agree completely!" },
    { label: "No/Disagree", text: "No, I don't think so." },
    { label: "Thank You", text: "Thank you so much!" },
    { label: "Clapping", text: "Well done! Bravo!" },
    { label: "Thinking", text: "Hmm, let me think about it..." },
    { label: "Yawn/Tired", text: "I'm so tired, yawn..." },
    { label: "Looking", text: "Let me look at this carefully." }
  ];

  const handleUserInput = (message: string) => {
    onUserInput?.(message);
  };

  const handleLLMResponse = (response: string) => {
    console.log('🎭🎭🎭 AVATAR CHAT OVERLAY: LLM Response received - triggering aggressive animation system 🎭🎭🎭');
    console.log('🎭 Response text:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));
    console.log('🎭 AGGRESSIVE: This will trigger talking animations immediately one after another');
    
    // Call the parent callback to trigger synchronized speech animation
    onLLMResponse?.(response);
    
    console.log('🎭 AGGRESSIVE: LLM response callback completed - synchronized speech should be starting');
  };

  // Debug function to test base layer approach
  const testBaseLayerApproach = useCallback(() => {
    console.log('🧪 Testing base layer approach...');
    
    // Check current animation state
    if ((window as any).getEchoAnimationState) {
      const state = (window as any).getEchoAnimationState();
      console.log('Current animation state:', state);
      
      // Force base idle to ensure it's active
      if ((window as any).forceEchoBaseIdle) {
        (window as any).forceEchoBaseIdle();
        console.log('✅ Base idle forced active');
      }
      
      // Test playing a greeting animation (should be layered on base idle)
      if ((window as any).playEchoAnimation) {
        setTimeout(() => {
          (window as any).playEchoAnimation('waving-gesture', 0.8);
          console.log('✅ Greeting animation layered on base idle');
        }, 1000);
      }
    }
  }, []);

  // Expose test function globally for debugging
  useEffect(() => {
    (window as any).testBaseLayerApproach = testBaseLayerApproach;
    return () => {
      delete (window as any).testBaseLayerApproach;
    };
  }, [testBaseLayerApproach]);

  return (
    <div className={`avatar-chat-overlay ${isOpen ? 'open' : ''}`}>
      {/* Toggle Button */}
      <button 
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>Chat with Echo</h3>
            <div className="chat-controls">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="settings-btn"
                aria-label="Settings"
              >
                <Settings size={20} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="close-btn"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {showSettings && <SettingsDrawer />}
          
          <div className="chat-content">
            <ModernChatInputSimple 
              onUserInput={handleUserInput}
              onLLMResponse={handleLLMResponse}
              isProcessing={isProcessing}
            />
            
            {/* Animation Test Panel */}
            <div className="animation-test-panel">
              <details>
                <summary>🎭 Test Animations</summary>
                <div className="animation-buttons">
                  {testAnimations.map((anim, index) => (
                    <button
                      key={index}
                      className="animation-test-btn"
                      onClick={() => handleLLMResponse(anim.text)}
                      title={`Test: ${anim.text}`}
                    >
                      {anim.label}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* TTS Notification */}
      {ttsNotification && (
        <div className="tts-notification" onClick={() => setShowTtsHelp(true)}>
          <div className="notification-content">
            <span className="notification-icon">⚠️</span>
            <span className="notification-text">{ttsNotification}</span>
            <button className="notification-close" onClick={(e) => {
              e.stopPropagation();
              setTtsNotification(null);
            }}>×</button>
          </div>
        </div>
      )}

      {/* TTS Help Modal */}
      {showTtsHelp && (
        <div className="tts-help-modal" onClick={() => setShowTtsHelp(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔊 Text-to-Speech Setup</h3>
              <button className="modal-close" onClick={() => setShowTtsHelp(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="help-section">
                <h4>Google TTS API Issue</h4>
                <p>Your Google Cloud project needs billing enabled to use the Text-to-Speech API.</p>
                
                <h4>Quick Fix:</h4>
                <ol>
                  <li>Go to <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer">Google Cloud Billing</a></li>
                  <li>Select your project: <strong>#924492423009</strong></li>
                  <li>Click "Link a billing account"</li>
                  <li>Follow the setup process</li>
                </ol>
                
                <h4>Alternative Solutions:</h4>
                <ul>
                  <li><strong>Free TTS:</strong> The app will use browser's built-in speech synthesis as fallback</li>
                  <li><strong>Other APIs:</strong> Consider Coqui TTS, Bark, or other free alternatives</li>
                  <li><strong>Local TTS:</strong> Use local TTS engines like eSpeak or Festival</li>
                </ul>
                
                <div className="current-status">
                  <p><strong>Current Status:</strong> Using fallback TTS (browser speech synthesis)</p>
                  <p><strong>Quality:</strong> Basic but functional</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowTtsHelp(false)}>Got it</button>
              <button className="btn-secondary" onClick={() => setTtsNotification(null)}>Dismiss notification</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Messages Container - positioned below avatar knees */}
      <div 
        ref={messagesContainerRef}
        className="floating-messages-container"
      >
        {messages.slice(-5).map((message, index) => (
          <div
            key={message.id}
            className={`floating-message ${message.sender} ${message.isTyping ? 'typing' : ''} ${message.interrupted ? 'interrupted' : ''}`}
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="message-bubble">
              <div className="message-text">
                {message.text}
                {message.isTyping && (
                  <span className="typing-cursor">|</span>
                )}
                {message.interrupted && (
                  <span className="interrupted-label"> (interrupted)</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {/* Typing indicator */}
        {isTypingIndicator && (
          <div className="floating-message assistant typing-indicator-row">
            <div className="message-bubble">
              <div className="message-text">
                <span className="typing-indicator">...</span>
              </div>
            </div>
          </div>
        )}
        {/* Interim transcript display */}
        {interimTranscript && (
          <div className="floating-message user interim">
            <div className="message-bubble">
              <div className="message-text">
                {interimTranscript}
                <span className="typing-indicator">...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="chat-input-container">
        <div className="input-wrapper">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            disabled={false}
            className="chat-input"
          />
          
          <div className="input-actions">
            {/* Auto-Detection Toggle */}
            <Tooltip title={`${autoLanguageDetection ? 'Disable' : 'Enable'} automatic language detection`}>
              <Button
                onClick={() => setAutoLanguageDetection(!autoLanguageDetection)}
                className={`auto-detection-button ${autoLanguageDetection ? 'active' : ''}`}
                type="text"
                size="small"
              >
                {autoLanguageDetection ? '🔍' : '🔒'}
              </Button>
            </Tooltip>
            
            {/* Language Toggle Button */}
            <Tooltip title={`Switch language (Current: ${getLanguageDisplay(recognitionLanguage)})`}>
              <Button
                onClick={() => cycleLanguage()}
                className="language-toggle-button"
                type="text"
                size="small"
              >
                {getLanguageDisplay(recognitionLanguage)}
              </Button>
            </Tooltip>
            
            {/* Mic button: speech-to-text only - COMPLETELY SEPARATE from voice chat */}
            <Tooltip title={`Transcribe speech to text (${getLanguageName(recognitionLanguage)})`}>
              <Button
                icon={<AudioOutlined />}
                onClick={startVoiceRecognition}
                className={`voice-mic-button ${isListening && !isVoiceChatActive ? 'listening' : ''}`}
                disabled={isVoiceChatActive} // Disable mic when voice chat is active
                type={isListening && !isVoiceChatActive ? 'primary' : 'text'}
              />
            </Tooltip>
            {/* Voice Chat button: full conversation loop - COMPLETELY INDEPENDENT */}
            <Tooltip title={`${isVoiceChatActive ? 'Stop' : 'Start'} Voice Chat (${getLanguageName(recognitionLanguage)} - hands-free conversation)`}>
              <Button
                icon={<FaWaveSquare />}
                onClick={isVoiceChatActive ? stopVoiceChatLoop : startVoiceChatLoop}
                className={`voice-chat-button ${isVoiceChatActive ? 'active' : ''}`}
                type={isVoiceChatActive ? 'primary' : 'default'}
                disabled={isListening && !isVoiceChatActive} // Disable voice chat when mic is listening
              />
            </Tooltip>
            <Button
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isVoiceChatActive} // Disable send when voice chat is active
              type="primary"
              className="send-button"
            />
          </div>
        </div>
      </div>

      <style>{`
        .avatar-chat-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40vh;
          pointer-events: none;
          z-index: 100;
        }

        /* TTS Notification Styles */
        .tts-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(255, 193, 7, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          max-width: 400px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          pointer-events: auto;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        }

        .notification-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notification-icon {
          font-size: 16px;
        }

        .notification-text {
          color: #856404;
          font-size: 14px;
          flex: 1;
        }

        .notification-close {
          background: none;
          border: none;
          color: #856404;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* TTS Help Modal Styles */
        .tts-help-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          pointer-events: auto;
        }

        .modal-content {
          background: rgba(64, 65, 79, 0.95);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          max-width: 600px;
          width: 90vw;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header h3 {
          color: #ececf1;
          margin: 0;
          font-size: 18px;
        }

        .modal-close {
          background: none;
          border: none;
          color: #8e8ea0;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ececf1;
        }

        .modal-body {
          padding: 24px;
        }

        .help-section h4 {
          color: #ececf1;
          margin: 16px 0 8px 0;
          font-size: 16px;
        }

        .help-section p {
          color: #d1d5db;
          margin: 8px 0;
          line-height: 1.5;
        }

        .help-section ol, .help-section ul {
          color: #d1d5db;
          margin: 8px 0;
          padding-left: 20px;
        }

        .help-section li {
          margin: 4px 0;
          line-height: 1.5;
        }

        .help-section a {
          color: #10a37f;
          text-decoration: none;
        }

        .help-section a:hover {
          text-decoration: underline;
        }

        .current-status {
          background: rgba(16, 163, 127, 0.1);
          border: 1px solid rgba(16, 163, 127, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        .current-status p {
          margin: 4px 0;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 20px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-primary, .btn-secondary {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #10a37f;
          color: white;
        }

        .btn-primary:hover {
          background: #0d8f6f;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ececf1;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .floating-messages-container {
          position: absolute;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          max-width: 90vw;
          height: 300px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          pointer-events: none;
          
          /* Hide scrollbar */
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .floating-messages-container::-webkit-scrollbar {
          display: none;
        }

        .floating-message {
          display: flex;
          justify-content: center;
          animation: floatUp 0.6s ease-out;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .floating-message.user {
          justify-content: flex-end;
        }

        .floating-message.assistant {
          justify-content: flex-start;
        }

        .floating-message.interim {
          opacity: 0.7;
        }

        .floating-message.typing {
          animation: pulse 2s infinite;
        }

        .floating-message.interrupted {
          opacity: 0.6;
          filter: grayscale(0.5);
        }

        .message-bubble {
          background: rgba(64, 65, 79, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 12px 16px;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .floating-message.user .message-bubble {
          background: rgba(16, 163, 127, 0.95);
          border-color: rgba(16, 163, 127, 0.3);
        }

        .floating-message.assistant .message-bubble {
          background: rgba(68, 70, 84, 0.95);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .message-text {
          color: #ececf1;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
          white-space: pre-wrap;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .typing-cursor {
          animation: blink 1s infinite;
          color: #10a37f;
        }

        .typing-indicator {
          animation: pulse 1.5s infinite;
          color: #8e8ea0;
        }

        .chat-input-container {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          max-width: 90vw;
          padding: 20px;
          pointer-events: auto;
        }

        .input-wrapper {
          background: rgba(64, 65, 79, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .chat-input {
          flex: 1;
          background: transparent !important;
          border: none !important;
          color: white !important;
          font-size: 14px;
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

        .voice-mic-button {
          margin-right: 4px;
        }

        .voice-chat-button.active {
          background: #10a37f;
          border-color: #10a37f;
          color: white;
        }

        .voice-chat-button {
          margin-right: 4px;
        }

        .send-button {
          background: #10a37f;
          border: none;
          width: 28px;
          height: 28px;
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

        .interrupted-label {
          color: #ff5252;
          font-size: 12px;
          margin-left: 6px;
        }

        .language-toggle-button {
          font-weight: bold;
          color: #10a37f;
          border: 1px solid rgba(16, 163, 127, 0.3);
          background: rgba(16, 163, 127, 0.1);
          margin-right: 8px;
          min-width: 50px;
        }

        .language-toggle-button:hover {
          background: rgba(16, 163, 127, 0.2);
          border-color: #10a37f;
        }

        .auto-detection-button {
          font-size: 16px;
          color: #8e8ea0;
          border: 1px solid rgba(142, 142, 160, 0.3);
          background: rgba(142, 142, 160, 0.1);
          margin-right: 8px;
          min-width: 40px;
          transition: all 0.3s ease;
        }

        .auto-detection-button.active {
          color: #10a37f;
          border-color: #10a37f;
          background: rgba(16, 163, 127, 0.1);
        }

        .auto-detection-button:hover {
          background: rgba(16, 163, 127, 0.2);
          border-color: #10a37f;
        }

        @keyframes floatUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .floating-messages-container {
            width: 95vw;
          }
          
          .chat-input-container {
            width: 95vw;
            padding: 15px;
          }
          
          .message-bubble {
            max-width: 280px;
          }

          .tts-notification {
            right: 10px;
            left: 10px;
            max-width: none;
          }
        }

        .typing-indicator-row .message-bubble {
          background: rgba(68, 70, 84, 0.7);
          color: #8e8ea0;
        }
        .typing-indicator {
          animation: blink 1s infinite;
          color: #8e8ea0;
          font-size: 22px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};