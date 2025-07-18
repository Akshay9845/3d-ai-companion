import { AudioOutlined, MutedOutlined, StopOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Card, Spin } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { animationService } from '../lib/animationService';
import { enhancedGoogleTTSService } from '../lib/enhancedGoogleTTSService';
import { faceDetectionService } from '../lib/faceDetectionService';
import { GestureDetectionResult, mediaPipeGestureService } from '../lib/mediapipeGestureService';
import { visionIntegratedChatService } from '../lib/visionIntegratedChat';
import { workingWhisperSTT } from '../lib/workingWhisperSTT';

interface VoiceDrivenConversationSystemProps {
  className?: string;
}

interface ConversationState {
  isActive: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  cameraEnabled: boolean;
  currentTranscript: string;
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string, timestamp: Date }>;
}

export const VoiceDrivenConversationSystem: React.FC<VoiceDrivenConversationSystemProps> = ({ className }) => {
  const [state, setState] = useState<ConversationState>({
    isActive: false,
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    cameraEnabled: false,
    currentTranscript: '',
    conversationHistory: []
  });

  const [error, setError] = useState<string | null>(null);
  const [systemReady, setSystemReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const conversationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation state management
  const [currentAnimationSequence, setCurrentAnimationSequence] = useState<string | null>(null);
  const [animationIndex, setAnimationIndex] = useState(0);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation sequences with all available animations for each category
  const animationSequences = {
    dance: [
      '/ECHO/animations/fight and dance and excersise/Salsa Dancing.glb',
      '/ECHO/animations/fight and dance and excersise/Gangnam Style .glb',
      '/ECHO/animations/fight and dance and excersise/Moonwalk .glb',
      '/ECHO/animations/fight and dance and excersise/Locking Hip Hop Dance.glb',
      '/ECHO/animations/fight and dance and excersise/Jump.glb'
    ],
    exercise: [
      '/ECHO/animations/fight and dance and excersise/Push Up.glb',
      '/ECHO/animations/fight and dance and excersise/Plank.glb',
      '/ECHO/animations/fight and dance and excersise/End Plank.glb',
      '/ECHO/animations/fight and dance and excersise/Air Squat.glb',
      '/ECHO/animations/fight and dance and excersise/Warming Up.glb',
      '/ECHO/animations/fight and dance and excersise/Idle To Push Up.glb'
    ],
    fighting: [
      '/ECHO/animations/fight and dance and excersise/Fight Idle.glb',
      '/ECHO/animations/fight and dance and excersise/Fight Idle (1).glb',
      '/ECHO/animations/fight and dance and excersise/Fight Idle (2).glb',
      '/ECHO/animations/fight and dance and excersise/Fight Idle (3).glb'
    ]
  };

  // Function to start animation sequence
  const startAnimationSequence = useCallback((category: 'dance' | 'exercise' | 'fighting') => {
    console.log(`🎭 Starting ${category} animation sequence`);
    console.log(`🎭 playEchoAnimation available: ${typeof (window as any).playEchoAnimation === 'function'}`);
    console.log(`🎭 animationService available: ${!!animationService}`);
    
    // Stop any existing sequence
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
    
    setCurrentAnimationSequence(category);
    setAnimationIndex(0);
    
    // Start the first animation
    const animations = animationSequences[category];
    if (animations.length > 0) {
      const firstAnimation = animations[0];
      console.log(`🎭 Playing first ${category} animation:`, firstAnimation);
      
      // Try direct playEchoAnimation first
      if (typeof (window as any).playEchoAnimation === 'function') {
        const animationName = firstAnimation.split('/').pop()?.replace('.glb', '') || '';
        console.log(`🎭 Calling playEchoAnimation directly with: ${animationName}`);
        (window as any).playEchoAnimation(animationName, 0.8);
      } else {
        console.warn('🎭 playEchoAnimation not available, trying animationService');
        animationService.triggerAnimationChange(firstAnimation, {
          path: firstAnimation,
          duration: 4000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.5,
          weight: 0.9,
          category: category,
          description: `${category} sequence`
        });
      }
      
      // Set up interval to cycle through animations
      animationIntervalRef.current = setInterval(() => {
        setAnimationIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % animations.length;
          const nextAnimation = animations[nextIndex];
          console.log(`🎭 Cycling to ${category} animation ${nextIndex + 1}/${animations.length}:`, nextAnimation);
          
          // Try direct playEchoAnimation first
          if (typeof (window as any).playEchoAnimation === 'function') {
            const animationName = nextAnimation.split('/').pop()?.replace('.glb', '') || '';
            console.log(`🎭 Calling playEchoAnimation directly with: ${animationName}`);
            (window as any).playEchoAnimation(animationName, 0.8);
          } else {
            console.warn('🎭 playEchoAnimation not available, trying animationService');
            animationService.triggerAnimationChange(nextAnimation, {
              path: nextAnimation,
              duration: 4000,
              loop: true,
              crossFade: 1.0,
              timeScale: 0.5,
              weight: 0.9,
              category: category,
              description: `${category} sequence`
            });
          }
          
          return nextIndex;
        });
      }, 6000); // Change animation every 6 seconds
    }
  }, []);

  // Function to stop animation sequence
  const stopAnimationSequence = useCallback(() => {
    console.log('🎭 Stopping animation sequence');
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setCurrentAnimationSequence(null);
    setAnimationIndex(0);
  }, []);

  // Test animation system
  const testAnimationSystem = useCallback(() => {
    console.log('🧪 Testing animation system...');
    console.log('playEchoAnimation available:', typeof (window as any).playEchoAnimation === 'function');
    console.log('animationService available:', !!animationService);
    
    if (typeof (window as any).playEchoAnimation === 'function') {
      console.log('🧪 Testing with playEchoAnimation...');
      (window as any).playEchoAnimation('waving-2', 0.8);
      return 'Animation test started with playEchoAnimation';
    } else if (typeof (window as any).testAnimation === 'function') {
      console.log('🧪 Testing with testAnimation...');
      (window as any).testAnimation('waving-2');
      return 'Animation test started with testAnimation';
    } else {
      console.warn('🧪 No animation functions available');
      return 'No animation functions available';
    }
  }, []);

  // Initialize the voice-driven system
  useEffect(() => {
    const initializeSystem = async () => {
      console.log('🎤 Initializing Voice-Driven Conversation System...');
      
      try {
        // Initialize Google TTS service
        const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyB-6aBzVSQo9pWXDKBKyxA1towrHqdYN2g';
        await enhancedGoogleTTSService.initialize(googleApiKey);
        console.log('✅ Google TTS initialized');

        // Initialize vision services
        await visionIntegratedChatService.initialize();
        console.log('✅ Vision services initialized');

        // Initialize face detection
        await faceDetectionService.initialize();
        console.log('✅ Face detection initialized');

        // Initialize gesture recognition
        await mediaPipeGestureService.initialize();
        console.log('✅ Gesture recognition initialized');

        // Initialize speech recognition
        await workingWhisperSTT.initialize();
        console.log('✅ Speech recognition initialized');

        setSystemReady(true);
        console.log('✅ Voice-Driven Conversation System ready!');

        // Welcome message
        setTimeout(() => {
          speakWelcomeMessage();
        }, 1000);

      } catch (error) {
        console.error('❌ System initialization failed:', error);
        setError(`System initialization failed: ${error.message}`);
      }
    };

    initializeSystem();

    return () => {
      cleanup();
    };
  }, []);

  // Welcome message when system is ready
  const speakWelcomeMessage = async () => {
    const welcomeMessage = "Hello! I am your voice-driven AI assistant. I can see, listen, and respond naturally. Would you like to start a conversation?";
    
    try {
      await enhancedGoogleTTSService.speak(welcomeMessage, {
        language: 'en-US',
        voice: 'en-US-Neural2-J',
        emotion: 'friendly'
      });
    } catch (error) {
      console.error('❌ Welcome message failed:', error);
    }
  };

  // Start voice-driven conversation
  const startConversation = useCallback(async () => {
    if (!systemReady) {
      setError('System not ready yet. Please wait...');
      return;
    }

    console.log('🎤 Starting voice-driven conversation...');
    setError(null);
    
    setState(prev => ({ ...prev, isActive: true }));

    // Ask user if they want camera
    const cameraPrompt = "I am ready to chat! Would you like me to enable the camera so I can see you? Just say 'yes' or 'no'.";
    
    try {
      await enhancedGoogleTTSService.speak(cameraPrompt, {
        language: 'en-US',
        voice: 'en-US-Neural2-J',
        emotion: 'friendly'
      });

      // Start listening for camera response
      setTimeout(() => {
        startListeningForResponse('camera');
      }, 1000);

    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      setError('Failed to start conversation');
    }
  }, [systemReady]);

  // Stop conversation
  const stopConversation = useCallback(async () => {
    console.log('🛑 Stopping voice-driven conversation...');
    
    // Stop all services
    stopListening();
    stopCamera();
    enhancedGoogleTTSService.stopAudio();
    
    setState(prev => ({
      ...prev,
      isActive: false,
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      currentTranscript: ''
    }));

    // Goodbye message
    try {
      await enhancedGoogleTTSService.speak("Goodbye! It was great talking with you.", {
        language: 'en-US',
        voice: 'en-US-Neural2-J',
        emotion: 'friendly'
      });
    } catch (error) {
      console.error('❌ Goodbye message failed:', error);
    }
  }, []);

  // Start listening for user input
  const startListeningForResponse = useCallback(async (context: 'camera' | 'general' = 'general') => {
    if (state.isListening) return;

    console.log('🎤 Starting to listen for user response...');
    setState(prev => ({ ...prev, isListening: true, currentTranscript: '' }));

    try {
      const transcript = await workingWhisperSTT.startLiveRecognition();
      
      if (transcript && transcript.trim()) {
        console.log('✅ User said:', transcript);
        setState(prev => ({ 
          ...prev, 
          isListening: false,
          currentTranscript: transcript,
          conversationHistory: [...prev.conversationHistory, {
            role: 'user',
            content: transcript,
            timestamp: new Date()
          }]
        }));

        // Process the response based on context
        if (context === 'camera') {
          await handleCameraResponse(transcript);
        } else {
          await processUserInput(transcript);
        }
      } else {
        console.log('⚠️ No speech detected, trying again...');
        setState(prev => ({ ...prev, isListening: false }));
        
        // Prompt user again
        try {
          await enhancedGoogleTTSService.speak("I did not hear anything. Please try speaking again.", {
            language: 'en-US',
            voice: 'en-US-Neural2-J'
          });
        } catch (error) {
          console.error('❌ Failed to speak retry message:', error);
        }
        
        setTimeout(() => {
          startListeningForResponse(context);
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Speech recognition failed:', error);
      setState(prev => ({ ...prev, isListening: false }));
      
      const errorMessage = "Sorry, I had trouble hearing you. Let us try again.";
      try {
        await enhancedGoogleTTSService.speak(errorMessage, {
          language: 'en-US',
          voice: 'en-US-Neural2-J'
        });
      } catch (error) {
        console.error('❌ Failed to speak error message:', error);
      }
      
      setTimeout(() => {
        startListeningForResponse(context);
      }, 2000);
    }
  }, [state.isListening]);

  // Handle camera response
  const handleCameraResponse = useCallback(async (response: string) => {
    const isYes = /yes|yeah|sure|okay|ok|enable|turn on|start/i.test(response);
    const isNo = /no|nah|don't|disable|turn off|stop/i.test(response);

    if (isYes) {
      console.log('👍 User wants camera enabled');
      await enableCamera();
      
      const cameraMessage = "Great! Camera is now enabled. I can see you now. What would you like to talk about?";
      try {
        await enhancedGoogleTTSService.speak(cameraMessage, {
          language: 'en-US',
          voice: 'en-US-Neural2-J',
          emotion: 'happy'
        });
      } catch (error) {
        console.error('❌ Failed to speak camera message:', error);
      }
      
      // Start general conversation
      setTimeout(() => {
        startListeningForResponse('general');
      }, 1000);
      
    } else if (isNo) {
      console.log('👎 User does not want camera');
      
      const noCameraMessage = "No problem! We can chat without the camera. What would you like to talk about?";
      try {
        await enhancedGoogleTTSService.speak(noCameraMessage, {
          language: 'en-US',
          voice: 'en-US-Neural2-J',
          emotion: 'friendly'
        });
      } catch (error) {
        console.error('❌ Failed to speak no camera message:', error);
      }
      
      // Start general conversation
      setTimeout(() => {
        startListeningForResponse('general');
      }, 1000);
      
    } else {
      // Unclear response, ask again
      const clarifyMessage = "I did not understand. Please say 'yes' to enable the camera or 'no' to continue without it.";
      await enhancedGoogleTTSService.speak(clarifyMessage, {
        language: 'en-US',
        voice: 'en-US-Neural2-J'
      });
      
      setTimeout(() => {
        startListeningForResponse('camera');
      }, 1000);
    }
  }, []);

  // Process user input and generate response
  const processUserInput = useCallback(async (input: string) => {
    setState(prev => ({ ...prev, isProcessing: true }));
    console.log('⚙️ Processing user input:', input);

    try {
      let response = '';

      // Check if camera is enabled for vision-enhanced responses
      if (state.cameraEnabled && videoRef.current) {
        console.log('👁️ Processing with vision integration...');
        
        // Capture current frame for analysis
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx && videoRef.current.videoWidth > 0) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);
          
          // Convert to blob for analysis
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
          });

          // Get vision-enhanced response
          response = await visionIntegratedChatService.generateVisionResponse(input, blob);
        } else {
          // Fallback to text-only response
          response = await visionIntegratedChatService.generateTextResponse(input);
        }
      } else {
        // Text-only conversation
        response = await visionIntegratedChatService.generateTextResponse(input);
      }

      console.log('✅ Generated response:', response);

      // Check for action words in user input and trigger animations
      const userInputLower = input.toLowerCase();
      const responseLower = response.toLowerCase();
      
      // Check for dance-related keywords
      if (userInputLower.includes('dance') || userInputLower.includes('salsa') || userInputLower.includes('moonwalk') || 
          userInputLower.includes('gangnam') || responseLower.includes('dance')) {
        console.log('💃 Triggering dance animation for user input:', input);
        startAnimationSequence('dance');
      }
      
      // Check for exercise-related keywords
      else if (userInputLower.includes('push') || userInputLower.includes('exercise') || userInputLower.includes('workout') || 
               userInputLower.includes('fitness') || responseLower.includes('push') || responseLower.includes('exercise')) {
        console.log('💪 Triggering exercise animation for user input:', input);
        startAnimationSequence('exercise');
      }
      
      // Check for fighting-related keywords
      else if (userInputLower.includes('fight') || userInputLower.includes('martial') || userInputLower.includes('combat') || 
               userInputLower.includes('karate') || responseLower.includes('fight') || responseLower.includes('martial')) {
        console.log('🥋 Triggering fighting animation for user input:', input);
        startAnimationSequence('fighting');
      }
      
      // Check for stop-related keywords
      else if (userInputLower.includes('stop') || userInputLower.includes('enough') || userInputLower.includes('quit') || 
               userInputLower.includes('end') || responseLower.includes('stop') || responseLower.includes('enough')) {
        console.log('⏹️ Stopping animation sequence for user input:', input);
        stopAnimationSequence();
      }
      
      // Check for greeting-related keywords
      else if (userInputLower.includes('hello') || userInputLower.includes('hi') || userInputLower.includes('hey') || 
               userInputLower.includes('greet') || responseLower.includes('hello') || responseLower.includes('hi')) {
        console.log('👋 Triggering greeting animation for user input:', input);
        const greetingPath = '/ECHO/animations/basic reactions/waving-2.glb';
        animationService.triggerAnimationChange(greetingPath, {
          path: greetingPath,
          duration: 2500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'gestures',
          description: 'Friendly greeting wave'
        });
      }

      // Add to conversation history
      setState(prev => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }],
        isProcessing: false,
        isSpeaking: true
      }));

      // Speak the response
      try {
        await enhancedGoogleTTSService.speak(response, {
          language: 'en-US',
          voice: 'en-US-Neural2-J',
          emotion: 'friendly'
        });
      } catch (error) {
        console.error('❌ Failed to speak response:', error);
      }

      setState(prev => ({ ...prev, isSpeaking: false }));

      // Continue conversation
      setTimeout(() => {
        startListeningForResponse('general');
      }, 1000);

    } catch (error) {
      console.error('❌ Failed to process input:', error);
      setState(prev => ({ ...prev, isProcessing: false, isSpeaking: false }));
      
      const errorMessage = "Sorry, I had trouble processing that. Could you please try again?";
      try {
        await enhancedGoogleTTSService.speak(errorMessage, {
          language: 'en-US',
          voice: 'en-US-Neural2-J'
        });
      } catch (error) {
        console.error('❌ Failed to speak error message:', error);
      }
      
      setTimeout(() => {
        startListeningForResponse('general');
      }, 2000);
    }
  }, [state.cameraEnabled]);

  // Handle gesture detection and automatic responses
  const handleGestureDetected = useCallback(async (result: GestureDetectionResult) => {
    console.log('🤚 Gesture detected:', result.gestures[0]?.type);
    
    // Handle automatic response if present
    if (result.automaticResponse && result.automaticResponse.shouldSpeak) {
      console.log('🗣️ Speaking automatic response:', result.automaticResponse.message);
      
      // Add to conversation history
      setState(prev => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, {
          role: 'assistant',
          content: result.automaticResponse.message,
          timestamp: new Date()
        }],
        isSpeaking: true
      }));

      try {
        // Speak the automatic response using the queue system
        await enhancedGoogleTTSService.speak(result.automaticResponse.message, {
          language: 'en-US',
          voice: 'en-US-Neural2-J',
          emotion: 'friendly'
        });

        setState(prev => ({ ...prev, isSpeaking: false }));

        // If the gesture is a wave, trigger a greeting bow animation after the TTS
        if (result.gestures[0]?.type === 'wave') {
          // Path for quick-informal-bow animation
          const bowPath = '/ECHO/animations/basic reactions/quick-informal-bow.glb';
          animationService.triggerAnimationChange(bowPath, {
            path: bowPath,
            duration: 1500,
            loop: false,
            crossFade: 0.8,
            timeScale: 0.3,
            category: 'gestures',
            description: 'Casual bow'
          });
        }

        // After speaking the automatic response, start listening for user input
        setTimeout(() => {
          console.log('🎤 Starting to listen after gesture response...');
          startListeningForResponse('general');
        }, 1000);
      } catch (error) {
        console.error('❌ Failed to speak gesture response:', error);
        setState(prev => ({ ...prev, isSpeaking: false }));
        
        // Still start listening even if speech failed
        setTimeout(() => {
          startListeningForResponse('general');
        }, 1000);
      }
    }
  }, [startListeningForResponse]);

  // Enable camera
  const enableCamera = useCallback(async () => {
    console.log('📹 Enabling camera...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState(prev => ({ ...prev, cameraEnabled: true }));
      
      // Start face detection and gesture recognition
      faceDetectionService.startDetection(videoRef.current!);
      mediaPipeGestureService.attachVideo(videoRef.current!, handleGestureDetected);
      mediaPipeGestureService.startDetection();
      
      console.log('✅ Camera enabled and vision services started');
      
    } catch (error) {
      console.error('❌ Failed to enable camera:', error);
      setError('Failed to enable camera. Please check permissions.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    console.log('📹 Stopping camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    faceDetectionService.stopDetection();
    mediaPipeGestureService.stopDetection();
    
    setState(prev => ({ ...prev, cameraEnabled: false }));
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    stopListening();
    stopCamera();
    enhancedGoogleTTSService.stopAudio();
    stopAnimationSequence(); // Stop any running animation sequences
    
    if (conversationTimeoutRef.current) {
      clearTimeout(conversationTimeoutRef.current);
    }
  }, [stopListening, stopCamera, stopAnimationSequence]);

  // Get status indicator
  const getStatusIndicator = () => {
    if (!systemReady) return { color: 'gray', text: 'Initializing...' };
    if (state.isSpeaking) return { color: 'blue', text: 'Speaking' };
    if (state.isProcessing) return { color: 'orange', text: 'Processing' };
    if (state.isListening) return { color: 'green', text: 'Listening' };
    if (currentAnimationSequence) {
      const animations = animationSequences[currentAnimationSequence as keyof typeof animationSequences];
      return { 
        color: 'purple', 
        text: `${currentAnimationSequence.charAt(0).toUpperCase() + currentAnimationSequence.slice(1)} ${animationIndex + 1}/${animations.length}` 
      };
    }
    if (state.isActive) return { color: 'blue', text: 'Ready' };
    return { color: 'gray', text: 'Inactive' };
  };

  const status = getStatusIndicator();

  return (
    <div className={`voice-conversation-system ${className || ''}`}>
      <Card
        title="🎤 Voice-Driven AI Assistant"
        className="conversation-card"
        extra={
          <Badge color={status.color} text={status.text} />
        }
      >
        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Camera Preview */}
        {state.cameraEnabled && (
          <div className="camera-preview" style={{ marginBottom: 16 }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                maxWidth: 320,
                height: 'auto',
                borderRadius: 8,
                border: '2px solid #1890ff'
              }}
              muted
              playsInline
            />
          </div>
        )}

        {/* Animation Status */}
        {currentAnimationSequence && (
          <div style={{ 
            background: '#f0f0ff',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            border: '2px solid #722ed1',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1', marginBottom: 4 }}>
              🎭 Currently Playing: {currentAnimationSequence.charAt(0).toUpperCase() + currentAnimationSequence.slice(1)}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Animation {animationIndex + 1} of {animationSequences[currentAnimationSequence as keyof typeof animationSequences].length}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
              Say "stop" to end the sequence
            </div>
          </div>
        )}

        {/* Current transcript */}
        {state.currentTranscript && (
          <div style={{ 
            background: '#f0f8ff',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid #d9d9d9'
          }}>
            <strong>You said:</strong> "{state.currentTranscript}"
          </div>
        )}

        {/* Conversation History */}
        {state.conversationHistory.length > 0 && (
          <div style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
            <h4>Conversation:</h4>
            {state.conversationHistory.slice(-4).map((entry, index) => (
              <div
                key={index}
                style={{
                  padding: 8,
                  margin: '8px 0',
                  borderRadius: 8,
                  background: entry.role === 'user' ? '#e6f7ff' : '#f6ffed',
                  border: `1px solid ${entry.role === 'user' ? '#91d5ff' : '#b7eb8f'}`
                }}
              >
                <strong>{entry.role === 'user' ? 'You' : 'Assistant'}:</strong>
                <div>{entry.content}</div>
                <small style={{ color: '#666' }}>
                  {entry.timestamp.toLocaleTimeString()}
                </small>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="conversation-controls" style={{ textAlign: 'center' }}>
          {!state.isActive ? (
            <Button
              type="primary"
              icon={<AudioOutlined />}
              size="large"
              onClick={startConversation}
              disabled={!systemReady}
              loading={!systemReady}
            >
              {systemReady ? 'Start Voice Conversation' : 'Initializing...'}
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={stopConversation}
              >
                Stop Conversation
              </Button>
              
              {state.cameraEnabled && (
                <Button
                  icon={<MutedOutlined />}
                  onClick={stopCamera}
                >
                  Turn Off Camera
                </Button>
              )}
              
              {!state.cameraEnabled && state.isActive && (
                <Button
                  icon={<VideoCameraOutlined />}
                  onClick={enableCamera}
                >
                  Enable Camera
                </Button>
              )}

              {state.isActive && !state.isListening && !state.isProcessing && !state.isSpeaking && (
                <Button
                  type="primary"
                  icon={<AudioOutlined />}
                  onClick={() => startListeningForResponse('general')}
                >
                  Start Listening
                </Button>
              )}

              {/* Animation Test Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button
                  size="small"
                  onClick={() => {
                    const result = testAnimationSystem();
                    console.log('Test result:', result);
                  }}
                  style={{ background: '#1890ff', color: 'white' }}
                >
                  Test Animation
                </Button>
                <Button
                  size="small"
                  onClick={() => startAnimationSequence('dance')}
                  style={{ background: '#722ed1', color: 'white' }}
                >
                  Test Dance
                </Button>
                <Button
                  size="small"
                  onClick={() => startAnimationSequence('exercise')}
                  style={{ background: '#52c41a', color: 'white' }}
                >
                  Test Exercise
                </Button>
                <Button
                  size="small"
                  onClick={() => startAnimationSequence('fighting')}
                  style={{ background: '#fa8c16', color: 'white' }}
                >
                  Test Fighting
                </Button>
                <Button
                  size="small"
                  onClick={stopAnimationSequence}
                  style={{ background: '#ff4d4f', color: 'white' }}
                >
                  Stop Animations
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {state.isListening && <Spin size="small" style={{ marginRight: 8 }} />}
          <span style={{ fontSize: '14px', color: '#666' }}>
            {state.isListening && '🎤 Listening for your voice...'}
            {state.isProcessing && '⚙️ Processing your request...'}
            {state.isSpeaking && '🗣️ Speaking response...'}
            {state.isActive && !state.isListening && !state.isProcessing && !state.isSpeaking && '✅ Ready for conversation'}
          </span>
        </div>

        {/* Instructions */}
        {state.isActive && state.cameraEnabled && !state.isListening && !state.isProcessing && !state.isSpeaking && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: 12, 
            padding: 12, 
            background: '#f0f8ff', 
            borderRadius: 8,
            border: '1px solid #d9d9d9'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: 8 }}>
              💡 <strong>Interaction Tips:</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              👋 Wave to say hello • 👍 Thumbs up for positive feedback • 🗣️ Click "Start Listening" or speak naturally
            </div>
          </div>
        )}
      </Card>

      <style jsx>{`
        .voice-conversation-system {
          max-width: 600px;
          margin: 20px auto;
        }
        
        .conversation-card {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .camera-preview {
          text-align: center;
        }
        
        .conversation-controls {
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default VoiceDrivenConversationSystem; 