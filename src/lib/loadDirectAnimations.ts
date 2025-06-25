import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Helper function to load GLB animations directly from the specified path
 * @param model The 3D model to apply animations to
 * @param animationManager Manager to store loaded animations
 * @returns Array of loaded animation names
 */
export async function loadDirectAnimations(
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

  console.log('Loading GLB animations directly...');

  const glbPath =
    '/Users/akshaynayak.s/Downloads/version 2/public/ECHO/animations/glb';
  const loadedAnimationNames: string[] = [];

  try {
    // Check if the GLB directory exists
    const response = await fetch(glbPath, { method: 'HEAD' });
    if (!response.ok) {
      console.warn(`GLB animations directory not found: ${glbPath}`);
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

  // Get a list of all files in the GLB directory
  let animationFilesToLoad: string[] = [];

  try {
    // Use directory listing API or simply try to load known animation names
    // This is a comprehensive list of common animations
    animationFilesToLoad = [
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
      'lengthy-head-nod.glb',
      'look-away-gesture.glb',
      'looking.glb',
      'male-sitting-pose.glb',
      'no.glb',
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
      'waving-2.glb',
      'waving-3.glb',
      'waving-4.glb',
      'waving-gesture-3.glb',
      'weight-shift.glb',
      'yawn.glb',
    ];
  } catch (error) {
    console.error('Error getting animation file list:', error);
  }

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
              `Loaded animation: ${clipName} (Duration: ${clip.duration.toFixed(2)}s)`
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
    `Successfully loaded ${loadedAnimationNames.length} GLB animations`
  );
  return loadedAnimationNames;
}

/**
 * Check if a file exists by performing a HEAD request
 * @param url The URL to check
 * @returns Promise that resolves to a boolean indicating if the file exists
 */
export async function checkFileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`Failed to check if file exists: ${url}`, error);
    return false;
  }
}
