import { faceDetectionService } from './faceDetectionService';

export interface CameraAnalysisResult {
  faces: {
    count: number;
    emotions: string[];
    ages: number[];
    genders: string[];
    dominantEmotion: string | null;
  };
  scene: {
    objects: Array<{ name: string; confidence: number }>;
    text: string[];
    description: string;
  };
  timestamp: number;
}

export interface VisionAnalysisOptions {
  includeFaceDetection?: boolean;
  includeObjectDetection?: boolean;
  includeTextDetection?: boolean;
  includeSceneDescription?: boolean;
  googleVisionApiKey?: string;
}

export class IntelligentCameraService {
  private isInitialized = false;
  private currentVideoElement: HTMLVideoElement | null = null;
  private lastAnalysisResult: CameraAnalysisResult | null = null;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initializing Intelligent Camera Service...');
      
      // Initialize face detection service
      const faceSuccess = await faceDetectionService.initialize();
      
      this.isInitialized = faceSuccess;
      console.log('✅ Intelligent Camera Service initialized:', this.isInitialized);
      return this.isInitialized;
    } catch (error) {
      console.error('❌ Failed to initialize Intelligent Camera Service:', error);
      return false;
    }
  }

  attachVideo(videoElement: HTMLVideoElement): void {
    this.currentVideoElement = videoElement;
    console.log('📹 Video element attached to Intelligent Camera Service');
  }

  detachVideo(): void {
    this.currentVideoElement = null;
    console.log('📹 Video element detached from Intelligent Camera Service');
  }

  async analyzeCurrentView(options: VisionAnalysisOptions = {}): Promise<CameraAnalysisResult | null> {
    if (!this.isInitialized || !this.currentVideoElement) {
      console.warn('Intelligent Camera Service not ready for analysis');
      return null;
    }

    try {
      const result: CameraAnalysisResult = {
        faces: {
          count: 0,
          emotions: [],
          ages: [],
          genders: [],
          dominantEmotion: null
        },
        scene: {
          objects: [],
          text: [],
          description: ''
        },
        timestamp: Date.now()
      };

      // Face Detection Analysis
      if (options.includeFaceDetection !== false) {
        const faceResult = await this.analyzeFaces();
        if (faceResult) {
          result.faces = faceResult;
        }
      }

      // Google Vision API Analysis
      if (options.googleVisionApiKey && (options.includeObjectDetection || options.includeTextDetection || options.includeSceneDescription)) {
        const visionResult = await this.analyzeWithGoogleVision(options.googleVisionApiKey, options);
        if (visionResult) {
          result.scene = { ...result.scene, ...visionResult };
        }
      }

      this.lastAnalysisResult = result;
      return result;
    } catch (error) {
      console.error('Error analyzing camera view:', error);
      return null;
    }
  }

  private async analyzeFaces(): Promise<CameraAnalysisResult['faces'] | null> {
    if (!this.currentVideoElement) return null;

    try {
      const faceResult = await faceDetectionService.detectFaces(this.currentVideoElement);
      
      if (!faceResult || !faceResult.faces.length) {
        return {
          count: 0,
          emotions: [],
          ages: [],
          genders: [],
          dominantEmotion: null
        };
      }

      const emotions = faceResult.faces.map(face => {
        if (face.emotions) {
          return faceDetectionService.getDominantEmotion(face.emotions);
        }
        return 'neutral';
      });

      const ages = faceResult.faces.filter(face => face.age !== undefined).map(face => face.age!);
      const genders = faceResult.faces.filter(face => face.gender).map(face => face.gender!);

      const emotionCounts: { [key: string]: number } = {};
      emotions.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });

      const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) => 
        emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b
      )?.[0] || null;

      return {
        count: faceResult.faces.length,
        emotions: emotions,
        ages: ages,
        genders: genders,
        dominantEmotion: dominantEmotion
      };
    } catch (error) {
      console.error('Face analysis error:', error);
      return null;
    }
  }

  private async analyzeWithGoogleVision(
    apiKey: string, 
    options: VisionAnalysisOptions
  ): Promise<Partial<CameraAnalysisResult['scene']> | null> {
    if (!this.currentVideoElement) return null;

    try {
      // Capture current frame
      const imageData = this.captureFrame();
      if (!imageData) return null;

      const features = [];
      
      if (options.includeObjectDetection !== false) {
        features.push({ type: 'OBJECT_LOCALIZATION', maxResults: 10 });
      }
      
      if (options.includeTextDetection) {
        features.push({ type: 'TEXT_DETECTION' });
      }

      if (options.includeSceneDescription !== false) {
        features.push({ type: 'LABEL_DETECTION', maxResults: 10 });
      }

      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: imageData
            },
            features: features
          }]
        })
      });

      const result = await response.json();
      
      if (!result.responses?.[0]) {
        console.warn('No response from Google Vision API');
        return null;
      }

      const visionData = result.responses[0];
      const sceneResult: Partial<CameraAnalysisResult['scene']> = {};

      // Process object detection
      if (visionData.localizedObjectAnnotations) {
        sceneResult.objects = visionData.localizedObjectAnnotations.map((obj: any) => ({
          name: obj.name,
          confidence: obj.score
        }));
      }

      // Process text detection
      if (visionData.textAnnotations && visionData.textAnnotations.length > 0) {
        sceneResult.text = visionData.textAnnotations.slice(1).map((text: any) => text.description);
      }

      // Process scene description from labels
      if (visionData.labelAnnotations) {
        const labels = visionData.labelAnnotations
          .filter((label: any) => label.score > 0.7)
          .map((label: any) => label.description)
          .slice(0, 5);
        
        sceneResult.description = labels.join(', ');
      }

      return sceneResult;
    } catch (error) {
      console.error('Google Vision API error:', error);
      return null;
    }
  }

  private captureFrame(): string | null {
    if (!this.currentVideoElement) return null;

    try {
      this.canvas.width = this.currentVideoElement.videoWidth;
      this.canvas.height = this.currentVideoElement.videoHeight;
      this.context.drawImage(this.currentVideoElement, 0, 0);
      
      return this.canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }

  generateDescription(analysis: CameraAnalysisResult): string {
    const descriptions: string[] = [];

    // Face detection description
    if (analysis.faces.count > 0) {
      if (analysis.faces.count === 1) {
        descriptions.push(`I can see you in the camera`);
        
        if (analysis.faces.dominantEmotion && analysis.faces.dominantEmotion !== 'neutral') {
          descriptions.push(`You appear to be ${analysis.faces.dominantEmotion}`);
        }

        if (analysis.faces.ages.length > 0) {
          descriptions.push(`You look around ${analysis.faces.ages[0]} years old`);
        }
      } else {
        descriptions.push(`I can see ${analysis.faces.count} people in the camera`);
        
        if (analysis.faces.dominantEmotion) {
          descriptions.push(`The overall mood seems ${analysis.faces.dominantEmotion}`);
        }
      }
    } else {
      descriptions.push(`I don't see any faces in the camera right now`);
    }

    // Scene description
    if (analysis.scene.objects.length > 0) {
      const topObjects = analysis.scene.objects
        .filter(obj => obj.confidence > 0.6)
        .slice(0, 3)
        .map(obj => obj.name);
      
      if (topObjects.length > 0) {
        descriptions.push(`I can also see: ${topObjects.join(', ')}`);
      }
    }

    if (analysis.scene.description) {
      descriptions.push(`The scene appears to contain: ${analysis.scene.description}`);
    }

    if (analysis.scene.text.length > 0) {
      const uniqueText = [...new Set(analysis.scene.text)].slice(0, 3);
      descriptions.push(`I can read some text: "${uniqueText.join('", "')}"`);
    }

    return descriptions.length > 0 
      ? descriptions.join('. ') + '.'
      : "I can see the camera feed but I'm having trouble analyzing what's in view right now.";
  }

  getLastAnalysisResult(): CameraAnalysisResult | null {
    return this.lastAnalysisResult;
  }

  isReady(): boolean {
    return this.isInitialized && this.currentVideoElement !== null;
  }

  destroy(): void {
    this.isInitialized = false;
    this.currentVideoElement = null;
    this.lastAnalysisResult = null;
  }
}

// Export singleton instance
export const intelligentCameraService = new IntelligentCameraService(); 