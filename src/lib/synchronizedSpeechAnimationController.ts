/**
 * Synchronized Speech Animation Controller for Echo Character
 * FIXED: Robust talking animation loop until TTS ends, no T-pose returns
 */


export interface SpeechAnimationState {
  isSpeaking: boolean;
  currentAnimation: string;
  speechStartTime: number;
  estimatedDuration: number;
  animationQueue: string[];
}

export class SynchronizedSpeechAnimationController {
  private state: SpeechAnimationState = {
    isSpeaking: false,
    currentAnimation: 'happy-idle',
    speechStartTime: 0,
    estimatedDuration: 0,
    animationQueue: []
  };

  private isProcessingSpeech: boolean = false;
  private currentSpeechTimeout: NodeJS.Timeout | null = null;
  private ttsCompletionCallback: (() => void) | null = null;
  private ttsMonitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    console.log('🎭 ROBUST Speech Controller: Continuous talking until TTS ends, no T-pose');
  }

  /**
   * Start synchronized speech with robust talking animation loop
   */
  public async startSynchronizedSpeech(text: string, ttsService: any): Promise<void> {
    console.log('🎭🎭🎭 STARTING ROBUST TALKING ANIMATION LOOP 🎭🎭🎭');
    console.log('🎭 Text length:', text.length, 'characters');
    
    // Prevent duplicate speech
    if (this.state.isSpeaking || this.isProcessingSpeech) {
      console.log('🔄 Speech already in progress, ignoring duplicate request');
      return;
    }

    this.isProcessingSpeech = true;
    this.state.isSpeaking = true;
    this.state.speechStartTime = Date.now();

    // Calculate estimated speech duration (generous timing)
    const wordsPerMinute = 120; // Slower estimate to ensure we don't stop too early
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = Math.max(5000, (wordCount / wordsPerMinute) * 60000);
    this.state.estimatedDuration = estimatedDuration;

    console.log('🎭 Estimated speech duration:', estimatedDuration, 'ms for', wordCount, 'words');
    console.log('🎭 Talking animations: 0.3x speed, robust loop until TTS ends');
    this.clearTimeouts();

    try {
      // 1. Start robust talking animation loop immediately
      console.log('🎭 STEP 1: Starting robust talking animation loop...');
      this.startRobustTalkingLoop();

      // 2. Start TTS and monitor completion aggressively
      console.log('🎭 STEP 2: Starting TTS with aggressive completion monitoring...');
      this.startTTSWithRobustMonitoring(text, ttsService, estimatedDuration);

    } catch (error) {
      console.error('❌ Synchronized speech error:', error);
      this.handleTTSCompletion();
    }
  }

  /**
   * Start TTS with robust completion monitoring
   */
  private startTTSWithRobustMonitoring(text: string, ttsService: any, estimatedDuration: number): void {
    console.log('🎭 Starting TTS with multiple completion detection methods...');

    // Method 1: Set up callback if TTS service supports it
    if (ttsService && typeof ttsService.setSpeechEndCallback === 'function') {
      console.log('🎭 Setting up TTS end callback');
      ttsService.setSpeechEndCallback(() => {
        console.log('🎭 TTS completion detected via callback');
        this.handleTTSCompletion();
      });
    }

    // Method 2: Aggressive TTS state monitoring
    let lastTTSCheck = true;
    let consecutiveNotSpeaking = 0;
    this.ttsMonitoringInterval = setInterval(() => {
      if (ttsService && typeof ttsService.isSpeaking === 'function') {
        const isCurrentlySpeaking = ttsService.isSpeaking();
        
        if (!isCurrentlySpeaking) {
          consecutiveNotSpeaking++;
          console.log(`🔍 TTS not speaking for ${consecutiveNotSpeaking} checks`);
          
          // Only consider TTS complete after 3 consecutive "not speaking" checks
          if (consecutiveNotSpeaking >= 3 && this.state.isSpeaking) {
            console.log('🎭 TTS completion detected via aggressive monitoring');
            this.handleTTSCompletion();
          }
        } else {
          consecutiveNotSpeaking = 0;
        }
      }
    }, 500); // Check every 500ms

    // Method 3: Safety timeout (very generous)
    this.currentSpeechTimeout = setTimeout(() => {
      console.log('🎭 TTS completion via safety timeout');
      this.handleTTSCompletion();
    }, estimatedDuration + 15000); // 15 second safety buffer

    // Start TTS
    console.log('🎭 Starting TTS playback...');
    ttsService.speak(text).then(() => {
      console.log('🎭 TTS Promise resolved');
      // Add delay before completion to ensure animation finishes naturally
      setTimeout(() => {
        this.handleTTSCompletion();
      }, 1000);
    }).catch((error: any) => {
      console.error('❌ TTS error:', error);
      this.handleTTSCompletion();
    });
  }

  /**
   * Start robust talking animation loop that continues until TTS ends
   */
  private startRobustTalkingLoop(): void {
    if (!this.state.isSpeaking) return;

    console.log('🎭🎭🎭 STARTING OVERLAPPING TALKING LOOP - NO GAPS = NO T-POSE 🎭🎭🎭');
    
    // Use overlapping animation controller to prevent T-pose gaps
    overlappingAnimationController.startOverlappingTalkingAnimations();
    
    console.log('✅ Overlapping talking animations started - continuous coverage');
  }



  /**
   * Handle TTS completion - Use overlapping controller for safe transition
   */
  private handleTTSCompletion(): void {
    if (!this.state.isSpeaking) {
      console.log('🎭 TTS completion already handled');
      return;
    }

    console.log('🎭 HANDLING TTS COMPLETION - Safe overlapping transition');
    
    this.state.isSpeaking = false;
    this.isProcessingSpeech = false;
    this.clearAllTimeouts();
    this.state.animationQueue = [];
    
    // Use overlapping controller to safely transition to idle without T-pose
    console.log('🛡️ TTS COMPLETE: Safe overlapping transition to idle');
    overlappingAnimationController.stopOverlappingAnimations();
    
    console.log('✅ TTS completion handled with overlapping safe transition');
  }

  /**
   * Force stop all speech and animations
   */
  public forceStop(): void {
    console.log('🎭 FORCE STOP: Stopping all speech and overlapping animations');
    
    // Stop overlapping animations first
    overlappingAnimationController.stopOverlappingAnimations();
    
    // Then handle TTS completion
    this.handleTTSCompletion();
  }

  /**
   * Get current state
   */
  public getState(): SpeechAnimationState {
    return { ...this.state };
  }

  /**
   * Check if currently speaking
   */
  public isCurrentlySpeaking(): boolean {
    return this.state.isSpeaking || this.isProcessingSpeech;
  }

  /**
   * Clear all timeouts and intervals
   */
  private clearAllTimeouts(): void {
    if (this.currentSpeechTimeout) {
      clearTimeout(this.currentSpeechTimeout);
      this.currentSpeechTimeout = null;
    }
    if (this.ttsMonitoringInterval) {
      clearInterval(this.ttsMonitoringInterval);
      this.ttsMonitoringInterval = null;
    }
  }
}

// Export singleton instance
export const synchronizedSpeechAnimationController = new SynchronizedSpeechAnimationController(); 