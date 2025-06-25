/**
 * Unified Animation Loader
 * Loads all animations into a single model for seamless blending
 */

import { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { analyzeBoneStructure, retargetAnimation } from './boneMapping';
import { SmoothAnimationController } from './smoothAnimationController';

export interface UnifiedAnimation {
  name: string;
  clip: AnimationClip;
  action: AnimationAction;
  config: {
    weight: number;
    duration: number;
    loop: boolean;
    crossFadeDuration: number;
    priority: number;
    timeScale?: number;
    naturalTiming?: boolean;
  };
}

export class UnifiedAnimationLoader {
  private mixer: AnimationMixer | null = null;
  private animations: Map<string, UnifiedAnimation> = new Map();
  private smoothController: SmoothAnimationController | null = null;
  private isLoading = false;
  private onLoadComplete?: () => void;
  private onHappyIdleReady?: () => void;
  private targetModel: any = null;

  // Animation definitions with their configurations - using natural human timing
  private animationDefinitions = {
    // Idle animations (base layer) - faster and more responsive
    'sitting-idle': {
      path: '/ECHO/animations/basic reactions/sitting-idle.glb',
      config: { 
        weight: 1.0, 
        duration: 4000, 
        loop: true, 
        crossFadeDuration: 0.8, 
        priority: 1,
        timeScale: 0.5,
        naturalTiming: true
      }
    },
    'weight-shift': {
      path: '/ECHO/animations/basic reactions/weight-shift.glb',
      config: { 
        weight: 0.8, 
        duration: 5000, 
        loop: true, 
        crossFadeDuration: 0.8, 
        priority: 1,
        timeScale: 0.5,
        naturalTiming: true
      }
    },
    'idle-to-situp': {
      path: '/ECHO/animations/basic reactions/idle-to-situp.glb',
      config: { 
        weight: 0.9, 
        duration: 3000, 
        loop: true, 
        crossFadeDuration: 0.8, 
        priority: 1,
        timeScale: 0.5,
        naturalTiming: true
      }
    },

    // Greeting animations (overlay layer) - faster and more responsive
    'waving-gesture': {
      path: '/ECHO/animations/basic reactions/waving-gesture-3.glb',
      config: { 
        weight: 1.0, 
        duration: 3000, 
        loop: false, 
        crossFadeDuration: 0.6, 
        priority: 3,
        timeScale: 0.5,
        naturalTiming: true
      }
    },
    'waving-2': {
      path: '/ECHO/animations/basic reactions/waving-2.glb',
      config: { 
        weight: 1.0, 
        duration: 3500, 
        loop: false, 
        crossFadeDuration: 0.6, 
        priority: 3,
        timeScale: 0.5,
        naturalTiming: true
      }
    },
    'quick-formal-bow': {
      path: '/ECHO/animations/basic reactions/quick-formal-bow.glb',
      config: { 
        weight: 1.0, 
        duration: 4000, 
        loop: false, 
        crossFadeDuration: 0.7, 
        priority: 3,
        timeScale: 0.5,
        naturalTiming: true
      }
    },
    'quick-informal-bow': {
      path: '/ECHO/animations/basic reactions/quick-informal-bow.glb',
      config: { 
        weight: 1.0, 
        duration: 3500, 
        loop: false, 
        crossFadeDuration: 0.6, 
        priority: 3,
        timeScale: 0.5,
        naturalTiming: true
      }
    },
    'standing-greeting': {
      path: '/ECHO/animations/basic reactions/standing-greeting.glb',
      config: { 
        weight: 1.0, 
        duration: 4500, 
        loop: false, 
        crossFadeDuration: 0.7, 
        priority: 3,
        timeScale: 0.5,
        naturalTiming: true
      }
    },

    // Talking animations (overlay layer) - faster and more responsive
    'talking': {
      path: '/ECHO/animations/basic reactions/talking.glb',
      config: { 
        weight: 0.8, 
        duration: 4000, 
        loop: true, 
        crossFadeDuration: 0.8, 
        priority: 2,
        timeScale: 0.5,
        naturalTiming: true
      }
    },
    'explaining': {
      path: '/ECHO/animations/basic reactions/explaining.glb',
      config: { 
        weight: 0.8, 
        duration: 5000, 
        loop: true, 
        crossFadeDuration: 0.8, 
        priority: 2,
        timeScale: 0.5,
        naturalTiming: true
      }
    },

    // Emotion animations (overlay layer) - expressive and natural
    'happy': {
      path: '/ECHO/animations/basic reactions/happy.glb',
      config: { 
        weight: 0.6, 
        duration: 4500, 
        loop: false, 
        crossFadeDuration: 0.7, 
        priority: 2,
        timeScale: 0.8,
        naturalTiming: true
      }
    },
    'excited': {
      path: '/ECHO/animations/basic reactions/excited.glb',
      config: { 
        weight: 0.7, 
        duration: 4000, 
        loop: false, 
        crossFadeDuration: 0.7, 
        priority: 2,
        timeScale: 0.8,
        naturalTiming: true
      }
    },
    'happy-hand-gesture': {
      path: '/ECHO/animations/basic reactions/happy-hand-gesture.glb',
      config: { 
        weight: 0.8, 
        duration: 3500, 
        loop: false, 
        crossFadeDuration: 0.6, 
        priority: 2,
        timeScale: 0.7,
        naturalTiming: true
      }
    },
    'clapping': {
      path: '/ECHO/animations/basic reactions/clapping.glb',
      config: { 
        weight: 0.8, 
        duration: 2500, 
        loop: false, 
        crossFadeDuration: 0.6, 
        priority: 2,
        timeScale: 0.7,
        naturalTiming: true
      }
    },

    // Gesture animations (overlay layer) - deliberate and clear
    'head-nod-yes': {
      path: '/ECHO/animations/basic reactions/head-nod-yes.glb',
      config: { 
        weight: 0.7, 
        duration: 3000, 
        loop: false, 
        crossFadeDuration: 0.6, 
        priority: 2,
        timeScale: 0.7,
        naturalTiming: true
      }
    },
    'acknowledging': {
      path: '/ECHO/animations/basic reactions/acknowledging.glb',
      config: { 
        weight: 0.6, 
        duration: 2500, 
        loop: false, 
        crossFadeDuration: 0.6, 
        priority: 2,
        timeScale: 0.8,
        naturalTiming: true
      }
    },
    'hard-head-nod': {
      path: '/ECHO/animations/basic reactions/hard-head-nod.glb',
      config: { 
        weight: 0.8, 
        duration: 2500, 
        loop: false, 
        crossFadeDuration: 0.6, 
        priority: 2,
        timeScale: 0.7,
        naturalTiming: true
      }
    },
    'lengthy-head-nod': {
      path: '/ECHO/animations/basic reactions/lengthy-head-nod.glb',
      config: { 
        weight: 0.7, 
        duration: 3500, 
        loop: false, 
        crossFadeDuration: 0.7, 
        priority: 2,
        timeScale: 0.7,
        naturalTiming: true
      }
    },
    'no': {
      path: '/ECHO/animations/basic reactions/no.glb',
      config: { 
        weight: 0.7, 
        duration: 3500, 
        loop: false, 
        crossFadeDuration: 0.7, 
        priority: 2,
        timeScale: 0.7,
        naturalTiming: true
      }
    },
    'happy-idle': {
      path: '/ECHO/animations/basic reactions/happy-idle.glb',
      config: {
        weight: 1.0,
        duration: 30000,
        loop: true,
        crossFadeDuration: 3.0,
        priority: 1,
        timeScale: 0.5,
        naturalTiming: true
      }
    },
  };

  constructor(mixer: AnimationMixer, targetModel?: any) {
    this.mixer = mixer;
    this.targetModel = targetModel;
    this.smoothController = new SmoothAnimationController(mixer);
    console.log('🎭 Unified Animation Loader initialized');
  }

  /**
   * Set the target model for retargeting
   */
  public setTargetModel(model: any): void {
    this.targetModel = model;
    if (model) {
      console.log('🎭 Target model set for animation retargeting');
      analyzeBoneStructure(model);
    }
  }

  /**
   * Load all animations for seamless blending
   */
  public async loadAllAnimations(onComplete?: () => void, onHappyIdleReady?: () => void): Promise<void> {
    if (this.isLoading) {
      console.log('🎭 Animation loading already in progress');
      return;
    }

    this.isLoading = true;
    this.onLoadComplete = onComplete;
    this.onHappyIdleReady = onHappyIdleReady;

    console.log('🎭 Starting to load all animations for unified blending...');

    const loader = new GLTFLoader();
    const loadPromises: Promise<void>[] = [];
    let happyIdleLoaded = false;

    // Load happy-idle FIRST to prevent T-pose
    const happyIdlePromise = this.loadAnimation('happy-idle', this.animationDefinitions['happy-idle'].path, this.animationDefinitions['happy-idle'], loader).then(() => {
      if (!happyIdleLoaded) {
        happyIdleLoaded = true;
        console.log('🚫 PREVENTING T-POSE: Starting happy-idle immediately after load');
        // Start happy-idle immediately to prevent T-pose
        setTimeout(() => {
          if (this.smoothController) {
            this.smoothController.forceStartBaseIdle();
            // Notify that happy-idle is ready and model can be shown
            this.onHappyIdleReady?.();
          }
        }, 50);
      }
    });
    loadPromises.push(happyIdlePromise);

    // Load all other animations in parallel
    Object.entries(this.animationDefinitions).forEach(([name, def]) => {
      if (name !== 'happy-idle') { // Skip happy-idle as it's already loaded above
        const loadPromise = this.loadAnimation(name, def.path, def.config, loader);
        loadPromises.push(loadPromise);
      }
    });

    try {
      await Promise.all(loadPromises);
      console.log(`🎭 Successfully loaded ${this.animations.size} animations`);
      
      // Set up smooth controller with all loaded animations
      this.setupSmoothController();
      
      // Ensure happy-idle is playing (double-check to prevent T-pose)
      if (this.smoothController && !this.smoothController.isBaseIdleActive()) {
        console.log('🚫 PREVENTING T-POSE: Ensuring base idle is active after all animations loaded');
        this.smoothController.forceStartBaseIdle();
      }
      
      this.isLoading = false;
      this.onLoadComplete?.();
    } catch (error) {
      console.error('🎭 Failed to load animations:', error);
      this.isLoading = false;
    }
  }

  /**
   * Load a single animation
   */
  private async loadAnimation(
    name: string, 
    path: string, 
    config: any, 
    loader: GLTFLoader
  ): Promise<void> {
    try {
      const gltf = await new Promise((resolve, reject) => {
        loader.load(path, resolve, undefined, reject);
      });

      if (gltf.animations && gltf.animations.length > 0) {
        const originalClip = gltf.animations[0];
        console.log(`🎭 Loaded animation: ${name} (${originalClip.duration.toFixed(2)}s)`);
        
        // Retarget the animation to match Echo model bone structure
        let retargetedClip = originalClip;
        
        if (this.targetModel) {
          try {
            retargetedClip = retargetAnimation(originalClip, this.targetModel);
            console.log(`🎯 Successfully retargeted ${name} animation`);
          } catch (error) {
            console.warn(`⚠️ Failed to retarget ${name} animation, using original:`, error);
            retargetedClip = originalClip;
          }
        } else {
          console.warn(`⚠️ No target model set for ${name}, using original animation`);
        }
        
        // Create action with the clip (either retargeted or original)
        const action = this.mixer!.clipAction(retargetedClip);
        
        const animation: UnifiedAnimation = {
          name,
          clip: retargetedClip,
          action,
          config
        };

        this.animations.set(name, animation);
        
        // Add to smooth controller
        this.smoothController?.addTrack(name, action, config);
        
        console.log(`🎭 Processed animation: ${name} (${retargetedClip.tracks.length} tracks)`);
      } else {
        console.warn(`🎭 No animations found in: ${path}`);
      }
    } catch (error) {
      console.error(`🎭 Failed to load animation ${name} from ${path}:`, error);
    }
  }

  /**
   * Set up the smooth controller with all loaded animations
   */
  private setupSmoothController(): void {
    if (!this.smoothController) return;

    // Add all loaded animations to the smooth controller
    this.animations.forEach((animation, name) => {
      this.smoothController!.addTrack(name, animation.action, animation.config);
    });

    console.log('🎭 Smooth controller set up with all animations');
  }

  /**
   * Get the smooth animation controller
   */
  public getSmoothController(): SmoothAnimationController | null {
    return this.smoothController;
  }

  /**
   * Play a specific animation with smooth transition
   */
  public playAnimation(name: string, blendDuration: number = 0.8): void {
    if (!this.smoothController) {
      console.warn('🎭 Smooth controller not initialized');
      return;
    }

    this.smoothController.transitionTo(name, blendDuration);
  }

  /**
   * Blend multiple animations together
   */
  public blendAnimations(animations: Array<{ name: string; weight: number }>, blendDuration: number = 0.8): void {
    if (!this.smoothController) {
      console.warn('🎭 Smooth controller not initialized');
      return;
    }

    this.smoothController.blendAnimations(animations, blendDuration);
  }

  /**
   * Return to idle state
   */
  public returnToIdle(blendDuration: number = 0.8): void {
    if (!this.smoothController) {
      console.warn('🎭 Smooth controller not initialized');
      return;
    }

    this.smoothController.returnToIdle(blendDuration);
  }

  /**
   * Update the animation system
   */
  public update(deltaTime: number): void {
    this.smoothController?.update(deltaTime);
  }

  /**
   * Get current animation state
   */
  public getCurrentState(): { activeAnimations: string[]; weights: Record<string, number> } {
    return this.smoothController?.getCurrentState() || { activeAnimations: [], weights: {} };
  }

  /**
   * Get available animation names
   */
  public getAvailableAnimations(): string[] {
    return Array.from(this.animations.keys());
  }

  /**
   * Check if animation is loaded
   */
  public isAnimationLoaded(name: string): boolean {
    return this.animations.has(name);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.smoothController?.cleanup();
    this.animations.clear();
    this.isLoading = false;
  }
} 