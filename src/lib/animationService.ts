/**
 * Intelligent Animation Service for Echo Character
 * Manages animation playback, categorization, and capability responses
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
  category?: string;
  description?: string;
}

export interface AnimationMapping {
  keywords: string[];
  animation: AnimationConfig;
  priority: number;
  category: string;
  description: string;
}

export interface AnimationCategory {
  name: string;
  displayName: string;
  description: string;
  animations: string[];
  examples: string[];
}

export class AnimationService {
  private currentAnimation: string | null = null;
  private isPlaying = false;
  private idleAnimations: AnimationConfig[] = [];
  private animationMappings: AnimationMapping[] = [];
  private animationCategories: Map<string, AnimationCategory> = new Map();
  private onAnimationChange?: (animation: string, config?: AnimationConfig) => void;

  private readonly defaultIdleAnimation = {
    name: 'happy-idle',
    path: '/ECHO/animations/basic reactions/happy-idle.glb',
    duration: 30000,
    weight: 0.3,
    loop: true,
    crossFade: 3.0,
    timeScale: 0.3,
    category: 'idle',
    description: 'Standing peacefully'
  };

  constructor() {
    this.initializeCategories();
    this.initializeAnimations();
  }

  private initializeCategories() {
    // DANCE & MOVEMENT - Updated with actual animation names
    this.animationCategories.set('dance', {
      name: 'dance',
      displayName: 'Dance & Movement',
      description: 'I can dance and move to music with various styles',
      animations: ['Salsa Dancing', 'Gangnam Style', 'Moonwalk', 'Locking Hip Hop Dance', 'Happy Walk', 'Jump', 'Excited', 'Happy'],
      examples: ['dance', 'salsa', 'gangnam style', 'moonwalk', 'hip hop', 'locking', 'jump', 'move to the music', 'boogie', 'freestyle', 'happy dance']
    });

    // EXERCISE & FITNESS - Updated with actual animation names
    this.animationCategories.set('exercise', {
      name: 'exercise',
      displayName: 'Exercise & Fitness',
      description: 'I can do various exercises and workouts to stay fit',
      animations: ['Warming Up', 'Push Up', 'Plank', 'End Plank', 'Air Squat', 'Idle To Push Up', 'Idle To Situp'],
      examples: ['exercise', 'workout', 'warm up', 'push-ups', 'plank', 'squats', 'sit-ups', 'fitness', 'strength training']
    });

    // FIGHTING & COMBAT - Updated with actual animation names
    this.animationCategories.set('fighting', {
      name: 'fighting',
      displayName: 'Fighting & Combat',
      description: 'I can show combat moves and martial arts techniques',
      animations: ['Fighting Idle', 'Fight Idle', 'Fight Idle (1)', 'Fight Idle (2)', 'Fight Idle (3)', 'angry gesture', 'being cocky', 'dismissing gesture', 'Defeat'],
      examples: ['fight', 'combat', 'martial arts', 'fighting stance', 'battle ready', 'angry', 'confident', 'defeat', 'combat stance']
    });

    // SITTING & IDLE POSITIONS - New category for sitting animations
    this.animationCategories.set('sitting', {
      name: 'sitting',
      displayName: 'Sitting & Positions',
      description: 'I can sit in various poses and positions',
      animations: ['Sitting Idle', 'Male Sitting Pose', 'Male Sitting Pose-2'],
      examples: ['sit', 'sitting', 'seated', 'chair', 'sit down', 'sitting pose', 'formal sitting']
    });

    // GESTURES & SOCIAL - Updated with actual animation names
    this.animationCategories.set('gestures', {
      name: 'gestures',
      displayName: 'Gestures & Social',
      description: 'I can make various hand gestures and social interactions',
      animations: ['Waving-2', 'Waving-3', 'Waving-4', 'Waving Gesture-3', 'Standing Greeting', 'Quick Formal Bow', 'Quick Informal Bow', 'Clapping', 'Reacting', 'weight shift'],
      examples: ['hello', 'greet', 'wave', 'bow', 'clap', 'gesture', 'social interaction', 'hand gesture', 'react', 'casual wave']
    });

    // TALKING & COMMUNICATION - Updated with actual animation names
    this.animationCategories.set('talking', {
      name: 'talking',
      displayName: 'Talking & Communication',
      description: 'I can communicate with various speaking gestures and expressions',
      animations: ['Talking', 'Talking-2', 'Talking-3', 'Talking-4', 'Head Nod Yes', 'shaking head no', 'No', 'look away gesture', 'sarcastic head nod', 'annoyed head shake'],
      examples: ['talk', 'communicate', 'speak', 'yes', 'no', 'nod', 'agree', 'disagree', 'conversation', 'sarcastic', 'annoyed']
    });

    // EMOTIONAL EXPRESSIONS - Updated with actual animation names
    this.animationCategories.set('emotional', {
      name: 'emotional',
      displayName: 'Emotional Expressions',
      description: 'I can express various emotions and feelings',
      animations: ['relieved sigh', 'thoughtful head shake', 'Yawn'],
      examples: ['relieved', 'sigh', 'thoughtful', 'thinking', 'tired', 'yawn', 'express feelings']
    });

    // TEACHING & EDUCATION - Updated with actual animation names
    this.animationCategories.set('teaching', {
      name: 'teaching',
      displayName: 'Teaching & Education',
      description: 'I can teach and explain things with educational gestures',
      animations: ['acknowledging', 'happy hand gesture', 'Looking', 'lengthy head nod', 'Hard Head Nod'],
      examples: ['teach', 'explain', 'educate', 'instruct', 'acknowledge', 'understand', 'demonstrate', 'look', 'nod']
    });
  }

  private initializeAnimations() {
    // Idle animations
    this.idleAnimations = [
      this.defaultIdleAnimation,
      {
        name: 'neutral-idle',
        path: '/ECHO/animations/fight and dance and excersise/Neutral Idle.glb',
        duration: 30000,
        weight: 0.3,
        loop: true,
        crossFade: 3.0,
        timeScale: 0.3,
        category: 'idle',
        description: 'Neutral standing pose'
      },
      {
        name: 'sad-idle',
        path: '/ECHO/animations/fight and dance and excersise/Sad Idle.glb',
        duration: 30000,
        weight: 0.3,
        loop: true,
        crossFade: 3.0,
        timeScale: 0.3,
        category: 'idle',
        description: 'Sad standing pose'
      }
    ];

    // Comprehensive animation mappings with categories - MIXED SOURCES
    this.animationMappings = [
      // DANCE & MOVEMENT - FASTER SPEED (0.5x) - Using source directory animations
      {
        keywords: ['dance', 'dancing', 'move', 'groove', 'boogie', 'party', 'music', 'rhythm'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Salsa Dancing.glb',
          duration: 6000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.6,
          weight: 0.9,
          category: 'dance',
          description: 'Salsa dance movement'
        },
        priority: 3,
        category: 'dance',
        description: 'Salsa dancing'
      },
      {
        keywords: ['gangnam', 'gangnam style', 'korean dance', 'k-pop', 'psy'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Gangnam Style .glb',
          duration: 10000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.3,
          category: 'dance',
          description: 'Gangnam Style dance'
        },
        priority: 3,
        category: 'dance',
        description: 'Gangnam Style dance'
      },
      {
        keywords: ['moonwalk', 'moon walk', 'michael jackson', 'backwards dance', 'slide backwards'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Moonwalk .glb',
          duration: 4000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'dance',
          description: 'Moonwalk dance movement'
        },
        priority: 3,
        category: 'dance',
        description: 'Moonwalk dance movement'
      },
      {
        keywords: ['hip hop', 'hip-hop', 'locking', 'lock dance', 'street dance', 'urban dance'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Locking Hip Hop Dance.glb',
          duration: 10000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'dance',
          description: 'Hip hop locking dance'
        },
        priority: 3,
        category: 'dance',
        description: 'Hip hop locking dance'
      },
      {
        keywords: ['happy walk', 'walk happy', 'strut', 'swagger', 'walk around'],
        animation: {
          path: '/ECHO/animations/basic reactions/happy-walk.glb',
          duration: 4000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'dance'
        },
        priority: 2,
        category: 'dance',
        description: 'Happy walking dance'
      },
      {
        keywords: ['jump', 'jumping', 'hop', 'bounce', 'leap'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Jump.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.7,
          category: 'dance'
        },
        priority: 2,
        category: 'dance',
        description: 'Jumping movement'
      },
      {
        keywords: ['excited', 'excitement', 'thrilled', 'pumped up'],
        animation: {
          path: '/ECHO/animations/basic reactions/excited.glb',
          duration: 4000,
          loop: false,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'dance'
        },
        priority: 3,
        category: 'dance',
        description: 'Excited movement'
      },
      {
        keywords: ['happy', 'joy', 'joyful', 'cheerful', 'celebrate'],
        animation: {
          path: '/ECHO/animations/basic reactions/happy.glb',
          duration: 5000,
          loop: false,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'dance'
        },
        priority: 3,
        category: 'dance',
        description: 'Happy celebration'
      },

      // EXERCISE & FITNESS - FASTER SPEED (0.5x) - Mixed source locations
      {
        keywords: ['exercise', 'workout', 'fitness', 'train', 'gym', 'warm up', 'warming up', 'stretch'],
        animation: {
          path: '/ECHO/animations/basic reactions/warming-up.glb',
          duration: 6000,
          loop: false,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'exercise'
        },
        priority: 3,
        category: 'exercise',
        description: 'Warming up exercises'
      },
      {
        keywords: ['push up', 'pushup', 'push-up', 'strength training'],
        animation: {
          path: '/ECHO/animations/basic reactions/push-up.glb',
          duration: 3000,
          loop: true,
          crossFade: 0.8,
          timeScale: 0.5,
          category: 'exercise'
        },
        priority: 3,
        category: 'exercise',
        description: 'Push-up exercise'
      },
      {
        keywords: ['plank', 'planking', 'core exercise', 'abs'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Plank.glb',
          duration: 4000,
          loop: true,
          crossFade: 0.8,
          timeScale: 0.5,
          category: 'exercise'
        },
        priority: 3,
        category: 'exercise',
        description: 'Plank exercise'
      },
      {
        keywords: ['end plank', 'finish plank', 'plank finish', 'complete plank'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/End Plank.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.5,
          category: 'exercise'
        },
        priority: 3,
        category: 'exercise',
        description: 'End plank exercise'
      },
      {
        keywords: ['squat', 'squats', 'air squat', 'leg exercise'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Air Squat.glb',
          duration: 3000,
          loop: true,
          crossFade: 0.8,
          timeScale: 0.5,
          category: 'exercise'
        },
        priority: 3,
        category: 'exercise',
        description: 'Air squat exercise'
      },
      {
        keywords: ['transition to pushup', 'get ready for pushup', 'prepare pushup'],
        animation: {
          path: '/ECHO/animations/basic reactions/idle-to-push-up.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.5,
          category: 'exercise'
        },
        priority: 2,
        category: 'exercise',
        description: 'Transition to push-up'
      },
      {
        keywords: ['situp', 'sit up', 'sit-up', 'transition to situp', 'prepare situp'],
        animation: {
          path: '/ECHO/animations/basic reactions/idle-to-situp.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.5,
          category: 'exercise'
        },
        priority: 2,
        category: 'exercise',
        description: 'Transition to sit-up'
      },

      // FIGHTING & COMBAT - FASTER SPEED (0.5x) - Mixed source locations
      {
        keywords: ['fight', 'fighting', 'combat', 'martial arts', 'battle', 'attack', 'fighting stance'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Fighting Idle.glb',
          duration: 4000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'fighting'
        },
        priority: 3,
        category: 'fighting',
        description: 'Fighting stance'
      },
      {
        keywords: ['fight idle', 'combat ready', 'battle ready'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Fight Idle.glb',
          duration: 3000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'fighting'
        },
        priority: 2,
        category: 'fighting',
        description: 'Combat ready stance'
      },
      {
        keywords: ['fight idle 1', 'combat stance 1', 'battle stance 1'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Fight Idle (1).glb',
          duration: 3000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'fighting'
        },
        priority: 2,
        category: 'fighting',
        description: 'Combat stance variation 1'
      },
      {
        keywords: ['fight idle 2', 'combat stance 2', 'battle stance 2'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Fight Idle (2).glb',
          duration: 3000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'fighting'
        },
        priority: 2,
        category: 'fighting',
        description: 'Combat stance variation 2'
      },
      {
        keywords: ['fight idle 3', 'combat stance 3', 'battle stance 3'],
        animation: {
          path: '/ECHO/animations/fight and dance and excersise/Fight Idle (3).glb',
          duration: 3000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'fighting'
        },
        priority: 2,
        category: 'fighting',
        description: 'Combat stance variation 3'
      },
      {
        keywords: ['angry', 'mad', 'furious', 'aggressive'],
        animation: {
          path: '/ECHO/animations/basic reactions/angry-gesture.glb',
          duration: 2500,
          loop: false,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'fighting'
        },
        priority: 3,
        category: 'fighting',
        description: 'Angry gesture'
      },
      {
        keywords: ['cocky', 'confident', 'arrogant', 'smug', 'tough', 'show off'],
        animation: {
          path: '/ECHO/animations/basic reactions/being-cocky.glb',
          duration: 3000,
          loop: false,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'fighting'
        },
        priority: 2,
        category: 'fighting',
        description: 'Confident fighting stance'
      },
      {
        keywords: ['dismiss', 'dismissing', 'whatever', 'ignore', 'brush off'],
        animation: {
          path: '/ECHO/animations/basic reactions/dismissing-gesture.glb',
          duration: 2500,
          loop: false,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'fighting'
        },
        priority: 2,
        category: 'fighting',
        description: 'Dismissive gesture'
      },
      {
        keywords: ['defeat', 'defeated', 'lost', 'surrender', 'give up'],
        animation: {
          path: '/ECHO/animations/basic reactions/defeat.glb',
          duration: 4000,
          loop: false,
          crossFade: 1.0,
          timeScale: 0.5,
          category: 'fighting'
        },
        priority: 2,
        category: 'fighting',
        description: 'Defeated gesture'
      },

      // SITTING & IDLE POSITIONS - New category for sitting animations
      {
        keywords: ['sit', 'sitting', 'seated', 'chair', 'sit down'],
        animation: {
          path: '/ECHO/animations/basic reactions/sitting-idle.glb',
          duration: 30000,
          loop: true,
          crossFade: 2.0,
          timeScale: 0.3,
          category: 'sitting'
        },
        priority: 3,
        category: 'sitting',
        description: 'Sitting idle position'
      },
      {
        keywords: ['male sitting', 'male sit', 'sitting pose', 'formal sitting'],
        animation: {
          path: '/ECHO/animations/basic reactions/male-sitting-pose.glb',
          duration: 30000,
          loop: true,
          crossFade: 2.0,
          timeScale: 0.3,
          category: 'sitting'
        },
        priority: 2,
        category: 'sitting',
        description: 'Male sitting pose'
      },
      {
        keywords: ['male sitting 2', 'alternate sitting', 'sitting pose 2'],
        animation: {
          path: '/ECHO/animations/basic reactions/male-sitting-pose-2.glb',
          duration: 30000,
          loop: true,
          crossFade: 2.0,
          timeScale: 0.3,
          category: 'sitting'
        },
        priority: 2,
        category: 'sitting',
        description: 'Male sitting pose variation 2'
      },

      // SOCIAL INTERACTIONS - Using basic reactions folder
      {
        keywords: ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
        animation: {
          path: '/ECHO/animations/basic reactions/waving-2.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'gestures'
        },
        priority: 3,
        category: 'gestures',
        description: 'Greeting wave'
      },
      {
        keywords: ['wave', 'waving', 'bye', 'goodbye', 'farewell', 'see you'],
        animation: {
          path: '/ECHO/animations/basic reactions/waving-3.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.6,
          timeScale: 0.3,
          category: 'gestures'
        },
        priority: 2,
        category: 'gestures',
        description: 'Goodbye wave'
      },
      {
        keywords: ['enthusiastic wave', 'big wave', 'excited wave'],
        animation: {
          path: '/ECHO/animations/basic reactions/waving-4.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'gestures'
        },
        priority: 2,
        category: 'gestures',
        description: 'Enthusiastic wave'
      },
      {
        keywords: ['waving gesture', 'casual wave', 'simple wave'],
        animation: {
          path: '/ECHO/animations/basic reactions/waving-gesture-3.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.6,
          timeScale: 0.3,
          category: 'gestures'
        },
        priority: 2,
        category: 'gestures',
        description: 'Casual waving gesture'
      },
      {
        keywords: ['greet', 'greeting', 'meet', 'introduce'],
        animation: {
          path: '/ECHO/animations/basic reactions/standing-greeting.glb',
          duration: 3000,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'gestures'
        },
        priority: 3,
        category: 'gestures',
        description: 'Standing greeting'
      },
      {
        keywords: ['bow', 'respect', 'formal', 'polite', 'thank you', 'thanks'],
        animation: {
          path: '/ECHO/animations/basic reactions/quick-formal-bow.glb',
          duration: 1500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'gestures'
        },
        priority: 3,
        category: 'gestures',
        description: 'Respectful bow'
      },
      {
        keywords: ['informal bow', 'casual bow', 'quick bow', 'slight bow'],
        animation: {
          path: '/ECHO/animations/basic reactions/quick-informal-bow.glb',
          duration: 1500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'gestures'
        },
        priority: 2,
        category: 'gestures',
        description: 'Casual bow'
      },
      {
        keywords: ['clap', 'clapping', 'applause', 'well done', 'bravo', 'good job'],
        animation: {
          path: '/ECHO/animations/basic reactions/clapping.glb',
          duration: 2500,
          loop: true,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'gestures'
        },
        priority: 2,
        category: 'gestures',
        description: 'Clapping applause'
      },
      {
        keywords: ['react', 'reacting', 'reaction', 'respond', 'surprise'],
        animation: {
          path: '/ECHO/animations/basic reactions/reacting.glb',
          duration: 1500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'gestures'
        },
        priority: 2,
        category: 'gestures',
        description: 'Surprised reaction'
      },
      {
        keywords: ['weight shift', 'sway', 'rock', 'move side to side', 'shift weight'],
        animation: {
          path: '/ECHO/animations/basic reactions/weight-shift.glb',
          duration: 4000,
          loop: true,
          crossFade: 1.0,
          timeScale: 0.3,
          category: 'gestures'
        },
        priority: 2,
        category: 'gestures',
        description: 'Weight shifting movement'
      },

      // TEACHING & EDUCATION - Using basic reactions folder
      {
        keywords: ['teach', 'teaching', 'educate', 'instruct', 'explain', 'show', 'demonstrate'],
        animation: {
          path: '/ECHO/animations/basic reactions/talking-3.glb',
          duration: 2500,
          loop: true,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'teaching'
        },
        priority: 3,
        category: 'teaching',
        description: 'Teaching explanation'
      },
      {
        keywords: ['acknowledge', 'understand', 'got it', 'okay', 'ok', 'i see'],
        animation: {
          path: '/ECHO/animations/basic reactions/acknowledging.glb',
          duration: 1500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'teaching'
        },
        priority: 2,
        category: 'teaching',
        description: 'Understanding acknowledgment'
      },
      {
        keywords: ['yes', 'agree', 'correct', 'right', 'exactly', 'absolutely', 'definitely'],
        animation: {
          path: '/ECHO/animations/basic reactions/head-nod-yes.glb',
          duration: 1500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'teaching'
        },
        priority: 2,
        category: 'teaching',
        description: 'Agreement nod'
      },
      {
        keywords: ['happy hand', 'hand gesture', 'gesture', 'point', 'indicate'],
        animation: {
          path: '/ECHO/animations/basic reactions/happy-hand-gesture.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'teaching'
        },
        priority: 2,
        category: 'teaching',
        description: 'Happy hand gesture'
      },
      {
        keywords: ['look', 'looking', 'observe', 'watch', 'see'],
        animation: {
          path: '/ECHO/animations/basic reactions/looking.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'teaching'
        },
        priority: 2,
        category: 'teaching',
        description: 'Looking around'
      },
      {
        keywords: ['long nod', 'lengthy nod', 'big nod', 'deep nod'],
        animation: {
          path: '/ECHO/animations/basic reactions/lengthy-head-nod.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'teaching'
        },
        priority: 2,
        category: 'teaching',
        description: 'Lengthy head nod'
      },
      {
        keywords: ['hard nod', 'strong nod', 'emphatic nod', 'firm nod'],
        animation: {
          path: '/ECHO/animations/basic reactions/hard-head-nod.glb',
          duration: 1500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'teaching'
        },
        priority: 2,
        category: 'teaching',
        description: 'Emphatic nod'
      },

      // EMOTIONAL EXPRESSIONS - Using basic reactions folder
      {
        keywords: ['relieved', 'relief', 'sigh', 'phew', 'whew', 'finally'],
        animation: {
          path: '/ECHO/animations/basic reactions/relieved-sigh.glb',
          duration: 2500,
          loop: false,
          crossFade: 1.0,
          timeScale: 0.3,
          category: 'emotional'
        },
        priority: 2,
        category: 'emotional',
        description: 'Relieved sigh'
      },
      {
        keywords: ['thoughtful', 'thinking', 'consider', 'ponder', 'hmm'],
        animation: {
          path: '/ECHO/animations/basic reactions/thoughtful-head-shake.glb',
          duration: 2500,
          loop: false,
          crossFade: 1.0,
          timeScale: 0.3,
          category: 'emotional'
        },
        priority: 2,
        category: 'emotional',
        description: 'Thoughtful head shake'
      },
      {
        keywords: ['tired', 'yawn', 'sleepy', 'exhausted', 'drowsy'],
        animation: {
          path: '/ECHO/animations/basic reactions/yawn.glb',
          duration: 3000,
          loop: false,
          crossFade: 1.0,
          timeScale: 0.3,
          category: 'emotional'
        },
        priority: 2,
        category: 'emotional',
        description: 'Tired yawning'
      },

      // COMMUNICATION - Using basic reactions folder
      {
        keywords: ['talk', 'speak', 'communicate', 'say', 'tell', 'converse'],
        animation: {
          path: '/ECHO/animations/basic reactions/talking.glb',
          duration: 2500,
          loop: true,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'talking'
        },
        priority: 1,
        category: 'talking',
        description: 'Basic talking gesture'
      },
      {
        keywords: ['conversation', 'discuss', 'chat', 'dialogue'],
        animation: {
          path: '/ECHO/animations/basic reactions/talking-2.glb',
          duration: 2500,
          loop: true,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'talking'
        },
        priority: 1,
        category: 'talking',
        description: 'Conversational talking'
      },
      {
        keywords: ['explain more', 'detailed talk', 'elaborate'],
        animation: {
          path: '/ECHO/animations/basic reactions/talking-4.glb',
          duration: 2500,
          loop: true,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'talking'
        },
        priority: 1,
        category: 'talking',
        description: 'Detailed talking'
      },
      {
        keywords: ['no', 'disagree', 'wrong', 'incorrect', 'not really', 'nope'],
        animation: {
          path: '/ECHO/animations/basic reactions/shaking-head-no.glb',
          duration: 1500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'talking'
        },
        priority: 2,
        category: 'talking',
        description: 'Disagreement head shake'
      },
      {
        keywords: ['no gesture', 'no way', 'negative'],
        animation: {
          path: '/ECHO/animations/basic reactions/no.glb',
          duration: 2000,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'talking'
        },
        priority: 2,
        category: 'talking',
        description: 'Strong no gesture'
      },
      {
        keywords: ['look away', 'avoid', 'ignore', 'turn away'],
        animation: {
          path: '/ECHO/animations/basic reactions/look-away-gesture.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'talking'
        },
        priority: 2,
        category: 'talking',
        description: 'Look away gesture'
      },
      {
        keywords: ['sarcastic', 'sarcasm', 'really', 'sure', 'oh yeah'],
        animation: {
          path: '/ECHO/animations/basic reactions/sarcastic-head-nod.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'talking'
        },
        priority: 2,
        category: 'talking',
        description: 'Sarcastic nod'
      },
      {
        keywords: ['annoyed', 'frustrated', 'irritated', 'ugh', 'whatever'],
        animation: {
          path: '/ECHO/animations/basic reactions/annoyed-head-shake.glb',
          duration: 2500,
          loop: false,
          crossFade: 0.8,
          timeScale: 0.3,
          category: 'talking'
        },
        priority: 2,
        category: 'talking',
        description: 'Annoyed head shake'
      }
    ];
  }

  /**
   * Get animations by category with human-readable names
   */
  public getAnimationNamesByCategory(category: string): string[] {
    const categoryData = this.animationCategories.get(category);
    if (!categoryData) return [];
    
    // Convert technical names to human-readable names
    return categoryData.animations.map(animName => this.humanizeAnimationName(animName));
  }

  /**
   * Convert technical animation names to human-readable names
   */
  private humanizeAnimationName(animationName: string): string {
    const nameMap: Record<string, string> = {
      // Dance & Movement
      'Salsa Dancing': 'Salsa Dance',
      'Gangnam Style': 'Gangnam Style Dance',
      'Moonwalk': 'Moonwalk Dance',
      'Happy Walk': 'Happy Walk',
      'Jump': 'Jumping',
      'Excited': 'Excited Dance',
      'Happy': 'Happy Dance',
      
      // Exercise & Fitness
      'Warming Up': 'Warm-up Exercises',
      'Push Up': 'Push-ups',
      'Plank': 'Plank Exercise',
      'Air Squat': 'Air Squats',
      'Idle To Push Up': 'Push-up Transition',
      'End Plank': 'End Plank',
      
      // Fighting & Combat
      'Fighting Idle': 'Fighting Stance',
      'Fight Idle': 'Combat Ready',
      'Fight Idle (1)': 'Combat Stance',
      'angry gesture': 'Angry Gesture',
      'being cocky': 'Confident Stance',
      'dismissing gesture': 'Dismissive Gesture',
      'Defeat': 'Defeated',
      
      // Gestures & Social
      'Waving-2': 'Friendly Wave',
      'Waving-3': 'Goodbye Wave',
      'Waving-4': 'Enthusiastic Wave',
      'Waving Gesture-3': 'Casual Wave',
      'Standing Greeting': 'Formal Greeting',
      'Quick Formal Bow': 'Respectful Bow',
      'Quick Informal Bow': 'Casual Bow',
      'Clapping': 'Applause',
      'Reacting': 'Surprised Reaction',
      'weight shift': 'Weight Shifting',
      
      // Talking & Communication
      'Talking': 'Basic Talking',
      'Talking-2': 'Animated Talking',
      'Talking-3': 'Expressive Talking',
      'Talking-4': 'Detailed Explanation',
      'Head Nod Yes': 'Yes Nod',
      'shaking head no': 'No Shake',
      'No': 'Strong No',
      'look away gesture': 'Look Away',
      'sarcastic head nod': 'Sarcastic Nod',
      'annoyed head shake': 'Annoyed Shake',
      
      // Teaching & Education
      'acknowledging': 'Understanding Nod',
      'happy hand gesture': 'Happy Gesture',
      'Looking': 'Observing',
      'lengthy head nod': 'Strong Agreement',
      'Hard Head Nod': 'Emphatic Yes',
      
      // Emotional Expressions
      'relieved sigh': 'Relief Sigh',
      'thoughtful head shake': 'Thoughtful Shake',
      'Yawn': 'Tired Yawn'
    };
    
    return nameMap[animationName] || animationName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Enhanced capability query detection - Only for explicit capability questions
   */
  public isCapabilityQuery(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Only detect very explicit capability queries, not normal conversation
    const explicitCapabilityQueries = [
      'what can you do',
      'what are your capabilities',
      'what abilities do you have',
      'show me what you can do',
      'what skills do you have',
      'what are you capable of',
      'list your abilities',
      'what functions do you have',
      'what can you perform',
      'what actions can you take',
      'tell me your skills',
      'what services do you offer',
      'what are your features',
      'what do you specialize in',
      'what can you assist with',
      'what are your talents'
    ];
    
    // Only match if the text is EXACTLY one of these queries or very close
    return explicitCapabilityQueries.some(query => {
      // Exact match or very close match (allowing for minor variations)
      return lowerText === query || 
             lowerText === query + '?' ||
             lowerText === query.replace('you', 'u') ||
             lowerText === query.replace('you', 'u') + '?';
    });
  }

  /**
   * Generate enhanced capability response with specific animation names
   */
  public generateCapabilityResponse(text?: string): string {
    const lowerText = text?.toLowerCase() || '';
    
    // Check for category-specific questions
    if (lowerText.includes('dance') || lowerText.includes('dancing')) {
      const danceAnimations = this.getAnimationNamesByCategory('dance');
      return `Yes! I love dancing! I know these dance moves: ${danceAnimations.join(', ')}. Want to see me dance? Just ask me to show you any of these moves! 💃`;
    }
    
    if (lowerText.includes('exercise') || lowerText.includes('workout') || lowerText.includes('fitness')) {
      const exerciseAnimations = this.getAnimationNamesByCategory('exercise');
      return `Absolutely! I'm great at fitness! I can do these exercises: ${exerciseAnimations.join(', ')}. Let's get moving! Which workout would you like to see? 💪`;
    }
    
    if (lowerText.includes('fight') || lowerText.includes('combat') || lowerText.includes('martial')) {
      const fightingAnimations = this.getAnimationNamesByCategory('fighting');
      return `You bet! I know martial arts! I can show you these combat moves: ${fightingAnimations.join(', ')}. Ready to see some action? 🥋`;
    }
    
    if (lowerText.includes('gesture') || lowerText.includes('wave') || lowerText.includes('greet')) {
      const gestureAnimations = this.getAnimationNamesByCategory('gestures');
      return `Of course! I'm great with gestures! I can do: ${gestureAnimations.join(', ')}. Want to see any of these social interactions? 👋`;
    }
    
    if (lowerText.includes('talk') || lowerText.includes('communicate') || lowerText.includes('speak')) {
      const talkingAnimations = this.getAnimationNamesByCategory('talking');
      return `Yes! I communicate with many expressions: ${talkingAnimations.join(', ')}. I love having conversations! 🗣️`;
    }
    
    if (lowerText.includes('emotion') || lowerText.includes('feeling') || lowerText.includes('express')) {
      const emotionalAnimations = this.getAnimationNamesByCategory('emotional');
      return `I can express many emotions! I can show: ${emotionalAnimations.join(', ')}. Emotions make conversations so much richer! 😊`;
    }
    
    if (lowerText.includes('teach') || lowerText.includes('educate') || lowerText.includes('instruct')) {
      const teachingAnimations = this.getAnimationNamesByCategory('teaching');
      return `I love teaching! I can use these educational gestures: ${teachingAnimations.join(', ')}. What would you like to learn today? 📚`;
    }
    
    // General capability response with all categories
    const allCategories = Array.from(this.animationCategories.values());
    const capabilityList = allCategories.map(category => 
      `${category.displayName}: ${this.getAnimationNamesByCategory(category.name).slice(0, 3).join(', ')}${this.getAnimationNamesByCategory(category.name).length > 3 ? ' and more!' : ''}`
    ).join('\n• ');
    
    const responses = [
      `Hi! I'm Echo, your amazing 3D AI assistant! I can do SO many things! Here's what I specialize in:\n\n• ${capabilityList}\n\nJust ask me to demonstrate any of these abilities! What would you like to see first? 🎭`,
      `I'm Echo, and I'm packed with abilities! I can:\n\n• ${capabilityList}\n\nI love showing off my skills! What catches your interest? 🌟`,
      `Welcome! I'm your versatile AI companion! My specialties include:\n\n• ${capabilityList}\n\nEvery ability comes with real demonstrations! What should we try? ✨`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Find the best matching animation for given text with intelligent categorization
   * Only triggers for EXPLICIT animation requests, not normal conversation
   */
  public findAnimationForText(text: string): { animation: AnimationConfig | null, category?: string, response?: string } {
    const lowerText = text.toLowerCase();
    
    // Check if it's a capability query first
    if (this.isCapabilityQuery(text)) {
      return {
        animation: null,
        response: this.generateCapabilityResponse(text)
      };
    }
    
    // Only trigger animations for EXPLICIT requests with action verbs
    const isExplicitAnimationRequest = this.isExplicitAnimationRequest(lowerText);
    
    if (!isExplicitAnimationRequest) {
      console.log(`📝 Normal conversation: "${text}" - passing to LLM`);
      return { animation: null }; // Let the LLM handle normal conversation
    }
    
    let bestMatch: AnimationMapping | null = null;
    let highestPriority = -1;
    let matchedKeyword = '';

    // Try keyword matching for explicit animation requests
    for (const mapping of this.animationMappings) {
      for (const keyword of mapping.keywords) {
        // Enhanced synonym matching
        const synonyms = this.getKeywordSynonyms(keyword);
        const allKeywords = [keyword, ...synonyms];
        
        for (const kw of allKeywords) {
          if (lowerText.includes(kw) && mapping.priority > highestPriority) {
            bestMatch = mapping;
            highestPriority = mapping.priority;
            matchedKeyword = kw;
            break;
          }
        }
        
        if (bestMatch && matchedKeyword) break;
      }
      
      if (bestMatch && matchedKeyword) break;
    }

    if (bestMatch) {
      // Log successful mapping for training data
      console.log(`🎯 Animation Mapping: "${text}" → ${bestMatch.category}:${this.extractAnimationNameFromPath(bestMatch.animation.path)} (via "${matchedKeyword}")`);
      
      return {
        animation: bestMatch.animation,
        category: bestMatch.category
        // No response - let the LLM generate it
      };
    }

    // Log uncategorized inputs for training data improvement
    console.log(`📊 Uncategorized Input: "${text}" - Consider adding to animation mappings`);
    this.logUncategorizedInput(text);

    return { animation: null };
  }

  /**
   * Check if the text is an explicit animation request (not just normal conversation)
   */
  private isExplicitAnimationRequest(lowerText: string): boolean {
    // Allow simple greetings and common action words
    const simpleActionWords = [
      // Simple greetings - SHOULD trigger animations
      'hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
      
      // Simple action words
      'dance', 'dancing', 'exercise', 'workout', 'fight', 'fighting',
      'wave', 'waving', 'bow', 'clap', 'clapping',
      'jump', 'jumping', 'moonwalk', 'salsa', 'gangnam',
      'push up', 'plank', 'squat', 'warm up',
      'yes', 'no', 'nod', 'shake', 'talk', 'speak'
    ];
    
    // Check for simple action words first
    const hasSimpleActionWord = simpleActionWords.some(word => {
      const includes = lowerText.includes(word);
      return includes;
    });
    
    if (hasSimpleActionWord) {
      return true;
    }
    
    // Also check for explicit action commands
    const explicitTriggers = [
      // Direct action commands
      'dance for me',
      'do a dance',
      'show me a dance',
      'can you dance',
      'dance now',
      'start dancing',
      
      'wave at me',
      'wave hello',
      'wave goodbye',
      'give me a wave',
      
      'exercise with me',
      'do some exercise',
      'show me exercise',
      'let\'s exercise',
      'work out',
      
      'fight me',
      'show fighting',
      'combat moves',
      
      // Greeting commands
      'say hello',
      'greet me',
      'bow to me'
    ];
    
    const hasExplicitTrigger = explicitTriggers.some(trigger => {
      const includes = lowerText.includes(trigger);
      return includes;
    });
    
    return hasExplicitTrigger;
  }

  /**
   * Get synonyms for animation keywords to improve matching
   */
  private getKeywordSynonyms(keyword: string): string[] {
    const synonymMap: Record<string, string[]> = {
      'hello': ['hi', 'hey', 'greetings', 'salutations', 'hiya'],
      'wave': ['waving', 'greet', 'greeting', 'salute'],
      'dance': ['dancing', 'boogie', 'groove', 'move', 'jive'],
      'exercise': ['workout', 'fitness', 'train', 'gym', 'physical'],
      'fight': ['fighting', 'combat', 'battle', 'martial', 'karate'],
      'teach': ['teaching', 'educate', 'instruct', 'show', 'demonstrate'],
      'happy': ['joy', 'cheerful', 'glad', 'pleased', 'delighted'],
      'bow': ['respect', 'honor', 'courtesy', 'polite'],
      'clap': ['clapping', 'applause', 'praise', 'bravo'],
      'talk': ['speak', 'communicate', 'converse', 'chat'],
      'yes': ['agree', 'correct', 'right', 'exactly', 'absolutely'],
      'no': ['disagree', 'wrong', 'incorrect', 'nope', 'negative']
    };
    
    return synonymMap[keyword] || [];
  }

  /**
   * Log uncategorized inputs for training data improvement
   */
  private logUncategorizedInput(text: string): void {
    // In production, this could send to analytics service
    const logEntry = {
      timestamp: new Date().toISOString(),
      input: text,
      type: 'uncategorized_animation_request'
    };
    
    // Store in localStorage for now (in production, use proper analytics)
    try {
      const existingLogs = JSON.parse(localStorage.getItem('echo_uncategorized_inputs') || '[]');
      existingLogs.push(logEntry);
      // Keep only last 100 entries
      const recentLogs = existingLogs.slice(-100);
      localStorage.setItem('echo_uncategorized_inputs', JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('Failed to log uncategorized input:', error);
    }
  }

  /**
   * Get uncategorized inputs for analysis (useful for improving the system)
   */
  public getUncategorizedInputs(): Array<{timestamp: string, input: string, type: string}> {
    try {
      return JSON.parse(localStorage.getItem('echo_uncategorized_inputs') || '[]');
    } catch (error) {
      console.warn('Failed to retrieve uncategorized inputs:', error);
      return [];
    }
  }

  /**
   * Get animations by category
   */
  public getAnimationsByCategory(category: string): AnimationMapping[] {
    return this.animationMappings.filter(mapping => mapping.category === category);
  }

  /**
   * Get all categories
   */
  public getAllCategories(): AnimationCategory[] {
    return Array.from(this.animationCategories.values());
  }

  /**
   * Get category capabilities as a formatted string
   */
  public getCapabilitiesString(): string {
    const categories = Array.from(this.animationCategories.values());
    return categories.map(cat => cat.displayName).join(', ');
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
      const animationName = this.extractAnimationNameFromPath(animationPath);
      console.log(`🎭 Extracted animation name: ${animationName}`);
      
      if (animationName !== 'happy-idle') {
        this.currentAnimation = animationName;
      }
      
      if ((window as any).playEchoAnimation) {
        const blendDuration = config?.crossFade || 0.8;
        console.log(`🎭 Calling playEchoAnimation with: ${animationName}, ${blendDuration}`);
        (window as any).playEchoAnimation(animationName, blendDuration);
      } else {
        console.warn('🎭 playEchoAnimation not available on window');
      }
      
      this.onAnimationChange(animationPath, config);
    } else {
      console.warn('🎭 No animation change callback set');
    }
  }

  /**
   * Extract animation name from file path and convert to match loaded animations
   */
  private extractAnimationNameFromPath(path: string): string {
    const filename = path.split('/').pop() || '';
    const nameWithoutExt = filename.replace('.glb', '');
    
    // Convert to match the animation loader naming convention (lowercase with dashes)
    const mappedName = this.mapToLoadedAnimationName(nameWithoutExt);
    console.log(`🎭 Animation name mapping: "${nameWithoutExt}" → "${mappedName}"`);
    
    return mappedName;
  }

  /**
   * Map animation file names to the actual loaded animation names
   */
  private mapToLoadedAnimationName(fileName: string): string {
    const nameMapping: Record<string, string> = {
      // Greeting animations
      'Waving-2': 'waving-2',
      'Waving-3': 'waving-3', 
      'Waving-4': 'waving-4',
      'Waving Gesture-3': 'waving-gesture-3',
      'Standing Greeting': 'standing-greeting',
      'Quick Formal Bow': 'quick-formal-bow',
      'Quick Informal Bow': 'quick-informal-bow',
      
      // Talking animations
      'Talking': 'talking',
      'Talking-2': 'talking-2',
      'Talking-3': 'talking-3',
      'Talking-4': 'talking-4',
      
      // Gesture animations
      'Clapping': 'clapping',
      'Reacting': 'reacting',
      'weight shift': 'weight-shift',
      'acknowledging': 'acknowledging',
      'happy hand gesture': 'happy-hand-gesture',
      'Looking': 'looking',
      'lengthy head nod': 'lengthy-head-nod',
      'Hard Head Nod': 'hard-head-nod',
      'Head Nod Yes': 'head-nod-yes',
      'shaking head no': 'shaking-head-no',
      'No': 'no',
      'look away gesture': 'look-away-gesture',
      'sarcastic head nod': 'sarcastic-head-nod',
      'annoyed head shake': 'annoyed-head-shake',
      
      // Emotional animations
      'relieved sigh': 'relieved-sigh',
      'thoughtful head shake': 'thoughtful-head-shake',
      'Yawn': 'yawn',
      
      // Happy/positive animations
      'Happy': 'happy',
      'Excited': 'excited',
      'Happy Walk': 'happy-walk',
      
      // Idle animations
      'Neutral Idle': 'neutral-idle',
      'Sad Idle': 'sad-idle',
      
      // Sitting animations
      'Sitting Idle': 'sitting-idle',
      'Male Sitting Pose': 'male-sitting-pose',
      'Male Sitting Pose-2': 'male-sitting-pose-2',
      'Idle To Situp': 'idle-to-situp',
      
      // Exercise animations
      'Warming Up': 'warming-up',
      'Push Up': 'push-up',
      'Plank': 'plank',
      'End Plank': 'end-plank',
      'Air Squat': 'air-squat',
      'Idle To Push Up': 'idle-to-push-up',
      
      // Fighting animations
      'Fighting Idle': 'fighting-idle',
      'Fight Idle': 'fight-idle',
      'Fight Idle (1)': 'fight-idle-1',
      'Fight Idle (2)': 'fight-idle-2',
      'Fight Idle (3)': 'fight-idle-3',
      'angry gesture': 'angry-gesture',
      'being cocky': 'being-cocky',
      'dismissing gesture': 'dismissing-gesture',
      'Defeat': 'defeat',
      
      // Dance animations
      'Salsa Dancing': 'salsa-dancing',
      'Gangnam Style ': 'gangnam-style', // Note: has space in filename
      'Moonwalk ': 'moonwalk', // Note: has space in filename
      'Locking Hip Hop Dance': 'locking-hip-hop-dance',
      'Jump': 'jump'
    };
    
    return nameMapping[fileName] || fileName.toLowerCase().replace(/\s+/g, '-');
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

  /**
   * Check if text contains action words that should trigger immediate animation
   */
  public hasActionWords(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Action words that should trigger immediate animation
    const actionWords = [
      // Dance & Movement
      'dance', 'dancing', 'move', 'groove', 'boogie', 'party', 'music', 'rhythm',
      'moonwalk', 'walk', 'strut', 'swagger', 'sway', 'rock', 'shift', 'weight',
      'happy', 'joy', 'celebrate', 'excited',
      
      // Exercise & Fitness
      'exercise', 'workout', 'fitness', 'train', 'gym', 'warm up', 'stretch',
      'push up', 'situp', 'strength', 'physical',
      
      // Fighting & Combat
      'fight', 'fighting', 'combat', 'martial', 'battle', 'attack', 'angry',
      'cocky', 'confident', 'tough', 'dismiss', 'defeat', 'surrender',
      
      // Social & Communication
      'hi', 'hello', 'hey', 'greet', 'wave', 'bye', 'goodbye', 'bow', 'respect',
      'clap', 'applause', 'react', 'surprise', 'talk', 'speak', 'communicate',
      'yes', 'no', 'agree', 'disagree', 'nod', 'shake', 'sarcastic', 'annoyed',
      
      // Teaching & Education
      'teach', 'educate', 'instruct', 'explain', 'show', 'demonstrate', 'learn',
      'acknowledge', 'understand', 'look', 'observe', 'point', 'gesture',
      
      // Emotional Expressions
      'relieved', 'sigh', 'thoughtful', 'think', 'tired', 'yawn', 'sleepy',
      'express', 'emotion', 'feeling', 'happy', 'sad', 'excited'
    ];
    
    return actionWords.some(word => lowerText.includes(word));
  }

  /**
   * Get action category from text for immediate animation selection
   */
  public getActionCategory(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    // Dance & Movement
    if (lowerText.includes('dance') || lowerText.includes('move') || lowerText.includes('groove') || 
        lowerText.includes('boogie') || lowerText.includes('music') || lowerText.includes('rhythm') ||
        lowerText.includes('moonwalk') || lowerText.includes('walk') || lowerText.includes('sway') ||
        lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('celebrate')) {
      return 'dance';
    }
    
    // Exercise & Fitness
    if (lowerText.includes('exercise') || lowerText.includes('workout') || lowerText.includes('fitness') ||
        lowerText.includes('train') || lowerText.includes('gym') || lowerText.includes('warm up') ||
        lowerText.includes('stretch') || lowerText.includes('push up') || lowerText.includes('situp')) {
      return 'exercise';
    }
    
    // Fighting & Combat
    if (lowerText.includes('fight') || lowerText.includes('combat') || lowerText.includes('martial') ||
        lowerText.includes('battle') || lowerText.includes('attack') || lowerText.includes('angry') ||
        lowerText.includes('cocky') || lowerText.includes('tough') || lowerText.includes('defeat')) {
      return 'fighting';
    }
    
    // Social & Communication
    if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('greet') ||
        lowerText.includes('wave') || lowerText.includes('bye') || lowerText.includes('bow') ||
        lowerText.includes('clap') || lowerText.includes('talk') || lowerText.includes('speak') ||
        lowerText.includes('yes') || lowerText.includes('no') || lowerText.includes('nod')) {
      return 'gestures';
    }
    
    // Teaching & Education
    if (lowerText.includes('teach') || lowerText.includes('educate') || lowerText.includes('instruct') ||
        lowerText.includes('explain') || lowerText.includes('show') || lowerText.includes('demonstrate') ||
        lowerText.includes('learn') || lowerText.includes('acknowledge') || lowerText.includes('look')) {
      return 'teaching';
    }
    
    // Emotional Expressions
    if (lowerText.includes('relieved') || lowerText.includes('sigh') || lowerText.includes('thoughtful') ||
        lowerText.includes('think') || lowerText.includes('tired') || lowerText.includes('yawn') ||
        lowerText.includes('express') || lowerText.includes('emotion') || lowerText.includes('feeling')) {
      return 'emotional';
    }
    
    return null;
  }
}

// Export singleton instance
export const animationService = new AnimationService(); 