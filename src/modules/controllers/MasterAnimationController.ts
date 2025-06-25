/**
 * Master Animation Controller
 * Orchestrates all AI avatar modules for cohesive real-time animation
 * Integrates emotion detection, gesture generation, lip sync, and audio processing
 */

import { AudioFeatures, AudioProcessingController, VoiceActivityResult } from '../audio/AudioProcessingController';
import { EmotionDetectionController, EmotionResult } from '../emotions/EmotionDetectionController';
import { GestureGenerationController, GestureRequest, GestureSequence } from '../gestures/GestureGenerationController';
import { LipSyncController } from '../lipSync/LipSyncController';

export interface MasterControllerOptions {
  enableLipSync: boolean;
  enableEmotionDetection: boolean;
  enableGestureGeneration: boolean;
  enableAudioProcessing: boolean;
  language: 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml';
  emotionSensitivity: number; // 0-1
  gestureSensitivity: number; // 0-1
  lipSyncSensitivity: number; // 0-1
  blendingMode: 'additive' | 'weighted' | 'priority';
  realTimeMode: boolean;
}

export interface AnimationState {
  // Current states
  currentEmotion: EmotionResult | null;
  currentGestures: GestureSequence[];
  currentVisemes: any[];
  voiceActivity: VoiceActivityResult | null;
  audioFeatures: AudioFeatures | null;
  
  // Animation weights
  emotionWeight: number;
  gestureWeight: number;
  lipSyncWeight: number;
  
  // Timing
  timestamp: number;
  isActive: boolean;
}

export interface AnimationUpdate {
  facialExpressions: {
    [key: string]: number; // blend shape name -> weight
  };
  bodyPose: {
    joints: {
      [jointName: string]: {
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number; w: number };
      };
    };
  };
  handPoses: {
    left: any;
    right: any;
  };
  eyeMovement: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
  };
  breathing: {
    intensity: number;
    rate: number;
  };
  metadata: {
    emotion: string;
    confidence: number;
    gestureCount: number;
    isLipSyncing: boolean;
    quality: number;
  };
}

export class MasterAnimationController {
  private options: MasterControllerOptions;
  private isActive: boolean = false;
  private animationState: AnimationState;
  
  // Module controllers
  private lipSyncController: LipSyncController;
  private emotionController: EmotionDetectionController;
  private gestureController: GestureGenerationController;
  private audioController: AudioProcessingController;
  
  // Animation blending
  private blendWeights = {
    emotion: 0.4,
    gesture: 0.3,
    lipSync: 0.3
  };
  
  // Callbacks
  private animationCallback: ((update: AnimationUpdate) => void) | null = null;
  private stateCallback: ((state: AnimationState) => void) | null = null;

  constructor(options: Partial<MasterControllerOptions> = {}) {
    this.options = {
      enableLipSync: true,
      enableEmotionDetection: true,
      enableGestureGeneration: true,
      enableAudioProcessing: true,
      language: 'en',
      emotionSensitivity: 0.7,
      gestureSensitivity: 0.6,
      lipSyncSensitivity: 0.8,
      blendingMode: 'weighted',
      realTimeMode: true,
      ...options
    };

    this.animationState = this.createInitialState();
    this.initializeControllers();
    
    console.log('🎭 Master Animation Controller initialized');
  }

  private createInitialState(): AnimationState {
    return {
      currentEmotion: null,
      currentGestures: [],
      currentVisemes: [],
      voiceActivity: null,
      audioFeatures: null,
      emotionWeight: this.blendWeights.emotion,
      gestureWeight: this.blendWeights.gesture,
      lipSyncWeight: this.blendWeights.lipSync,
      timestamp: Date.now() / 1000,
      isActive: false
    };
  }

  private initializeControllers(): void {
    // Initialize LipSync Controller
    if (this.options.enableLipSync) {
      this.lipSyncController = new LipSyncController({
        language: this.options.language,
        sensitivity: this.options.lipSyncSensitivity,
        realTimeMode: this.options.realTimeMode
      });
    }

    // Initialize Emotion Detection Controller
    if (this.options.enableEmotionDetection) {
      this.emotionController = new EmotionDetectionController({
        language: this.options.language,
        sensitivity: this.options.emotionSensitivity,
        enableTextAnalysis: true,
        enableAudioAnalysis: true,
        realTimeMode: this.options.realTimeMode
      });
    }

    // Initialize Gesture Generation Controller
    if (this.options.enableGestureGeneration) {
      this.gestureController = new GestureGenerationController({
        language: this.options.language,
        gestureIntensity: this.options.gestureSensitivity,
        enableHandGestures: true,
        enableBodyGestures: true,
        enableHeadGestures: true,
        adaptToEmotion: true
      });
    }

    // Initialize Audio Processing Controller
    if (this.options.enableAudioProcessing) {
      this.audioController = new AudioProcessingController({
        enableRealTime: this.options.realTimeMode,
        enableFeatureExtraction: true,
        enableVoiceActivityDetection: true,
        enableNoiseReduction: true
      });
    }
  }

  /**
   * Start the master animation system
   */
  public async startAnimation(
    stream: MediaStream,
    callbacks: {
      onAnimationUpdate: (update: AnimationUpdate) => void;
      onStateChange?: (state: AnimationState) => void;
    }
  ): Promise<void> {
    console.log('🎬 Starting Master Animation Controller');
    
    this.animationCallback = callbacks.onAnimationUpdate;
    this.stateCallback = callbacks.onStateChange;
    
    this.isActive = true;
    this.animationState.isActive = true;

    // Start audio processing first
    if (this.audioController) {
      await this.audioController.startRealTimeProcessing(stream, {
        onFeatures: (features) => this.handleAudioFeatures(features),
        onVAD: (vad) => this.handleVoiceActivity(vad),
        onQuality: (quality) => console.log('🎵 Audio quality:', quality.overallQuality)
      });
    }

    // Start emotion detection
    if (this.emotionController) {
      this.emotionController.startRealTimeAnalysis(stream, (emotion) => {
        this.handleEmotionUpdate(emotion);
      });
    }

    // Start animation loop
    this.startAnimationLoop();
  }

  /**
   * Process text input for speech synthesis and animation
   */
  public async processTextInput(text: string, audioUrl?: string): Promise<void> {
    console.log('📝 Processing text input:', text.substring(0, 50) + '...');

    const promises: Promise<any>[] = [];

    // Generate lip sync from text
    if (this.lipSyncController) {
      promises.push(
        this.lipSyncController.generateVisemesFromText(text).then(visemes => {
          this.animationState.currentVisemes = visemes;
        })
      );
    }

    // Analyze emotion from text
    if (this.emotionController) {
      promises.push(
        this.emotionController.analyzeTextEmotion(text).then(emotion => {
          this.handleEmotionUpdate(emotion);
        })
      );
    }

    // Generate gestures from text
    if (this.gestureController) {
      const gestureRequest: GestureRequest = {
        text,
        emotion: this.animationState.currentEmotion?.emotion || 'neutral',
        intensity: this.animationState.currentEmotion?.intensity || 0.5,
        style: 'casual'
      };

      promises.push(
        this.gestureController.generateGesturesFromText(gestureRequest).then(gestures => {
          this.animationState.currentGestures = gestures;
        })
      );
    }

    // If audio URL provided, sync lip sync with audio
    if (audioUrl && this.lipSyncController) {
      promises.push(
        this.lipSyncController.syncWithAudio(audioUrl).then(syncedVisemes => {
          this.animationState.currentVisemes = syncedVisemes;
        })
      );
    }

    await Promise.all(promises);
    this.updateAnimationState();
  }

  private handleAudioFeatures(features: AudioFeatures): void {
    this.animationState.audioFeatures = features;
    
    // Use audio features to enhance animations
    if (features.energy && features.energy.length > 0) {
      const energy = features.energy[0];
      
      // Adjust breathing based on audio energy
      this.adjustBreathingFromAudio(energy);
      
      // Enhance emotion detection with audio features
      if (this.emotionController && features.pitch && features.pitch.length > 0) {
        // Audio-based emotion enhancement would go here
      }
    }
  }

  private handleVoiceActivity(vad: VoiceActivityResult): void {
    this.animationState.voiceActivity = vad;
    
    // Trigger lip sync when voice is detected
    if (vad.isVoiceActive && this.lipSyncController) {
      // Real-time lip sync activation
    }
    
    // Adjust gesture intensity based on voice activity
    if (vad.isVoiceActive) {
      this.blendWeights.gesture = 0.2; // Reduce gestures during speech
      this.blendWeights.lipSync = 0.5; // Increase lip sync weight
    } else {
      this.blendWeights.gesture = 0.3; // Normal gesture weight
      this.blendWeights.lipSync = 0.2; // Reduced lip sync weight
    }
  }

  private handleEmotionUpdate(emotion: EmotionResult): void {
    this.animationState.currentEmotion = emotion;
    
    // Update blend weights based on emotion confidence
    this.blendWeights.emotion = 0.2 + (emotion.confidence * 0.3);
    
    // Trigger gesture adaptation
    if (this.gestureController && emotion.confidence > 0.6) {
      // High confidence emotion should influence gestures
    }
  }

  private adjustBreathingFromAudio(energy: number): void {
    // Adjust breathing animation based on speech energy
    const breathingIntensity = Math.max(0.3, Math.min(1.0, energy * 2));
    const breathingRate = 0.8 + (energy * 0.4); // Faster breathing during speech
    
    // This would be applied in the animation update
  }

  private startAnimationLoop(): void {
    const animate = () => {
      if (!this.isActive) return;

      this.updateAnimationState();
      const animationUpdate = this.generateAnimationUpdate();
      
      if (this.animationCallback) {
        this.animationCallback(animationUpdate);
      }
      
      if (this.stateCallback) {
        this.stateCallback(this.animationState);
      }

      requestAnimationFrame(animate);
    };

    animate();
  }

  private updateAnimationState(): void {
    this.animationState.timestamp = Date.now() / 1000;
    
    // Update weights based on current activity
    this.updateBlendWeights();
    
    // Clean up old data
    this.cleanupState();
  }

  private updateBlendWeights(): void {
    const totalWeight = this.blendWeights.emotion + this.blendWeights.gesture + this.blendWeights.lipSync;
    
    if (totalWeight > 0) {
      this.animationState.emotionWeight = this.blendWeights.emotion / totalWeight;
      this.animationState.gestureWeight = this.blendWeights.gesture / totalWeight;
      this.animationState.lipSyncWeight = this.blendWeights.lipSync / totalWeight;
    }
  }

  private generateAnimationUpdate(): AnimationUpdate {
    const facialExpressions = this.blendFacialExpressions();
    const bodyPose = this.blendBodyPose();
    const handPoses = this.blendHandPoses();
    const eyeMovement = this.generateEyeMovement();
    const breathing = this.generateBreathing();

    return {
      facialExpressions,
      bodyPose,
      handPoses,
      eyeMovement,
      breathing,
      metadata: {
        emotion: this.animationState.currentEmotion?.emotion || 'neutral',
        confidence: this.animationState.currentEmotion?.confidence || 0,
        gestureCount: this.animationState.currentGestures.length,
        isLipSyncing: this.animationState.currentVisemes.length > 0,
        quality: this.animationState.audioFeatures?.quality || 0
      }
    };
  }

  private blendFacialExpressions(): { [key: string]: number } {
    const expressions: { [key: string]: number } = {};
    
    // Base neutral expression
    expressions['neutral'] = 0.3;
    
    // Add emotion-based expressions
    if (this.animationState.currentEmotion && this.emotionController) {
      const emotionExpression = this.emotionController.getFacialExpressionForEmotion(
        this.animationState.currentEmotion.emotion
      );
      
      if (emotionExpression) {
        const weight = this.animationState.emotionWeight * this.animationState.currentEmotion.intensity;
        expressions[emotionExpression.mouth] = (expressions[emotionExpression.mouth] || 0) + weight * 0.4;
        expressions[emotionExpression.eyes] = (expressions[emotionExpression.eyes] || 0) + weight * 0.3;
        expressions[emotionExpression.eyebrows] = (expressions[emotionExpression.eyebrows] || 0) + weight * 0.3;
      }
    }
    
    // Add lip sync expressions
    if (this.animationState.currentVisemes.length > 0) {
      const currentTime = this.animationState.timestamp;
      
      for (const viseme of this.animationState.currentVisemes) {
        if (viseme.startTime <= currentTime && currentTime <= viseme.endTime) {
          const weight = this.animationState.lipSyncWeight * viseme.intensity;
          expressions[viseme.viseme] = (expressions[viseme.viseme] || 0) + weight;
        }
      }
    }
    
    return expressions;
  }

  private blendBodyPose(): AnimationUpdate['bodyPose'] {
    const joints: { [jointName: string]: any } = {};
    
    // Base neutral pose
    const neutralPose = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 }
    };
    
    // Add gesture-based poses
    if (this.animationState.currentGestures.length > 0) {
      const currentTime = this.animationState.timestamp;
      
      for (const gesture of this.animationState.currentGestures) {
        for (const keyframe of gesture.keyframes) {
          if (Math.abs(keyframe.timestamp - (currentTime % gesture.duration)) < 0.1) {
            const weight = this.animationState.gestureWeight;
            
            for (const [jointName, jointData] of Object.entries(keyframe.joints)) {
              if (!joints[jointName]) {
                joints[jointName] = { ...neutralPose };
              }
              
              // Blend positions
              joints[jointName].position.x += jointData.x * weight;
              joints[jointName].position.y += jointData.y * weight;
              joints[jointName].position.z += jointData.z * weight;
              
              // Blend rotations (simplified)
              joints[jointName].rotation.x += jointData.rotation.x * weight;
              joints[jointName].rotation.y += jointData.rotation.y * weight;
              joints[jointName].rotation.z += jointData.rotation.z * weight;
            }
          }
        }
      }
    }
    
    return { joints };
  }

  private blendHandPoses(): AnimationUpdate['handPoses'] {
    return {
      left: { fingers: 'relaxed', intensity: 0.5 },
      right: { fingers: 'relaxed', intensity: 0.5 }
    };
  }

  private generateEyeMovement(): AnimationUpdate['eyeMovement'] {
    // Simple eye movement based on emotion and audio
    let eyeX = 0;
    let eyeY = 0;
    
    if (this.animationState.currentEmotion) {
      const emotion = this.animationState.currentEmotion.emotion;
      
      switch (emotion) {
        case 'surprised':
          eyeY = 0.2;
          break;
        case 'sad':
          eyeY = -0.1;
          break;
        case 'happy':
          eyeX = (Math.random() - 0.5) * 0.1;
          break;
      }
    }
    
    return {
      leftEye: { x: eyeX, y: eyeY },
      rightEye: { x: eyeX, y: eyeY }
    };
  }

  private generateBreathing(): AnimationUpdate['breathing'] {
    let intensity = 0.5;
    let rate = 1.0;
    
    // Adjust based on voice activity
    if (this.animationState.voiceActivity?.isVoiceActive) {
      intensity = 0.8;
      rate = 1.2;
    }
    
    // Adjust based on emotion
    if (this.animationState.currentEmotion) {
      switch (this.animationState.currentEmotion.emotion) {
        case 'excited':
          intensity = 0.9;
          rate = 1.4;
          break;
        case 'sad':
          intensity = 0.3;
          rate = 0.7;
          break;
        case 'angry':
          intensity = 0.8;
          rate = 1.3;
          break;
      }
    }
    
    return { intensity, rate };
  }

  private cleanupState(): void {
    const currentTime = this.animationState.timestamp;
    const maxAge = 10; // seconds
    
    // Clean up old gestures
    this.animationState.currentGestures = this.animationState.currentGestures.filter(
      gesture => (currentTime - gesture.duration) < maxAge
    );
    
    // Clean up old visemes
    this.animationState.currentVisemes = this.animationState.currentVisemes.filter(
      viseme => viseme.endTime > (currentTime - maxAge)
    );
  }

  /**
   * Stop the animation system
   */
  public stopAnimation(): void {
    console.log('⏹️ Stopping Master Animation Controller');
    
    this.isActive = false;
    this.animationState.isActive = false;
    
    // Stop all controllers
    if (this.audioController) {
      this.audioController.stopRealTimeProcessing();
    }
    
    if (this.emotionController) {
      this.emotionController.stopRealTimeAnalysis();
    }
  }

  /**
   * Update controller options
   */
  public updateOptions(newOptions: Partial<MasterControllerOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // Update individual controllers
    if (this.lipSyncController && newOptions.lipSyncSensitivity !== undefined) {
      this.lipSyncController.updateOptions({ sensitivity: newOptions.lipSyncSensitivity });
    }
    
    if (this.emotionController && newOptions.emotionSensitivity !== undefined) {
      this.emotionController.updateOptions({ sensitivity: newOptions.emotionSensitivity });
    }
    
    if (this.gestureController && newOptions.gestureSensitivity !== undefined) {
      this.gestureController.updateOptions({ gestureIntensity: newOptions.gestureSensitivity });
    }
  }

  /**
   * Get current animation state
   */
  public getAnimationState(): AnimationState {
    return { ...this.animationState };
  }

  /**
   * Get controller statistics
   */
  public getStats(): any {
    return {
      isActive: this.isActive,
      emotion: this.animationState.currentEmotion?.emotion || 'none',
      emotionConfidence: this.animationState.currentEmotion?.confidence || 0,
      gestureCount: this.animationState.currentGestures.length,
      visemeCount: this.animationState.currentVisemes.length,
      voiceActive: this.animationState.voiceActivity?.isVoiceActive || false,
      audioQuality: this.animationState.audioFeatures?.quality || 0,
      blendWeights: { ...this.blendWeights }
    };
  }

  /**
   * Cleanup all resources
   */
  public dispose(): void {
    this.stopAnimation();
    
    if (this.lipSyncController) {
      this.lipSyncController.dispose();
    }
    
    if (this.emotionController) {
      this.emotionController.dispose();
    }
    
    if (this.gestureController) {
      this.gestureController.dispose();
    }
    
    if (this.audioController) {
      this.audioController.dispose();
    }
    
    console.log('🧹 Master Animation Controller disposed');
  }
} 