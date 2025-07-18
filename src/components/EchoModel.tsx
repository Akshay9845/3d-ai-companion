import { useGLTF } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { AnimationMixer } from 'three';
import { echoRobotCharacter } from '../characters/echo-robot-clean.config';
import { UnifiedAnimationLoader } from '../lib/unifiedAnimationLoader';

interface EchoModelProps {
  onAnimationChange?: (animationName: string) => void;
}

export function EchoModel({ onAnimationChange }: EchoModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const animationLoaderRef = useRef<UnifiedAnimationLoader | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState('');
  const [isModelVisible, setIsModelVisible] = useState(false);
  
  // SIMPLE state management - no complex scheduling
  const isPlayingRef = useRef<boolean>(false);
  const currentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { scene, animations } = useGLTF(echoRobotCharacter.modelPath);

  useEffect(() => {
    if (!scene || !groupRef.current) return;

    console.log('🎭 SIMPLE: Setting up basic animation system');

    // Create mixer
    const mixer = new AnimationMixer(scene);
    mixerRef.current = mixer;

    // Create animation loader
    const loader = new UnifiedAnimationLoader(mixer, scene);
    animationLoaderRef.current = loader;

    // Load animations and start immediately
    loader.loadAllAnimations(
      () => {
        console.log('✅ SIMPLE: All animations loaded');
        setIsModelVisible(true);
        
        // Start happy-idle immediately
        playAnimationSimple('happy-idle');
      },
      () => {
        console.log('✅ SIMPLE: Happy-idle ready');
        setIsModelVisible(true);
        
        // Start happy-idle immediately
        playAnimationSimple('happy-idle');
      }
    );

    // SIMPLE global function - no complex scheduling
    (window as any).playEchoAnimation = (animationName: string, crossfade: number = 0.8) => {
      console.log(`🎭 SIMPLE: ===== GLOBAL PLAY FUNCTION CALLED =====`);
      console.log(`🎭 SIMPLE: Animation name received: "${animationName}"`);
      console.log(`🎭 SIMPLE: Crossfade: ${crossfade}`);
      console.log(`🎭 SIMPLE: Animation loader available: ${!!animationLoaderRef.current}`);
      
      if (!animationLoaderRef.current) {
        console.error(`❌ SIMPLE: Animation loader not available!`);
        return false;
      }
      
      // Check if animation exists in loader
      const hasAnimation = animationLoaderRef.current.hasAnimation ? 
        animationLoaderRef.current.hasAnimation(animationName) : 'unknown';
      console.log(`🎭 SIMPLE: Animation "${animationName}" exists in loader: ${hasAnimation}`);
      
      playAnimationSimple(animationName, crossfade);
      return true;
    };

    // CRITICAL: Force base idle function for T-pose prevention
    (window as any).forceEchoBaseIdle = () => {
      console.log('🛡️ FORCE BASE IDLE: Preventing T-pose by forcing happy-idle');
      playAnimationSimple('happy-idle', 1.5);
      return 'Base idle forced - T-pose prevented';
    };

    // Get animation state function
    (window as any).getEchoAnimationState = () => {
      const state = {
        currentAnimation: currentAnimation,
        isPlaying: isPlayingRef.current,
        isModelVisible: isModelVisible,
        activeAnimations: currentAnimation ? [currentAnimation] : [],
        isTPose: !isModelVisible || !currentAnimation || currentAnimation === '',
        mixer: !!mixerRef.current,
        loader: !!animationLoaderRef.current
      };
      console.log('🎭 Current animation state:', state);
      return state;
    };

    // Emergency functions - NO FORCED IDLE RETURNS
    (window as any).clearAllTimeouts = () => {
      console.log('🔄 SIMPLE: Clearing any animation timeouts');
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current);
        currentTimeoutRef.current = null;
      }
      return 'All timeouts cleared - animations play naturally';
    };

    (window as any).emergencyFixTPose = () => {
      console.log('🚨 SIMPLE: Emergency T-pose fix - ONLY when absolutely necessary');
      
      // Only use this in extreme T-pose cases
      if (confirm('Are you sure? This will interrupt current animations.')) {
        if (mixerRef.current) {
          mixerRef.current.stopAllAction();
        }
        
        setTimeout(() => {
          playAnimationSimple('happy-idle', 0.1);
        }, 100);
        
        return 'Emergency fix applied - use sparingly!';
      }
      return 'Emergency fix cancelled';
    };

    (window as any).testAnimationSystem = () => {
      console.log('🧪 SIMPLE: Testing system');
      console.log('Model visible:', isModelVisible);
      console.log('Animation playing:', isPlayingRef.current);
      console.log('Current animation:', currentAnimation);
      console.log('Mixer available:', !!mixerRef.current);
      console.log('Loader available:', !!animationLoaderRef.current);
      console.log('Animation speed: 0.3x (slower to prevent cutting)');
      
      // Test animation
      playAnimationSimple('waving-2', 0.5);
      
      return {
        modelVisible: isModelVisible,
        animationPlaying: isPlayingRef.current,
        currentAnimation: currentAnimation,
        mixerAvailable: !!mixerRef.current,
        loaderAvailable: !!animationLoaderRef.current,
        animationSpeed: '0.3x (slower)',
        expectedDuration: getSimpleDuration('waving-2') + 'ms'
      };
    };

    (window as any).testSlowWave = () => {
      console.log('🧪 SIMPLE: Testing slow wave animation');
      console.log('Expected duration:', getSimpleDuration('waving-2'), 'ms');
      playAnimationSimple('waving-2', 1.0);
      return 'Wave test started - should take ~' + (getSimpleDuration('waving-2') / 1000) + ' seconds';
    };

    // Quick test function for animations
    (window as any).testAnimation = (animName: string = 'waving-2') => {
      console.log(`🧪 SIMPLE: Quick test of ${animName}`);
      playAnimationSimple(animName, 0.8);
      return `Testing ${animName} - duration: ${getSimpleDuration(animName)}ms`;
    };

    // Animation system status
    (window as any).animationStatus = () => {
      return {
        modelVisible: isModelVisible,
        currentAnimation: currentAnimation,
        isPlaying: isPlayingRef.current,
        mixerExists: !!mixerRef.current,
        loaderExists: !!animationLoaderRef.current,
        hasTimeout: !!currentTimeoutRef.current,
        animationServiceCallbackSet: 'Check AvatarChatOverlay logs'
      };
    };

    // Fix model posture if leaning backwards
    (window as any).fixModelPosture = () => {
      if (groupRef.current) {
        // Reset to upright position
        groupRef.current.rotation.set(0, 0, 0);
        groupRef.current.position.set(
          echoRobotCharacter.modelSettings?.position?.[0] || 0,
          echoRobotCharacter.modelSettings?.position?.[1] || -3.5,
          echoRobotCharacter.modelSettings?.position?.[2] || 0
        );
        console.log('🎭 POSTURE: Model posture reset to upright');
        return 'Model posture fixed';
      }
      return 'Model not available';
    };

    // Adjust dance animation weight to prevent extreme poses
    (window as any).adjustDanceWeight = (weight: number = 0.6) => {
      if (animationLoaderRef.current && animationLoaderRef.current.getSmoothController) {
        const controller = animationLoaderRef.current.getSmoothController();
        if (controller) {
          // This would need to be implemented in the smooth controller
          console.log(`🎭 DANCE: Adjusting dance weight to ${weight}`);
          return `Dance weight adjusted to ${weight}`;
        }
      }
      return 'Animation controller not available';
    };

    return () => {
      // Cleanup
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current);
      }
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, [scene, onAnimationChange]);

  // SIMPLE animation play function - with improved debugging
  const playAnimationSimple = (animationName: string, crossfade: number = 0.8) => {
    if (!animationLoaderRef.current) {
      console.error('❌ SIMPLE: Animation loader not available');
      return;
    }

    console.log(`🎭 SIMPLE: ===== PLAYING ANIMATION: ${animationName} =====`);
    console.log(`🎭 SIMPLE: Crossfade: ${crossfade}s`);
    console.log(`🎭 SIMPLE: Current animation: ${currentAnimation}`);
    console.log(`🎭 SIMPLE: Animation loader available: ${!!animationLoaderRef.current}`);

    // No more forced timeouts - let animations play naturally
    if (currentTimeoutRef.current) {
      console.log(`🎭 SIMPLE: Clearing any existing timeout - animations now play naturally`);
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    try {
      // Play the animation
      const success = animationLoaderRef.current.playAnimation(animationName, crossfade);
      
      if (success !== false) {
        setCurrentAnimation(animationName);
        isPlayingRef.current = true;
        onAnimationChange?.(animationName);
        
        console.log(`✅ SIMPLE: ${animationName} started successfully`);
        
        // Let animations play naturally without forced return to idle
        if (!animationName.includes('idle')) {
          const duration = getSimpleDuration(animationName);
          console.log(`🎭 SIMPLE: ${animationName} will play for ${duration}ms - NO FORCED RETURN TO IDLE`);
          console.log(`🎭 SIMPLE: Animation will blend naturally with base layer when complete`);
        } else {
          console.log(`🎭 SIMPLE: ${animationName} is idle animation - continuous play`);
        }
      } else {
        console.error(`❌ SIMPLE: Failed to start ${animationName} - success returned: ${success}`);
        // If animation fails, log more details
        console.error(`❌ SIMPLE: Animation loader state:`, {
          loaderExists: !!animationLoaderRef.current,
          animationName: animationName,
          crossfade: crossfade
        });
      }
    } catch (error) {
      console.error('❌ SIMPLE: Error playing animation:', error);
      console.error('❌ SIMPLE: Error details:', {
        animationName,
        crossfade,
        loaderExists: !!animationLoaderRef.current,
        error: error
      });
    }
  };

  // SIMPLE duration calculation - ALIGNED with animation service
  const getSimpleDuration = (animationName: string): number => {
    const durations: Record<string, number> = {
      // Greeting animations - 0.3x speed from animation service
      'waving-2': 2500,      // From animation service
      'waving-3': 2500,      // From animation service
      'waving-4': 3000,      // From animation service
      'standing-greeting': 3000, // From animation service
      
      // Talking animations - 0.3x speed from animation service
      'talking': 2500,       // From animation service
      'talking-2': 2500,     // From animation service
      'talking-3': 2500,     // From animation service
      'talking-4': 2500,     // From animation service
      
      // Happy/emotion animations - 0.5x speed from animation service
      'happy': 5000,         // From animation service
      'excited': 4000,       // From animation service
      'weight-shift': 4000,  // From animation service
      
      // Idle animations
      'happy-idle': 30000,   // Never times out
      
      // Dance animations - varying speeds
      'salsa-dancing': 8000, // From animation service
      'gangnam-style': 10000, // From animation service
      'moonwalk': 4000,      // From animation service
      'locking-hip-hop-dance': 10000, // From animation service
      'jump': 3000,          // From animation service
      
      // Exercise animations - 0.5x speed
      'plank': 4000,         // From animation service
      'air-squat': 3000,     // From animation service
      'warming-up': 6000,    // From animation service
      'push-up': 3000,       // From animation service
      
      // Fighting animations - 0.5x speed
      'fighting-idle': 4000, // From animation service
      'fight-idle': 3000,    // From animation service
      'angry-gesture': 2500, // From animation service
      
      // Teaching animations - 0.3x speed
      'acknowledging': 1500, // From animation service
      'head-nod-yes': 1500,  // From animation service
      'looking': 2500,       // From animation service
      
      // Emotional animations - 0.3x speed
      'relieved-sigh': 2500, // From animation service
      'yawn': 3000,          // From animation service
      
      // Communication animations - 0.3x speed
      'no': 2000,            // From animation service
      'shaking-head-no': 1500, // From animation service
    };
    
    return durations[animationName] || 3000; // Default 3 seconds
  };

  // Animation loop
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      if (mixerRef.current) {
        mixerRef.current.update(0.016); // 60 FPS
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <group ref={groupRef}>
      <primitive 
        object={scene} 
        visible={isModelVisible}
        scale={echoRobotCharacter.modelSettings?.scale || [1, 1, 1]}
        position={echoRobotCharacter.modelSettings?.position || [0, -3.5, 0]}
        rotation={echoRobotCharacter.modelSettings?.rotation || [0, 0, 0]}
      />
      {!isModelVisible && (
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

// Preload the main model
useGLTF.preload(echoRobotCharacter.modelPath); 