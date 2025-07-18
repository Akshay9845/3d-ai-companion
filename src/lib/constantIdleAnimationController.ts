/**
 * Constant Idle Animation Controller
 * PREVENTS T-POSE by ensuring character is ALWAYS in idle animations
 * Maintains continuous idle animation cycling when no specific animations are triggered
 */

export interface IdleAnimationState {
  isIdleActive: boolean;
  currentIdleAnimation: string;
  lastIdleChange: number;
  idleQueue: string[];
}

export class ConstantIdleAnimationController {
  private state: IdleAnimationState = {
    isIdleActive: true,
    currentIdleAnimation: 'happy-idle',
    lastIdleChange: Date.now(),
    idleQueue: []
  };

  private idleLoopInterval: NodeJS.Timeout | null = null;
  private idleAnimationIndex: number = 0;
  private isInitialized: boolean = false;
  private preventTPoseMode: boolean = true; // Always prevent T-pose

  // Available idle animations that can cycle
  private idleAnimations = [
    'happy-idle',
    'sitting-idle',
    'weight-shift',
    'neutral-idle',
    'male-sitting-pose',
    'male-sitting-pose-2',
    'looking',
    'lengthy-head-nod',
    'thoughtful-head-shake'
  ];

  constructor() {
    console.log('🛡️ CONSTANT IDLE: T-pose prevention system activated');
    this.initialize();
  }

  /**
   * Initialize the constant idle system
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.log('🛡️ CONSTANT IDLE: Already initialized');
      return;
    }

    console.log('🛡️ CONSTANT IDLE: Initializing constant idle animation system...');
    
    // Start with happy-idle immediately
    this.ensureIdleAnimation();
    
    // Start the constant idle loop
    this.startConstantIdleLoop();
    
    // Expose global functions for emergency T-pose prevention
    this.exposeGlobalFunctions();
    
    this.isInitialized = true;
    console.log('✅ CONSTANT IDLE: T-pose prevention system ready');
  }

  /**
   * Ensure an idle animation is always playing - CRITICAL for T-pose prevention
   */
  public ensureIdleAnimation(): void {
    if (!this.preventTPoseMode) return;

    console.log('🛡️ CONSTANT IDLE: Ensuring idle animation is active (prevent T-pose)');
    
    try {
      if ((window as any).playEchoAnimation) {
        const currentIdle = this.getCurrentIdleAnimation();
        console.log(`🛡️ CONSTANT IDLE: Activating ${currentIdle} to prevent T-pose`);
        
        // Use longer crossfade for smooth idle transitions
        (window as any).playEchoAnimation(currentIdle, 2.0);
        
        this.state.currentIdleAnimation = currentIdle;
        this.state.isIdleActive = true;
        this.state.lastIdleChange = Date.now();
        
        console.log(`✅ CONSTANT IDLE: ${currentIdle} active - T-pose prevented`);
      } else {
        console.error('❌ CONSTANT IDLE: playEchoAnimation not available');
      }
    } catch (error) {
      console.error('❌ CONSTANT IDLE: Error ensuring idle animation:', error);
    }
  }

  /**
   * Start the constant idle animation loop - prevents T-pose indefinitely
   */
  private startConstantIdleLoop(): void {
    if (this.idleLoopInterval) {
      clearInterval(this.idleLoopInterval);
    }

    console.log('🛡️ CONSTANT IDLE: Starting continuous idle loop (T-pose prevention)');
    
    // Change idle animation every 30 seconds for variety
    this.idleLoopInterval = setInterval(() => {
      if (this.preventTPoseMode) {
        console.log('🛡️ CONSTANT IDLE: Cycling to next idle animation (T-pose prevention)');
        this.cycleToNextIdleAnimation();
      }
    }, 30000); // 30 seconds
  }

  /**
   * Cycle to the next idle animation in the queue
   */
  private cycleToNextIdleAnimation(): void {
    this.idleAnimationIndex = (this.idleAnimationIndex + 1) % this.idleAnimations.length;
    const nextIdle = this.idleAnimations[this.idleAnimationIndex];
    
    console.log(`🛡️ CONSTANT IDLE: Cycling to ${nextIdle} (position ${this.idleAnimationIndex + 1}/${this.idleAnimations.length})`);
    
    try {
      if ((window as any).playEchoAnimation) {
        // Use very long crossfade for smooth idle transitions
        (window as any).playEchoAnimation(nextIdle, 3.0);
        
        this.state.currentIdleAnimation = nextIdle;
        this.state.lastIdleChange = Date.now();
        
        console.log(`✅ CONSTANT IDLE: Now playing ${nextIdle} - T-pose still prevented`);
      }
    } catch (error) {
      console.error('❌ CONSTANT IDLE: Error cycling idle animation:', error);
      // Fallback to happy-idle if cycling fails
      this.fallbackToHappyIdle();
    }
  }

  /**
   * Get the current idle animation to play
   */
  private getCurrentIdleAnimation(): string {
    return this.idleAnimations[this.idleAnimationIndex % this.idleAnimations.length];
  }

  /**
   * Fallback to happy-idle if other idles fail
   */
  private fallbackToHappyIdle(): void {
    console.log('🛡️ CONSTANT IDLE: Falling back to happy-idle');
    
    try {
      if ((window as any).playEchoAnimation) {
        (window as any).playEchoAnimation('happy-idle', 2.0);
        this.state.currentIdleAnimation = 'happy-idle';
        this.state.lastIdleChange = Date.now();
        console.log('✅ CONSTANT IDLE: Happy-idle fallback active');
      }
    } catch (error) {
      console.error('❌ CONSTANT IDLE: Even happy-idle fallback failed:', error);
    }
  }

  /**
   * Force immediate idle animation (emergency T-pose prevention)
   */
  public emergencyIdleActivation(): void {
    console.log('🚨 EMERGENCY IDLE: Activating immediate idle animation');
    
    // Stop any conflicting timers
    if (this.idleLoopInterval) {
      clearInterval(this.idleLoopInterval);
    }
    
    // Force happy-idle immediately
    this.fallbackToHappyIdle();
    
    // Wait a moment then restart the constant loop
    setTimeout(() => {
      this.startConstantIdleLoop();
    }, 2000);
    
    console.log('✅ EMERGENCY IDLE: Emergency idle activation complete');
  }

  /**
   * Temporarily disable T-pose prevention (use with caution)
   */
  public temporarilyDisableTPosePrevention(durationMs: number = 5000): void {
    console.log(`⚠️ CONSTANT IDLE: Temporarily disabling T-pose prevention for ${durationMs}ms`);
    
    this.preventTPoseMode = false;
    
    setTimeout(() => {
      console.log('🛡️ CONSTANT IDLE: Re-enabling T-pose prevention');
      this.preventTPoseMode = true;
      this.ensureIdleAnimation();
    }, durationMs);
  }

  /**
   * Check if idle animation is currently active
   */
  public isIdleAnimationActive(): boolean {
    return this.state.isIdleActive;
  }

  /**
   * Get current idle state
   */
  public getIdleState(): IdleAnimationState {
    return { ...this.state };
  }

  /**
   * Expose global functions for easy access and emergency use
   */
  private exposeGlobalFunctions(): void {
    // Emergency T-pose prevention function
    (window as any).emergencyTPosePrevention = () => {
      console.log('🚨 GLOBAL: Emergency T-pose prevention activated');
      this.emergencyIdleActivation();
      return 'Emergency T-pose prevention activated';
    };

    // Force constant idle function
    (window as any).forceConstantIdle = () => {
      console.log('🛡️ GLOBAL: Forcing constant idle activation');
      this.ensureIdleAnimation();
      return 'Constant idle forced active';
    };

    // Get idle status function
    (window as any).getIdleStatus = () => {
      const state = this.getIdleState();
      console.log('📊 IDLE STATUS:', state);
      return state;
    };

    // Restart idle loop function
    (window as any).restartIdleLoop = () => {
      console.log('🔄 GLOBAL: Restarting idle loop');
      this.startConstantIdleLoop();
      return 'Idle loop restarted';
    };

    // Override the existing forceEchoBaseIdle to use our system
    (window as any).forceEchoBaseIdle = () => {
      console.log('🛡️ OVERRIDE: forceEchoBaseIdle using constant idle system');
      this.ensureIdleAnimation();
      return 'Base idle forced via constant idle system';
    };

    console.log('✅ CONSTANT IDLE: Global T-pose prevention functions exposed');
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    console.log('🛡️ CONSTANT IDLE: Cleaning up constant idle system');
    
    if (this.idleLoopInterval) {
      clearInterval(this.idleLoopInterval);
      this.idleLoopInterval = null;
    }
    
    this.isInitialized = false;
  }
}

// Create and export singleton instance
export const constantIdleAnimationController = new ConstantIdleAnimationController(); 