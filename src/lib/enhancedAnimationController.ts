/**
 * Enhanced Animation Controller for Echo Character
 * Manages specific animation sequences: greeting -> talking -> idle
 * 
 * IMPROVED: Works with base layer approach where happy-idle is always active
 */

import { animationService } from './animationService';

export interface AnimationSequence {
  greeting: boolean;
  talking: boolean;
  idle: boolean;
}

export class EnhancedAnimationController {
  private currentSequence: AnimationSequence = {
    greeting: false,
    talking: false,
    idle: true
  };
  
  private talkingTimeout: NodeJS.Timeout | null = null;
  private greetingTimeout: NodeJS.Timeout | null = null;
  private idleInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    console.log('🎭 Enhanced Animation Controller initialized with base layer protection');
    this.startIdleLoop();
    // Base idle is always active - no need to play it immediately
  }

  /**
   * Start speaking sequence: greeting -> talking -> return to base idle
   */
  public startSpeaking(text: string = ''): void {
    console.log('🎭 Starting speaking sequence (base idle remains active)');
    
    // Clear timeouts
    this.clearTimeouts();
    
    // 1. Play greeting animation (layered on base idle)
    this.playGreetingAnimation();
    
    // 2. After a short delay, start talking animation
    this.greetingTimeout = setTimeout(() => {
      this.startTalkingAnimation();
    }, 800); // Short delay to let greeting animation play
  }

  /**
   * Stop speaking sequence: return to base idle (which is always active)
   */
  public stopSpeaking(): void {
    console.log('🎭 Stopping speaking sequence (base idle remains active)');
    
    // Clear timeouts
    this.clearTimeouts();
    
    // Update sequence state
    this.currentSequence = {
      greeting: false,
      talking: false,
      idle: true
    };
    
    // Return to base idle (which is always active)
    this.returnToBaseIdle();
  }

  /**
   * Play greeting animation (hi, wave, etc.) - layered on base idle
   */
  private playGreetingAnimation(): void {
    console.log('🎭 Playing greeting animation (layered on base idle)');
    
    this.currentSequence.greeting = true;
    this.currentSequence.talking = false;
    this.currentSequence.idle = true; // Base idle is always true
    
    // Find and trigger greeting animation (layered on base idle)
    const greetingAnimation = animationService.findAnimationForText('hi hello');
    if (greetingAnimation) {
      animationService.triggerAnimationChange(greetingAnimation.path);
    }
  }

  /**
   * Start continuous talking animation - layered on base idle
   */
  private startTalkingAnimation(): void {
    console.log('🎭 Starting talking animation (layered on base idle)');
    
    this.currentSequence.greeting = false;
    this.currentSequence.talking = true;
    this.currentSequence.idle = true; // Base idle is always true
    
    // Find and trigger talking animation (layered on base idle)
    const talkingAnimation = animationService.findAnimationForText('talk speak conversation');
    if (talkingAnimation) {
      animationService.triggerAnimationChange(talkingAnimation.path);
      
      // Keep talking animation going during speech
      this.maintainTalkingAnimation();
    }
  }

  /**
   * Maintain talking animation during speech - layered on base idle
   */
  private maintainTalkingAnimation(): void {
    if (this.currentSequence.talking) {
      // Refresh talking animation every few seconds to maintain natural movement
      this.talkingTimeout = setTimeout(() => {
        if (this.currentSequence.talking) {
          const talkingAnimations = [
            'talk speak conversation',
            'explain teach instruct',
            'present demonstration'
          ];
          
          const randomTalking = talkingAnimations[Math.floor(Math.random() * talkingAnimations.length)];
          const animation = animationService.findAnimationForText(randomTalking);
          
          if (animation) {
            animationService.triggerAnimationChange(animation.path);
          }
          
          // Continue maintaining talking animation
          this.maintainTalkingAnimation();
        }
      }, 3000 + Math.random() * 2000); // 3-5 seconds
    }
  }

  /**
   * Start idle animation loop (base idle is always active)
   */
  private startIdleLoop(): void {
    console.log('🎭 Starting idle loop (base idle is always active)');
    
    this.currentSequence = {
      greeting: false,
      talking: false,
      idle: true // Base idle is always true
    };
    
    // Base idle is always active - no need to start it
    // Just ensure it's running and monitor it
    
    // Monitor base idle every 30 seconds to ensure it's still active
    this.idleInterval = setInterval(() => {
      if (this.currentSequence.idle) {
        // Check if base idle is still active
        const currentAnim = animationService.getCurrentAnimation();
        if (!currentAnim || currentAnim === '') {
          console.log('🚨 Base idle stopped - forcing it to restart');
          this.forceRestartBaseIdle();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Force restart base idle if it stops unexpectedly
   */
  private forceRestartBaseIdle(): void {
    console.log('🚨 EMERGENCY: Forcing base idle to restart');
    
    // Use the global function to force base idle
    if ((window as any).forceEchoBaseIdle) {
      (window as any).forceEchoBaseIdle();
    }
    
    // Also trigger through animation service
    const idleAnim = animationService.getRandomIdleAnimation();
    animationService.triggerAnimationChange(idleAnim.path, {
      timeScale: 0.1, // Extremely slow - 10% speed
      weight: 1.0, // Full weight for base layer
      crossFadeDuration: 3.0, // Very long crossfade to prevent T-pose
      duration: 20000 // Very long duration
    });
  }

  /**
   * Return to base idle (which is always active)
   */
  private returnToBaseIdle(): void {
    console.log('🎭 Returning to base idle (which is always active)');
    
    // Base idle is always active, just ensure other animations fade out
    if ((window as any).returnEchoToIdle) {
      (window as any).returnEchoToIdle(0.8);
    }
  }

  /**
   * Stop idle animation loop
   */
  private stopIdleLoop(): void {
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = null;
    }
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    if (this.talkingTimeout) {
      clearTimeout(this.talkingTimeout);
      this.talkingTimeout = null;
    }
    
    if (this.greetingTimeout) {
      clearTimeout(this.greetingTimeout);
      this.greetingTimeout = null;
    }
  }

  /**
   * Get current animation sequence state
   */
  public getCurrentSequence(): AnimationSequence {
    return { ...this.currentSequence };
  }

  /**
   * Force specific animation (for testing) - layered on base idle
   */
  public forceAnimation(animationType: 'greeting' | 'talking' | 'idle'): void {
    this.clearTimeouts();
    this.stopIdleLoop();
    
    switch (animationType) {
      case 'greeting':
        this.playGreetingAnimation();
        break;
      case 'talking':
        this.startTalkingAnimation();
        break;
      case 'idle':
        this.startIdleLoop();
        break;
    }
  }

  /**
   * Cleanup when component unmounts
   */
  public cleanup(): void {
    this.clearTimeouts();
    this.stopIdleLoop();
  }
}

// Create singleton instance
export const enhancedAnimationController = new EnhancedAnimationController(); 