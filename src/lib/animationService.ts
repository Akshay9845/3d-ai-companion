/**
 * Animation Service for Echo Character
 * Manages animation playback, keyword mapping, and idle animation loops
 */

export interface AnimationConfig {
  path: string;
  duration: number;
  loop: boolean;
  crossFade?: number;
  weight?: number;
  timeScale?: number;
  naturalTiming?: boolean;
  crossFadeDuration?: number;
  priority?: number;
}

export interface AnimationMapping {
  keywords: string[];
  animation: AnimationConfig;
  priority: number;
}

export class AnimationService {
  private currentAnimation: string | null = null;
  private isPlaying = false;
  private idleAnimations: AnimationConfig[] = [];
  private animationMappings: AnimationMapping[] = [];
  private onAnimationChange?: (animation: string, config?: AnimationConfig) => void;

  private readonly defaultIdleAnimation = {
    name: 'happy-idle',
    path: '/ECHO/animations/basic reactions/happy-idle.glb',
    duration: 30000,
    weight: 0.3,
    loop: true,
    crossFade: 3.0, // Very long crossfade to prevent T-pose
    timeScale: 0.1
  };

  constructor() {
    this.initializeAnimations();
  }

  private initializeAnimations() {
    // Idle animations - ONLY ONE IDLE ANIMATION - very slow and continuous
    this.idleAnimations = [
      this.defaultIdleAnimation
    ];

    // Keyword to animation mappings - using the comprehensive basic reactions set
    this.animationMappings = [
      // Greeting animations
      {
        keywords: ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
        animation: {
          path: '/ECHO/animations/basic reactions/waving-gesture-3.glb',
          duration: 2000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['wave', 'waving', 'bye', 'goodbye', 'farewell'],
        animation: {
          path: '/ECHO/animations/basic reactions/waving-2.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['bow', 'respect', 'formal', 'polite', 'thank you', 'thanks'],
        animation: {
          path: '/ECHO/animations/basic reactions/quick-formal-bow.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.3
        },
        priority: 3
      },
      {
        keywords: ['casual', 'informal', 'relaxed', 'sup'],
        animation: {
          path: '/ECHO/animations/basic reactions/quick-informal-bow.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['stand', 'standing', 'formal greeting', 'welcome'],
        animation: {
          path: '/ECHO/animations/basic reactions/standing-greeting.glb',
          duration: 3500,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },

      // Happy/Positive animations
      {
        keywords: ['happy', 'joy', 'great', 'wonderful', 'amazing', 'fantastic', 'awesome'],
        animation: {
          path: '/ECHO/animations/basic reactions/happy.glb',
          duration: 4000,
          loop: false,
          crossFade: 0.3
        },
        priority: 3
      },
      {
        keywords: ['excited', 'thrilled', 'enthusiastic', 'pumped', 'energetic'],
        animation: {
          path: '/ECHO/animations/basic reactions/excited.glb',
          duration: 3500,
          loop: false,
          crossFade: 0.3
        },
        priority: 3
      },
      {
        keywords: ['happy gesture', 'celebration', 'celebrate', 'victory'],
        animation: {
          path: '/ECHO/animations/basic reactions/happy-hand-gesture.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['clap', 'clapping', 'applause', 'well done', 'bravo'],
        animation: {
          path: '/ECHO/animations/basic reactions/clapping.glb',
          duration: 2000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },

      // Agreement/Acknowledgment animations
      {
        keywords: ['yes', 'agree', 'correct', 'right', 'exactly', 'absolutely'],
        animation: {
          path: '/ECHO/animations/basic reactions/head-nod-yes.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['acknowledge', 'understand', 'got it', 'okay', 'ok'],
        animation: {
          path: '/ECHO/animations/basic reactions/acknowledging.glb',
          duration: 2000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['strong yes', 'definitely', 'for sure'],
        animation: {
          path: '/ECHO/animations/basic reactions/hard-head-nod.glb',
          duration: 2000,
          loop: false,
          crossFade: 0.3
        },
        priority: 3
      },
      {
        keywords: ['lengthy nod', 'thinking', 'considering'],
        animation: {
          path: '/ECHO/animations/basic reactions/lengthy-head-nod.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },

      // Disagreement/Negative animations
      {
        keywords: ['no', 'disagree', 'wrong', 'incorrect', 'not really'],
        animation: {
          path: '/ECHO/animations/basic reactions/no.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['shake head', 'head shake', 'nope'],
        animation: {
          path: '/ECHO/animations/basic reactions/shaking-head-no.glb',
          duration: 2000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['annoyed', 'frustrated', 'irritated'],
        animation: {
          path: '/ECHO/animations/basic reactions/annoyed-head-shake.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['thoughtful', 'hmm', 'thinking about it'],
        animation: {
          path: '/ECHO/animations/basic reactions/thoughtful-head-shake.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },

      // Emotional reactions
      {
        keywords: ['angry', 'mad', 'upset', 'furious'],
        animation: {
          path: '/ECHO/animations/basic reactions/angry-gesture.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['cocky', 'confident', 'arrogant', 'smug'],
        animation: {
          path: '/ECHO/animations/basic reactions/being-cocky.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['defeat', 'defeated', 'lost', 'give up'],
        animation: {
          path: '/ECHO/animations/basic reactions/defeat.glb',
          duration: 4000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['relieved', 'relief', 'sigh', 'phew'],
        animation: {
          path: '/ECHO/animations/basic reactions/relieved-sigh.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['tired', 'yawn', 'sleepy', 'exhausted'],
        animation: {
          path: '/ECHO/animations/basic reactions/yawn.glb',
          duration: 4000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },

      // Dismissive/Rejection animations
      {
        keywords: ['dismiss', 'dismissing', 'whatever', 'ignore'],
        animation: {
          path: '/ECHO/animations/basic reactions/dismissing-gesture.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['look away', 'avoid', 'not interested'],
        animation: {
          path: '/ECHO/animations/basic reactions/look-away-gesture.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['sarcastic', 'sarcasm', 'really?', 'sure'],
        animation: {
          path: '/ECHO/animations/basic reactions/sarcastic-head-nod.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },

      // Observation/Looking animations
      {
        keywords: ['look', 'looking', 'observe', 'watch', 'see'],
        animation: {
          path: '/ECHO/animations/basic reactions/looking.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.3
        },
        priority: 1
      },
      {
        keywords: ['react', 'reacting', 'response', 'surprise'],
        animation: {
          path: '/ECHO/animations/basic reactions/reacting.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },

      // Talking animations
      {
        keywords: ['talk', 'speak', 'explain', 'describe', 'tell', 'say'],
        animation: {
          path: '/ECHO/animations/basic reactions/talking.glb',
          duration: 2500,
          loop: true,
          crossFade: 0.3
        },
        priority: 1
      },
      {
        keywords: ['conversation', 'discuss', 'chat'],
        animation: {
          path: '/ECHO/animations/basic reactions/talking-2.glb',
          duration: 3000,
          loop: true,
          crossFade: 0.3
        },
        priority: 1
      },
      {
        keywords: ['explain', 'teach', 'instruct', 'educate'],
        animation: {
          path: '/ECHO/animations/basic reactions/talking-3.glb',
          duration: 3500,
          loop: true,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['present', 'presentation', 'demonstrate'],
        animation: {
          path: '/ECHO/animations/basic reactions/talking-4.glb',
          duration: 4000,
          loop: true,
          crossFade: 0.3
        },
        priority: 2
      },

      // Exercise/Activity animations
      {
        keywords: ['warm up', 'warming up', 'prepare', 'ready'],
        animation: {
          path: '/ECHO/animations/basic reactions/warming-up.glb',
          duration: 4000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['push up', 'pushup', 'exercise', 'workout'],
        animation: {
          path: '/ECHO/animations/basic reactions/push-up.glb',
          duration: 2000,
          loop: true,
          crossFade: 0.3
        },
        priority: 2
      },
      {
        keywords: ['sit up', 'situp'],
        animation: {
          path: '/ECHO/animations/basic reactions/idle-to-push-up.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.3
        },
        priority: 2
      }
    ];
  }

  /**
   * Find the best matching animation for given text
   */
  public findAnimationForText(text: string): AnimationConfig | null {
    const lowerText = text.toLowerCase();
    let bestMatch: AnimationMapping | null = null;
    let highestPriority = -1;

    for (const mapping of this.animationMappings) {
      for (const keyword of mapping.keywords) {
        if (lowerText.includes(keyword) && mapping.priority > highestPriority) {
          bestMatch = mapping;
          highestPriority = mapping.priority;
        }
      }
    }

    return bestMatch?.animation || null;
  }

  /**
   * Get a random idle animation
   */
  public getRandomIdleAnimation(): AnimationConfig {
    const randomIndex = Math.floor(Math.random() * this.idleAnimations.length);
    return this.idleAnimations[randomIndex];
  }

  /**
   * Get all available animations for debugging
   */
  public getAllAnimations(): AnimationMapping[] {
    return this.animationMappings;
  }

  /**
   * Set callback for animation changes
   */
  public setAnimationChangeCallback(callback: (animation: string, config?: AnimationConfig) => void) {
    this.onAnimationChange = callback;
  }

  /**
   * Trigger animation change with smooth transition
   */
  public triggerAnimationChange(animationPath: string, config?: AnimationConfig) {
    console.log(`🎭 Triggering animation change: ${animationPath} (layered on base idle)`);
    
    if (this.onAnimationChange) {
      // Extract animation name from path
      const animationName = this.extractAnimationNameFromPath(animationPath);
      
      // Update current animation (but base idle is always the foundation)
      if (animationName !== 'happy-idle') {
        this.currentAnimation = animationName;
      }
      
      // Use the global animation function (which respects base layer)
      if ((window as any).playEchoAnimation) {
        const blendDuration = config?.crossFade || 0.8;
        (window as any).playEchoAnimation(animationName, blendDuration);
      }
      
      // Call the callback
      this.onAnimationChange(animationPath, config);
    }
  }

  /**
   * Extract animation name from file path
   */
  private extractAnimationNameFromPath(path: string): string {
    // Extract filename without extension and path
    const filename = path.split('/').pop() || '';
    const nameWithoutExt = filename.replace('.glb', '');
    return nameWithoutExt;
  }

  /**
   * Get current animation
   */
  public getCurrentAnimation(): string | null {
    return this.currentAnimation;
  }

  /**
   * Check if animation is currently playing
   */
  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Set playing state
   */
  public setPlayingState(playing: boolean) {
    this.isPlaying = playing;
  }
}

// Export singleton instance
export const animationService = new AnimationService(); 