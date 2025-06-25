import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { optimizeAnimations } from './animationOptimizer';

/**
 * Helper function to load GLB animations from converted directory
 * @param model The 3D model to apply animations to
 * @param animationManager Manager to store loaded animations
 * @returns Array of loaded animation names
 */
export async function loadConvertedAnimations(
  model: THREE.Object3D,
  animationManager: {
    registerAnimation?: (clip: THREE.AnimationClip, name: string) => void;
    registerAnimations?: (clips: THREE.AnimationClip[], name: string) => void;
  }
) {
  if (!model) {
    console.error('Cannot load animations: Model not provided');
    return [];
  }

  console.log('Loading new GLB animations...');

  const glbPath =
    '/Users/akshaynayak.s/Downloads/version 2/public/ECHO/animations/glb';
  const loadedAnimationNames: string[] = [];

  try {
    // Check if the GLB directory exists
    const response = await fetch(glbPath, { method: 'HEAD' });
    if (!response.ok) {
      console.warn(`GLB animations directory not found: ${glbPath}`);
      console.warn(
        `Please run the copy-animations-to-glb-dir.sh script to copy animations`
      );
      return [];
    } else {
      console.log(`GLB animations directory found at ${glbPath}`);
    }
  } catch (error) {
    console.error(`Error checking GLB animations directory: ${error}`);
    console.warn(
      `Please make sure the directory ${glbPath} exists and is accessible`
    );
    return [];
  }

  // This array is populated with GLB animation files to load
  // These are the actual files in the glb directory
  const animationFilesToLoad: string[] = [
    'acknowledging.glb',
    'angry-gesture.glb',
    'annoyed-head-shake.glb',
    'being-cocky.glb',
    'clapping.glb',
    'defeat.glb',
    'dismissing-gesture.glb',
    'excited.glb',
    'happy-hand-gesture.glb',
    'happy-idle.glb',
    'happy-walk.glb',
    'happy.glb',
    'hard-head-nod.glb',
    'head-nod-yes.glb',
    'idle-to-push-up.glb',
    'idle-to-situp.glb',
    'lengthy-head-nod.glb',
    'look-away-gesture.glb',
    'looking.glb',
    'male-sitting-pose-2.glb',
    'male-sitting-pose.glb',
    'no.glb',
    'push-up.glb',
    'quick-formal-bow.glb',
    'quick-informal-bow.glb',
    'reacting.glb',
    'relieved-sigh.glb',
    'sarcastic-head-nod.glb',
    'shaking-head-no.glb',
    'sitting-idle.glb',
    'standing-greeting.glb',
    'talking-2.glb',
    'talking-3.glb',
    'talking-4.glb',
    'talking.glb',
    'thoughtful-head-shake.glb',
    'warming-up.glb',
    'waving-2.glb',
    'waving-3.glb',
    'waving-4.glb',
    'waving-gesture-3.glb',
    'weight-shift.glb',
    'yawn.glb',
  ];

  const loader = new GLTFLoader();

  let loadedCount = 0;
  let errorCount = 0;

  for (const fileName of animationFilesToLoad) {
    try {
      const filePath = `${glbPath}/${fileName}`;
      console.log(`Loading GLB animation: ${filePath}`);

      // Check if the file exists first
      try {
        const fileResponse = await fetch(filePath, { method: 'HEAD' });
        if (!fileResponse.ok) {
          console.warn(`Animation file not found: ${filePath}`);
          errorCount++;
          continue;
        }
      } catch (fileErr) {
        console.warn(`Error checking file ${fileName}:`, fileErr);
        errorCount++;
        continue;
      }

      const gltf = await new Promise<{
        animations?: THREE.AnimationClip[];
        scene?: THREE.Scene;
      }>((resolve, reject) => {
        loader.load(
          filePath,
          resolve,
          // Progress callback
          progress => {
            if (progress.lengthComputable) {
              const percentComplete = Math.round(
                (progress.loaded / progress.total) * 100
              );
              if (percentComplete % 25 === 0) {
                console.log(`Loading ${fileName}: ${percentComplete}%`);
              }
            }
          },
          reject
        );
      });

      if (gltf.animations && gltf.animations.length > 0) {
        // Process each animation in the file
        gltf.animations.forEach((clip: THREE.AnimationClip) => {
          // Create a name for the animation (remove .glb extension)
          const baseName = fileName.replace('.glb', '');
          const clipName = baseName;

          // Optimize the animation for better performance
          optimizeAnimations(clip);

          // Store animation in the manager
          if (animationManager) {
            if (typeof animationManager.registerAnimation === 'function') {
              animationManager.registerAnimation(clip, clipName);
            } else if (
              typeof animationManager.registerAnimations === 'function'
            ) {
              animationManager.registerAnimations([clip], clipName);
            }

            loadedAnimationNames.push(clipName);
            console.log(
              `Loaded converted animation: ${clipName} (Duration: ${clip.duration.toFixed(2)}s)`
            );
            loadedCount++;
          }
        });
      } else {
        console.warn(`No animations found in ${filePath}`);
        errorCount++;
      }
    } catch (err) {
      console.warn(`Could not load animation ${fileName}:`, err);
      errorCount++;
    }
  }

  console.log(
    `Animation loading complete: ${loadedCount} loaded, ${errorCount} failed`
  );

  console.log(
    `Successfully loaded ${loadedAnimationNames.length} converted GLB animations`
  );
  return loadedAnimationNames;
}
