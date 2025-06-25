/**
 * Unified Animation Service
 * Provides a clean interface for the smooth animation system
 */

export interface AnimationRequest {
  name: string;
  blendDuration?: number;
  weight?: number;
}

export interface BlendRequest {
  animations: Array<{ name: string; weight: number }>;
  blendDuration?: number;
}

export class UnifiedAnimationService {
  private static instance: UnifiedAnimationService;
  private isInitialized = false;

  private constructor() {
    console.log('🎭 Unified Animation Service initialized');
  }

  public static getInstance(): UnifiedAnimationService {
    if (!UnifiedAnimationService.instance) {
      UnifiedAnimationService.instance = new UnifiedAnimationService();
    }
    return UnifiedAnimationService.instance;
  }

  /**
   * Initialize the service
   */
  public initialize(): void {
    this.isInitialized = true;
    console.log('🎭 Unified Animation Service ready');
  }

  /**
   * Play a single animation with smooth transition
   */
  public playAnimation(request: AnimationRequest): void {
    if (!this.isInitialized) {
      console.warn('🎭 Animation service not initialized');
      return;
    }

    if ((window as any).playEchoAnimation) {
      (window as any).playEchoAnimation(request.name, request.blendDuration || 0.8);
    } else {
      console.warn('🎭 Animation system not available');
    }
  }

  /**
   * Blend multiple animations together
   */
  public blendAnimations(request: BlendRequest): void {
    if (!this.isInitialized) {
      console.warn('🎭 Animation service not initialized');
      return;
    }

    if ((window as any).blendEchoAnimations) {
      (window as any).blendEchoAnimations(request.animations, request.blendDuration || 0.8);
    } else {
      console.warn('🎭 Animation system not available');
    }
  }

  /**
   * Return to idle state
   */
  public returnToIdle(blendDuration: number = 0.8): void {
    console.log('🎭 Returning to idle state (base idle is always active)');
    
    // Base idle is always active, just ensure other animations fade out
    if ((window as any).returnEchoToIdle) {
      (window as any).returnEchoToIdle(blendDuration);
    }
  }

  /**
   * Get current animation state
   */
  public getCurrentState(): { activeAnimations: string[]; weights: Record<string, number> } {
    if ((window as any).getEchoAnimationState) {
      return (window as any).getEchoAnimationState();
    }
    return { activeAnimations: [], weights: {} };
  }

  /**
   * Play animation based on text input
   */
  public playAnimationForText(text: string): void {
    const lowerText = text.toLowerCase();
    
    // Map text to animations with natural timing
    if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('hey')) {
      this.playAnimation({ name: 'waving-gesture', blendDuration: 0.6 });
    } else if (lowerText.includes('wave') || lowerText.includes('bye')) {
      this.playAnimation({ name: 'waving-2', blendDuration: 0.6 });
    } else if (lowerText.includes('bow') || lowerText.includes('respect') || lowerText.includes('thank')) {
      this.playAnimation({ name: 'quick-formal-bow', blendDuration: 0.7 });
    } else if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('great')) {
      this.playAnimation({ name: 'happy', blendDuration: 0.7 });
    } else if (lowerText.includes('excited') || lowerText.includes('thrilled')) {
      this.playAnimation({ name: 'excited', blendDuration: 0.7 });
    } else if (lowerText.includes('yes') || lowerText.includes('agree') || lowerText.includes('correct')) {
      this.playAnimation({ name: 'head-nod-yes', blendDuration: 0.6 });
    } else if (lowerText.includes('no') || lowerText.includes('disagree')) {
      this.playAnimation({ name: 'no', blendDuration: 0.7 });
    } else if (lowerText.includes('clap') || lowerText.includes('applause')) {
      this.playAnimation({ name: 'clapping', blendDuration: 0.6 });
    } else {
      // Default acknowledgment
      this.playAnimation({ name: 'acknowledging', blendDuration: 0.6 });
    }
  }

  /**
   * Start speaking sequence
   */
  public startSpeaking(): void {
    // Blend talking with idle
    this.blendAnimations({
      animations: [
        { name: 'talking', weight: 0.8 },
        { name: 'happy-idle', weight: 0.2 }
      ],
      blendDuration: 0.8
    });
  }

  /**
   * Stop speaking sequence
   */
  public stopSpeaking(): void {
    this.returnToIdle(0.8);
  }

  /**
   * Play greeting sequence
   */
  public playGreeting(): void {
    this.playAnimation({ name: 'waving-gesture', blendDuration: 0.6 });
  }

  /**
   * Play emotion animation
   */
  public playEmotion(emotion: string): void {
    const emotionMap: Record<string, string> = {
      'happy': 'happy',
      'excited': 'excited',
      'sad': 'acknowledging', // Fallback for sad
      'angry': 'no', // Fallback for angry
      'surprised': 'excited', // Fallback for surprised
      'neutral': 'happy-idle'
    };

    const animationName = emotionMap[emotion] || 'acknowledging';
    this.playAnimation({ name: animationName, blendDuration: 0.7 });
  }

  /**
   * Play gesture animation
   */
  public playGesture(gesture: string): void {
    const gestureMap: Record<string, string> = {
      'wave': 'waving-gesture',
      'nod': 'head-nod-yes',
      'shake': 'no',
      'clap': 'clapping',
      'bow': 'quick-formal-bow'
    };

    const animationName = gestureMap[gesture] || 'acknowledging';
    this.playAnimation({ name: animationName, blendDuration: 0.6 });
  }
}

// Export singleton instance
export const unifiedAnimationService = UnifiedAnimationService.getInstance(); 