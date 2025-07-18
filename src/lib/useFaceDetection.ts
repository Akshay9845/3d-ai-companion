import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceDetectionConfig, FaceDetectionResult, faceDetectionService } from './faceDetectionService';
import { MediaPipeResult, mediaPipeService } from './mediaPipeService';

export interface FaceDetectionHookConfig extends FaceDetectionConfig {
  enableMediaPipe?: boolean;
  autoStart?: boolean;
  processingInterval?: number;
}

export interface FaceDetectionState {
  isInitialized: boolean;
  isProcessing: boolean;
  faces: FaceDetectionResult | null;
  mediaPipeResult: MediaPipeResult | null;
  error: string | null;
  dominantEmotion: string | null;
  faceCount: number;
  averageAge: number | null;
  dominantGender: string | null;
}

export const useFaceDetection = (config: FaceDetectionHookConfig = {}) => {
  const [state, setState] = useState<FaceDetectionState>({
    isInitialized: false,
    isProcessing: false,
    faces: null,
    mediaPipeResult: null,
    error: null,
    dominantEmotion: null,
    faceCount: 0,
    averageAge: null,
    dominantGender: null
  });

  const processingRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const configRef = useRef(config);

  // Update config reference
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Initialize face detection service
      const faceApiSuccess = await faceDetectionService.initialize();
      
      // Initialize MediaPipe if enabled
      let mediaPipeSuccess = true;
      if (config.enableMediaPipe) {
        mediaPipeSuccess = await mediaPipeService.initialize();
      }

      if (faceApiSuccess || mediaPipeSuccess) {
        setState(prev => ({ ...prev, isInitialized: true }));
        
        if (config.autoStart) {
          startProcessing();
        }
      } else {
        throw new Error('Failed to initialize any face detection service');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));
    }
  }, [config.enableMediaPipe, config.autoStart]);

  const startProcessing = useCallback(() => {
    if (!state.isInitialized || state.isProcessing) return;

    setState(prev => ({ ...prev, isProcessing: true }));
    
    const processFrame = async () => {
      if (!videoRef.current) return;

      try {
        let faceResult: FaceDetectionResult | null = null;
        let mediaPipeResult: MediaPipeResult | null = null;

        // Process with face-api.js
        if (faceDetectionService.isReady()) {
          faceResult = await faceDetectionService.detectFaces(videoRef.current);
        }

        // Process with MediaPipe if enabled
        if (configRef.current.enableMediaPipe && mediaPipeService.isReady()) {
          mediaPipeResult = await mediaPipeService.processVideo(videoRef.current);
        }

        // Update state with results
        if (faceResult || mediaPipeResult) {
          const faces = faceResult?.faces || mediaPipeResult?.faces || [];
          
          // Calculate statistics
          const faceCount = faces.length;
          const dominantEmotion = calculateDominantEmotion(faces);
          const averageAge = calculateAverageAge(faces);
          const dominantGender = calculateDominantGender(faces);

          setState(prev => ({
            ...prev,
            faces: faceResult,
            mediaPipeResult,
            faceCount,
            dominantEmotion,
            averageAge,
            dominantGender,
            error: null
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Processing failed'
        }));
      }
    };

    // Start processing loop
    const interval = configRef.current.processingInterval || 200;
    processingRef.current = window.setInterval(processFrame, interval);
  }, [state.isInitialized, state.isProcessing]);

  const stopProcessing = useCallback(() => {
    if (processingRef.current) {
      clearInterval(processingRef.current);
      processingRef.current = null;
    }
    setState(prev => ({ ...prev, isProcessing: false }));
  }, []);

  const attachVideo = useCallback((videoElement: HTMLVideoElement) => {
    videoRef.current = videoElement;
  }, []);

  const detachVideo = useCallback(() => {
    videoRef.current = null;
    stopProcessing();
  }, [stopProcessing]);

  const updateConfig = useCallback((newConfig: Partial<FaceDetectionHookConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };
    
    // Update service configs
    faceDetectionService.updateConfig(newConfig);
    if (newConfig.enableMediaPipe) {
      mediaPipeService.updateConfig(newConfig);
    }
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const getEmotionDistribution = useCallback(() => {
    if (!state.faces?.faces) return {};

    const emotionCounts: { [emotion: string]: number } = {};
    let totalFaces = 0;

    state.faces.faces.forEach(face => {
      if (face.emotions) {
        totalFaces++;
        Object.entries(face.emotions).forEach(([emotion, score]) => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + score;
        });
      }
    });

    // Calculate averages
    const emotionDistribution: { [emotion: string]: number } = {};
    Object.entries(emotionCounts).forEach(([emotion, total]) => {
      emotionDistribution[emotion] = totalFaces > 0 ? total / totalFaces : 0;
    });

    return emotionDistribution;
  }, [state.faces]);

  const getGenderDistribution = useCallback(() => {
    if (!state.faces?.faces) return { male: 0, female: 0 };

    const genderCounts = { male: 0, female: 0 };
    
    state.faces.faces.forEach(face => {
      if (face.gender) {
        if (face.gender === 'male') genderCounts.male++;
        else if (face.gender === 'female') genderCounts.female++;
      }
    });

    return genderCounts;
  }, [state.faces]);

  // Auto-initialize if configured
  useEffect(() => {
    if (config.autoStart && !state.isInitialized) {
      initialize();
    }
  }, [config.autoStart, state.isInitialized, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProcessing();
      faceDetectionService.destroy();
      if (config.enableMediaPipe) {
        mediaPipeService.destroy();
      }
    };
  }, [stopProcessing, config.enableMediaPipe]);

  return {
    // State
    ...state,
    
    // Methods
    initialize,
    startProcessing,
    stopProcessing,
    attachVideo,
    detachVideo,
    updateConfig,
    captureFrame,
    
    // Utilities
    getEmotionDistribution,
    getGenderDistribution,
    
    // Computed properties
    hasActiveFaces: state.faceCount > 0,
    processingMode: state.faces?.processedWith || 'none',
    isReady: state.isInitialized && (faceDetectionService.isReady() || mediaPipeService.isReady())
  };
};

// Helper functions
function calculateDominantEmotion(faces: any[]): string | null {
  if (!faces || faces.length === 0) return null;

  const emotionTotals: { [emotion: string]: number } = {};
  let faceCount = 0;

  faces.forEach(face => {
    if (face.emotions) {
      faceCount++;
      Object.entries(face.emotions).forEach(([emotion, score]) => {
        emotionTotals[emotion] = (emotionTotals[emotion] || 0) + (score as number);
      });
    }
  });

  if (faceCount === 0) return null;

  // Find emotion with highest average score
  let maxEmotion = 'neutral';
  let maxScore = 0;

  Object.entries(emotionTotals).forEach(([emotion, total]) => {
    const average = total / faceCount;
    if (average > maxScore) {
      maxScore = average;
      maxEmotion = emotion;
    }
  });

  return maxEmotion;
}

function calculateAverageAge(faces: any[]): number | null {
  if (!faces || faces.length === 0) return null;

  const agesWithValues = faces.filter(face => face.age !== undefined);
  if (agesWithValues.length === 0) return null;

  const totalAge = agesWithValues.reduce((sum, face) => sum + face.age, 0);
  return Math.round(totalAge / agesWithValues.length);
}

function calculateDominantGender(faces: any[]): string | null {
  if (!faces || faces.length === 0) return null;

  const genderCounts = { male: 0, female: 0 };
  
  faces.forEach(face => {
    if (face.gender) {
      if (face.gender === 'male') genderCounts.male++;
      else if (face.gender === 'female') genderCounts.female++;
    }
  });

  if (genderCounts.male === 0 && genderCounts.female === 0) return null;
  
  return genderCounts.male > genderCounts.female ? 'male' : 'female';
} 