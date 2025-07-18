import { AudioOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import { MessageCircle, Settings, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaWaveSquare } from 'react-icons/fa';
import { animationService } from '../lib/animationService';
import { assistantKnowledgeBase } from '../lib/assistantKnowledgeBase';
import { constantIdleAnimationController } from '../lib/constantIdleAnimationController';
import { enhancedGoogleTTSService } from '../lib/enhancedGoogleTTSService';
import { groqService } from '../lib/groqService';
import { visionIntegratedChatService } from '../lib/visionIntegratedChat';
import { CharacterSettings } from '../types/characters';

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
  onLLMResponse?: (response: string) => Promise<string>;
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
  const [geminiTTS] = useState(() => enhancedGoogleTTSService);
  const ttsBufferRef = useRef('');
  const ttsStartedRef = useRef(false);
  const ttsQueueRef = useRef<string[]>([]);
  const isTTSProcessingRef = useRef(false);

  // Voice chat loop logic
  const voiceChatLoopRef = useRef(false);

  // Demo UI state
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [demoResponse, setDemoResponse] = useState<string>('');
  const capabilities = assistantKnowledgeBase.getAllCapabilities();
  const categories = [...new Set(capabilities.map(cap => cap.category))];
  const animationCategories = animationService.getAllCategories();

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
        // Initialize Google TTS with environment API key
        const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyB-6aBzVSQo9pWXDKBKyxA1towrHqdYN2g';
        console.log('🔑 Using Google API Key:', googleApiKey.substring(0, 10) + '...');
        await geminiTTS.initialize(googleApiKey);
        
        // Check if Google TTS is available and notify user
        if (!geminiTTS.isGoogleTTSAvailable()) {
          console.log('🔄 Google TTS unavailable - using browser TTS with Indian voice selection');
          setTtsNotification('Using browser TTS with Indian voice (Google TTS requires billing)');
        } else {
          console.log('✅ Google TTS available - using high-quality Indian voice');
        }
        
        await groqService.initialize();
        groqService.refreshApiKey();
        
        // Set up animation service callback to connect with EchoModel
        animationService.setAnimationChangeCallback((animationPath: string, config?: any) => {
          console.log('🎭 Animation service callback triggered:', animationPath);
          if ((window as any).playEchoAnimation) {
            const animationName = animationPath.split('/').pop()?.replace('.glb', '') || 'happy-idle';
            
            // FIXED: Use the proper name mapping from animation service
            const nameMapping: Record<string, string> = {
              // Dance animations - CRITICAL FIX
              'Salsa Dancing': 'salsa-dancing',
              'Gangnam Style ': 'gangnam-style', // Note: has space in filename
              'Moonwalk ': 'moonwalk', // Note: has space in filename  
              'Locking Hip Hop Dance': 'locking-hip-hop-dance',
              'Jump': 'jump',
              
              // Exercise animations
              'Warming Up': 'warming-up',
              'Push Up': 'push-up',
              'Plank': 'plank',
              'End Plank': 'end-plank',
              'Air Squat': 'air-squat',
              'Idle To Push Up': 'idle-to-push-up',
              'Idle To Situp': 'idle-to-situp',
              
              // Fighting animations
              'Fighting Idle': 'fighting-idle',
              'Fight Idle': 'fight-idle',
              'Fight Idle (1)': 'fight-idle-1',
              'Fight Idle (2)': 'fight-idle-2',
              'Fight Idle (3)': 'fight-idle-3',
              'angry gesture': 'angry-gesture',
              'being cocky': 'being-cocky',
              'dismissing gesture': 'dismissing-gesture',
              'Defeat': 'defeat',
              
              // Gesture animations
              'Waving-2': 'waving-2',
              'Waving-3': 'waving-3',
              'Waving-4': 'waving-4',
              'Waving Gesture-3': 'waving-gesture-3',
              'Standing Greeting': 'standing-greeting',
              'Quick Formal Bow': 'quick-formal-bow',
              'Quick Informal Bow': 'quick-informal-bow',
              'Clapping': 'clapping',
              'Reacting': 'reacting',
              'weight shift': 'weight-shift',
              
              // Talking animations
              'Talking': 'talking',
              'Talking-2': 'talking-2',
              'Talking-3': 'talking-3',
              'Talking-4': 'talking-4',
              'Head Nod Yes': 'head-nod-yes',
              'shaking head no': 'shaking-head-no',
              'No': 'no',
              'look away gesture': 'look-away-gesture',
              'sarcastic head nod': 'sarcastic-head-nod',
              'annoyed head shake': 'annoyed-head-shake',
              
              // Other animations
              'Happy': 'happy',
              'Excited': 'excited',
              'Happy Walk': 'happy-walk',
              'acknowledging': 'acknowledging',
              'happy hand gesture': 'happy-hand-gesture',
              'Looking': 'looking',
              'lengthy head nod': 'lengthy-head-nod',
              'Hard Head Nod': 'hard-head-nod',
              'relieved sigh': 'relieved-sigh',
              'thoughtful head shake': 'thoughtful-head-shake',
              'Yawn': 'yawn',
              'Sitting Idle': 'sitting-idle',
              'Male Sitting Pose': 'male-sitting-pose',
              'Male Sitting Pose-2': 'male-sitting-pose-2',
              'Neutral Idle': 'neutral-idle',
              'Sad Idle': 'sad-idle'
            };
            
            const mappedName = nameMapping[animationName] || animationName.toLowerCase().replace(/\s+/g, '-');
            const crossFade = config?.crossFade || 0.8;
            
            console.log('🎭 FIXED: Animation name mapping:', `"${animationName}" → "${mappedName}"`);
            console.log('🎭 Calling playEchoAnimation:', mappedName, crossFade);
            (window as any).playEchoAnimation(mappedName, crossFade);
          } else {
            console.warn('🎭 playEchoAnimation not available on window');
          }
        });
        console.log('✅ Animation service callback set up');
        
        // Initialize constant idle animation controller to prevent T-pose
        console.log('🛡️ INITIALIZING CONSTANT IDLE SYSTEM - T-POSE PREVENTION');
        constantIdleAnimationController.initialize();
        console.log('✅ Constant idle system activated - T-pose prevention ready');
        
        // Initialize overlapping animation controller for ultimate T-pose prevention
        console.log('🛡️ INITIALIZING OVERLAPPING ANIMATION SYSTEM - NO GAPS = NO T-POSE');
        const { overlappingAnimationController } = await import('../lib/overlappingAnimationController');
        overlappingAnimationController.forceContinuousCoverage();
        console.log('✅ Overlapping animation system activated - continuous coverage guaranteed');
        
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
    let lastIdleForceTime = 0;
    const baseIdleCheckInterval = setInterval(() => {
      // Check if base idle is active (reduced frequency to prevent loops)
      if ((window as any).getEchoAnimationState) {
        const state = (window as any).getEchoAnimationState();
        const hasActiveAnimations = state.activeAnimations && state.activeAnimations.length > 0;
        const now = Date.now();
        
        // Only force idle if no animations and hasn't been forced recently
        if (!hasActiveAnimations && (now - lastIdleForceTime) > 25000) {
          console.log('🚨 No active animations detected - forcing base idle');
          if ((window as any).forceEchoBaseIdle) {
            (window as any).forceEchoBaseIdle();
            lastIdleForceTime = now;
          }
        }
      }
    }, 30000); // Check every 30 seconds (reduced frequency)

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
      console.log('🎭🎭🎭 AI RESPONSE STARTING - Using Enhanced Chat Integration 🎭🎭🎭');
      console.log('🎭 User asked:', message.substring(0, 50) + '...');
      
      // Use enhanced chat integration service for capability-aware responses
      const { enhancedChatIntegrationService } = await import('../lib/enhancedChatIntegrationService');
      const chatResponse = await enhancedChatIntegrationService.processUserInput(message);
      
      console.log('🎭 Enhanced response:', chatResponse.text.substring(0, 100) + '...');
      
      // Trigger animation if present - BUT WAIT for TTS to start
      if (chatResponse.animation) {
        console.log('🎭 CAPABILITY: Animation detected, will trigger when TTS starts');
        // Store animation info to trigger when TTS starts
        const animationInfo = {
          name: chatResponse.animation.animation,
          timeScale: chatResponse.animation.timeScale || 0.5,
          crossFade: chatResponse.animation.crossFade || 0.8
        };
        
        // Don't trigger animation yet - wait for TTS to start
        console.log('🎭 CAPABILITY: Animation queued:', animationInfo);
      }
      
      // REMOVED TTS from getAIResponse to prevent duplicate speech
      // TTS is handled by handleLLMResponse to avoid duplicates
      console.log('🔇 TTS removed from getAIResponse - handled by handleLLMResponse only');
      
      console.log('✅ Enhanced AI response completed');
      return chatResponse.text;
      
    } catch (error) {
      console.error('❌ Enhanced chat integration failed:', error);
      // Fallback to capability-aware response
      const fallbackResponse = "I'm Echo, your 3D AI assistant! I can dance, exercise, fight, teach, and much more! What would you like me to demonstrate?";
      
      // REMOVED TTS from fallback to prevent duplicate speech
      console.log('🔇 Fallback TTS removed - handled by handleLLMResponse only');
      
      return fallbackResponse;
    }
  }, [geminiTTS, setTtsNotification]);

  // Handle voice input with TTS enabled
  const handleVoiceInput = async (transcript: string) => {
    console.log('🎤 Processing voice input with TTS enabled:', transcript);
    
    // Call onUserInput callback for animation triggering
    onUserInput?.(transcript);
    
    // Abort previous streaming and TTS
    if (currentStreaming) {
      currentStreaming.abort();
      setCurrentStreaming(null);
    }
    stopTTS();
    // Stop any ongoing streaming TTS
    geminiTTS.stopStreamingTTS();
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: transcript,
      sender: 'user',
      timestamp: new Date()
    };
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
      // FIXED: Only call handleLLMResponse, it handles everything including messages
      const response = await handleLLMResponse(transcript, true);
      
      // FIXED: handleLLMResponse already adds messages, just update typing indicator
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.isTyping) {
          lastMessage.text = '';
          lastMessage.isTyping = false;
        }
        return newMessages;
      });
      setIsTypingIndicator(false);
      
      console.log('🎤 Voice input processed with single response path');
      
    } catch (error) {
      setIsTypingIndicator(false);
    } finally {
      setCurrentStreaming(null);
    }
  };

  // Send message handler - TEXT INPUT ONLY (NO TTS to save tokens)
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    console.log('🎭🎭🎭 AVATAR CHAT OVERLAY: handleSendMessage called 🎭🎭🎭');
    console.log('🎭 Input value:', inputValue);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    console.log('🎭 Adding user message to chat:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    
    try {
      console.log('🎭 About to call handleLLMResponse with:', currentInput);
      const response = await handleLLMResponse(currentInput, false); // false = text input
      console.log('🎭 handleLLMResponse completed successfully');
      
      // FIXED: handleLLMResponse already adds the assistant message, don't add it again
    } catch (error) {
      console.error('🎭 Error in handleSendMessage:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        text: "Sorry, I'm having trouble responding right now. Please try again!",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
          
          // FIXED: Don't set inputValue to prevent duplicate processing
          // setInputValue(transcript.trim()); // REMOVED - this was causing duplicates
          setInterimTranscript('');
          recognition.stop();
          
          // Process voice input with TTS enabled - this handles the message
          handleVoiceInput(transcript.trim());
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
            
            if (isFinal && transcript.trim()) {
              console.log('[Voice Chat] Got transcript:', transcript.trim());
              
              // Auto-detect language and switch if needed
              const detectedLanguage = detectLanguage(transcript.trim());
              autoSwitchLanguage(detectedLanguage);
              
              // FIXED: Don't call handleVoiceInput here - it causes duplicates
              // Just resolve with the transcript for voice chat loop to handle
              
              // Stop this recognition instance
              voiceChatRecognition.stop();
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
            // FIXED: handleLLMResponse handles everything including adding messages
            const response = await handleLLMResponse(userInput, true);
            
            // FIXED: handleLLMResponse already adds messages, just clear typing indicator
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.isTyping) {
                lastMessage.text = '';
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

  const handleLLMResponse = async (userInput: string, isVoiceInput: boolean = false): Promise<string> => {
    console.log('🎭🎭🎭 AVATAR CHAT OVERLAY: Processing user input with capability awareness 🎭🎭🎭');
    console.log('🎭 User input:', userInput.substring(0, 100) + (userInput.length > 100 ? '...' : ''));
    console.log('🎭 Input type:', isVoiceInput ? 'VOICE' : 'TEXT');
    
    try {
      // Check if this is a vision-related query
      const isVisionQuery = visionIntegratedChatService.detectVisionQuery(userInput);
      
      // If it's a vision query, analyze the camera to get fresh data
      if (isVisionQuery && (window as any).analyzeCamera) {
        console.log('👁️ Vision query detected, analyzing camera for fresh data...');
        try {
          await (window as any).analyzeCamera();
          console.log('👁️ Fresh camera analysis completed for vision query');
        } catch (error) {
          console.error('👁️ Camera analysis error:', error);
        }
      }
      
      // The vision service will handle context integration
      const enhancedInput = userInput;
      
      // ALWAYS use enhanced chat integration service for capability awareness
      const { enhancedChatIntegrationService } = await import('../lib/enhancedChatIntegrationService');
      console.log('🎭 About to call enhancedChatIntegrationService.processUserInput...');
      const chatResponse = await enhancedChatIntegrationService.processUserInput(enhancedInput);
      
      console.log('🎭 AI Response:', chatResponse);
      console.log('🎭 Response text:', chatResponse.text);
      console.log('🎭 Has animation:', !!chatResponse.animation);
      
      // Enhance response with vision context if available
      const visionEnhancedResponse = visionIntegratedChatService.generateVisionEnhancedPrompt(
        userInput, 
        chatResponse.text
      );
      
      console.log('👁️ Vision enhanced response:', visionEnhancedResponse !== chatResponse.text ? 'ENHANCED' : 'NO_ENHANCEMENT');
      
      // Add the assistant's response to the messages (using vision-enhanced version)
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-response`,
        text: visionEnhancedResponse,
        sender: 'assistant',
        timestamp: new Date()
      };
      console.log('🎭 Adding response message to chat:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
      
      // Trigger animation if present - BUT WAIT for TTS to start
      if (chatResponse.animation) {
        console.log('🎭 CAPABILITY: Animation detected, will trigger when TTS starts');
        // Store animation info to trigger when TTS starts
        const animationInfo = {
          name: chatResponse.animation.animation,
          timeScale: chatResponse.animation.timeScale || 0.5,
          crossFade: chatResponse.animation.crossFade || 0.8
        };
      
        // Don't trigger animation yet - wait for TTS to start
        console.log('🎭 CAPABILITY: Animation queued:', animationInfo);
      }
      
      // Handle TTS for voice input only OR for all responses (enabling TTS for all)
      if (chatResponse.shouldSpeak && visionEnhancedResponse) {
        console.log('🎤 TTS Text (vision enhanced response):', visionEnhancedResponse.replace(/\s+/g, ' '));
        
        // TRIGGER ANIMATION IMMEDIATELY WHEN TTS STARTS
        if (chatResponse.animation) {
          const animationName = chatResponse.animation.animation;
          const timeScale = chatResponse.animation.timeScale || 0.5;
          const crossfade = chatResponse.animation.crossFade || 0.8;
          
          console.log('🎭 CAPABILITY: TRIGGERING ANIMATION NOW - TTS starting:', animationName);
          console.log('🎭 CAPABILITY: Animation details:', { animationName, timeScale, crossfade, category: chatResponse.animation.category });
          
          if ((window as any).playEchoAnimation) {
            (window as any).playEchoAnimation(animationName, crossfade, timeScale);
            console.log('🎭 CAPABILITY: Animation triggered with TTS start');
          } else {
            console.warn('🎭 CAPABILITY: playEchoAnimation not available');
          }
        } else {
          // 🎭 TALKING ANIMATIONS: Trigger talking animations for ALL TTS responses
          console.log('🎭🎭🎭 TALKING ANIMATION: Starting for general TTS response 🎭🎭🎭');
          
                      // Start synchronized speech with talking animations (using vision-enhanced text)
            try {
              const { synchronizedSpeechAnimationController } = await import('../lib/synchronizedSpeechAnimationController');
              console.log('🎭 TALKING: Starting synchronized speech animation controller');
              synchronizedSpeechAnimationController.startSynchronizedSpeech(visionEnhancedResponse, geminiTTS);
              console.log('✅ TALKING: Synchronized speech animations started');
            } catch (error) {
              console.error('❌ TALKING: Failed to start synchronized speech animations:', error);
            
            // Fallback: Manual talking animation trigger
            if ((window as any).playEchoAnimation) {
              console.log('🎭 TALKING: Fallback - triggering talking animation manually');
              const talkingAnimations = ['talking', 'talking-2', 'talking-3', 'talking-4'];
              const randomTalking = talkingAnimations[Math.floor(Math.random() * talkingAnimations.length)];
              (window as any).playEchoAnimation(randomTalking, 1.0, 0.7);
              console.log('🎭 TALKING: Manual talking animation triggered:', randomTalking);
            }
          }
        }
      
        // Use Google TTS with Indian male voice
        try {
          console.log('🇮🇳 USING GOOGLE TTS: en-IN-Neural2-B (Indian Male Neural)');
          console.log('🎤 TTS Service Type:', geminiTTS.constructor.name);
          console.log('🎤 Google TTS Available:', geminiTTS.isGoogleTTSAvailable ? geminiTTS.isGoogleTTSAvailable() : 'Unknown');
          
          await geminiTTS.speak(visionEnhancedResponse, {
            language: 'en-IN', // Indian English for accent
            voice: 'en-IN-Neural2-B', // Indian English Male Neural voice (Google) or best Indian browser voice
            rate: 1.0, // Normal speed
            pitch: 0.0, // Normal pitch  
            volume: 0.0, // Normal volume
            emotion: 'neutral'
          });
          
          console.log('✅ Google TTS completed successfully');
          
          // IMPORTANT: Return to idle animations after TTS completion (prevent T-pose)
          console.log('🎭 TTS COMPLETE: Returning to idle animations to prevent T-pose');
          setTimeout(() => {
            if ((window as any).forceEchoBaseIdle) {
              (window as any).forceEchoBaseIdle();
              console.log('✅ TTS completion: Returned to happy-idle (no T-pose)');
            } else if ((window as any).playEchoAnimation) {
              (window as any).playEchoAnimation('happy-idle', 1.5);
              console.log('✅ TTS completion: Transitioned to happy-idle (no T-pose)');
            }
          }, 1000); // 1 second delay for graceful transition
          
    } catch (error) {
          console.error('❌ TTS Error:', error);
          
          // Even on error, return to idle to prevent T-pose
          console.log('🎭 TTS ERROR: Returning to idle animations');
          setTimeout(() => {
            if ((window as any).forceEchoBaseIdle) {
              (window as any).forceEchoBaseIdle();
              console.log('✅ TTS error: Returned to happy-idle (no T-pose)');
            }
          }, 500);
        }
      }
      
      return visionEnhancedResponse;
    } catch (error) {
      console.error('🎭 Error in enhanced chat integration:', error);
      
      // Return error message instead of adding duplicate fallback
      const errorText = "Sorry, I encountered an error. Please try again.";
      return errorText;
    }
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
          (window as any).playEchoAnimation('waving-gesture', 0.8, 0.5);
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

  // Helper to make assistant responses short and sweet
  function shortAndSweet(text: string, maxLength: number = 500): string {
    // FIXED: Show full response, increased limit significantly
    // Remove excessive newlines and whitespace
    let clean = text.replace(/\s+/g, ' ').trim();
    // If too long, truncate and add ellipsis (but with much higher limit)
    if (clean.length > maxLength) {
      clean = clean.slice(0, maxLength).trim() + '...';
    }
    // Optionally, you could add more summarization logic here
    return clean;
  }

  const handleCapabilityClick = (capability: any) => {
    setDemoResponse(capability.responseTemplate);
  };
  const handleAnimationCategoryClick = (category: any) => {
    const examples = category.examples.join(', ');
    setDemoResponse(`I'd love to show you some ${category.displayName.toLowerCase()}! Try saying: "${examples}"`);
  };
  const handleAssistantDescription = () => {
    setDemoResponse(assistantKnowledgeBase.getAssistantDescription());
  };

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
            <div className="tts-mode-indicator">
              <span className="mode-badge">
                🔇 Text: No TTS | 🎤 Voice: TTS Enabled
              </span>
            </div>
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
            {/* REMOVED ModernChatInputSimple to prevent duplicate inputs */}
            
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

      {/* Floating Messages Container - bottom right above input */}
      <div 
        className="floating-messages-container"
        style={{
          position: 'absolute',
          right: 24,
          bottom: 120,
          width: 400,
          maxWidth: '32vw',
          maxHeight: 250,
          height: 'auto',
          overflowY: 'auto' as const,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 20,
          pointerEvents: 'auto',
          alignItems: 'flex-end',
          zIndex: 1001
        }}
      >
        {messages.slice(-5).map((message, index) => {
          console.log('🎭 Rendering message:', message.sender, message.text.substring(0, 50));
          return (
          <div
            key={message.id}
            className={`floating-message ${message.sender} ${message.isTyping ? 'typing' : ''} ${message.interrupted ? 'interrupted' : ''}`}
            style={{
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                width: '100%',
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div className="message-bubble">
                <span className="message-text">{shortAndSweet(message.text)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box at the bottom right */}
      <div className="chat-input-container" style={{ alignSelf: 'flex-end', position: 'absolute', right: 24, bottom: 24, zIndex: 1002 }}>
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
          right: 24px;
          bottom: 120px;
          width: 400px;
          max-width: 32vw;
          max-height: 250px;
          height: auto;
          overflow-y: auto !important;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          pointer-events: auto;
          align-items: flex-end;
          z-index: 1001;
        }

        .floating-messages-container::-webkit-scrollbar {
          display: block;
          width: 8px;
        }

        .floating-messages-container::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }

        .floating-messages-container::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.3);
          border-radius: 4px;
        }

        .floating-message.user .message-bubble {
          background: rgba(16, 163, 127, 0.95);
          color: #ffffff;
          border: 1px solid rgba(16, 163, 127, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          max-width: 100%;
          word-wrap: break-word;
          white-space: pre-wrap;
          line-height: 1.4;
          align-self: flex-end;
        }

        .floating-message.user .message-text {
          color: #ffffff !important;
          font-size: 14px;
          font-weight: 500;
          margin: 0;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .floating-message.assistant .message-bubble {
          background: rgba(255,255,255,0.95);
          color: #000000;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 100%;
          word-wrap: break-word;
          white-space: pre-wrap;
          line-height: 1.4;
          align-self: flex-start;
        }

        .floating-message.assistant .message-text {
          color: #000000 !important;
          font-size: 14px;
          font-weight: 500;
          margin: 0;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .floating-message.typing .message-bubble {
          background: rgba(255,255,255,0.8);
          color: #666;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .floating-message.typing .message-text::after {
          content: "...";
          animation: dots 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        @keyframes dots {
          0%, 20% { content: "..."; }
          40% { content: ".."; }
          60% { content: "."; }
          80% { content: ""; }
        }

        .chat-input-container {
          position: absolute;
          bottom: 0;
          right: 0;
          left: auto;
          width: 400px;
          max-width: 40vw;
          padding: 20px 20px 20px 0;
          pointer-events: auto;
          display: flex;
          justify-content: flex-end;
        }

        .input-wrapper {
          width: 100%;
        }

        @media (max-width: 900px) {
          .floating-messages-container, .chat-input-container {
            max-width: 95vw;
            width: 95vw;
            left: 0;
            right: 0;
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
};

function getCategoryEmoji(categoryName: string): string {
  const emojiMap: Record<string, string> = {
    'dance': '💃',
    'exercise': '💪',
    'fighting': '🥋',
    'social': '👋',
    'teaching': '📚',
    'emotional': '😊',
    'communication': '💬'
  };
  return emojiMap[categoryName] || '🎭';
}