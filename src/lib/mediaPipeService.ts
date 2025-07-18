import { DetectedFace } from './faceDetectionService';

export interface MediaPipeConfig {
  enableFaceDetection?: boolean;
  enableFaceMesh?: boolean;
  enableHolistic?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  maxNumFaces?: number;
}

export interface MediaPipeResult {
  faces?: DetectedFace[];
  faceMesh?: Array<{ x: number; y: number; z?: number }>;
  pose?: {
    landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }>;
    worldLandmarks?: Array<{ x: number; y: number; z: number }>;
  };
  hands?: {
    left?: Array<{ x: number; y: number; z?: number }>;
    right?: Array<{ x: number; y: number; z?: number }>;
  };
  timestamp: number;
}

declare global {
  interface Window {
    MediaPipeHolistic?: any;
    MediaPipeFaceDetection?: any;
    MediaPipeFaceMesh?: any;
  }
}

export class MediaPipeService {
  private isInitialized = false;
  private config: MediaPipeConfig;
  private holisticDetector: any;
  private faceDetector: any;
  private faceMeshDetector: any;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(config: MediaPipeConfig = {}) {
    this.config = {
      enableFaceDetection: true,
      enableFaceMesh: true,
      enableHolistic: false,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
      maxNumFaces: 2,
      ...config
    };

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initializing MediaPipe Service...');

      // Load MediaPipe scripts dynamically
      await this.loadMediaPipeScripts();

      // Initialize detectors based on config
      if (this.config.enableFaceDetection) {
        await this.initializeFaceDetection();
      }

      if (this.config.enableFaceMesh) {
        await this.initializeFaceMesh();
      }

      if (this.config.enableHolistic) {
        await this.initializeHolistic();
      }

      this.isInitialized = true;
      console.log('✅ MediaPipe Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe Service:', error);
      return false;
    }
  }

  private async loadMediaPipeScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.MediaPipeHolistic || window.MediaPipeFaceDetection) {
        resolve();
        return;
      }

      // Load MediaPipe from CDN
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
      ];

      let loaded = 0;
      scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          loaded++;
          if (loaded === scripts.length) {
            resolve();
          }
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    });
  }

  private async initializeFaceDetection(): Promise<void> {
    if (!window.MediaPipeFaceDetection) {
      throw new Error('MediaPipe FaceDetection not loaded');
    }

    this.faceDetector = new window.MediaPipeFaceDetection.FaceDetection({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
    });

    this.faceDetector.setOptions({
      model: 'short',
      minDetectionConfidence: this.config.minDetectionConfidence
    });

    console.log('✅ MediaPipe Face Detection initialized');
  }

  private async initializeFaceMesh(): Promise<void> {
    if (!window.MediaPipeFaceMesh) {
      throw new Error('MediaPipe FaceMesh not loaded');
    }

    this.faceMeshDetector = new window.MediaPipeFaceMesh.FaceMesh({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    this.faceMeshDetector.setOptions({
      maxNumFaces: this.config.maxNumFaces,
      refineLandmarks: true,
      minDetectionConfidence: this.config.minDetectionConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence
    });

    console.log('✅ MediaPipe Face Mesh initialized');
  }

  private async initializeHolistic(): Promise<void> {
    if (!window.MediaPipeHolistic) {
      throw new Error('MediaPipe Holistic not loaded');
    }

    this.holisticDetector = new window.MediaPipeHolistic.Holistic({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
    });

    this.holisticDetector.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: true,
      refineFaceLandmarks: true,
      minDetectionConfidence: this.config.minDetectionConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence
    });

    console.log('✅ MediaPipe Holistic initialized');
  }

  async processVideo(videoElement: HTMLVideoElement): Promise<MediaPipeResult | null> {
    if (!this.isInitialized) {
      console.warn('MediaPipe Service not initialized');
      return null;
    }

    try {
      // Prepare canvas
      this.canvas.width = videoElement.videoWidth;
      this.canvas.height = videoElement.videoHeight;
      this.context.drawImage(videoElement, 0, 0);

      const result: MediaPipeResult = {
        timestamp: Date.now()
      };

      // Process with different detectors
      if (this.config.enableHolistic && this.holisticDetector) {
        const holisticResult = await this.processWithHolistic(videoElement);
        if (holisticResult) {
          result.faces = holisticResult.faces;
          result.pose = holisticResult.pose;
          result.hands = holisticResult.hands;
          result.faceMesh = holisticResult.faceMesh;
        }
      } else {
        // Process face detection separately
        if (this.config.enableFaceDetection && this.faceDetector) {
          const faces = await this.processWithFaceDetection(videoElement);
          if (faces) {
            result.faces = faces;
          }
        }

        // Process face mesh separately
        if (this.config.enableFaceMesh && this.faceMeshDetector) {
          const faceMesh = await this.processWithFaceMesh(videoElement);
          if (faceMesh) {
            result.faceMesh = faceMesh;
          }
        }
      }

      return result;
    } catch (error) {
      console.error('MediaPipe processing error:', error);
      return null;
    }
  }

  private async processWithHolistic(videoElement: HTMLVideoElement): Promise<MediaPipeResult | null> {
    return new Promise((resolve) => {
      this.holisticDetector.onResults((results: any) => {
        const processedResult: MediaPipeResult = {
          timestamp: Date.now()
        };

        // Process face landmarks
        if (results.faceLandmarks) {
          processedResult.faceMesh = results.faceLandmarks.map((landmark: any) => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z
          }));

          // Convert to face detection format
          processedResult.faces = [{
            boundingBox: this.calculateBoundingBox(results.faceLandmarks),
            landmarks: results.faceLandmarks.map((landmark: any) => ({
              x: landmark.x * videoElement.videoWidth,
              y: landmark.y * videoElement.videoHeight
            })),
            confidence: 0.9 // MediaPipe doesn't provide confidence for face landmarks
          }];
        }

        // Process pose landmarks
        if (results.poseLandmarks) {
          processedResult.pose = {
            landmarks: results.poseLandmarks.map((landmark: any) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z,
              visibility: landmark.visibility
            })),
            worldLandmarks: results.poseWorldLandmarks?.map((landmark: any) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z
            }))
          };
        }

        // Process hand landmarks
        if (results.leftHandLandmarks || results.rightHandLandmarks) {
          processedResult.hands = {};
          if (results.leftHandLandmarks) {
            processedResult.hands.left = results.leftHandLandmarks.map((landmark: any) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z
            }));
          }
          if (results.rightHandLandmarks) {
            processedResult.hands.right = results.rightHandLandmarks.map((landmark: any) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z
            }));
          }
        }

        resolve(processedResult);
      });

      this.holisticDetector.send({ image: videoElement });
    });
  }

  private async processWithFaceDetection(videoElement: HTMLVideoElement): Promise<DetectedFace[] | null> {
    return new Promise((resolve) => {
      this.faceDetector.onResults((results: any) => {
        if (results.detections && results.detections.length > 0) {
          const faces: DetectedFace[] = results.detections.map((detection: any) => ({
            boundingBox: {
              x: detection.boundingBox.xCenter * videoElement.videoWidth - (detection.boundingBox.width * videoElement.videoWidth) / 2,
              y: detection.boundingBox.yCenter * videoElement.videoHeight - (detection.boundingBox.height * videoElement.videoHeight) / 2,
              width: detection.boundingBox.width * videoElement.videoWidth,
              height: detection.boundingBox.height * videoElement.videoHeight
            },
            landmarks: detection.landmarks?.map((landmark: any) => ({
              x: landmark.x * videoElement.videoWidth,
              y: landmark.y * videoElement.videoHeight
            })),
            confidence: detection.score
          }));
          resolve(faces);
        } else {
          resolve(null);
        }
      });

      this.faceDetector.send({ image: videoElement });
    });
  }

  private async processWithFaceMesh(videoElement: HTMLVideoElement): Promise<Array<{ x: number; y: number; z?: number }> | null> {
    return new Promise((resolve) => {
      this.faceMeshDetector.onResults((results: any) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          // Return landmarks for the first face
          const landmarks = results.multiFaceLandmarks[0].map((landmark: any) => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z
          }));
          resolve(landmarks);
        } else {
          resolve(null);
        }
      });

      this.faceMeshDetector.send({ image: videoElement });
    });
  }

  private calculateBoundingBox(landmarks: Array<{ x: number; y: number }>): { x: number; y: number; width: number; height: number } {
    let minX = 1, minY = 1, maxX = 0, maxY = 0;

    landmarks.forEach(landmark => {
      minX = Math.min(minX, landmark.x);
      minY = Math.min(minY, landmark.y);
      maxX = Math.max(maxX, landmark.x);
      maxY = Math.max(maxY, landmark.y);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  startProcessing(): void {
    // Start continuous processing if needed
    console.log('MediaPipe processing started');
  }

  stopProcessing(): void {
    // Stop processing
    console.log('MediaPipe processing stopped');
  }

  updateConfig(newConfig: Partial<MediaPipeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update detector options if they exist
    if (this.faceDetector && newConfig.minDetectionConfidence !== undefined) {
      this.faceDetector.setOptions({
        minDetectionConfidence: newConfig.minDetectionConfidence
      });
    }

    if (this.faceMeshDetector) {
      if (newConfig.maxNumFaces !== undefined || newConfig.minDetectionConfidence !== undefined || newConfig.minTrackingConfidence !== undefined) {
        this.faceMeshDetector.setOptions({
          maxNumFaces: newConfig.maxNumFaces || this.config.maxNumFaces,
          minDetectionConfidence: newConfig.minDetectionConfidence || this.config.minDetectionConfidence,
          minTrackingConfidence: newConfig.minTrackingConfidence || this.config.minTrackingConfidence
        });
      }
    }

    if (this.holisticDetector) {
      if (newConfig.minDetectionConfidence !== undefined || newConfig.minTrackingConfidence !== undefined) {
        this.holisticDetector.setOptions({
          minDetectionConfidence: newConfig.minDetectionConfidence || this.config.minDetectionConfidence,
          minTrackingConfidence: newConfig.minTrackingConfidence || this.config.minTrackingConfidence
        });
      }
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  destroy(): void {
    this.isInitialized = false;
    
    // Clean up MediaPipe instances
    if (this.holisticDetector) {
      this.holisticDetector.close();
    }
    if (this.faceDetector) {
      this.faceDetector.close();
    }
    if (this.faceMeshDetector) {
      this.faceMeshDetector.close();
    }
  }
}

// Export singleton instance
export const mediaPipeService = new MediaPipeService(); 