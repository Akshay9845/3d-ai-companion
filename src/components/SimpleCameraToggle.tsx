import { Brain, Camera, CameraOff, Eye, FileText, User, Users, X, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { DocumentAnalysisResult, documentAnalysisService } from '../lib/documentAnalysisService';
import { faceDetectionService } from '../lib/faceDetectionService';
import { CameraAnalysisResult, intelligentCameraService } from '../lib/intelligentCameraService';
import { GestureDetectionResult, mediaPipeGestureService } from '../lib/mediapipeGestureService';
import { UserRecognitionResult, userRecognitionService } from '../lib/userRecognitionService';
import { visionIntegratedChatService } from '../lib/visionIntegratedChat';
import FaceDetectionOverlay from './FaceDetectionOverlay';
import UserManagementPanel from './UserManagementPanel';
import UserRegistrationModal from './UserRegistrationModal';

interface SimpleCameraToggleProps {
  className?: string;
  onVisionAnalysis?: (description: string) => void;
  onCameraStateChange?: (isActive: boolean) => void;
}

// Global function to analyze camera view - accessible from anywhere
let globalAnalyzeCamera: (() => Promise<string>) | null = null;

const SimpleCameraToggle: React.FC<SimpleCameraToggleProps> = ({ 
  className = '',
  onVisionAnalysis,
  onCameraStateChange
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<CameraAnalysisResult | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<{
    faceDetectionActive: boolean;
    facesDetected: number;
    dominantEmotion: string | null;
    lastDetectionTime: number | null;
  }>({
    faceDetectionActive: false,
    facesDetected: 0,
    dominantEmotion: null,
    lastDetectionTime: null
  });
  const [currentFaces, setCurrentFaces] = useState<any[]>([]);
  const [recognitionResult, setRecognitionResult] = useState<UserRecognitionResult | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingRecognition, setPendingRecognition] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [gestureResult, setGestureResult] = useState<GestureDetectionResult | null>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [isGestureEnabled, setIsGestureEnabled] = useState(true);
  const [isDocumentModeActive, setIsDocumentModeActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

          return () => {
        stopCamera();
        stopContinuousDetection();
        stopUserRecognition();
        stopGestureDetection();
      };
  }, [isCameraActive]);

  // Initialize intelligent camera service only when camera is active AND user has enabled it
  useEffect(() => {
    if (isCameraActive && videoRef.current && stream) {
      initializeIntelligentCamera();
    }
  }, [isCameraActive, stream]);

  // Set up global camera analysis function (only works when camera is manually enabled)
  useEffect(() => {
    globalAnalyzeCamera = async () => {
      if (!isCameraActive || !intelligentCameraService.isReady()) {
        return "The camera is not currently active. Please click the camera button to turn it on first so I can see what's happening.";
      }

      return await performVisionAnalysis();
    };

    // Expose to window for global access
    (window as any).analyzeCamera = globalAnalyzeCamera;
    
    // Expose vision context for chat integration
    (window as any).getVisionContext = () => visionIntegratedChatService.getCurrentVisionContext();
    (window as any).hasVisionData = () => visionIntegratedChatService.isVisionDataFresh();

    return () => {
      globalAnalyzeCamera = null;
      delete (window as any).analyzeCamera;
      delete (window as any).getVisionContext;
      delete (window as any).hasVisionData;
    };
  }, [isCameraActive]);

  const initializeIntelligentCamera = async () => {
    try {
      // Initialize face detection service first
      console.log('🔄 Initializing face detection service...');
      const faceInitSuccess = await faceDetectionService.initialize();
      if (!faceInitSuccess) {
        console.error('❌ Face detection service failed to initialize');
      } else {
        console.log('✅ Face detection service ready');
      }

      // Then initialize intelligent camera service
      await intelligentCameraService.initialize();
      if (videoRef.current) {
        intelligentCameraService.attachVideo(videoRef.current);
        console.log('📹 Intelligent camera service attached to video');
        
        // Start continuous face detection for status updates
        startContinuousDetection();
        
        // Start user recognition
        startUserRecognition();
        
        // Start gesture detection if enabled
        if (isGestureEnabled) {
          startGestureDetection();
        }
      }
    } catch (error) {
      console.error('Failed to initialize intelligent camera:', error);
    }
  };

  const startContinuousDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    setDetectionStatus(prev => ({ ...prev, faceDetectionActive: true }));

    detectionIntervalRef.current = setInterval(async () => {
      if (!faceDetectionService.isReady() || !isCameraActive || !videoRef.current) {
        console.log('Face detection conditions not met:', {
          faceServiceReady: faceDetectionService.isReady(),
          cameraActive: isCameraActive,
          videoReady: !!videoRef.current
        });
        return;
      }

      try {
        // Use face detection service directly for real-time detection
        const faceResult = await faceDetectionService.detectFaces(videoRef.current);
        
        console.log('Face detection result:', {
          hasResult: !!faceResult,
          faceCount: faceResult?.faces.length || 0,
          timestamp: faceResult?.timestamp
        });
        
        if (faceResult && faceResult.faces.length > 0) {
          setCurrentFaces(faceResult.faces);
          
          const dominantEmotion = faceResult.faces[0].emotions
            ? faceDetectionService.getDominantEmotion(faceResult.faces[0].emotions)
            : null;

          console.log('Face detected:', {
            faceCount: faceResult.faces.length,
            dominantEmotion,
            confidence: faceResult.faces[0].confidence
          });

          setDetectionStatus(prev => ({
            ...prev,
            facesDetected: faceResult.faces.length,
            dominantEmotion: dominantEmotion,
            lastDetectionTime: Date.now()
          }));
        } else {
          setCurrentFaces([]);
          setDetectionStatus(prev => ({
            ...prev,
            facesDetected: 0,
            dominantEmotion: null,
            lastDetectionTime: Date.now()
          }));
        }
      } catch (error) {
        console.error('Continuous detection error:', error);
      }
    }, 1000); // Increased to 1 second for better debugging
  };

  const stopContinuousDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setDetectionStatus({
      faceDetectionActive: false,
      facesDetected: 0,
      dominantEmotion: null,
      lastDetectionTime: null
    });
    setCurrentFaces([]);
  };

  const startUserRecognition = () => {
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
    }

    recognitionIntervalRef.current = setInterval(async () => {
      if (!isCameraActive || !videoRef.current || pendingRecognition) {
        return;
      }

      try {
        const result = await userRecognitionService.recognizeUser(videoRef.current);
        setRecognitionResult(result);

        if (result.isNewFace && !showRegistrationModal) {
          // Wait a moment to ensure we have a stable detection
          setTimeout(() => {
            if (detectionStatus.facesDetected > 0) {
              setShowRegistrationModal(true);
              setPendingRecognition(true);
            }
          }, 2000); // Wait 2 seconds for stable detection
        }

        // If user is recognized, update chat context and potentially greet them
        if (result.isRecognized && result.user) {
          console.log('👤 User recognized:', result.user.name);
          
          // Update vision context with user information
          visionIntegratedChatService.updateUserContext(result.user);
          
          // Generate personalized greeting (only for returning users after 5 seconds gap)
          if (result.user.sessionCount > 1) {
            const greeting = userRecognitionService.generatePersonalizedGreeting(result.user);
            
            // Trigger avatar to speak the greeting
            visionIntegratedChatService.speak(greeting);
          }
        }

        // Handle new face detection - automatically ask for name via speech
        if (result.isNewFace && !showRegistrationModal && !pendingRecognition) {
          console.log('👤 New face detected - asking for name via speech');
          
          const askNameMessage = "Hello there! I see a new face. I'm your AI assistant. What's your name so I can remember you for next time?";
          
          // Speak the question automatically
          visionIntegratedChatService.speak(askNameMessage);
          
          // Show the registration modal after a brief delay
          setTimeout(() => {
            if (detectionStatus.facesDetected > 0) {
              setShowRegistrationModal(true);
              setPendingRecognition(true);
            }
          }, 3000); // Give time for speech to finish
        }
      } catch (error) {
        console.error('User recognition error:', error);
      }
    }, 3000); // Check every 3 seconds
  };

  const stopUserRecognition = () => {
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }
    setRecognitionResult(null);
  };

  const startGestureDetection = async () => {
    try {
      console.log('🤚 Starting gesture detection...');
      
      if (!mediaPipeGestureService.isReady()) {
        const initialized = await mediaPipeGestureService.initialize();
        if (!initialized) {
          console.error('❌ Failed to initialize MediaPipe gesture service');
          return;
        }
      }

      if (videoRef.current) {
        mediaPipeGestureService.attachVideo(videoRef.current, handleGestureDetected);
        mediaPipeGestureService.startDetection();
        console.log('✅ Gesture detection started');
      }
    } catch (error) {
      console.error('❌ Error starting gesture detection:', error);
    }
  };

  const stopGestureDetection = () => {
    mediaPipeGestureService.stopDetection();
    setGestureResult(null);
    console.log('🤚 Gesture detection stopped');
  };

  const handleGestureDetected = (result: GestureDetectionResult) => {
    setGestureResult(result);
    
    // Handle automatic responses with immediate speech
    if (result.automaticResponse && result.automaticResponse.shouldSpeak) {
      console.log('🤚 Automatic gesture response:', result.automaticResponse.message);
      
      // Trigger avatar to speak the gesture response immediately
      visionIntegratedChatService.speak(result.automaticResponse.message);
    }
  };

  const analyzeDocument = async () => {
    if (!videoRef.current) return;
    
    setIsAnalyzing(true);
    setIsDocumentModeActive(true);
    
    try {
      console.log('📄 Analyzing document/question...');
      
      const analysis = await documentAnalysisService.analyzeDocument(videoRef.current);
      
      if (analysis) {
        setDocumentAnalysis(analysis);
        
        // Generate assistance response
        const assistance = await documentAnalysisService.generateAssistanceResponse(analysis);
        
        let responseMessage = analysis.suggestedAction;
        
        if (assistance.canHelp) {
          responseMessage += ` ${assistance.explanation || ''}`;
          
          if (assistance.solution) {
            responseMessage += ` Solution: ${assistance.solution}`;
          }
        }
        
        // Trigger avatar to speak the analysis
        visionIntegratedChatService.speak(responseMessage);
        
        console.log('📄 Document analysis completed:', analysis);
      } else {
        const fallbackMessage = "I can see the camera, but I'm having trouble reading any text or questions clearly. Could you hold the document steadier or move it closer to the camera?";
        
        visionIntegratedChatService.speak(fallbackMessage);
      }
    } catch (error) {
      console.error('📄 Document analysis error:', error);
      
      const errorMessage = "I'm having trouble analyzing the document right now. Please try again or ask me to help in a different way.";
      visionIntegratedChatService.speak(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setIsDocumentModeActive(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    stopContinuousDetection();
    stopUserRecognition();
    stopGestureDetection();
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    intelligentCameraService.detachVideo();
    
    // Reset all state
    setRecognitionResult(null);
    setShowRegistrationModal(false);
    setPendingRecognition(false);
    setGestureResult(null);
    setDocumentAnalysis(null);
    setIsDocumentModeActive(false);
  };

  const toggleCamera = () => {
    const newState = !isCameraActive;
    setIsCameraActive(newState);
    setError(null);
    
    // Notify parent component of camera state change
    if (onCameraStateChange) {
      onCameraStateChange(newState);
    }
  };

  const performVisionAnalysis = async (): Promise<string> => {
    if (!intelligentCameraService.isReady()) {
      return "Camera analysis is not available right now.";
    }

    setIsAnalyzing(true);
    
    try {
      const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem('googleVisionApiKey');
      
      const analysisResult = await intelligentCameraService.analyzeCurrentView({
        includeFaceDetection: true,
        includeObjectDetection: true,
        includeTextDetection: true,
        includeSceneDescription: true,
        googleVisionApiKey: googleApiKey || undefined
      });

      if (analysisResult) {
        setLastAnalysis(analysisResult);
        const description = generateDetailedVisionDescription(analysisResult);
        
        // Update vision context for chat integration
        visionIntegratedChatService.updateVisionContext(analysisResult, description);
        
        if (onVisionAnalysis) {
          onVisionAnalysis(description);
        }
        
        return description;
      } else {
        return "I'm having trouble analyzing the camera view right now.";
      }
    } catch (error) {
      console.error('Vision analysis error:', error);
      return "There was an error analyzing the camera view.";
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cleanEmotionWord = (emotion: string): string => {
    // Remove emoji descriptions and clean up emotion words
    const cleanWord = emotion
      .replace(/thinking face/gi, 'thoughtful')
      .replace(/biceps/gi, 'strong')
      .replace(/flexed biceps/gi, 'confident')
      .replace(/muscle/gi, 'determined')
      .replace(/[^\w\s]/g, '') // Remove special characters
      .toLowerCase()
      .trim();
    
    // Map to standard emotion words
    const emotionMap: Record<string, string> = {
      'happy': 'happy',
      'joy': 'happy',
      'joyful': 'happy',
      'sad': 'sad',
      'sorrow': 'sad',
      'angry': 'angry',
      'anger': 'angry',
      'surprised': 'surprised',
      'surprise': 'surprised',
      'fearful': 'fearful',
      'fear': 'fearful',
      'disgusted': 'disgusted',
      'disgust': 'disgusted',
      'neutral': 'neutral',
      'thoughtful': 'thoughtful',
      'confident': 'confident',
      'determined': 'determined'
    };

    return emotionMap[cleanWord] || cleanWord || 'neutral';
  };

  const generateDetailedVisionDescription = (analysis: CameraAnalysisResult): string => {
    const details: string[] = [];

    // Face and emotion analysis
    if (analysis.faces.count > 0) {
      if (analysis.faces.count === 1) {
        details.push(`I can see you looking at me`);
        
        if (analysis.faces.dominantEmotion && analysis.faces.dominantEmotion !== 'neutral') {
          const cleanEmotion = cleanEmotionWord(analysis.faces.dominantEmotion);
          details.push(`Your facial expression shows you're ${cleanEmotion}`);
        } else {
          details.push(`You have a neutral expression`);
        }

        if (analysis.faces.ages.length > 0) {
          details.push(`You appear to be around ${analysis.faces.ages[0]} years old`);
        }

        if (analysis.faces.genders.length > 0) {
          // Only mention if confident about gender detection
        }
      } else {
        details.push(`I can see ${analysis.faces.count} people in the camera`);
        if (analysis.faces.dominantEmotion) {
          const cleanEmotion = cleanEmotionWord(analysis.faces.dominantEmotion);
          details.push(`The overall mood in the room seems ${cleanEmotion}`);
        }
      }
    } else {
      details.push(`I don't see any faces in the camera right now`);
    }

    // Clothing and objects
    if (analysis.scene.objects.length > 0) {
      const clothing = analysis.scene.objects.filter(obj => 
        ['shirt', 'clothing', 'dress', 'jacket', 'sweater', 'hoodie', 'top', 'blouse', 'tie', 'suit'].some(item => 
          obj.name.toLowerCase().includes(item)
        )
      );

      const accessories = analysis.scene.objects.filter(obj => 
        ['glasses', 'hat', 'cap', 'watch', 'jewelry', 'necklace', 'earring'].some(item => 
          obj.name.toLowerCase().includes(item)
        )
      );

      const furniture = analysis.scene.objects.filter(obj => 
        ['chair', 'desk', 'table', 'sofa', 'bed', 'lamp', 'computer', 'monitor', 'laptop'].some(item => 
          obj.name.toLowerCase().includes(item)
        )
      );

      if (clothing.length > 0) {
        const clothingItems = clothing.map(c => c.name).join(', ');
        details.push(`I can see you're wearing what appears to be ${clothingItems}`);
      }

      if (accessories.length > 0) {
        const accessoryItems = accessories.map(a => a.name).join(', ');
        details.push(`I notice you have ${accessoryItems}`);
      }

      if (furniture.length > 0) {
        const furnitureItems = furniture.slice(0, 3).map(f => f.name).join(', ');
        details.push(`I can see ${furnitureItems} in your environment`);
      }

      const otherObjects = analysis.scene.objects.filter(obj => 
        !clothing.some(c => c.name === obj.name) && 
        !accessories.some(a => a.name === obj.name) && 
        !furniture.some(f => f.name === obj.name)
      ).slice(0, 3);

      if (otherObjects.length > 0) {
        const otherItems = otherObjects.map(o => o.name).join(', ');
        details.push(`I also notice ${otherItems} in the scene`);
      }
    }

    // Environment description
    if (analysis.scene.description) {
      details.push(`The overall environment looks like ${analysis.scene.description}`);
    }

    // Text detection
    if (analysis.scene.text.length > 0) {
      const uniqueText = [...new Set(analysis.scene.text)].slice(0, 2);
      details.push(`I can read some text that says "${uniqueText.join('", "')}"`);
    }

    return details.length > 0 
      ? details.join('. ') + '.'
      : "I can see the camera feed but I'm having trouble making out specific details right now.";
  };

  const handleManualAnalysis = async () => {
    const description = await performVisionAnalysis();
    console.log('📹 Camera Analysis:', description);
    
    // Trigger the avatar to speak this description
    visionIntegratedChatService.speak(description);
  };

  // Continuous vision analysis for human-like awareness
  useEffect(() => {
    let analysisInterval: NodeJS.Timeout | null = null;
    
    if (isCameraActive && !isAnalyzing) {
      // Start continuous analysis every 10 seconds for fresh vision data
      analysisInterval = setInterval(async () => {
        if (!isAnalyzing && intelligentCameraService.isReady()) {
          try {
            console.log('👁️ CONTINUOUS: Auto-analyzing camera for fresh vision context');
            await performVisionAnalysis();
            console.log('👁️ CONTINUOUS: Background vision analysis completed');
          } catch (error) {
            console.error('👁️ CONTINUOUS: Background analysis error:', error);
          }
        }
      }, 10000); // Every 10 seconds
      
      console.log('👁️ CONTINUOUS: Vision analysis started (every 10s)');
    }
    
    return () => {
      if (analysisInterval) {
        clearInterval(analysisInterval);
        console.log('👁️ CONTINUOUS: Vision analysis stopped');
      }
    };
      }, [isCameraActive, isAnalyzing]); // Removed performVisionAnalysis from deps to avoid initialization error

  // Handle user registration
  const handleUserRegistration = async (name: string): Promise<boolean> => {
    if (!videoRef.current) {
      return false;
    }

    try {
      const success = await userRecognitionService.registerNewUser(name, videoRef.current);
      
      if (success) {
        setPendingRecognition(false);
        
        // Generate welcome message
        const welcomeMessage = `Nice to meet you, ${name}! I'll remember you from now on. Welcome to our AI world!`;
        
        // Trigger avatar to speak the welcome message
        visionIntegratedChatService.speak(welcomeMessage);
        
        // Update recognition result to show the new user
        const user = userRecognitionService.getUserByName(name);
        if (user) {
          setRecognitionResult({
            isRecognized: true,
            user,
            confidence: 1.0,
            isNewFace: false
          });
        }
      }
      
      return success;
    } catch (error) {
      console.error('User registration failed:', error);
      return false;
    }
  };

  const handleSkipRegistration = () => {
    setPendingRecognition(false);
    setShowRegistrationModal(false);
  };

    return (
    <>
      {/* User Registration Modal */}
      <UserRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onRegister={handleUserRegistration}
        onSkip={handleSkipRegistration}
      />

      {/* User Management Panel */}
      <UserManagementPanel
        isOpen={showUserManagement}
        onClose={() => setShowUserManagement(false)}
      />

      {/* Camera Toggle Button - Below Animation Panel */}
      <button
        onClick={toggleCamera}
        className={`
          fixed top-52 left-5 z-[9999] 
          px-4 py-2 rounded-lg 
          flex items-center justify-center gap-2
          transition-all duration-300 ease-in-out
          shadow-lg hover:shadow-xl
          ${isCameraActive 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200'
          }
          ${className}
        `}
        title={isCameraActive ? 'Turn off camera' : 'Turn on camera'}
      >
        {isCameraActive ? (
          <Camera className="w-4 h-4" />
        ) : (
          <CameraOff className="w-4 h-4" />
        )}
        <span className="text-sm font-bold">
          {isCameraActive ? 'Camera On' : 'Camera Off'}
        </span>
      </button>

      {/* Small Camera Preview Window */}
      {isCameraActive && (
        <div className="fixed top-72 left-5 z-[9998] w-80 h-60 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-gray-300">
          {/* Header Bar */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-black/70 backdrop-blur-sm flex items-center justify-between px-3 z-10">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${detectionStatus.faceDetectionActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-white text-xs font-medium">AI Camera</span>
              {intelligentCameraService.isReady() && (
                <Brain className="w-3 h-3 text-cyan-400" title="AI Vision Active" />
              )}
              {detectionStatus.faceDetectionActive && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-xs">Detecting</span>
                </div>
              )}
              {recognitionResult?.isRecognized && recognitionResult.user && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-400 text-xs">{recognitionResult.user.name}</span>
                </div>
              )}
              {gestureResult && gestureResult.gestures.length > 0 && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-400 text-xs">
                    {mediaPipeGestureService.getGestureDescription(gestureResult.gestures[0].type)}
                  </span>
                </div>
              )}
              {documentAnalysis && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-orange-400" />
                  <span className="text-orange-400 text-xs">
                    {documentAnalysis.type} {documentAnalysis.isQuestion ? '❓' : '📄'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleManualAnalysis}
                disabled={isAnalyzing || !intelligentCameraService.isReady()}
                className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                title="Analyze what I can see"
              >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={analyzeDocument}
                disabled={isAnalyzing}
                className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                title="Analyze document/question"
              >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsGestureEnabled(!isGestureEnabled)}
                className={`text-white/80 hover:text-white transition-colors ${isGestureEnabled ? 'text-purple-400' : ''}`}
                title={`${isGestureEnabled ? 'Disable' : 'Enable'} gesture detection`}
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowUserManagement(true)}
                className="text-white/80 hover:text-white transition-colors"
                title="Manage recognized users"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCameraActive(false)}
                className="text-white/80 hover:text-white transition-colors"
                title="Close camera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Camera Feed */}
          <div className="w-full h-full relative">
            {error ? (
              <div className="flex items-center justify-center w-full h-full text-red-400 text-sm text-center p-4">
                <div className="text-center">
                  <CameraOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{error}</p>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }} // Mirror the video
                />
                {/* Face Detection Overlay */}
                {detectionStatus.faceDetectionActive && videoRef.current && (
                  <FaceDetectionOverlay
                    faces={currentFaces}
                    videoWidth={videoRef.current.videoWidth || 640}
                    videoHeight={videoRef.current.videoHeight || 480}
                    className="transform scale-x-[-1]" // Mirror to match video
                  />
                )}
              </>
            )}
          </div>

          {/* Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/70 backdrop-blur-sm flex items-center justify-between px-2">
            <span className="text-white/80 text-xs">
              {error ? 'Camera Error' : isAnalyzing ? 'Analyzing...' : 'Live Feed'}
            </span>
            <div className="flex items-center gap-2">
              {recognitionResult?.isRecognized && recognitionResult.user ? (
                <span className="text-blue-400 text-xs">
                  👋 {recognitionResult.user.name}
                </span>
              ) : detectionStatus.facesDetected > 0 ? (
                <>
                  <span className="text-green-400 text-xs">
                    👤 {detectionStatus.facesDetected} face{detectionStatus.facesDetected !== 1 ? 's' : ''}
                  </span>
                  {detectionStatus.dominantEmotion && (
                    <span className="text-yellow-400 text-xs">
                      😊 {detectionStatus.dominantEmotion}
                    </span>
                  )}
                  {recognitionResult?.isNewFace && (
                    <span className="text-orange-400 text-xs">
                      ❓ New
                    </span>
                  )}
                  {gestureResult && gestureResult.gestures.length > 0 && (
                    <span className="text-purple-400 text-xs">
                      🤚 {gestureResult.gestures[0].type}
                    </span>
                  )}
                  {isDocumentModeActive && (
                    <span className="text-orange-400 text-xs">
                      📄 Analyzing...
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-400 text-xs">
                  {detectionStatus.faceDetectionActive ? '👁️ Scanning...' : '❌ No Detection'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleCameraToggle; 