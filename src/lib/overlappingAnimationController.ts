/**
 * Overlapping Animation Controller
 * PREVENTS T-POSE by starting next animation BEFORE current one ends
 * Ensures continuous animation coverage with NO GAPS
 */

export interface OverlappingAnimationState {
  isActive: boolean;
  currentAnimations: string[];
  animationQueue: string[];
  nextAnimationTime: number;
  preventTPose: boolean;
}

export class OverlappingAnimationController {
  private state: OverlappingAnimationState = {
    isActive: false,
    currentAnimations: [],
    animationQueue: [],
    nextAnimationTime: 0,
    preventTPose: true
  };

  private overlappingIntervals: NodeJS.Timeout[] = [];
  private animationIndex: number = 0;

  constructor() {
    console.log('🛡️ OVERLAPPING CONTROLLER: NO GAPS = NO T-POSE');
  }

  /**
   * Start continuous overlapping talking animations
   */
  public startOverlappingTalkingAnimations(): void {
    console.log('🎭🎭🎭 STARTING OVERLAPPING TALKING ANIMATIONS 🎭🎭🎭');
    console.log('🛡️ Strategy: Next animation starts BEFORE current ends');
    
    this.state.isActive = true;
    this.state.currentAnimations = [];
    this.animationIndex = 0;
    
    // Clear any existing intervals
    this.clearAllIntervals();
    
    // Start first animation immediately
    this.startNextOverlappingAnimation();
    
    // Set up continuous overlapping cycle
    this.scheduleOverlappingAnimations();
  }

  /**
   * Start the next animation with overlap timing
   */
  private startNextOverlappingAnimation(): void {
    if (!this.state.isActive) return;

    const talkingAnimations = ['talking', 'talking-2', 'talking-3', 'talking-4'];
    const nextAnimation = talkingAnimations[this.animationIndex % talkingAnimations.length];
    
    console.log(`🎭 OVERLAPPING: Starting ${nextAnimation} (${this.animationIndex + 1}) - BEFORE previous ends`);
    
    try {
      if ((window as any).playEchoAnimation) {
        // Use shorter crossfade for quicker transitions
        (window as any).playEchoAnimation(nextAnimation, 0.5);
        
        // Track current animations
        this.state.currentAnimations.push(nextAnimation);
        
        // Remove old animations from tracking after they fade out
        setTimeout(() => {
          const index = this.state.currentAnimations.indexOf(nextAnimation);
          if (index > -1) {
            this.state.currentAnimations.splice(index, 1);
          }
        }, 4000); // Remove after 4 seconds (animation should be blended out)
        
        this.animationIndex++;
        console.log(`✅ OVERLAPPING: ${nextAnimation} started while previous still active`);
        
      } else {
        console.error('❌ playEchoAnimation not available');
      }
    } catch (error) {
      console.error('❌ Error starting overlapping animation:', error);
    }
  }

  /**
   * Schedule overlapping animations to prevent ANY gaps
   */
  private scheduleOverlappingAnimations(): void {
    if (!this.state.isActive) return;

    // CRITICAL: Start next animation BEFORE current one ends
    // Animation duration: ~4 seconds at 0.3x speed
    // Start next: 3 seconds (1 second overlap)
    const overlapInterval = 3000; // 3 seconds - starts before current animation ends
    
    console.log(`🛡️ OVERLAPPING: Next animation in ${overlapInterval}ms (prevents T-pose gap)`);
    
    const interval = setTimeout(() => {
      if (this.state.isActive) {
        this.startNextOverlappingAnimation();
        this.scheduleOverlappingAnimations(); // Continue the overlapping cycle
      }
    }, overlapInterval);
    
    this.overlappingIntervals.push(interval);
  }

  /**
   * Start overlapping idle animations for when not speaking
   */
  public startOverlappingIdleAnimations(): void {
    console.log('🛡️ STARTING OVERLAPPING IDLE ANIMATIONS');
    
    this.state.isActive = true;
    this.clearAllIntervals();
    
    const idleAnimations = [
      'happy-idle', 
      'sitting-idle', 
      'weight-shift', 
      'neutral-idle',
      'looking',
      'lengthy-head-nod'
    ];
    
    let idleIndex = 0;
    
    const startNextIdle = () => {
      if (!this.state.isActive) return;
      
      const nextIdle = idleAnimations[idleIndex % idleAnimations.length];
      console.log(`🛡️ OVERLAPPING IDLE: Starting ${nextIdle} before previous ends`);
      
      if ((window as any).playEchoAnimation) {
        (window as any).playEchoAnimation(nextIdle, 1.0); // Longer crossfade for idle
        idleIndex++;
      }
    };
    
    // Start first idle immediately
    startNextIdle();
    
    // Continue overlapping idle animations every 8 seconds
    // (Idle animations are longer, so less frequent overlap needed)
    const idleInterval = setInterval(() => {
      if (this.state.isActive) {
        startNextIdle();
      }
    }, 8000);
    
    this.overlappingIntervals.push(idleInterval);
  }

  /**
   * Stop overlapping animations and transition safely
   */
  public stopOverlappingAnimations(): void {
    console.log('🎭 STOPPING OVERLAPPING ANIMATIONS - Transitioning safely');
    
    this.state.isActive = false;
    this.clearAllIntervals();
    
    // Ensure we end with an idle animation (NO T-pose)
    console.log('🛡️ SAFETY: Starting idle animation before stopping');
    
    setTimeout(() => {
      if ((window as any).playEchoAnimation) {
        (window as any).playEchoAnimation('happy-idle', 1.5);
        console.log('✅ Safe transition to idle - no T-pose');
      }
    }, 500);
    
    // Start overlapping idle animations to maintain coverage
    setTimeout(() => {
      this.startOverlappingIdleAnimations();
    }, 1000);
  }

  /**
   * Emergency T-pose prevention - immediate overlapping animation
   */
  public emergencyOverlapPrevention(): void {
    console.log('🚨 EMERGENCY OVERLAP PREVENTION');
    
    // Start multiple animations immediately to ensure coverage
    const emergencyAnimations = ['happy-idle', 'talking', 'sitting-idle'];
    
    emergencyAnimations.forEach((anim, index) => {
      setTimeout(() => {
        if ((window as any).playEchoAnimation) {
          (window as any).playEchoAnimation(anim, 0.3); // Very quick crossfade
          console.log(`🚨 Emergency: ${anim} started`);
        }
      }, index * 200); // Stagger by 200ms
    });
    
    // Restart overlapping idle system after emergency
    setTimeout(() => {
      this.startOverlappingIdleAnimations();
    }, 2000);
  }

  /**
   * Rapid fire animation coverage - for critical T-pose prevention
   */
  public rapidFireAnimationCoverage(durationMs: number = 10000): void {
    console.log(`🔥 RAPID FIRE ANIMATION COVERAGE for ${durationMs}ms`);
    
    const rapidAnimations = [
      'happy-idle', 'talking', 'sitting-idle', 'weight-shift', 
      'neutral-idle', 'looking', 'head-nod-yes'
    ];
    
    let rapidIndex = 0;
    const startTime = Date.now();
    
    const rapidInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed >= durationMs) {
        clearInterval(rapidInterval);
        console.log('🔥 Rapid fire coverage complete');
        this.startOverlappingIdleAnimations();
        return;
      }
      
      const anim = rapidAnimations[rapidIndex % rapidAnimations.length];
      console.log(`🔥 RAPID FIRE: ${anim} (${Math.round(elapsed/1000)}s)`);
      
      if ((window as any).playEchoAnimation) {
        (window as any).playEchoAnimation(anim, 0.2); // Very fast transitions
        rapidIndex++;
      }
      
    }, 800); // New animation every 800ms - extreme overlap
  }

  /**
   * Get current overlapping state
   */
  public getOverlappingState(): OverlappingAnimationState {
    return { ...this.state };
  }

  /**
   * Clear all intervals and timeouts
   */
  private clearAllIntervals(): void {
    console.log('🧹 Clearing all overlapping intervals');
    
    this.overlappingIntervals.forEach(interval => {
      clearTimeout(interval);
    });
    this.overlappingIntervals = [];
  }

  /**
   * Force continuous animation coverage
   */
  public forceContinuousCoverage(): void {
    console.log('🛡️ FORCING CONTINUOUS ANIMATION COVERAGE');
    
    // Start overlapping animations immediately
    this.startOverlappingIdleAnimations();
    
    // Set up periodic checks to ensure coverage
    const coverageCheck = setInterval(() => {
      if (!this.state.isActive) {
        console.log('🔍 Coverage check: Restarting overlapping animations');
        this.startOverlappingIdleAnimations();
      }
    }, 5000); // Check every 5 seconds
    
    this.overlappingIntervals.push(coverageCheck);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    console.log('🧹 Cleaning up overlapping animation controller');
    this.state.isActive = false;
    this.clearAllIntervals();
  }
}

// Create and export singleton instance
export const overlappingAnimationController = new OverlappingAnimationController(); 