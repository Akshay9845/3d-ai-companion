import { useGLTF } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { AnimationMixer } from 'three';
import { echoRobotCharacter } from '../characters/echo-robot-clean.config';
import { analyzeBoneStructure, getAllBoneNames } from '../lib/boneMapping';
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
  
  // Aggressive animation management - prevent any gaps
  const currentAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const happyIdleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationQueueRef = useRef<string[]>([]);
  const isPlayingAnimationRef = useRef<boolean>(false);

  const { scene, animations } = useGLTF(echoRobotCharacter.modelPath);

  useEffect(() => {
    if (!scene || !groupRef.current) return;

    console.log('🚫 AGGRESSIVE T-POSE PREVENTION: Setting up continuous animation system');

    // Create mixer
    const mixer = new AnimationMixer(scene);
    mixerRef.current = mixer;

    // Create animation loader
    const loader = new UnifiedAnimationLoader(mixer, scene);
    animationLoaderRef.current = loader;

    // Analyze bone structure
    analyzeBoneStructure(scene);
    const boneNames = getAllBoneNames(scene);
    console.log('🦴 Available bones:', boneNames.slice(0, 10));

    // Load all animations
    loader.loadAllAnimations(
      () => {
        console.log('✅ All animations loaded - starting aggressive animation management');
        startAggressiveAnimationManagement();
      },
      () => {
        console.log('✅ Happy-idle ready - making model visible');
        setIsModelVisible(true);
      }
    );

    // Expose global functions for animation control
    (window as any).playEchoAnimation = (animationName: string, crossfade: number = 4.0) => {
      console.log(`🎭 AGGRESSIVE: Playing ${animationName} - will trigger next immediately`);
      playAnimationAggressively(animationName, crossfade);
    };

    (window as any).returnEchoToIdle = (crossfade: number = 4.0) => {
      console.log('🔄 AGGRESSIVE: Returning to happy-idle immediately');
      returnToHappyIdleAggressively();
    };

    (window as any).forceEchoBaseIdle = () => {
      console.log('🚨 EMERGENCY: Forcing happy-idle active');
      forceHappyIdleActive();
    };

    (window as any).getEchoAnimationState = () => {
      return {
        current: currentAnimation,
        isPlaying: isPlayingAnimationRef.current,
        queue: animationQueueRef.current,
        modelVisible: isModelVisible
      };
    };

    return () => {
      // Cleanup
      if (currentAnimationTimeoutRef.current) {
        clearTimeout(currentAnimationTimeoutRef.current);
      }
      if (happyIdleIntervalRef.current) {
        clearInterval(happyIdleIntervalRef.current);
      }
      mixer?.stopAllAction();
    };
  }, [scene, onAnimationChange]);

  // Aggressive animation management - ensures no gaps
  const startAggressiveAnimationManagement = () => {
    console.log('🚫 AGGRESSIVE: Starting continuous animation management - NO GAPS ALLOWED');
    
    // Start happy-idle immediately
    playHappyIdleAggressively();

    // Set up continuous monitoring to prevent any gaps
    happyIdleIntervalRef.current = setInterval(() => {
      ensureAnimationIsAlwaysPlaying();
    }, 1000); // Check every second for gaps
  };

  // Play animation aggressively - ensures next animation starts immediately
  const playAnimationAggressively = (animationName: string, crossfade: number = 4.0) => {
    if (!animationLoaderRef.current) return;
    
    console.log(`🎭 AGGRESSIVE: Playing ${animationName} - NO GAPS`);
    console.log(`🎭 AGGRESSIVE: Animation loader available: ${!!animationLoaderRef.current}`);
    
    // Clear any pending timeouts
    if (currentAnimationTimeoutRef.current) {
      clearTimeout(currentAnimationTimeoutRef.current);
      console.log(`🎭 AGGRESSIVE: Cleared previous animation timeout`);
    }

    try {
      // Play the animation
      console.log(`🎭 AGGRESSIVE: Calling animationLoader.playAnimation(${animationName}, ${crossfade})`);
      animationLoaderRef.current.playAnimation(animationName, crossfade);
      setCurrentAnimation(animationName);
      isPlayingAnimationRef.current = true;
      onAnimationChange?.(animationName);
      
      console.log(`🎭 AGGRESSIVE: ${animationName} started successfully`);
      
      // For non-talking animations, schedule next animation immediately
      if (!animationName.includes('talking') && !animationName.includes('idle')) {
        const animationDuration = getAnimationDuration(animationName);
        console.log(`🎭 AGGRESSIVE: ${animationName} will end in ${animationDuration}ms, scheduling next animation`);
        
        currentAnimationTimeoutRef.current = setTimeout(() => {
          console.log(`🎭 AGGRESSIVE: ${animationName} ended, triggering next animation immediately`);
          triggerNextAnimation();
        }, animationDuration - 500); // Start next animation 500ms before current ends
      } else if (animationName.includes('talking')) {
        console.log(`🎭 AGGRESSIVE: Talking animation ${animationName} - will be managed by synchronized speech controller`);
      } else if (animationName.includes('idle')) {
        console.log(`🎭 AGGRESSIVE: Idle animation ${animationName} - permanent base animation`);
      }
    } catch (error) {
      console.error('❌ Error playing animation aggressively:', error);
      // Emergency fallback to happy-idle
      console.log('🚨 EMERGENCY: Falling back to happy-idle due to animation error');
      playHappyIdleAggressively();
    }
  };

  // Return to happy-idle aggressively
  const returnToHappyIdleAggressively = () => {
    console.log('🔄 AGGRESSIVE: Returning to happy-idle immediately - NO GAPS');
    playAnimationAggressively('happy-idle', 4.0);
  };

  // Force happy-idle active (emergency)
  const forceHappyIdleActive = () => {
    console.log('🚨 EMERGENCY: Forcing happy-idle active to prevent T-pose');
    playHappyIdleAggressively();
    setIsModelVisible(true);
  };

  // Play happy-idle aggressively
  const playHappyIdleAggressively = () => {
    console.log('🔄 AGGRESSIVE: Playing happy-idle - permanent base animation');
    playAnimationAggressively('happy-idle', 4.0);
  };

  // Trigger next animation immediately
  const triggerNextAnimation = () => {
    console.log('🎭 AGGRESSIVE: Triggering next animation immediately');
    
    // If we have animations in queue, play the next one
    if (animationQueueRef.current.length > 0) {
      const nextAnimation = animationQueueRef.current.shift()!;
      playAnimationAggressively(nextAnimation, 4.0);
    } else {
      // Default back to happy-idle
      playHappyIdleAggressively();
    }
  };

  // Ensure animation is always playing (prevents gaps)
  const ensureAnimationIsAlwaysPlaying = () => {
    if (!isPlayingAnimationRef.current) {
      console.log('🚫 AGGRESSIVE: No animation playing - EMERGENCY STARTING HAPPY-IDLE');
      playHappyIdleAggressively();
    }
  };

  // Get animation duration for scheduling
  const getAnimationDuration = (animationName: string): number => {
    const durations: Record<string, number> = {
      'happy-idle': 15000, // Reduced from 30000 to 15000 for faster cycling
      'waving-2': 2000, // Reduced from 3500 to 2000 for faster greeting
      'standing-greeting': 2500, // Reduced from 4500 to 2500 for faster greeting
      'quick-informal-bow': 2000, // Reduced from 3500 to 2000 for faster greeting
      'talking': 3000, // Reduced from 4000 to 3000 for faster talking
      'talking-2': 3000, // Reduced from 4000 to 3000 for faster talking
      'talking-3': 3000, // Reduced from 4000 to 3000 for faster talking
      'talking-4': 3000  // Reduced from 4000 to 3000 for faster talking
    };
    
    return durations[animationName] || 3000; // Default 3 seconds instead of 4
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