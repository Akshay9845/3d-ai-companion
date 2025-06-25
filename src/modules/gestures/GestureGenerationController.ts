/**
 * Advanced Gesture Generation Controller
 * Text-to-motion synthesis for natural hand and body gestures
 * Integrates with HumanML3D dataset and motion retargeting
 */

export interface GestureRequest {
  text: string;
  emotion: string;
  intensity: number; // 0-1
  duration?: number; // seconds
  style?: 'formal' | 'casual' | 'energetic' | 'calm';
}

export interface GestureSequence {
  id: string;
  keyframes: GestureKeyframe[];
  duration: number;
  emotion: string;
  confidence: number;
}

export interface GestureKeyframe {
  timestamp: number; // seconds from start
  joints: {
    leftShoulder: { x: number; y: number; z: number; rotation: { x: number; y: number; z: number; w: number } };
    rightShoulder: { x: number; y: number; z: number; rotation: { x: number; y: number; z: number; w: number } };
    leftElbow: { x: number; y: number; z: number; rotation: { x: number; y: number; z: number; w: number } };
    rightElbow: { x: number; y: number; z: number; rotation: { x: number; y: number; z: number; w: number } };
    leftWrist: { x: number; y: number; z: number; rotation: { x: number; y: number; z: number; w: number } };
    rightWrist: { x: number; y: number; z: number; rotation: { x: number; y: number; z: number; w: number } };
    leftHand: { x: number; y: number; z: number; rotation: { x: number; y: number; z: number; w: number } };
    rightHand: { x: number; y: number; z: number; rotation: { x: number; y: number; z: number; w: number } };
    head: { x: number; y: number; z: number; rotation: { x: number; y: number; z: number; w: number } };
    spine: { x: number; y: number; z: number; rotation: { x: number; y: number; z: number; w: number } };
  };
  fingerPoses?: {
    leftHand: FingerPose;
    rightHand: FingerPose;
  };
}

export interface FingerPose {
  thumb: { bend: number; spread: number };
  index: { bend: number; spread: number };
  middle: { bend: number; spread: number };
  ring: { bend: number; spread: number };
  pinky: { bend: number; spread: number };
}

export interface GestureOptions {
  language: 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml';
  gestureIntensity: number; // 0-1
  enableHandGestures: boolean;
  enableBodyGestures: boolean;
  enableHeadGestures: boolean;
  smoothingFactor: number; // 0-1
  adaptToEmotion: boolean;
}

export class GestureGenerationController {
  private options: GestureOptions;
  private gestureLibrary: Map<string, GestureSequence[]> = new Map();
  private currentGesture: GestureSequence | null = null;
  private isGenerating: boolean = false;

  // Gesture patterns for different text types
  private readonly GESTURE_PATTERNS = {
    'greeting': {
      keywords: ['hello', 'hi', 'namaste', 'good morning', 'good evening', 'welcome'],
      gestures: ['wave_hand', 'slight_bow', 'open_arms', 'prayer_hands'],
      intensity: 0.7,
      duration: 2.0
    },
    'pointing': {
      keywords: ['this', 'that', 'here', 'there', 'look', 'see', 'over there'],
      gestures: ['point_forward', 'point_left', 'point_right', 'gesture_towards'],
      intensity: 0.6,
      duration: 1.5
    },
    'explaining': {
      keywords: ['because', 'therefore', 'however', 'moreover', 'furthermore'],
      gestures: ['open_palm', 'counting_fingers', 'circular_motion', 'spread_hands'],
      intensity: 0.5,
      duration: 3.0
    },
    'questioning': {
      keywords: ['what', 'why', 'how', 'when', 'where', 'who'],
      gestures: ['palm_up', 'shoulder_shrug', 'head_tilt', 'questioning_gesture'],
      intensity: 0.6,
      duration: 2.0
    },
    'emphasizing': {
      keywords: ['very', 'really', 'extremely', 'absolutely', 'definitely'],
      gestures: ['fist_pump', 'strong_gesture', 'double_hand_emphasis', 'forward_lean'],
      intensity: 0.8,
      duration: 1.5
    },
    'counting': {
      keywords: ['one', 'two', 'three', 'first', 'second', 'third', 'firstly'],
      gestures: ['count_fingers', 'enumerate_points', 'list_items'],
      intensity: 0.6,
      duration: 2.5
    },
    'thinking': {
      keywords: ['think', 'consider', 'perhaps', 'maybe', 'possibly'],
      gestures: ['chin_touch', 'temple_touch', 'thoughtful_pose'],
      intensity: 0.4,
      duration: 2.0
    },
    'agreeing': {
      keywords: ['yes', 'agree', 'correct', 'right', 'exactly', 'absolutely'],
      gestures: ['nod_head', 'thumbs_up', 'ok_gesture', 'affirmative_gesture'],
      intensity: 0.6,
      duration: 1.5
    },
    'disagreeing': {
      keywords: ['no', 'disagree', 'wrong', 'incorrect', 'never'],
      gestures: ['shake_head', 'wave_off', 'cross_arms', 'dismissive_gesture'],
      intensity: 0.7,
      duration: 1.5
    }
  };

  // Emotion-based gesture modifiers
  private readonly EMOTION_MODIFIERS = {
    'happy': {
      intensityMultiplier: 1.2,
      speedMultiplier: 1.1,
      gestureHeight: 'high',
      handOpenness: 0.8
    },
    'excited': {
      intensityMultiplier: 1.5,
      speedMultiplier: 1.3,
      gestureHeight: 'high',
      handOpenness: 1.0
    },
    'sad': {
      intensityMultiplier: 0.6,
      speedMultiplier: 0.8,
      gestureHeight: 'low',
      handOpenness: 0.3
    },
    'angry': {
      intensityMultiplier: 1.3,
      speedMultiplier: 1.2,
      gestureHeight: 'high',
      handOpenness: 0.2
    },
    'surprised': {
      intensityMultiplier: 1.0,
      speedMultiplier: 1.4,
      gestureHeight: 'high',
      handOpenness: 0.9
    },
    'confident': {
      intensityMultiplier: 1.1,
      speedMultiplier: 0.9,
      gestureHeight: 'medium',
      handOpenness: 0.7
    },
    'neutral': {
      intensityMultiplier: 1.0,
      speedMultiplier: 1.0,
      gestureHeight: 'medium',
      handOpenness: 0.5
    }
  };

  // Base gesture library (simplified for demo)
  private readonly BASE_GESTURES = {
    'wave_hand': {
      keyframes: [
        { timestamp: 0.0, rightHand: { x: 0.3, y: 0.8, z: 0.2 }, rightWrist: { rotation: { x: 0, y: 0, z: 0.3, w: 0.9 } } },
        { timestamp: 0.5, rightHand: { x: 0.4, y: 0.9, z: 0.3 }, rightWrist: { rotation: { x: 0, y: 0, z: -0.3, w: 0.9 } } },
        { timestamp: 1.0, rightHand: { x: 0.3, y: 0.8, z: 0.2 }, rightWrist: { rotation: { x: 0, y: 0, z: 0.3, w: 0.9 } } },
        { timestamp: 1.5, rightHand: { x: 0.4, y: 0.9, z: 0.3 }, rightWrist: { rotation: { x: 0, y: 0, z: -0.3, w: 0.9 } } },
        { timestamp: 2.0, rightHand: { x: 0.2, y: 0.6, z: 0.1 }, rightWrist: { rotation: { x: 0, y: 0, z: 0, w: 1 } } }
      ],
      duration: 2.0
    },
    'point_forward': {
      keyframes: [
        { timestamp: 0.0, rightHand: { x: 0.2, y: 0.6, z: 0.1 }, rightWrist: { rotation: { x: 0, y: 0, z: 0, w: 1 } } },
        { timestamp: 0.5, rightHand: { x: 0.5, y: 0.7, z: 0.4 }, rightWrist: { rotation: { x: 0, y: 0, z: 0, w: 1 } } },
        { timestamp: 1.0, rightHand: { x: 0.5, y: 0.7, z: 0.4 }, rightWrist: { rotation: { x: 0, y: 0, z: 0, w: 1 } } },
        { timestamp: 1.5, rightHand: { x: 0.2, y: 0.6, z: 0.1 }, rightWrist: { rotation: { x: 0, y: 0, z: 0, w: 1 } } }
      ],
      duration: 1.5
    },
    'open_palm': {
      keyframes: [
        { timestamp: 0.0, rightHand: { x: 0.2, y: 0.6, z: 0.1 }, leftHand: { x: -0.2, y: 0.6, z: 0.1 } },
        { timestamp: 1.0, rightHand: { x: 0.4, y: 0.7, z: 0.3 }, leftHand: { x: -0.4, y: 0.7, z: 0.3 } },
        { timestamp: 2.0, rightHand: { x: 0.3, y: 0.6, z: 0.2 }, leftHand: { x: -0.3, y: 0.6, z: 0.2 } },
        { timestamp: 3.0, rightHand: { x: 0.2, y: 0.6, z: 0.1 }, leftHand: { x: -0.2, y: 0.6, z: 0.1 } }
      ],
      duration: 3.0
    }
  };

  constructor(options: Partial<GestureOptions> = {}) {
    this.options = {
      language: 'en',
      gestureIntensity: 0.7,
      enableHandGestures: true,
      enableBodyGestures: true,
      enableHeadGestures: true,
      smoothingFactor: 0.5,
      adaptToEmotion: true,
      ...options
    };

    this.initializeGestureLibrary();
  }

  private initializeGestureLibrary(): void {
    // Initialize base gesture library
    for (const [gestureName, gestureData] of Object.entries(this.BASE_GESTURES)) {
      const sequence: GestureSequence = {
        id: gestureName,
        keyframes: this.convertToFullKeyframes(gestureData.keyframes),
        duration: gestureData.duration,
        emotion: 'neutral',
        confidence: 1.0
      };
      
      if (!this.gestureLibrary.has('base')) {
        this.gestureLibrary.set('base', []);
      }
      this.gestureLibrary.get('base')!.push(sequence);
    }

    console.log('🤲 Gesture library initialized with', this.gestureLibrary.size, 'categories');
  }

  private convertToFullKeyframes(simpleKeyframes: any[]): GestureKeyframe[] {
    return simpleKeyframes.map(kf => ({
      timestamp: kf.timestamp,
      joints: {
        leftShoulder: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        rightShoulder: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        leftElbow: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        rightElbow: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        leftWrist: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        rightWrist: { x: 0, y: 0, z: 0, rotation: kf.rightWrist?.rotation || { x: 0, y: 0, z: 0, w: 1 } },
        leftHand: kf.leftHand || { x: -0.2, y: 0.6, z: 0.1, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        rightHand: kf.rightHand || { x: 0.2, y: 0.6, z: 0.1, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        head: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        spine: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } }
      }
    }));
  }

  /**
   * Generate gestures from text input
   */
  public async generateGesturesFromText(request: GestureRequest): Promise<GestureSequence[]> {
    console.log('🤲 Generating gestures for:', request.text.substring(0, 50) + '...');

    try {
      this.isGenerating = true;
      
      // Analyze text for gesture patterns
      const patterns = this.analyzeTextForGestures(request.text);
      
      // Generate gesture sequences
      const sequences: GestureSequence[] = [];
      
      for (const pattern of patterns) {
        const gesture = await this.createGestureSequence(pattern, request);
        if (gesture) {
          sequences.push(gesture);
        }
      }

      // If no specific patterns found, create default conversational gestures
      if (sequences.length === 0) {
        const defaultGesture = await this.createDefaultGesture(request);
        if (defaultGesture) {
          sequences.push(defaultGesture);
        }
      }

      this.isGenerating = false;
      return sequences;
    } catch (error) {
      console.error('❌ Error generating gestures:', error);
      this.isGenerating = false;
      return [];
    }
  }

  private analyzeTextForGestures(text: string): Array<{ type: string; confidence: number; position: number }> {
    const patterns: Array<{ type: string; confidence: number; position: number }> = [];
    const words = text.toLowerCase().split(/\s+/);

    for (const [patternType, patternData] of Object.entries(this.GESTURE_PATTERNS)) {
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        for (const keyword of patternData.keywords) {
          if (word.includes(keyword)) {
            patterns.push({
              type: patternType,
              confidence: 0.8,
              position: i / words.length // Relative position in text
            });
            break;
          }
        }
      }
    }

    // Sort by position in text
    return patterns.sort((a, b) => a.position - b.position);
  }

  private async createGestureSequence(
    pattern: { type: string; confidence: number; position: number },
    request: GestureRequest
  ): Promise<GestureSequence | null> {
    const patternData = this.GESTURE_PATTERNS[pattern.type as keyof typeof this.GESTURE_PATTERNS];
    if (!patternData) return null;

    // Select appropriate gesture from pattern
    const gestureType = patternData.gestures[Math.floor(Math.random() * patternData.gestures.length)];
    const baseGesture = this.BASE_GESTURES[gestureType as keyof typeof this.BASE_GESTURES];
    
    if (!baseGesture) {
      // Create a simple default gesture
      return this.createSimpleGesture(pattern.type, request);
    }

    // Apply emotion and intensity modifiers
    const modifiedGesture = this.applyEmotionModifiers(baseGesture, request.emotion, request.intensity);
    
    return {
      id: `${pattern.type}_${Date.now()}`,
      keyframes: this.convertToFullKeyframes(modifiedGesture.keyframes),
      duration: modifiedGesture.duration * (request.duration ? request.duration / modifiedGesture.duration : 1),
      emotion: request.emotion,
      confidence: pattern.confidence
    };
  }

  private createSimpleGesture(type: string, request: GestureRequest): GestureSequence {
    // Create a basic gesture based on type
    const duration = request.duration || 2.0;
    
    const keyframes: GestureKeyframe[] = [
      {
        timestamp: 0.0,
        joints: this.createNeutralPose()
      },
      {
        timestamp: duration * 0.5,
        joints: this.createGestureVariation(type, request.intensity)
      },
      {
        timestamp: duration,
        joints: this.createNeutralPose()
      }
    ];

    return {
      id: `simple_${type}_${Date.now()}`,
      keyframes,
      duration,
      emotion: request.emotion,
      confidence: 0.6
    };
  }

  private createNeutralPose(): GestureKeyframe['joints'] {
    return {
      leftShoulder: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      rightShoulder: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      leftElbow: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      rightElbow: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      leftWrist: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      rightWrist: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      leftHand: { x: -0.2, y: 0.6, z: 0.1, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      rightHand: { x: 0.2, y: 0.6, z: 0.1, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      head: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      spine: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } }
    };
  }

  private createGestureVariation(type: string, intensity: number): GestureKeyframe['joints'] {
    const base = this.createNeutralPose();
    
    switch (type) {
      case 'greeting':
        base.rightHand.x = 0.4 * intensity;
        base.rightHand.y = 0.8 * intensity;
        base.rightHand.z = 0.3 * intensity;
        break;
      case 'pointing':
        base.rightHand.x = 0.5 * intensity;
        base.rightHand.y = 0.7 * intensity;
        base.rightHand.z = 0.4 * intensity;
        break;
      case 'explaining':
        base.rightHand.x = 0.3 * intensity;
        base.leftHand.x = -0.3 * intensity;
        base.rightHand.y = 0.7 * intensity;
        base.leftHand.y = 0.7 * intensity;
        break;
      default:
        base.rightHand.y = 0.7 * intensity;
        break;
    }
    
    return base;
  }

  private applyEmotionModifiers(gesture: any, emotion: string, intensity: number): any {
    const modifier = this.EMOTION_MODIFIERS[emotion as keyof typeof this.EMOTION_MODIFIERS] || this.EMOTION_MODIFIERS.neutral;
    
    const modifiedGesture = {
      ...gesture,
      duration: gesture.duration / modifier.speedMultiplier,
      keyframes: gesture.keyframes.map((kf: any) => ({
        ...kf,
        timestamp: kf.timestamp / modifier.speedMultiplier
      }))
    };

    // Apply intensity and emotion modifiers to keyframes
    modifiedGesture.keyframes = modifiedGesture.keyframes.map((kf: any) => {
      const modified = { ...kf };
      
      if (kf.rightHand) {
        modified.rightHand = {
          ...kf.rightHand,
          x: kf.rightHand.x * modifier.intensityMultiplier * intensity,
          y: kf.rightHand.y * modifier.intensityMultiplier * intensity,
          z: kf.rightHand.z * modifier.intensityMultiplier * intensity
        };
      }
      
      if (kf.leftHand) {
        modified.leftHand = {
          ...kf.leftHand,
          x: kf.leftHand.x * modifier.intensityMultiplier * intensity,
          y: kf.leftHand.y * modifier.intensityMultiplier * intensity,
          z: kf.leftHand.z * modifier.intensityMultiplier * intensity
        };
      }
      
      return modified;
    });

    return modifiedGesture;
  }

  private async createDefaultGesture(request: GestureRequest): Promise<GestureSequence | null> {
    // Create subtle conversational gestures for general speech
    const duration = request.duration || 3.0;
    
    const keyframes: GestureKeyframe[] = [
      {
        timestamp: 0.0,
        joints: this.createNeutralPose()
      },
      {
        timestamp: duration * 0.3,
        joints: this.createSubtleGesture(0.3 * request.intensity)
      },
      {
        timestamp: duration * 0.7,
        joints: this.createSubtleGesture(0.5 * request.intensity)
      },
      {
        timestamp: duration,
        joints: this.createNeutralPose()
      }
    ];

    return {
      id: `default_${Date.now()}`,
      keyframes,
      duration,
      emotion: request.emotion,
      confidence: 0.4
    };
  }

  private createSubtleGesture(intensity: number): GestureKeyframe['joints'] {
    const base = this.createNeutralPose();
    
    // Add slight hand movements for natural conversation
    base.rightHand.x += (Math.random() - 0.5) * 0.1 * intensity;
    base.rightHand.y += (Math.random() - 0.5) * 0.05 * intensity;
    base.leftHand.x += (Math.random() - 0.5) * 0.1 * intensity;
    base.leftHand.y += (Math.random() - 0.5) * 0.05 * intensity;
    
    // Slight head movement
    base.head.rotation.y = (Math.random() - 0.5) * 0.1 * intensity;
    
    return base;
  }

  /**
   * Get current gesture being played
   */
  public getCurrentGesture(): GestureSequence | null {
    return this.currentGesture;
  }

  /**
   * Update gesture options
   */
  public updateOptions(newOptions: Partial<GestureOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Check if gesture generation is in progress
   */
  public isGeneratingGestures(): boolean {
    return this.isGenerating;
  }

  /**
   * Get gesture library statistics
   */
  public getLibraryStats(): { categories: number; totalGestures: number } {
    let totalGestures = 0;
    for (const gestures of this.gestureLibrary.values()) {
      totalGestures += gestures.length;
    }
    
    return {
      categories: this.gestureLibrary.size,
      totalGestures
    };
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.gestureLibrary.clear();
    this.currentGesture = null;
    this.isGenerating = false;
  }
} 