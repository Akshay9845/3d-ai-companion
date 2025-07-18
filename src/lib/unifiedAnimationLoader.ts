/**
 * Unified Animation Loader
 * Loads all animations into a single model for seamless blending
 */

import { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { analyzeBoneStructure, retargetAnimation } from './boneMapping';
import { SmoothAnimationController } from './smoothAnimationController';

export interface UnifiedAnimation {
  name: string;
  clip: AnimationClip;
  action: AnimationAction;
  config: {
    weight: number;
    duration: number;
    loop: boolean;
    crossFadeDuration: number;
    priority: number;
    timeScale?: number;
    naturalTiming?: boolean;
  };
}

interface AnimationDefinition {
  path: string;
  config: {
    weight: number;
    duration: number;
    loop: boolean;
    crossFadeDuration: number;
    priority: number;
    timeScale?: number;
    naturalTiming?: boolean;
  };
}

export class UnifiedAnimationLoader {
  private mixer: AnimationMixer | null = null;
  private animations: Map<string, UnifiedAnimation> = new Map();
  private smoothController: SmoothAnimationController | null = null;
  private isLoading = false;
  private onLoadComplete?: () => void;
  private onHappyIdleReady?: () => void;
  private targetModel: any = null;

  // Animation definitions with proper paths and configurations
  private animationDefinitions: Record<string, AnimationDefinition> = {
    // Base idle animation (always active)
    'happy-idle': {
      path: '/ECHO/animations/basic reactions/happy-idle.glb',
      config: {
        weight: 1.0,
        duration: 30000,
        loop: true,
        crossFadeDuration: 3.0,
        priority: 1,
        timeScale: 1.0, // Natural speed for idle animation
        naturalTiming: true
      }
    },

    // EXERCISE & FITNESS ANIMATIONS - Balanced to prevent backward lean
    'warming-up': {
      path: '/ECHO/animations/basic reactions/warming-up.glb',
      config: {
        weight: 0.8, // REDUCED to prevent backward lean during warmup
        duration: 6000, // Reduced from 8000 for quicker response
        loop: false,
        crossFadeDuration: 1.2, // LONGER crossfade for smoother blending
        priority: 3,
        timeScale: 0.8, // FASTER to prevent extreme warmup poses
        naturalTiming: true
      }
    },
    'push-up': {
      path: '/ECHO/animations/basic reactions/push-up.glb',
      config: {
        weight: 0.8, // REDUCED to prevent backward lean during pushups
        duration: 4500, // Reduced from 6000 for quicker response
        loop: true,
        crossFadeDuration: 1.2, // LONGER crossfade for smoother blending
        priority: 3,
        timeScale: 0.8, // FASTER to prevent extreme pushup poses
        naturalTiming: true
      }
    },
    'idle-to-push-up': {
      path: '/ECHO/animations/basic reactions/idle-to-push-up.glb',
      config: {
        weight: 0.8, // REDUCED to prevent backward lean during transition
        duration: 3000, // Reduced from 4000 for quicker response
        loop: false,
        crossFadeDuration: 1.2, // LONGER crossfade for smoother blending
        priority: 3,
        timeScale: 0.8, // FASTER to prevent extreme transition poses
        naturalTiming: true
      }
    },

    // EXERCISE ANIMATIONS - Energetic workout speeds
    'plank': {
      path: '/ECHO/animations/fight and dance and excersise/Plank.glb',
      config: {
        weight: 1.0,
        duration: 4000,
        loop: true,
        crossFadeDuration: 0.8,
        priority: 3,
        timeScale: 0.8, // FASTER for dynamic plank
        naturalTiming: true
      }
    },
    'end-plank': {
      path: '/ECHO/animations/fight and dance and excersise/End Plank.glb',
      config: {
        weight: 1.0,
        duration: 2500,
        loop: false,
        crossFadeDuration: 0.8,
        priority: 3,
        timeScale: 0.8, // FASTER for exercise transition
        naturalTiming: true
      }
    },
    'air-squat': {
      path: '/ECHO/animations/fight and dance and excersise/Air Squat.glb',
      config: {
        weight: 1.0,
        duration: 3000,
        loop: true,
        crossFadeDuration: 0.8,
        priority: 3,
        timeScale: 0.8, // FASTER for dynamic squats
        naturalTiming: true
      }
    },

    // DANCE & MOVEMENT ANIMATIONS - Balanced to prevent backward lean
    'happy-walk': {
      path: '/ECHO/animations/basic reactions/happy-walk.glb',
      config: {
        weight: 0.8, // REDUCED to prevent backward lean during walking
        duration: 4000, // Reduced from 5000 for quicker response
        loop: true,
        crossFadeDuration: 1.2, // LONGER crossfade for smoother walking
        priority: 3,
        timeScale: 0.7, // FASTER to prevent extreme walking poses
        naturalTiming: true
      }
    },
    'excited': {
      path: '/ECHO/animations/basic reactions/excited.glb',
      config: {
        weight: 0.7, // REDUCED to prevent backward lean during excitement
        duration: 4500, // Reduced from 6000 for quicker response
        loop: false,
        crossFadeDuration: 1.2, // LONGER crossfade for smoother blending
        priority: 3,
        timeScale: 0.8, // FASTER to prevent extreme excited poses
        naturalTiming: true
      }
    },
    'happy': {
      path: '/ECHO/animations/basic reactions/happy.glb',
      config: {
        weight: 0.7, // REDUCED to prevent backward lean during happiness
        duration: 3500, // Reduced from 5000 for quicker response
        loop: false,
        crossFadeDuration: 1.2, // LONGER crossfade for smoother blending
        priority: 3,
        timeScale: 0.8, // FASTER to prevent extreme happy poses
        naturalTiming: true
      }
    },
    'weight-shift': {
      path: '/ECHO/animations/basic reactions/weight-shift.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 3000, // Reduced from 4000 for quicker response
        loop: true,
        crossFadeDuration: 1.0, // Consistent with other gestures
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },

    // DANCE ANIMATIONS - AGGRESSIVE ANTI-LEAN SETTINGS
    'salsa-dancing': {
      path: '/ECHO/animations/fight and dance and excersise/Salsa Dancing.glb',
      config: {
        weight: 0.5, // VERY LOW weight to prevent backward lean completely
        duration: 6000,
        loop: true,
        crossFadeDuration: 2.0, // VERY LONG crossfade for maximum blending
        priority: 3,
        timeScale: 1.2, // MUCH FASTER to prevent extreme poses
        naturalTiming: true
      }
    },
    'gangnam-style': {
      path: '/ECHO/animations/fight and dance and excersise/Gangnam Style .glb',
      config: {
        weight: 0.5, // VERY LOW weight to prevent backward lean completely
        duration: 8000,
        loop: true,
        crossFadeDuration: 2.0, // VERY LONG crossfade for maximum blending
        priority: 3,
        timeScale: 1.2, // MUCH FASTER to prevent extreme poses
        naturalTiming: true
      }
    },
    'moonwalk': {
      path: '/ECHO/animations/fight and dance and excersise/Moonwalk .glb',
      config: {
        weight: 0.5, // VERY LOW weight to prevent backward lean completely
        duration: 4000,
        loop: true,
        crossFadeDuration: 2.0, // VERY LONG crossfade for maximum blending
        priority: 3,
        timeScale: 1.4, // MUCH FASTER for smooth moonwalk
        naturalTiming: true
      }
    },
    'locking-hip-hop-dance': {
      path: '/ECHO/animations/fight and dance and excersise/Locking Hip Hop Dance.glb',
      config: {
        weight: 0.5, // VERY LOW weight to prevent backward lean completely
        duration: 8000,
        loop: true,
        crossFadeDuration: 2.0, // VERY LONG crossfade for maximum blending
        priority: 3,
        timeScale: 1.2, // MUCH FASTER to prevent extreme poses
        naturalTiming: true
      }
    },
    'jump': {
      path: '/ECHO/animations/fight and dance and excersise/Jump.glb',
      config: {
        weight: 0.8, // REDUCED to prevent backward lean
        duration: 2000, // Shorter for snappy jump
        loop: false,
        crossFadeDuration: 0.8, // Smoother transition
        priority: 3,
        timeScale: 1.0, // FULL SPEED for explosive jump
        naturalTiming: true
      }
    },

    // FIGHTING & COMBAT GESTURES - Aligned with happy-idle base
    'angry-gesture': {
      path: '/ECHO/animations/basic reactions/angry-gesture.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // Consistent blending
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'being-cocky': {
      path: '/ECHO/animations/basic reactions/being-cocky.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 3000, // Reduced from 4000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // Consistent blending
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'dismissing-gesture': {
      path: '/ECHO/animations/basic reactions/dismissing-gesture.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // Consistent blending
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'defeat': {
      path: '/ECHO/animations/basic reactions/defeat.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 4000, // Reduced from 5000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // Consistent blending
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },

    // FIGHTING ANIMATIONS - AGGRESSIVE ANTI-LEAN SETTINGS
    'fighting-idle': {
      path: '/ECHO/animations/fight and dance and excersise/Fighting Idle.glb',
      config: {
        weight: 0.5, // VERY LOW weight to prevent backward lean completely
        duration: 4000,
        loop: true,
        crossFadeDuration: 2.0, // VERY LONG crossfade for maximum blending
        priority: 3,
        timeScale: 1.1, // FASTER to prevent extreme fighting poses
        naturalTiming: true
      }
    },
    'fight-idle': {
      path: '/ECHO/animations/fight and dance and excersise/Fight Idle.glb',
      config: {
        weight: 0.5, // VERY LOW weight to prevent backward lean completely
        duration: 3000,
        loop: true,
        crossFadeDuration: 2.0, // VERY LONG crossfade for maximum blending
        priority: 3,
        timeScale: 1.1, // FASTER to prevent extreme combat poses
        naturalTiming: true
      }
    },
    'fight-idle-1': {
      path: '/ECHO/animations/fight and dance and excersise/Fight Idle (1).glb',
      config: {
        weight: 0.5, // VERY LOW weight to prevent backward lean completely
        duration: 3000,
        loop: true,
        crossFadeDuration: 2.0, // VERY LONG crossfade for maximum blending
        priority: 3,
        timeScale: 1.1, // FASTER to prevent extreme fighting poses
        naturalTiming: true
      }
    },
    'fight-idle-2': {
      path: '/ECHO/animations/fight and dance and excersise/Fight Idle (2).glb',
      config: {
        weight: 0.5, // VERY LOW weight to prevent backward lean completely
        duration: 3000,
        loop: true,
        crossFadeDuration: 2.0, // VERY LONG crossfade for maximum blending
        priority: 3,
        timeScale: 1.1, // FASTER to prevent extreme stance poses
        naturalTiming: true
      }
    },
    'fight-idle-3': {
      path: '/ECHO/animations/fight and dance and excersise/Fight Idle (3).glb',
      config: {
        weight: 0.5, // VERY LOW weight to prevent backward lean completely
        duration: 3000,
        loop: true,
        crossFadeDuration: 2.0, // VERY LONG crossfade for maximum blending
        priority: 3,
        timeScale: 1.1, // FASTER to prevent extreme combat poses
        naturalTiming: true
      }
    },

    // TEACHING & EDUCATION ANIMATIONS - Aligned with happy-idle base
    'acknowledging': {
      path: '/ECHO/animations/basic reactions/acknowledging.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 1500, // Reduced from 2000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'head-nod-yes': {
      path: '/ECHO/animations/basic reactions/head-nod-yes.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 1500, // Reduced from 2000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'happy-hand-gesture': {
      path: '/ECHO/animations/basic reactions/happy-hand-gesture.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'looking': {
      path: '/ECHO/animations/basic reactions/looking.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'lengthy-head-nod': {
      path: '/ECHO/animations/basic reactions/lengthy-head-nod.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },

    // EMOTIONAL EXPRESSIONS - Aligned with happy-idle base
    'relieved-sigh': {
      path: '/ECHO/animations/basic reactions/relieved-sigh.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // Consistent blending
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'thoughtful-head-shake': {
      path: '/ECHO/animations/basic reactions/thoughtful-head-shake.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // Consistent blending
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'yawn': {
      path: '/ECHO/animations/basic reactions/yawn.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 3000, // Reduced from 4000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // Consistent blending
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },

    // SOCIAL INTERACTIONS - Natural gesture speeds
    'waving-2': {
      path: '/ECHO/animations/basic reactions/waving-2.glb',
      config: {
        weight: 1.0,
        duration: 2500,
        loop: false,
        crossFadeDuration: 0.6,
        priority: 3,
        timeScale: 0.6, // FASTER for natural waving
        naturalTiming: true
      }
    },
    'standing-greeting': {
      path: '/ECHO/animations/basic reactions/standing-greeting.glb',
      config: {
        weight: 1.0,
        duration: 3000,
        loop: false,
        crossFadeDuration: 0.6,
        priority: 3,
        timeScale: 0.6, // FASTER for natural greeting
        naturalTiming: true
      }
    },
    'quick-formal-bow': {
      path: '/ECHO/animations/basic reactions/quick-formal-bow.glb',
      config: {
        weight: 1.0,
        duration: 1500,
        loop: false,
        crossFadeDuration: 0.6,
        priority: 3,
        timeScale: 0.7, // FASTER for quick bow
        naturalTiming: true
      }
    },
    'quick-informal-bow': {
      path: '/ECHO/animations/basic reactions/quick-informal-bow.glb',
      config: {
        weight: 1.0,
        duration: 1500,
        loop: false,
        crossFadeDuration: 0.6,
        priority: 3,
        timeScale: 0.7, // FASTER for quick bow
        naturalTiming: true
      }
    },
    'clapping': {
      path: '/ECHO/animations/basic reactions/clapping.glb',
      config: {
        weight: 1.0,
        duration: 2500,
        loop: true,
        crossFadeDuration: 0.6,
        priority: 3,
        timeScale: 0.6, // FASTER for energetic clapping
        naturalTiming: true
      }
    },
    'reacting': {
      path: '/ECHO/animations/basic reactions/reacting.glb',
      config: {
        weight: 1.0,
        duration: 1500,
        loop: false,
        crossFadeDuration: 0.6,
        priority: 3,
        timeScale: 0.7, // FASTER for natural reaction
        naturalTiming: true
      }
    },

    // COMMUNICATION GESTURES - Aligned with happy-idle base
    'shaking-head-no': {
      path: '/ECHO/animations/basic reactions/shaking-head-no.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 1500, // Reduced from 2000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'no': {
      path: '/ECHO/animations/basic reactions/no.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2000,
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'look-away-gesture': {
      path: '/ECHO/animations/basic reactions/look-away-gesture.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'sarcastic-head-nod': {
      path: '/ECHO/animations/basic reactions/sarcastic-head-nod.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'annoyed-head-shake': {
      path: '/ECHO/animations/basic reactions/annoyed-head-shake.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'waving-gesture-3': {
      path: '/ECHO/animations/basic reactions/waving-gesture-3.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500,
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'hard-head-nod': {
      path: '/ECHO/animations/basic reactions/hard-head-nod.glb',
      config: {
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 1500,
        loop: false,
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },

    // SITTING ANIMATIONS - Idle states (keep slower for calm sitting)
    'sitting-idle': {
      path: '/ECHO/animations/basic reactions/sitting-idle.glb',
      config: { 
        weight: 1.0, // Keep full weight for idle state replacement
        duration: 30000, 
        loop: true, 
        crossFadeDuration: 2.5, // LONGER for smooth transition from standing
        priority: 1,
        timeScale: 0.5, // SLIGHTLY FASTER than 0.3 but still calm
        naturalTiming: true
      }
    },
    'male-sitting-pose': {
      path: '/ECHO/animations/basic reactions/male-sitting-pose.glb',
      config: { 
        weight: 1.0, // Keep full weight for idle state replacement
        duration: 30000, 
        loop: true, 
        crossFadeDuration: 2.5, // LONGER for smooth transition from standing
        priority: 1,
        timeScale: 0.5, // SLIGHTLY FASTER than 0.3 but still calm
        naturalTiming: true
      }
    },
    'male-sitting-pose-2': {
      path: '/ECHO/animations/basic reactions/male-sitting-pose-2.glb',
      config: { 
        weight: 1.0, // Keep full weight for idle state replacement
        duration: 30000, 
        loop: true, 
        crossFadeDuration: 2.5, // LONGER for smooth transition from standing
        priority: 1,
        timeScale: 0.5, // SLIGHTLY FASTER than 0.3 but still calm
        naturalTiming: true
      }
    },
    'idle-to-situp': {
      path: '/ECHO/animations/basic reactions/idle-to-situp.glb',
      config: { 
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 3000, // Reduced from 4000 for quicker response
        loop: false, 
        crossFadeDuration: 1.2, // LONGER for smooth blending transition
        priority: 2,
        timeScale: 0.8, // FASTER for natural transition flow
        naturalTiming: true
      }
    },

    // ALTERNATIVE IDLE ANIMATIONS - Aligned with happy-idle timing
    'neutral-idle': {
      path: '/ECHO/animations/fight and dance and excersise/Neutral Idle.glb',
      config: {
        weight: 1.0, // Keep full weight for idle state replacement
        duration: 30000,
        loop: true,
        crossFadeDuration: 3.0, // Match happy-idle crossfade timing
        priority: 1,
        timeScale: 1.0, // MATCH happy-idle natural speed for consistency
        naturalTiming: true
      }
    },
    'sad-idle': {
      path: '/ECHO/animations/fight and dance and excersise/Sad Idle.glb',
      config: {
        weight: 1.0, // Keep full weight for idle state replacement
        duration: 30000,
        loop: true,
        crossFadeDuration: 3.0, // Match happy-idle crossfade timing
        priority: 1,
        timeScale: 1.0, // MATCH happy-idle natural speed for consistency
        naturalTiming: true
      }
    },

    // Additional waving animations - Aligned with happy-idle base
    'waving-3': {
      path: '/ECHO/animations/basic reactions/waving-3.glb',
      config: { 
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3500 for quicker response
        loop: false, 
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },
    'waving-4': {
      path: '/ECHO/animations/basic reactions/waving-4.glb',
      config: { 
        weight: 0.8, // REDUCED to blend with happy-idle base
        duration: 2500, // Reduced from 3000 for quicker response
        loop: false, 
        crossFadeDuration: 1.0, // LONGER for smooth blending with happy-idle
        priority: 3,
        timeScale: 0.7, // FASTER to flow naturally with happy-idle
        naturalTiming: true
      }
    },

    // Talking animations - 0.3x SPEED, EXTENDED DURATION TO PREVENT T-POSE
    'talking': {
      path: '/ECHO/animations/basic reactions/talking.glb',
      config: { 
        weight: 0.9, // Strong weight for visible talking gestures
        duration: 12000, // 12 seconds - much longer to prevent premature ending
        loop: true, 
        crossFadeDuration: 0.6, // Quick crossfade for seamless transitions
        priority: 2,
        timeScale: 0.3, // 0.3x speed as requested
        naturalTiming: true
      }
    },
    'talking-2': {
      path: '/ECHO/animations/basic reactions/talking-2.glb',
      config: { 
        weight: 0.9, // Strong weight for visible talking gestures
        duration: 12000, // 12 seconds - much longer to prevent premature ending
        loop: true, 
        crossFadeDuration: 0.6, // Quick crossfade for seamless transitions
        priority: 2,
        timeScale: 0.3, // 0.3x speed as requested
        naturalTiming: true
      }
    },
    'talking-3': {
      path: '/ECHO/animations/basic reactions/talking-3.glb',
      config: { 
        weight: 0.9, // Strong weight for visible talking gestures
        duration: 12000, // 12 seconds - much longer to prevent premature ending
        loop: true, 
        crossFadeDuration: 0.6, // Quick crossfade for seamless transitions
        priority: 2,
        timeScale: 0.3, // 0.3x speed as requested
        naturalTiming: true
      }
    },
    'talking-4': {
      path: '/ECHO/animations/basic reactions/talking-4.glb',
      config: { 
        weight: 0.9, // Strong weight for visible talking gestures
        duration: 12000, // 12 seconds - much longer to prevent premature ending
        loop: true, 
        crossFadeDuration: 0.6, // Quick crossfade for seamless transitions
        priority: 2,
        timeScale: 0.3, // 0.3x speed as requested
        naturalTiming: true
      }
    },


  };

  constructor(mixer: AnimationMixer, targetModel?: any) {
    this.mixer = mixer;
    this.targetModel = targetModel;
    this.smoothController = new SmoothAnimationController(mixer);
    console.log('🎭 Unified Animation Loader initialized');
  }

  /**
   * Set the target model for retargeting
   */
  public setTargetModel(model: any): void {
    this.targetModel = model;
    if (model) {
      console.log('🎭 Target model set for animation retargeting');
      analyzeBoneStructure(model);
    }
  }

  /**
   * Load all animations for seamless blending
   */
  public async loadAllAnimations(onComplete?: () => void, onHappyIdleReady?: () => void): Promise<void> {
    if (this.isLoading) {
      console.log('🎭 Animation loading already in progress');
      return;
    }

    this.isLoading = true;
    this.onLoadComplete = onComplete;
    this.onHappyIdleReady = onHappyIdleReady;

    console.log('🎭 Starting to load all animations for unified blending...');

    const loader = new GLTFLoader();
    const loadPromises: Promise<void>[] = [];
    let happyIdleLoaded = false;

    // Load happy-idle FIRST to prevent T-pose
    const happyIdlePromise = this.loadAnimation('happy-idle', this.animationDefinitions['happy-idle'].path, this.animationDefinitions['happy-idle'], loader).then(() => {
      if (!happyIdleLoaded) {
        happyIdleLoaded = true;
        console.log('🚫 PREVENTING T-POSE: Starting happy-idle immediately after load');
        // Start happy-idle immediately to prevent T-pose
        setTimeout(() => {
          if (this.smoothController) {
            this.smoothController.forceStartBaseIdle();
            // Notify that happy-idle is ready and model can be shown
            this.onHappyIdleReady?.();
          }
        }, 50);
      }
    });
    loadPromises.push(happyIdlePromise);

    // Load all other animations in parallel
    Object.entries(this.animationDefinitions).forEach(([name, def]) => {
      if (name !== 'happy-idle') { // Skip happy-idle as it's already loaded above
        const loadPromise = this.loadAnimation(name, def.path, def.config, loader);
        loadPromises.push(loadPromise);
      }
    });

    try {
      await Promise.all(loadPromises);
      console.log(`🎭 Successfully loaded ${this.animations.size} animations`);
      
      // Set up smooth controller with all loaded animations
      this.setupSmoothController();
      
      // Ensure happy-idle is playing (double-check to prevent T-pose)
      if (this.smoothController && !this.smoothController.isBaseIdleActive()) {
        console.log('🚫 PREVENTING T-POSE: Ensuring base idle is active after all animations loaded');
        this.smoothController.forceStartBaseIdle();
      }
      
      this.isLoading = false;
      this.onLoadComplete?.();
    } catch (error) {
      console.error('🎭 Failed to load animations:', error);
      this.isLoading = false;
    }
  }

  /**
   * Load a single animation
   */
  private async loadAnimation(
    name: string, 
    path: string, 
    config: any, 
    loader: GLTFLoader
  ): Promise<void> {
    try {
      const gltf = await new Promise((resolve, reject) => {
        loader.load(path, resolve, undefined, reject);
      });

      if (gltf.animations && gltf.animations.length > 0) {
        const originalClip = gltf.animations[0];
        console.log(`🎭 Loaded animation: ${name} (${originalClip.duration.toFixed(2)}s)`);
        
        // Retarget the animation to match Echo model bone structure
        let retargetedClip = originalClip;
        
        if (this.targetModel) {
          try {
            retargetedClip = retargetAnimation(originalClip, this.targetModel);
            console.log(`🎯 Successfully retargeted ${name} animation`);
          } catch (error) {
            console.warn(`⚠️ Failed to retarget ${name} animation, using original:`, error);
            retargetedClip = originalClip;
          }
        } else {
          console.warn(`⚠️ No target model set for ${name}, using original animation`);
        }
        
        // Create action with the clip (either retargeted or original)
        const action = this.mixer!.clipAction(retargetedClip);
        
        const animation: UnifiedAnimation = {
          name,
          clip: retargetedClip,
          action,
          config
        };

        this.animations.set(name, animation);
        
        // Add to smooth controller
        this.smoothController?.addTrack(name, action, config);
        
        console.log(`🎭 Processed animation: ${name} (${retargetedClip.tracks.length} tracks)`);
      } else {
        console.warn(`🎭 No animations found in: ${path}`);
      }
    } catch (error) {
      console.error(`🎭 Failed to load animation ${name} from ${path}:`, error);
    }
  }

  /**
   * Set up the smooth controller with all loaded animations
   */
  private setupSmoothController(): void {
    if (!this.smoothController) return;

    // Add all loaded animations to the smooth controller
    this.animations.forEach((animation, name) => {
      this.smoothController!.addTrack(name, animation.action, animation.config);
    });

    console.log('🎭 Smooth controller set up with all animations');
  }

  /**
   * Get the smooth animation controller
   */
  public getSmoothController(): SmoothAnimationController | null {
    return this.smoothController;
  }

  /**
   * Check if an animation is loaded
   */
  public hasAnimation(name: string): boolean {
    const exists = this.animations.has(name);
    console.log(`🎭 LOADER: Animation "${name}" exists: ${exists}`);
    if (!exists) {
      console.log(`🎭 LOADER: Available animations (${this.animations.size}): ${Array.from(this.animations.keys()).slice(0, 10).join(', ')}${this.animations.size > 10 ? '...' : ''}`);
    }
    return exists;
  }

  /**
   * Play a specific animation with smooth transition
   */
  public playAnimation(name: string, blendDuration: number = 0.8): boolean {
    console.log(`🎭 LOADER: ===== PLAY ANIMATION CALLED =====`);
    console.log(`🎭 LOADER: Animation name: "${name}"`);
    console.log(`🎭 LOADER: Blend duration: ${blendDuration}s`);
    console.log(`🎭 LOADER: Smooth controller available: ${!!this.smoothController}`);
    console.log(`🎭 LOADER: Total loaded animations: ${this.animations.size}`);

    if (!this.smoothController) {
      console.error('❌ LOADER: Smooth controller not initialized!');
      return false;
    }

    // Check if animation exists
    if (!this.hasAnimation(name)) {
      console.error(`❌ LOADER: Animation "${name}" not found!`);
      console.error(`❌ LOADER: Available animations: ${Array.from(this.animations.keys()).join(', ')}`);
      return false;
    }

    console.log(`🎭 LOADER: Calling smoothController.transitionTo("${name}", ${blendDuration})`);
    try {
      this.smoothController.transitionTo(name, blendDuration);
      console.log(`✅ LOADER: Successfully initiated transition to "${name}"`);
      return true;
    } catch (error) {
      console.error(`❌ LOADER: Error during transition to "${name}":`, error);
      return false;
    }
  }

  /**
   * Blend multiple animations together
   */
  public blendAnimations(animations: Array<{ name: string; weight: number }>, blendDuration: number = 0.8): void {
    if (!this.smoothController) {
      console.warn('🎭 Smooth controller not initialized');
      return;
    }

    this.smoothController.blendAnimations(animations, blendDuration);
  }

  /**
   * Return to idle state
   */
  public returnToIdle(blendDuration: number = 0.8): void {
    if (!this.smoothController) {
      console.warn('🎭 Smooth controller not initialized');
      return;
    }

    this.smoothController.returnToIdle(blendDuration);
  }

  /**
   * Update the animation system
   */
  public update(deltaTime: number): void {
    this.smoothController?.update(deltaTime);
  }

  /**
   * Get current animation state
   */
  public getCurrentState(): { activeAnimations: string[]; weights: Record<string, number> } {
    return this.smoothController?.getCurrentState() || { activeAnimations: [], weights: {} };
  }

  /**
   * Get available animation names
   */
  public getAvailableAnimations(): string[] {
    return Array.from(this.animations.keys());
  }

  /**
   * Check if animation is loaded
   */
  public isAnimationLoaded(name: string): boolean {
    return this.animations.has(name);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.smoothController?.cleanup();
    this.animations.clear();
    this.isLoading = false;
  }
} 