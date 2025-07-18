import * as faceapi from 'face-api.js';
import { GoogleVisionFaceAnnotation } from './googleTypes';

export interface FaceDetectionResult {
  faces: DetectedFace[];
  timestamp: number;
  processedWith: 'face-api' | 'google-vision' | 'mediapipe';
}

export interface DetectedFace {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Array<{ x: number; y: number }>;
  emotions?: {
    [emotion: string]: number;
  };
  age?: number;
  gender?: string;
  genderProbability?: number;
  confidence: number;
}

export interface FaceDetectionConfig {
  enableEmotions?: boolean;
  enableAgeGender?: boolean;
  enableLandmarks?: boolean;
  minConfidence?: number;
  maxFaces?: number;
  processInterval?: number;
  useGoogleVision?: boolean;
  useMediaPipe?: boolean;
  googleVisionApiKey?: string;
}

export class FaceDetectionService {
  private isInitialized = false;
  private config: FaceDetectionConfig;
  private lastProcessTime = 0;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(config: FaceDetectionConfig = {}) {
    this.config = {
      enableEmotions: true,
      enableAgeGender: true,
      enableLandmarks: true,
      minConfidence: 0.5,
      maxFaces: 5,
      processInterval: 100, // ms
      useGoogleVision: false,
      useMediaPipe: false,
      ...config
    };

    // Create canvas for processing
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initializing Face Detection Service...');
      
      // Load face-api.js models - using static path for browser access
      const modelPath = '/static/models';
      console.log('📁 Loading models from:', modelPath);
      
      // Test if models are reachable first
      try {
        const testResponse = await fetch(`${modelPath}/tiny_face_detector_model-weights_manifest.json`);
        console.log('🧪 Model path test:', testResponse.ok ? 'SUCCESS' : 'FAILED', testResponse.status);
      } catch (testError) {
        console.warn('⚠️ Model path test failed:', testError);
      }

      // Load models one by one with detailed error reporting
      console.log('📦 Loading TinyFaceDetector...');
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
      console.log('✅ TinyFaceDetector loaded');

      console.log('📦 Loading FaceLandmark68Net...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
      console.log('✅ FaceLandmark68Net loaded');

      console.log('📦 Loading FaceRecognitionNet...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
      console.log('✅ FaceRecognitionNet loaded');

      if (this.config.enableEmotions) {
        console.log('📦 Loading FaceExpressionNet...');
        await faceapi.nets.faceExpressionNet.loadFromUri(modelPath);
        console.log('✅ FaceExpressionNet loaded');
      }

      if (this.config.enableAgeGender) {
        console.log('📦 Loading AgeGenderNet...');
        await faceapi.nets.ageGenderNet.loadFromUri(modelPath);
        console.log('✅ AgeGenderNet loaded');
      }

      console.log('✅ All face-api.js models loaded successfully');

      // Initialize MediaPipe if enabled
      if (this.config.useMediaPipe) {
        await this.initializeMediaPipe();
      }

      this.isInitialized = true;
      console.log('✅ Face Detection Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Face Detection Service:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  private async initializeMediaPipe(): Promise<void> {
    try {
      // TODO: Initialize MediaPipe FaceDetection
      // const { FaceDetection } = await import('@mediapipe/face_detection');
      console.log('📝 MediaPipe initialization placeholder');
    } catch (error) {
      console.error('❌ MediaPipe initialization failed:', error);
    }
  }

  async detectFaces(videoElement: HTMLVideoElement): Promise<FaceDetectionResult | null> {
    if (!this.isInitialized) {
      console.warn('Face Detection Service not initialized');
      return null;
    }

    const now = Date.now();
    if (now - this.lastProcessTime < this.config.processInterval!) {
      return null; // Skip processing to maintain performance
    }
    this.lastProcessTime = now;

    try {
      // Primary detection with face-api.js
      const faceApiResult = await this.detectWithFaceApi(videoElement);
      
      if (faceApiResult) {
        return faceApiResult;
      }

      // Fallback to Google Vision if enabled
      if (this.config.useGoogleVision) {
        return await this.detectWithGoogleVision(videoElement);
      }

      return null;
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }

  private async detectWithFaceApi(videoElement: HTMLVideoElement): Promise<FaceDetectionResult | null> {
    try {
      // Create detection options
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: this.config.minConfidence!
      });

      // Build detection pipeline
      let detection = faceapi.detectAllFaces(videoElement, options);

      if (this.config.enableLandmarks) {
        detection = detection.withFaceLandmarks();
      }

      if (this.config.enableEmotions) {
        detection = detection.withFaceExpressions();
      }

      if (this.config.enableAgeGender) {
        detection = detection.withAgeAndGender();
      }

      const results = await detection;

      if (!results || results.length === 0) {
        return null;
      }

      // Convert to our format
      const faces: DetectedFace[] = results.slice(0, this.config.maxFaces!).map(result => {
        const box = result.detection.box;
        const face: DetectedFace = {
          boundingBox: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          },
          confidence: result.detection.score
        };

        // Add landmarks if available
        if ('landmarks' in result && result.landmarks) {
          face.landmarks = result.landmarks.positions.map(pos => ({
            x: pos.x,
            y: pos.y
          }));
        }

        // Add emotions if available
        if ('expressions' in result && result.expressions) {
          face.emotions = result.expressions;
        }

        // Add age/gender if available
        if ('age' in result && result.age !== undefined) {
          face.age = Math.round(result.age);
        }
        if ('gender' in result && result.gender) {
          face.gender = result.gender;
          face.genderProbability = result.genderProbability;
        }

        return face;
      });

      return {
        faces,
        timestamp: Date.now(),
        processedWith: 'face-api'
      };
    } catch (error) {
      console.error('face-api.js detection error:', error);
      return null;
    }
  }

  private async detectWithGoogleVision(videoElement: HTMLVideoElement): Promise<FaceDetectionResult | null> {
    try {
      if (!this.config.googleVisionApiKey) {
        console.warn('Google Vision API key not provided');
        return null;
      }

      // Convert video frame to base64
      const imageData = this.captureVideoFrame(videoElement);
      
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.config.googleVisionApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: imageData
            },
            features: [{
              type: 'FACE_DETECTION',
              maxResults: this.config.maxFaces
            }]
          }]
        })
      });

      const result = await response.json();
      
      if (result.responses?.[0]?.faceAnnotations) {
        const faces: DetectedFace[] = result.responses[0].faceAnnotations.map((face: GoogleVisionFaceAnnotation) => ({
          boundingBox: {
            x: face.boundingPoly.vertices[0].x,
            y: face.boundingPoly.vertices[0].y,
            width: face.boundingPoly.vertices[2].x - face.boundingPoly.vertices[0].x,
            height: face.boundingPoly.vertices[2].y - face.boundingPoly.vertices[0].y
          },
          landmarks: face.landmarks?.map(landmark => ({
            x: landmark.position.x,
            y: landmark.position.y
          })),
          emotions: {
            joy: this.convertLikelihoodToScore(face.joyLikelihood),
            sorrow: this.convertLikelihoodToScore(face.sorrowLikelihood),
            anger: this.convertLikelihoodToScore(face.angerLikelihood),
            surprise: this.convertLikelihoodToScore(face.surpriseLikelihood)
          },
          confidence: face.detectionConfidence
        }));

        return {
          faces,
          timestamp: Date.now(),
          processedWith: 'google-vision'
        };
      }

      return null;
    } catch (error) {
      console.error('Google Vision API error:', error);
      return null;
    }
  }

  private captureVideoFrame(videoElement: HTMLVideoElement): string {
    this.canvas.width = videoElement.videoWidth;
    this.canvas.height = videoElement.videoHeight;
    this.context.drawImage(videoElement, 0, 0);
    
    return this.canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }

  private convertLikelihoodToScore(likelihood: string): number {
    const map: { [key: string]: number } = {
      'VERY_UNLIKELY': 0.1,
      'UNLIKELY': 0.3,
      'POSSIBLE': 0.5,
      'LIKELY': 0.7,
      'VERY_LIKELY': 0.9,
      'UNKNOWN': 0.5
    };
    return map[likelihood] || 0.5;
  }

  getDominantEmotion(emotions: { [emotion: string]: number }): string {
    let maxEmotion = 'neutral';
    let maxScore = 0;

    for (const [emotion, score] of Object.entries(emotions)) {
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    }

    return maxEmotion;
  }

  updateConfig(newConfig: Partial<FaceDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  destroy(): void {
    this.isInitialized = false;
    // Cleanup resources if needed
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService(); 