/**
 * Human-Like Animation Service
 * Provides smooth, natural animations that mimic human behavior
 * Includes proper timing, transitions, and natural movement patterns
 */

import { animationService } from './animationService';

export interface HumanAnimationConfig {
  name: string;
  path: string;
  duration: number;
  weight: number;
  priority: number;
  naturalTiming: boolean;
  crossFadeDuration: number;
  timeScale: number;
  loop: boolean;
  category: 'greeting' | 'talking' | 'idle' | 'thinking' | 'transition';
}

export interface AnimationTransition {
  from: string;
  to: string;
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export class HumanLikeAnimationService {
  private currentAnimation: string = '';
  private isTransitioning: boolean = false;
  private transitionQueue: AnimationTransition[] = [];
  private animationHistory: string[] = [];
  private lastAnimationTime: number = 0;

  // Human-like animation configurations
  private readonly humanAnimations: Record<string, HumanAnimationConfig> = {
    // Greeting animations - warm and welcoming with smooth transitions
    'waving-2': {
      name: 'waving-2',
      path: '/ECHO/animations/basic reactions/waving-2.glb',
      duration: 6000, // Increased for slower movement
      weight: 1.0,
      priority: 3,
      naturalTiming: true,
      crossFadeDuration: 4.0, // Longer crossfade for smooth transitions (like happy-idle to hi)
      timeScale: 0.1, // Very slow - 10% speed (consistent with talking animations)
      loop: false,
      category: 'greeting'
    },
    'standing-greeting': {
      name: 'standing-greeting',
      path: '/ECHO/animations/basic reactions/standing-greeting.glb',
      duration: 8000, // Increased for slower movement
      weight: 1.0,
      priority: 3,
      naturalTiming: true,
      crossFadeDuration: 4.0, // Longer crossfade for smooth transitions (like happy-idle to hi)
      timeScale: 0.1, // Very slow - 10% speed (consistent with talking animations)
      loop: false,
      category: 'greeting'
    },
    'quick-informal-bow': {
      name: 'quick-informal-bow',
      path: '/ECHO/animations/basic reactions/quick-informal-bow.glb',
      duration: 6000, // Increased for slower movement
      weight: 1.0,
      priority: 3,
      naturalTiming: true,
      crossFadeDuration: 4.0, // Longer crossfade for smooth transitions (like happy-idle to hi)
      timeScale: 0.1, // Very slow - 10% speed (consistent with talking animations)
      loop: false,
      category: 'greeting'
    },

    // Talking animations - natural speech rhythm (using actual files)
    'talking': {
      name: 'talking',
      path: '/ECHO/animations/basic reactions/talking.glb',
      duration: 8000, // Increased for slower movement
      weight: 0.8,
      priority: 2,
      naturalTiming: true,
      crossFadeDuration: 4.0, // Same as other animations for consistent smooth transitions
      timeScale: 0.1, // Extremely slow - 10% speed (consistent with all animations)
      loop: true,
      category: 'talking'
    },
    'talking-2': {
      name: 'talking-2',
      path: '/ECHO/animations/basic reactions/talking-2.glb',
      duration: 8000, // Increased for slower movement
      weight: 0.8,
      priority: 2,
      naturalTiming: true,
      crossFadeDuration: 4.0, // Same as other animations for consistent smooth transitions
      timeScale: 0.1, // Extremely slow - 10% speed (consistent with all animations)
      loop: true,
      category: 'talking'
    },
    'talking-3': {
      name: 'talking-3',
      path: '/ECHO/animations/basic reactions/talking-3.glb',
      duration: 10000, // Increased for slower movement
      weight: 0.8,
      priority: 2,
      naturalTiming: true,
      crossFadeDuration: 4.0, // Same as other animations for consistent smooth transitions
      timeScale: 0.1, // Extremely slow - 10% speed (consistent with all animations)
      loop: true,
      category: 'talking'
    },

    // Idle animation - ONLY ONE IDLE ANIMATION - very slow and continuous (STANDING IDLE)
    'happy-idle': {
      name: 'happy-idle',
      path: '/ECHO/animations/basic reactions/happy-idle.glb',
      duration: 30000, // Very long duration
      weight: 0.8, // Increased weight for more visible movement (like other animations)
      priority: 1,
      naturalTiming: true,
      crossFadeDuration: 4.0, // Same as other animations for consistent smooth transitions
      timeScale: 0.1, // Extremely slow - 10% speed (consistent with all animations)
      loop: true,
      category: 'idle'
    }
  };

  /**
   * Start a human-like animation with proper timing
   */
  public async startHumanAnimation(animationName: string, options: Partial<HumanAnimationConfig> = {}): Promise<void> {
    const config = this.humanAnimations[animationName];
    if (!config) {
      console.warn(`⚠️ Animation not found: ${animationName}`);
      return;
    }

    // Prevent rapid animation changes
    const now = Date.now();
    if (now - this.lastAnimationTime < 1000) {
      console.log('⏱️ Animation change too rapid, queuing...');
      this.queueAnimation(animationName, options);
      return;
    }

    console.log(`🎭 Starting human animation: ${animationName}`);

    // Merge with default config
    const finalConfig = { ...config, ...options };

    // Add to history
    this.animationHistory.push(animationName);
    if (this.animationHistory.length > 10) {
      this.animationHistory.shift();
    }

    // Update current animation
    this.currentAnimation = animationName;
    this.lastAnimationTime = now;

    // Trigger animation with human-like settings
    try {
      animationService.triggerAnimationChange(finalConfig.path, {
        weight: finalConfig.weight,
        duration: finalConfig.duration,
        crossFadeDuration: finalConfig.crossFadeDuration,
        timeScale: finalConfig.timeScale,
        loop: finalConfig.loop,
        naturalTiming: finalConfig.naturalTiming
      });
    } catch (error) {
      console.error(`❌ Error starting animation ${animationName}:`, error);
    }
  }

  /**
   * Queue animation for smooth transitions
   */
  private queueAnimation(animationName: string, options: Partial<HumanAnimationConfig> = {}): void {
    const transition: AnimationTransition = {
      from: this.currentAnimation,
      to: animationName,
      duration: 800,
      easing: 'ease-in-out'
    };

    this.transitionQueue.push(transition);
    this.processTransitionQueue();
  }

  /**
   * Process animation transition queue
   */
  private async processTransitionQueue(): Promise<void> {
    if (this.isTransitioning || this.transitionQueue.length === 0) {
      return;
    }

    this.isTransitioning = true;
    const transition = this.transitionQueue.shift()!;

    // Wait for transition duration
    await new Promise(resolve => setTimeout(resolve, transition.duration));

    // Start the queued animation
    const config = this.humanAnimations[transition.to];
    if (config) {
      await this.startHumanAnimation(transition.to);
    }

    this.isTransitioning = false;

    // Process next transition if any
    if (this.transitionQueue.length > 0) {
      setTimeout(() => this.processTransitionQueue(), 100);
    }
  }

  /**
   * Get random animation from specified category
   */
  public getRandomAnimation(category: 'greeting' | 'talking' | 'idle' | 'thinking'): string {
    const config = this.humanAnimations[category];
    if (category === 'idle') {
      // For idle, always return happy-idle (standing idle) - no random selection
      return 'happy-idle';
    }

    const categoryAnimations = Object.values(this.humanAnimations)
      .filter(anim => anim.category === category);

    if (categoryAnimations.length === 0) {
      return '';
    }

    // Avoid repeating the same animation
    const availableAnimations = categoryAnimations.filter(anim => 
      anim.name !== this.currentAnimation
    );

    const animationsToChoose = availableAnimations.length > 0 ? availableAnimations : categoryAnimations;
    const randomIndex = Math.floor(Math.random() * animationsToChoose.length);
    
    return animationsToChoose[randomIndex].name;
  }

  /**
   * Start talking animation sequence
   */
  public async startTalkingSequence(): Promise<void> {
    console.log('🎭🎭🎭 HUMAN LIKE ANIMATION SERVICE: STARTING TALKING SEQUENCE 🎭🎭🎭');
    const talkingAnimations = ['talking', 'talking-2', 'talking-3'];
    const randomAnimation = talkingAnimations[Math.floor(Math.random() * talkingAnimations.length)];
    console.log('🎭 Selected talking animation:', randomAnimation);
    await this.startHumanAnimation(randomAnimation);
  }

  /**
   * Start greeting animation sequence
   */
  public async startGreetingSequence(): Promise<void> {
    console.log('🎭🎭🎭 HUMAN LIKE ANIMATION SERVICE: STARTING GREETING SEQUENCE 🎭🎭🎭');
    const greetingAnimations = ['waving-2', 'standing-greeting', 'quick-informal-bow'];
    const randomAnimation = greetingAnimations[Math.floor(Math.random() * greetingAnimations.length)];
    console.log('🎭 Selected greeting animation:', randomAnimation);
    await this.startHumanAnimation(randomAnimation);
  }

  /**
   * Start idle animation sequence - ONLY ONE IDLE ANIMATION (STANDING IDLE)
   */
  public async startIdleSequence(): Promise<void> {
    // Only use happy-idle animation (standing idle) - no random selection
    await this.startHumanAnimation('happy-idle');
  }

  /**
   * Get current animation
   */
  public getCurrentAnimation(): string {
    return this.currentAnimation;
  }

  /**
   * Check if currently transitioning
   */
  public isCurrentlyTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Get animation history
   */
  public getAnimationHistory(): string[] {
    return [...this.animationHistory];
  }

  /**
   * Clear transition queue
   */
  public clearTransitionQueue(): void {
    this.transitionQueue = [];
    this.isTransitioning = false;
  }

  /**
   * Stop current animation and return to idle
   */
  public async stopAndReturnToIdle(): Promise<void> {
    this.clearTransitionQueue();
    await this.startIdleSequence();
  }
}

// Export singleton instance
export const humanLikeAnimationService = new HumanLikeAnimationService(); 