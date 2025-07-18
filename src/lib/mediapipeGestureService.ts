import { Camera } from '@mediapipe/camera_utils';
import { Hands, Results } from '@mediapipe/hands';

export interface HandGesture {
  type: 'wave' | 'thumbsUp' | 'thumbsDown' | 'peace' | 'pointing' | 'openPalm' | 'fist' | 'ok' | 'unknown';
  confidence: number;
  hand: 'left' | 'right';
  landmarks: Array<{x: number, y: number, z: number}>;
}

export interface GestureDetectionResult {
  gestures: HandGesture[];
  timestamp: number;
  automaticResponse?: {
    trigger: string;
    message: string;
    shouldSpeak: boolean;
  };
}

export class MediaPipeGestureService {
  private hands: Hands | null = null;
  private camera: Camera | null = null;
  private isInitialized = false;
  private videoElement: HTMLVideoElement | null = null;
  private onGestureDetected?: (result: GestureDetectionResult) => void;
  private lastGestureTime = 0;
  private gestureDebounceMs = 2000; // Prevent rapid repeated gestures
  private lastDetectedGesture: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      console.log('🤚 Initializing MediaPipe Hands...');

      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.hands.onResults(this.onResults.bind(this));

      this.isInitialized = true;
      console.log('✅ MediaPipe Hands initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe Hands:', error);
      return false;
    }
  }

  attachVideo(videoElement: HTMLVideoElement, onGestureDetected?: (result: GestureDetectionResult) => void): void {
    this.videoElement = videoElement;
    this.onGestureDetected = onGestureDetected;

    if (this.hands && videoElement) {
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.hands) {
            await this.hands.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });
      
      console.log('📹 MediaPipe camera attached to video element');
    }
  }

  private onResults(results: Results): void {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return;
    }

    const gestures: HandGesture[] = [];
    
    results.multiHandLandmarks.forEach((landmarks, index) => {
      const handedness = results.multiHandedness?.[index];
      const hand = handedness?.label?.toLowerCase() === 'left' ? 'right' : 'left'; // MediaPipe flips hands
      
      const gesture = this.classifyGesture(landmarks);
      if (gesture.type !== 'unknown') {
        gestures.push({
          ...gesture,
          hand,
          landmarks: landmarks.map(point => ({
            x: point.x,
            y: point.y,
            z: point.z || 0
          }))
        });
      }
    });

    if (gestures.length > 0) {
      const result: GestureDetectionResult = {
        gestures,
        timestamp: Date.now()
      };

      // Check for automatic responses
      this.checkForAutomaticResponses(result);

      if (this.onGestureDetected) {
        this.onGestureDetected(result);
      }
    }
  }

  private classifyGesture(landmarks: Array<{x: number, y: number, z?: number}>): Omit<HandGesture, 'hand' | 'landmarks'> {
    // Extract key landmark points
    const thumb_tip = landmarks[4];
    const thumb_ip = landmarks[3];
    const index_tip = landmarks[8];
    const index_pip = landmarks[6];
    const middle_tip = landmarks[12];
    const middle_pip = landmarks[10];
    const ring_tip = landmarks[16];
    const ring_pip = landmarks[14];
    const pinky_tip = landmarks[20];
    const pinky_pip = landmarks[18];
    const wrist = landmarks[0];

    // Helper function to check if finger is extended
    const isFingerExtended = (tip: any, pip: any) => {
      return tip.y < pip.y; // Tip is above PIP joint
    };

    // Count extended fingers
    const thumbExtended = thumb_tip.x > thumb_ip.x; // Thumb logic is different
    const indexExtended = isFingerExtended(index_tip, index_pip);
    const middleExtended = isFingerExtended(middle_tip, middle_pip);
    const ringExtended = isFingerExtended(ring_tip, ring_pip);
    const pinkyExtended = isFingerExtended(pinky_tip, pinky_pip);

    const extendedCount = [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

    // Wave detection (moving hand left-right with open palm)
    if (extendedCount >= 4) {
      const handMovement = this.detectHandMovement(landmarks);
      if (handMovement.isWaving) {
        return { type: 'wave', confidence: 0.9 };
      }
      return { type: 'openPalm', confidence: 0.8 };
    }

    // Thumbs up
    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return { type: 'thumbsUp', confidence: 0.9 };
    }

    // Thumbs down (thumb pointing down)
    if (!thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      if (thumb_tip.y > thumb_ip.y) {
        return { type: 'thumbsDown', confidence: 0.8 };
      }
    }

    // Peace sign (index and middle extended)
    if (!thumbExtended && indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return { type: 'peace', confidence: 0.9 };
    }

    // Pointing (only index extended)
    if (!thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return { type: 'pointing', confidence: 0.8 };
    }

    // OK sign (thumb and index forming circle)
    if (this.isOKGesture(landmarks)) {
      return { type: 'ok', confidence: 0.9 };
    }

    // Fist (no fingers extended)
    if (extendedCount === 0) {
      return { type: 'fist', confidence: 0.7 };
    }

    return { type: 'unknown', confidence: 0.0 };
  }

  private detectHandMovement(landmarks: Array<{x: number, y: number, z?: number}>): { isWaving: boolean } {
    // Simple wave detection - could be enhanced with temporal tracking
    const wrist = landmarks[0];
    const middle_mcp = landmarks[9];
    
    // Check if hand is relatively stable vertically but could move horizontally
    const handSpread = Math.abs(landmarks[4].x - landmarks[20].x); // thumb to pinky spread
    
    return {
      isWaving: handSpread > 0.15 // Wide hand spread indicates open palm suitable for waving
    };
  }

  private isOKGesture(landmarks: Array<{x: number, y: number, z?: number}>): boolean {
    const thumb_tip = landmarks[4];
    const index_tip = landmarks[8];
    
    // Check if thumb and index tips are close together
    const distance = Math.sqrt(
      Math.pow(thumb_tip.x - index_tip.x, 2) + 
      Math.pow(thumb_tip.y - index_tip.y, 2)
    );
    
    return distance < 0.08; // Threshold for fingertips being close
  }

  private checkForAutomaticResponses(result: GestureDetectionResult): void {
    const now = Date.now();
    
    // Debounce rapid gestures
    if (now - this.lastGestureTime < this.gestureDebounceMs) {
      return;
    }

    const primaryGesture = result.gestures[0];
    if (!primaryGesture) return;

    // Check if this is the same gesture as last time
    if (this.lastDetectedGesture === primaryGesture.type) {
      return;
    }

    let automaticResponse: GestureDetectionResult['automaticResponse'] | undefined;

    switch (primaryGesture.type) {
      case 'wave':
        automaticResponse = this.generateWaveResponse();
        break;
      case 'thumbsUp':
        automaticResponse = {
          trigger: 'thumbsUp',
          message: "I see your thumbs up! That's great! Thanks for the positive feedback! What would you like to talk about?",
          shouldSpeak: true
        };
        break;
      case 'peace':
        automaticResponse = {
          trigger: 'peace',
          message: "Peace! ✌️ I see your peace sign. Spread love and good vibes! How are you feeling today?",
          shouldSpeak: true
        };
        break;
      case 'pointing':
        automaticResponse = {
          trigger: 'pointing',
          message: "I see you pointing! Are you trying to show me something? What would you like me to look at? Tell me more!",
          shouldSpeak: true
        };
        break;
      case 'ok':
        automaticResponse = {
          trigger: 'ok',
          message: "Got it! I see your OK sign. Everything looks good to me too! What's on your mind?",
          shouldSpeak: true
        };
        break;
    }

    if (automaticResponse) {
      result.automaticResponse = automaticResponse;
      this.lastGestureTime = now;
      this.lastDetectedGesture = primaryGesture.type;
      
      console.log('🤚 Automatic gesture response triggered:', primaryGesture.type);
    }
  }

  private generateWaveResponse(): GestureDetectionResult['automaticResponse'] {
    // Get user context if available
    const userContext = (window as any).getVisionContext?.();
    const recognizedUser = userContext?.recognizedUser;

    if (recognizedUser) {
      // Personalized wave response
      const responses = [
        `Hi ${recognizedUser.name}! I see you waving at me! How are you doing today?`,
        `Hello ${recognizedUser.name}! Great to see you again! Thanks for the wave!`,
        `Hey there, ${recognizedUser.name}! I'm so happy to see you waving!`,
        `Hi ${recognizedUser.name}! Waving back at you! Hope you're having a wonderful day!`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return {
        trigger: 'wave',
        message: randomResponse,
        shouldSpeak: true
      };
    } else {
      // Generic wave response that encourages interaction
      const responses = [
        "Hi there! I see you waving at me! I'm your AI assistant. What's your name so I can remember you?",
        "Hello! Thanks for the wave! I'm excited to meet you! Could you tell me your name?",
        "Hey! I see your wave! I'm waving back! I'd love to know who you are!",
        "Hi! Great to meet you! I can see you waving - what should I call you?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return {
        trigger: 'wave',
        message: randomResponse,
        shouldSpeak: true
      };
    }
  }

  startDetection(): void {
    if (this.camera) {
      this.camera.start();
      console.log('🤚 Hand gesture detection started');
    }
  }

  stopDetection(): void {
    if (this.camera) {
      this.camera.stop();
      console.log('🤚 Hand gesture detection stopped');
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  destroy(): void {
    this.stopDetection();
    this.hands = null;
    this.camera = null;
    this.videoElement = null;
    this.onGestureDetected = undefined;
    this.isInitialized = false;
  }

  // Get gesture description for UI display
  getGestureDescription(gestureType: HandGesture['type']): string {
    const descriptions = {
      wave: '👋 Waving',
      thumbsUp: '👍 Thumbs Up',
      thumbsDown: '👎 Thumbs Down',
      peace: '✌️ Peace Sign',
      pointing: '👉 Pointing',
      openPalm: '✋ Open Palm',
      fist: '✊ Fist',
      ok: '👌 OK Sign',
      unknown: '❓ Unknown'
    };
    
    return descriptions[gestureType] || '❓ Unknown';
  }
}

// Export singleton instance
export const mediaPipeGestureService = new MediaPipeGestureService(); 