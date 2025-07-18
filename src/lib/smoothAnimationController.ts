/**
 * Smooth Animation Controller for Echo Character
 * Manages seamless transitions between animations using a single model
 * with multiple animation tracks that can be blended together
 * 
 * IMPROVED: Always maintains happy-idle as a base layer to prevent T-pose
 */

import { AnimationAction, AnimationMixer, LoopOnce, LoopRepeat } from 'three';

export interface SmoothAnimationConfig {
  name: string;
  weight: number;
  duration: number;
  loop: boolean;
  crossFadeDuration: number;
  priority: number;
  timeScale?: number; // Control playback speed
  naturalTiming?: boolean; // Use human-like timing
}

export interface AnimationTrack {
  name: string;
  action: AnimationAction;
  config: SmoothAnimationConfig;
  currentWeight: number;
  targetWeight: number;
  isActive: boolean;
}

export class SmoothAnimationController {
  private mixer: AnimationMixer | null = null;
  private tracks: Map<string, AnimationTrack> = new Map();
  private currentAnimations: Set<string> = new Set();
  private blendQueue: Array<{ track: string; targetWeight: number; duration: number }> = [];
  private isBlending = false;
  private baseIdleActive = false; // Track if base idle is active
  private baseIdleTrack: string = 'happy-idle'; // The base idle animation
  
  // Animation presets for smooth transitions with natural human-like timing
  private animationPresets = {
    idle: {
      weight: 1.0,
      duration: 4000,
      loop: true,
      crossFadeDuration: 0.8,
      priority: 1,
      timeScale: 0.3, // Even slower speed to prevent cutting short
      naturalTiming: true
    },
    greeting: {
      weight: 1.0,
      duration: 2500, // Reduced for quicker response
      loop: false,
      crossFadeDuration: 0.6,
      priority: 3,
      timeScale: 0.3, // Even slower speed to prevent cutting short
      naturalTiming: true
    },
    talking: {
      weight: 0.8,
      duration: 2500, // Reduced for faster talking
      loop: true,
      crossFadeDuration: 0.8,
      priority: 2,
      timeScale: 0.3, // Even slower speed to prevent cutting short
      naturalTiming: true
    },
    emotion: {
      weight: 0.6,
      duration: 2500, // Reduced for quicker emotional response
      loop: false,
      crossFadeDuration: 0.7,
      priority: 2,
      timeScale: 0.3, // Even slower speed to prevent cutting short
      naturalTiming: true
    },
    gesture: {
      weight: 0.7,
      duration: 2000, // Reduced for quicker gestures
      loop: false,
      crossFadeDuration: 0.6,
      priority: 2,
      timeScale: 0.3, // Even slower speed to prevent cutting short
      naturalTiming: true
    }
  };

  constructor(mixer: AnimationMixer) {
    this.mixer = mixer;
    console.log('🎭 Smooth Animation Controller initialized with base layer protection');
  }

  /**
   * Add an animation track to the controller
   */
  public addTrack(name: string, action: AnimationAction, config: Partial<SmoothAnimationConfig> = {}): void {
    const defaultConfig = this.animationPresets.idle;
    const fullConfig: SmoothAnimationConfig = {
      ...defaultConfig,
      name,
      ...config
    };

    const track: AnimationTrack = {
      name,
      action,
      config: fullConfig,
      currentWeight: 0,
      targetWeight: 0,
      isActive: false
    };

    this.tracks.set(name, track);
    console.log(`🎭 Added animation track: ${name}`);
    
    // If this is the base idle animation, start it immediately
    if (name === this.baseIdleTrack) {
      this.ensureBaseIdleActive();
    }
  }

  /**
   * Ensure the base idle animation is always active (prevents T-pose)
   */
  private ensureBaseIdleActive(): void {
    const idleTrack = this.tracks.get(this.baseIdleTrack);
    if (!idleTrack || this.baseIdleActive) return;

    console.log('🚫 PREVENTING T-POSE: Starting base idle animation');
    
    // Start the base idle animation
    idleTrack.action.reset();
    idleTrack.action.setLoop(LoopRepeat, 1);
    idleTrack.action.setEffectiveTimeScale(0.3); // 0.3x speed to prevent cutting short
    idleTrack.action.setEffectiveWeight(1.0);
    idleTrack.action.play();
    idleTrack.isActive = true;
    idleTrack.currentWeight = 1.0;
    idleTrack.targetWeight = 1.0;
    
    this.baseIdleActive = true;
    console.log('✅ Base idle animation is now active and will never stop');
  }

  /**
   * Smoothly transition to a new animation (layered on top of base idle)
   */
  public transitionTo(animationName: string, blendDuration: number = 0.8): void {
    console.log(`🎭 SMOOTH: ===== TRANSITION TO CALLED =====`);
    console.log(`🎭 SMOOTH: Animation name: "${animationName}"`);
    console.log(`🎭 SMOOTH: Blend duration: ${blendDuration}s`);
    console.log(`🎭 SMOOTH: Total tracks available: ${this.tracks.size}`);
    console.log(`🎭 SMOOTH: Available tracks: ${Array.from(this.tracks.keys()).slice(0, 10).join(', ')}`);

    const track = this.tracks.get(animationName);
    if (!track) {
      console.error(`❌ SMOOTH: Animation track not found: "${animationName}"`);
      console.error(`❌ SMOOTH: Available tracks: ${Array.from(this.tracks.keys()).join(', ')}`);
      return;
    }

    console.log(`✅ SMOOTH: Found track for "${animationName}"`);
    console.log(`🎭 SMOOTH: Track config:`, track.config);
    console.log(`🎭 SMOOTH: Track active: ${track.isActive}`);
    console.log(`🎭 SMOOTH: Current weight: ${track.currentWeight}`);

    // Ensure base idle is active before any transition
    this.ensureBaseIdleActive();

    console.log(`🎭 SMOOTH: Transitioning to: ${animationName} with ${blendDuration}s blend (layered on base idle)`);
    console.log(`🎭 SMOOTH: Current blend queue size: ${this.blendQueue.length}`);
    console.log(`🎭 SMOOTH: Is currently blending: ${this.isBlending}`);

    // Add to blend queue
    this.blendQueue.push({
      track: animationName,
      targetWeight: track.config.weight,
      duration: blendDuration
    });

    console.log(`🎭 SMOOTH: Added to blend queue. New queue size: ${this.blendQueue.length}`);

    // Start blending if not already in progress
    if (!this.isBlending) {
      console.log(`🎭 SMOOTH: Starting blend queue processing...`);
      this.processBlendQueue();
    } else {
      console.log(`🎭 SMOOTH: Blend already in progress, queued for later`);
    }
  }

  /**
   * Blend multiple animations together (layered on top of base idle)
   */
  public blendAnimations(animations: Array<{ name: string; weight: number }>, blendDuration: number = 0.8): void {
    console.log(`🎭 Blending animations:`, animations, `(layered on base idle)`);

    // Ensure base idle is active
    this.ensureBaseIdleActive();

    // Reset all non-idle animation weights to 0 (but keep base idle at 1.0)
    this.tracks.forEach((track, name) => {
      if (name !== this.baseIdleTrack) {
        this.blendQueue.push({
          track: name,
          targetWeight: 0,
          duration: blendDuration
        });
      }
    });

    // Set target weights for specified animations (layered on base idle)
    animations.forEach(({ name, weight }) => {
      if (name !== this.baseIdleTrack) { // Don't override base idle
        this.blendQueue.push({
          track: name,
          targetWeight: weight,
          duration: blendDuration
        });
      }
    });

    if (!this.isBlending) {
      this.processBlendQueue();
    }
  }

  /**
   * Process the blend queue for smooth transitions
   */
  private processBlendQueue(): void {
    console.log(`🎭 SMOOTH: ===== PROCESS BLEND QUEUE =====`);
    console.log(`🎭 SMOOTH: Queue length: ${this.blendQueue.length}`);
    
    if (this.blendQueue.length === 0) {
      console.log(`🎭 SMOOTH: Blend queue empty, stopping blend process`);
      this.isBlending = false;
      return;
    }

    this.isBlending = true;
    const blend = this.blendQueue.shift()!;
    console.log(`🎭 SMOOTH: Processing blend for track: "${blend.track}"`);
    console.log(`🎭 SMOOTH: Target weight: ${blend.targetWeight}, Duration: ${blend.duration}s`);
    
    const track = this.tracks.get(blend.track);
    
    if (!track) {
      console.error(`❌ SMOOTH: Track not found during blend processing: "${blend.track}"`);
      this.processBlendQueue();
      return;
    }

    console.log(`✅ SMOOTH: Found track for blending: "${blend.track}"`);
    console.log(`🎭 SMOOTH: Track currently active: ${track.isActive}`);
    console.log(`🎭 SMOOTH: Track current weight: ${track.currentWeight}`);

    // Start the action if not already playing (except base idle which is always active)
    if (!track.isActive && blend.track !== this.baseIdleTrack) {
      console.log(`🎭 SMOOTH: Starting action for "${blend.track}"`);
      track.action.reset();
      track.action.setLoop(track.config.loop ? LoopRepeat : LoopOnce, 1);
      // Use 0.3x speed to prevent cutting short
      track.action.setEffectiveTimeScale(track.config.timeScale || 0.3);
      track.action.play();
      track.isActive = true;
      console.log(`✅ SMOOTH: Action started for "${blend.track}"`);
    } else if (track.isActive) {
      console.log(`🎭 SMOOTH: Track "${blend.track}" already active, skipping start`);
    } else if (blend.track === this.baseIdleTrack) {
      console.log(`🎭 SMOOTH: Track "${blend.track}" is base idle, should already be active`);
    }

    // Smoothly blend to target weight
    console.log(`🎭 SMOOTH: Starting smooth blend for "${blend.track}" to weight ${blend.targetWeight}`);
    this.smoothBlend(track, blend.targetWeight, blend.duration, () => {
      console.log(`🎭 SMOOTH: Blend completed for "${blend.track}", processing next in queue`);
      this.processBlendQueue();
    });
  }

  /**
   * Smoothly blend animation weight over time
   */
  private smoothBlend(track: AnimationTrack, targetWeight: number, duration: number, onComplete: () => void): void {
    const startWeight = track.currentWeight;
    const startTime = performance.now();
    const endTime = startTime + (duration * 1000);

    const blendStep = () => {
      const currentTime = performance.now();
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Use smooth easing function for natural transitions
      const easedProgress = this.easeInOutCubic(progress);
      track.currentWeight = startWeight + (targetWeight - startWeight) * easedProgress;
      
      // Apply weight to action
      track.action.setEffectiveWeight(track.currentWeight);

      if (progress < 1) {
        requestAnimationFrame(blendStep);
      } else {
        track.currentWeight = targetWeight;
        track.action.setEffectiveWeight(targetWeight);
        
        // Stop action if weight is 0 (but NEVER stop base idle)
        if (targetWeight === 0 && track.isActive && track.name !== this.baseIdleTrack) {
          track.action.stop();
          track.isActive = false;
        }
        
        onComplete();
      }
    };

    requestAnimationFrame(blendStep);
  }

  /**
   * Smooth easing function for natural transitions
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Update the animation mixer
   */
  public update(deltaTime: number): void {
    if (this.mixer) {
      // Use a slower update rate for more natural movement
      this.mixer.update(deltaTime * 0.8);
    }
  }

  /**
   * Get current animation state
   */
  public getCurrentState(): { activeAnimations: string[]; weights: Record<string, number> } {
    const activeAnimations: string[] = [];
    const weights: Record<string, number> = {};

    this.tracks.forEach((track, name) => {
      if (track.isActive && track.currentWeight > 0) {
        activeAnimations.push(name);
        weights[name] = track.currentWeight;
      }
    });

    return { activeAnimations, weights };
  }

  /**
   * Check if base idle is active (for model visibility)
   */
  public isBaseIdleActive(): boolean {
    return this.baseIdleActive;
  }

  /**
   * Return to idle state (layered approach - base idle is always active)
   */
  public returnToIdle(blendDuration: number = 0.8): void {
    console.log('🎭 Returning to idle state (base idle is always active)');
    
    // Ensure base idle is active
    this.ensureBaseIdleActive();
    
    // Blend all non-idle animations to 0 (base idle stays at 1.0)
    this.tracks.forEach((track, name) => {
      if (name !== this.baseIdleTrack) {
        this.blendQueue.push({
          track: name,
          targetWeight: 0,
          duration: blendDuration
        });
      }
    });

    // Ensure base idle is at full weight
    const idleTrack = this.tracks.get(this.baseIdleTrack);
    if (idleTrack) {
      this.blendQueue.push({
        track: this.baseIdleTrack,
        targetWeight: 1.0,
        duration: blendDuration
      });
    }

    if (!this.isBlending) {
      this.processBlendQueue();
    }
  }

  /**
   * Force start base idle (emergency method to prevent T-pose)
   */
  public forceStartBaseIdle(): void {
    console.log('🚨 EMERGENCY: Forcing base idle to start to prevent T-pose');
    this.ensureBaseIdleActive();
  }

  /**
   * Clean up resources (but preserve base idle until the very end)
   */
  public cleanup(): void {
    this.tracks.forEach(track => {
      if (track.isActive && track.name !== this.baseIdleTrack) {
        track.action.stop();
      }
    });
    
    // Only stop base idle at the very end
    const baseIdleTrack = this.tracks.get(this.baseIdleTrack);
    if (baseIdleTrack && baseIdleTrack.isActive) {
      baseIdleTrack.action.stop();
    }
    
    this.tracks.clear();
    this.blendQueue = [];
    this.isBlending = false;
    this.baseIdleActive = false;
  }
} 