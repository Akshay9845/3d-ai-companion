/**
 * Intelligent Animation Scheduler - Simplified version to prevent T-pose
 * Ensures continuous animation flow with zero gaps
 */

interface ScheduledAnimation {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  priority: number;
  crossfade: number;
  isLoop: boolean;
  category: string;
}

interface AnimationQueue {
  current: ScheduledAnimation | null;
  next: ScheduledAnimation | null;
  pending: ScheduledAnimation[];
}

export class IntelligentAnimationScheduler {
  private queue: AnimationQueue = {
    current: null,
    next: null,
    pending: []
  };
  
  private schedulerActive = false;
  private schedulerInterval: NodeJS.Timeout | null = null;
  private emergencyPreventionActive = false;
  private lastScheduledAnimation: string | null = null;
  private lastScheduledTime: number = 0;
  private animationCooldown: Map<string, number> = new Map(); // Prevent rapid re-scheduling
  
  // Animation timing configurations
  private readonly timingConfig = {
    minAnimationDuration: 1000,
    maxGapDuration: 100,
    emergencyBlendTime: 0.2,
    normalBlendTime: 0.8,
    preloadTime: 500,
    idleReturnDelay: 2000,
    animationCooldownMs: 1000, // Minimum time between same animation
  };
  
  // Emergency fallback animations
  private readonly emergencyAnimations = [
    { name: 'happy-idle', duration: 15000, priority: 1 },
    { name: 'talking', duration: 3000, priority: 2 },
    { name: 'weight-shift', duration: 2000, priority: 3 },
    { name: 'happy', duration: 2500, priority: 4 }
  ];
  
  private onAnimationStart?: (animation: ScheduledAnimation) => void;
  private onAnimationEnd?: (animation: ScheduledAnimation) => void;
  private onEmergencyPrevention?: () => void;

  constructor() {
    console.log('🎯 Intelligent Animation Scheduler initialized - Zero T-pose tolerance');
  }

  /**
   * Start the intelligent scheduler
   */
  public startScheduler(): void {
    if (this.schedulerActive) return;
    
    this.schedulerActive = true;
    
    // Reduced frequency monitoring (every 200ms instead of 50ms)
    this.schedulerInterval = setInterval(() => {
      this.processQueue();
      this.preventAnimationGaps();
    }, 200);
    
    // Start with emergency idle animation
    this.scheduleEmergencyAnimation();
    
    console.log('🎯 Intelligent Animation Scheduler started - 5 FPS monitoring');
  }

  /**
   * Stop the scheduler
   */
  public stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.schedulerActive = false;
    console.log('🎯 Scheduler stopped');
  }

  /**
   * Schedule a new animation with cooldown protection
   */
  public scheduleAnimation(
    animationName: string, 
    priority: number = 2, 
    options: {
      duration?: number;
      crossfade?: number;
      category?: string;
      isLoop?: boolean;
      immediate?: boolean;
    } = {}
  ): string {
    const now = Date.now();
    
    // Check cooldown to prevent rapid re-scheduling
    const lastScheduled = this.animationCooldown.get(animationName) || 0;
    if (now - lastScheduled < this.timingConfig.animationCooldownMs) {
      console.log(`🎯 SCHEDULER: ${animationName} on cooldown, skipping`);
      return '';
    }
    
    // Prevent scheduling the same animation too quickly
    if (this.lastScheduledAnimation === animationName && 
        now - this.lastScheduledTime < this.timingConfig.animationCooldownMs) {
      console.log(`🎯 SCHEDULER: Preventing rapid re-schedule of ${animationName}`);
      return '';
    }
    
    const animationId = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scheduledAnimation: ScheduledAnimation = {
      id: animationId,
      name: animationName,
      startTime: options.immediate ? Date.now() : this.calculateOptimalStartTime(),
      duration: options.duration || this.getAnimationDuration(animationName),
      priority,
      crossfade: options.crossfade || this.timingConfig.normalBlendTime,
      isLoop: options.isLoop || false,
      category: options.category || 'general'
    };

    this.insertIntoQueue(scheduledAnimation);
    
    // Update tracking
    this.lastScheduledAnimation = animationName;
    this.lastScheduledTime = now;
    this.animationCooldown.set(animationName, now);
    
    console.log(`🎯 Scheduled animation: ${animationName} (ID: ${animationId}, Priority: ${priority})`);
    
    return animationId;
  }

  /**
   * Schedule emergency animation immediately
   */
  private scheduleEmergencyAnimation(): void {
    // Prevent multiple emergency animations
    if (this.emergencyPreventionActive) {
      console.log('🎯 SCHEDULER: Emergency prevention already active, skipping');
      return;
    }
    
    this.emergencyPreventionActive = true;
    
    const emergencyAnim = this.emergencyAnimations[0];
    
    const emergencyScheduled: ScheduledAnimation = {
      id: `emergency_${Date.now()}`,
      name: emergencyAnim.name,
      startTime: Date.now(),
      duration: emergencyAnim.duration,
      priority: 999,
      crossfade: this.timingConfig.emergencyBlendTime,
      isLoop: emergencyAnim.name.includes('idle'),
      category: 'emergency'
    };

    this.queue.pending = [];
    this.queue.next = emergencyScheduled;
    
    console.log(`🚨 EMERGENCY ANIMATION SCHEDULED: ${emergencyAnim.name}`);
    
    setTimeout(() => {
      this.emergencyPreventionActive = false;
    }, 2000); // Increased from 1000ms to 2000ms
  }

  /**
   * Process the animation queue
   */
  private processQueue(): void {
    const now = Date.now();
    
    // Start next animation if it's time
    if (this.queue.next && now >= this.queue.next.startTime) {
      this.startAnimation(this.queue.next);
      this.queue.current = this.queue.next;
      this.queue.next = this.getNextFromPending();
    }
    
    // Check if current animation should end
    if (this.queue.current) {
      const endTime = this.queue.current.startTime + this.queue.current.duration;
      if (now >= endTime && !this.queue.current.isLoop) {
        this.endAnimation(this.queue.current);
        this.queue.current = null;
      }
    }
    
    // Ensure we always have a next animation ready
    if (!this.queue.next && this.queue.pending.length === 0) {
      this.scheduleDefaultIdleAnimation();
    }
  }

  /**
   * Prevent animation gaps
   */
  private preventAnimationGaps(): void {
    const now = Date.now();
    
    // Only check for gaps if we don't have any animations queued
    if (!this.queue.current && !this.queue.next && this.queue.pending.length === 0) {
      console.log('🚨 SCHEDULER: Animation gap detected - EMERGENCY SCHEDULING');
      this.scheduleEmergencyAnimation();
      return;
    }
    
    // Preload next animation if current is ending soon
    if (this.queue.current && !this.queue.next && this.queue.pending.length === 0) {
      const timeRemaining = (this.queue.current.startTime + this.queue.current.duration) - now;
      if (timeRemaining <= this.timingConfig.preloadTime && timeRemaining > 0) {
        console.log('🎯 SCHEDULER: Preloading idle animation to prevent gap');
        this.scheduleDefaultIdleAnimation();
      }
    }
  }

  /**
   * Start an animation
   */
  private startAnimation(animation: ScheduledAnimation): void {
    try {
      console.log(`🎯 SCHEDULER: Starting animation: ${animation.name} (${animation.category})`);
      
      if ((window as any).playEchoAnimation) {
        (window as any).playEchoAnimation(animation.name, animation.crossfade);
      }
      
      this.onAnimationStart?.(animation);
      
    } catch (error) {
      console.error('❌ SCHEDULER: Error starting animation:', error);
      this.scheduleEmergencyAnimation();
    }
  }

  /**
   * End an animation
   */
  private endAnimation(animation: ScheduledAnimation): void {
    console.log(`🎯 SCHEDULER: Ending animation: ${animation.name}`);
    this.onAnimationEnd?.(animation);
  }

  /**
   * Calculate optimal start time
   */
  private calculateOptimalStartTime(): number {
    const now = Date.now();
    
    if (!this.queue.current) {
      return now + 100;
    }
    
    const currentEndTime = this.queue.current.startTime + this.queue.current.duration;
    return currentEndTime - this.timingConfig.preloadTime;
  }

  /**
   * Insert animation into queue
   */
  private insertIntoQueue(animation: ScheduledAnimation): void {
    if (animation.priority >= 999) {
      this.queue.next = animation;
      return;
    }
    
    const insertIndex = this.queue.pending.findIndex(a => a.priority < animation.priority);
    if (insertIndex === -1) {
      this.queue.pending.push(animation);
    } else {
      this.queue.pending.splice(insertIndex, 0, animation);
    }
    
    if (!this.queue.next) {
      this.queue.next = this.getNextFromPending();
    }
  }

  /**
   * Get next animation from pending queue
   */
  private getNextFromPending(): ScheduledAnimation | null {
    return this.queue.pending.shift() || null;
  }

  /**
   * Schedule default idle animation with immediate chaining
   */
  private scheduleDefaultIdleAnimation(): void {
    // Check if we already have an idle animation scheduled
    const hasIdleInQueue = this.queue.pending.some(anim => anim.name === 'happy-idle') ||
                          (this.queue.next && this.queue.next.name === 'happy-idle') ||
                          (this.queue.current && this.queue.current.name === 'happy-idle');
    
    if (hasIdleInQueue) {
      console.log('🎯 SCHEDULER: Idle animation already scheduled, skipping');
      return;
    }
    
    // Schedule the idle animation with immediate follow-up
    const idleAnimationId = this.scheduleAnimation('happy-idle', 1, {
      duration: this.getAnimationDuration('happy-idle'),
      isLoop: false, // Don't loop, chain instead
      category: 'idle',
      crossfade: this.timingConfig.normalBlendTime
    });
    
    // Schedule the next idle animation to start right after this one ends
    setTimeout(() => {
      this.scheduleNextIdleAnimation();
    }, this.getAnimationDuration('happy-idle') - 1000); // Start next 1 second before current ends
    
    console.log('🎯 SCHEDULER: Scheduled idle animation chain to prevent T-pose');
  }

  /**
   * Schedule the next idle animation in the chain
   */
  private scheduleNextIdleAnimation(): void {
    // Only schedule if we don't have other animations pending
    if (this.queue.pending.length === 0) {
      console.log('🎯 SCHEDULER: Chaining next idle animation to prevent gaps');
      this.scheduleDefaultIdleAnimation();
    }
  }

  /**
   * Get animation duration (adjusted for 0.4x speed)
   */
  private getAnimationDuration(animationName: string): number {
    const baseDurations: Record<string, number> = {
      'happy-idle': 30000, // Base duration for idle
      'talking': 4000,
      'talking-2': 4000,
      'talking-3': 4000,
      'talking-4': 4000,
      'waving-2': 3500,
      'standing-greeting': 4500,
      'happy': 3500,
      'excited': 4500,
      'weight-shift': 3000,
      'warming-up': 6000,
      'angry-gesture': 2500,
      'clapping': 2500
    };
    
    const baseDuration = baseDurations[animationName] || this.timingConfig.minAnimationDuration;
    
    // Since animations play at 0.3x speed, they take 3.33x longer to complete
    const adjustedDuration = Math.round(baseDuration * 3.33);
    
    console.log(`🎯 SCHEDULER: ${animationName} duration: ${baseDuration}ms base → ${adjustedDuration}ms at 0.3x speed`);
    
    return adjustedDuration;
  }

  /**
   * Get current queue status
   */
  public getQueueStatus(): {
    current: ScheduledAnimation | null;
    next: ScheduledAnimation | null;
    pending: number;
    isActive: boolean;
  } {
    return {
      current: this.queue.current,
      next: this.queue.next,
      pending: this.queue.pending.length,
      isActive: this.schedulerActive
    };
  }

  /**
   * Clear all pending animations
   */
  public clearQueue(): void {
    this.queue.pending = [];
    console.log('🎯 SCHEDULER: Queue cleared');
  }

  /**
   * Set event callbacks
   */
  public setCallbacks(callbacks: {
    onAnimationStart?: (animation: ScheduledAnimation) => void;
    onAnimationEnd?: (animation: ScheduledAnimation) => void;
    onEmergencyPrevention?: () => void;
  }): void {
    this.onAnimationStart = callbacks.onAnimationStart;
    this.onAnimationEnd = callbacks.onAnimationEnd;
    this.onEmergencyPrevention = callbacks.onEmergencyPrevention;
  }

  /**
   * Force immediate animation
   */
  public forceImmediateAnimation(animationName: string): void {
    console.log(`🎯 SCHEDULER: Forcing immediate animation: ${animationName}`);
    
    const immediateAnimation: ScheduledAnimation = {
      id: `force_${Date.now()}`,
      name: animationName,
      startTime: Date.now(),
      duration: this.getAnimationDuration(animationName),
      priority: 999,
      crossfade: this.timingConfig.emergencyBlendTime,
      isLoop: false,
      category: 'forced'
    };
    
    this.startAnimation(immediateAnimation);
    this.queue.current = immediateAnimation;
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    this.stopScheduler();
    this.queue = { current: null, next: null, pending: [] };
    console.log('🎯 Intelligent Animation Scheduler cleaned up');
  }
}

// Export singleton instance
export const intelligentAnimationScheduler = new IntelligentAnimationScheduler(); 