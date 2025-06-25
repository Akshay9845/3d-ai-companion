/**
 * Synchronized Speech Animation Controller for Echo Character
 * Works with aggressive animation system - ensures NO GAPS between animations
 * 
 * IMPROVED: Animations trigger immediately one after another, never returning to T-pose
 */

import { humanLikeAnimationService } from './humanLikeAnimationService';

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
  private talkingAnimationInterval: NodeJS.Timeout | null = null;
  private talkingAnimationIndex: number = 0;

  constructor() {
    console.log('🎭 AGGRESSIVE Speech Controller: NO GAPS between animations');
  }

  /**
   * Start synchronized speech with animation - ensures continuous animation
   */
  public async startSynchronizedSpeech(text: string, ttsService: any): Promise<void> {
    console.log('🎭🎭🎭 AGGRESSIVE SYNCHRONIZED SPEECH: NO GAPS ALLOWED 🎭🎭🎭');
    console.log('🎭 Text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    // Prevent duplicate speech
    if (this.state.isSpeaking || this.isProcessingSpeech) {
      console.log('🔄 Speech already in progress, ignoring duplicate request');
      return;
    }

    if (ttsService && ttsService.isSpeaking && ttsService.isSpeaking()) {
      console.log('🔄 TTS service already speaking, ignoring duplicate request');
      return;
    }

    this.isProcessingSpeech = true;
    this.state.isSpeaking = true;
    this.state.speechStartTime = Date.now();

    // Calculate estimated speech duration
    const wordsPerMinute = 150;
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = Math.max(2000, (wordCount / wordsPerMinute) * 60000);
    this.state.estimatedDuration = estimatedDuration;

    console.log('🎭 Estimated speech duration:', estimatedDuration, 'ms');
    this.clearTimeouts();

    try {
      // 1. Start greeting animation immediately
      console.log('🎭 AGGRESSIVE Step 1: Starting greeting animation immediately...');
      await this.startGreetingAnimation();

      // 2. Start talking animations immediately (continuous cycle)
      console.log('🎭 AGGRESSIVE Step 2: Starting continuous talking animation cycle...');
      setTimeout(async () => {
        await this.startContinuousTalkingCycle();
      }, 1000); // Brief delay for greeting

      // 3. Start TTS
      setTimeout(async () => {
        console.log('🎭 AGGRESSIVE Step 3: Starting TTS...');
        try {
          // Set up TTS completion callback
          ttsService.setSpeechEndCallback(() => {
            console.log('🎭 TTS completion - returning to happy-idle immediately');
            this.returnToHappyIdleImmediately();
          });
          
          this.monitorTTSCompletion(ttsService);
          await ttsService.speak(text);
        } catch (error) {
          console.error('❌ TTS error:', error);
          this.returnToHappyIdleImmediately();
        }
      }, 1500);

    } catch (error) {
      console.error('❌ Synchronized speech error:', error);
      this.returnToHappyIdleImmediately();
    }
  }

  /**
   * Start greeting animation immediately
   */
  private async startGreetingAnimation(): Promise<void> {
    console.log('🎭 AGGRESSIVE: Starting greeting animation immediately');
    try {
      if ((window as any).playEchoAnimation) {
        const greetings = ['waving-2', 'standing-greeting', 'quick-informal-bow'];
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        (window as any).playEchoAnimation(randomGreeting, 4.0);
        this.state.currentAnimation = randomGreeting;
        console.log(`🎭 AGGRESSIVE: Greeting animation ${randomGreeting} started`);
      }
    } catch (error) {
      console.error('❌ Error starting greeting animation:', error);
    }
  }

  /**
   * Start continuous talking animation cycle - NO GAPS
   */
  private async startContinuousTalkingCycle(): Promise<void> {
    console.log('🎭 AGGRESSIVE: Starting continuous talking animation cycle - NO GAPS');
    
    this.talkingAnimationIndex = 0;
    
    // Start first talking animation immediately
    await this.playNextTalkingAnimation();
    
    // Continue with continuous cycle until speech ends
    this.maintainContinuousTalkingCycle();
  }

  /**
   * Play next talking animation in cycle
   */
  private async playNextTalkingAnimation(): Promise<void> {
    if (!this.state.isSpeaking) return;
    
    try {
      if ((window as any).playEchoAnimation) {
        const talkingAnimations = ['talking', 'talking-2', 'talking-3', 'talking-4'];
        const nextAnimation = talkingAnimations[this.talkingAnimationIndex % talkingAnimations.length];
        
        console.log(`🎭🎭🎭 AGGRESSIVE TALKING: ${nextAnimation} (cycle ${this.talkingAnimationIndex + 1}) 🎭🎭🎭`);
        console.log(`🎭 AGGRESSIVE: This will trigger next animation immediately when it ends`);
        console.log(`🎭 AGGRESSIVE: Calling playEchoAnimation(${nextAnimation}, 4.0) NOW`);
        
        (window as any).playEchoAnimation(nextAnimation, 4.0);
        this.state.currentAnimation = nextAnimation;
        
        this.talkingAnimationIndex++;
        console.log(`🎭 AGGRESSIVE: Talking animation ${nextAnimation} triggered successfully`);
        console.log(`🎭 AGGRESSIVE: Next animation will be ${talkingAnimations[this.talkingAnimationIndex % talkingAnimations.length]} in 4 seconds`);
      } else {
        console.error('❌ playEchoAnimation function not available on window object');
        console.error('❌ This means the EchoModel component is not properly initialized');
      }
    } catch (error) {
      console.error('❌ Error playing talking animation:', error);
    }
  }

  /**
   * Maintain continuous talking animation cycle - NO GAPS
   */
  private maintainContinuousTalkingCycle(): void {
    if (!this.state.isSpeaking) {
      console.log('🎭 AGGRESSIVE: Speech ended - stopping continuous talking cycle');
      return;
    }

    // Change talking animation every 3 seconds (matches faster animation duration)
    const cycleInterval = 3000; // 3 seconds to match faster animation duration
    
    console.log(`🎭 AGGRESSIVE: Next talking animation in ${cycleInterval}ms (continuous cycle)`);
    
    this.talkingAnimationInterval = setTimeout(async () => {
      if (this.state.isSpeaking) {
        await this.playNextTalkingAnimation();
        this.maintainContinuousTalkingCycle(); // Continue the cycle immediately
      }
    }, cycleInterval);
  }

  /**
   * Return to happy-idle immediately - NO GAPS
   */
  private returnToHappyIdleImmediately(): void {
    console.log('🔄 AGGRESSIVE: Returning to happy-idle immediately - NO GAPS');

    this.state.isSpeaking = false;
    this.isProcessingSpeech = false;
    this.clearTimeouts();
    this.state.animationQueue = [];
    this.state.currentAnimation = 'happy-idle';

    // Use global function to return to happy-idle immediately
    if ((window as any).returnEchoToIdle) {
      (window as any).returnEchoToIdle(4.0);
    }
  }

  /**
   * Stop synchronized speech and return to happy-idle immediately
   */
  public stopSynchronizedSpeech(): void {
    console.log('🎭 AGGRESSIVE: Stopping synchronized speech - returning to happy-idle immediately');
    this.returnToHappyIdleImmediately();
  }

  /**
   * Monitor TTS completion to ensure smooth transition
   */
  private monitorTTSCompletion(ttsService: any): void {
    console.log('🎭 AGGRESSIVE: Monitoring TTS completion for smooth transition');

    const checkTTSState = () => {
      if (!this.state.isSpeaking) {
        console.log('🎭 AGGRESSIVE: Speech state ended, returning to happy-idle');
        return;
      }

      // Check if TTS is still speaking
      if (ttsService && ttsService.isSpeaking && ttsService.isSpeaking()) {
        // TTS is still speaking, continue monitoring
        setTimeout(checkTTSState, 100);
      } else {
        // TTS has completed, return to happy-idle immediately
        console.log('🎭 AGGRESSIVE: TTS completed, returning to happy-idle immediately');
        this.returnToHappyIdleImmediately();
      }
    };

    // Start monitoring
    setTimeout(checkTTSState, 100);
  }

  /**
   * Handle TTS completion callback
   */
  public onTTSCompleted(): void {
    console.log('🎭 AGGRESSIVE: TTS completion callback received');
    this.returnToHappyIdleImmediately();
  }

  /**
   * Check if currently speaking
   */
  public isCurrentlySpeaking(): boolean {
    return this.state.isSpeaking || this.isProcessingSpeech;
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    if (this.currentSpeechTimeout) {
      clearTimeout(this.currentSpeechTimeout);
      this.currentSpeechTimeout = null;
    }
    if (this.talkingAnimationInterval) {
      clearTimeout(this.talkingAnimationInterval);
      this.talkingAnimationInterval = null;
    }
  }

  /**
   * Get current state
   */
  public getState(): SpeechAnimationState {
    return { ...this.state };
  }

  /**
   * Force stop all animations and return to happy-idle immediately
   */
  public forceStop(): void {
    console.log('🛑 AGGRESSIVE: Force stopping all animations and returning to happy-idle immediately');
    
    this.state.isSpeaking = false;
    this.isProcessingSpeech = false;
    this.clearTimeouts();
    this.state.animationQueue = [];
    this.state.currentAnimation = 'happy-idle';

    // Use human-like service to stop and return to happy-idle immediately
    humanLikeAnimationService.stopAllAnimations();
    
    // Immediately return to happy-idle
    if ((window as any).forceEchoBaseIdle) {
      (window as any).forceEchoBaseIdle();
    }
    
    this.state.currentAnimation = 'happy-idle';
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    console.log('🎭 AGGRESSIVE: Cleaning up synchronized speech controller');
    this.clearTimeouts();
    this.state.isSpeaking = false;
    this.isProcessingSpeech = false;
    this.state.animationQueue = [];
  }
}

// Export singleton instance
export const synchronizedSpeechAnimationController = new SynchronizedSpeechAnimationController(); 