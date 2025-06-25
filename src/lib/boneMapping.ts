/**
 * Bone Mapping Utility for Animation Retargeting
 * Maps Mixamo bone names to Echo model bone names
 */

import * as THREE from 'three';

// Mapping from Mixamo bone names to Echo model bone names
export const MIXAMO_TO_ECHO_BONE_MAP: Record<string, string> = {
  // Core bones - try multiple variations
  'mixamorigHips': 'Hips',
  'mixamorigSpine': 'Spine',
  'mixamorigSpine1': 'Spine1', 
  'mixamorigSpine2': 'Spine2',
  'mixamorigNeck': 'Neck',
  'mixamorigHead': 'Head',
  
  // Left arm
  'mixamorigLeftShoulder': 'LeftShoulder',
  'mixamorigLeftArm': 'LeftArm',
  'mixamorigLeftForeArm': 'LeftForeArm',
  'mixamorigLeftHand': 'LeftHand',
  
  // Left hand fingers
  'mixamorigLeftHandThumb1': 'LeftHandThumb1',
  'mixamorigLeftHandThumb2': 'LeftHandThumb2',
  'mixamorigLeftHandThumb3': 'LeftHandThumb3',
  'mixamorigLeftHandIndex1': 'LeftHandIndex1',
  'mixamorigLeftHandIndex2': 'LeftHandIndex2',
  'mixamorigLeftHandIndex3': 'LeftHandIndex3',
  'mixamorigLeftHandMiddle1': 'LeftHandMiddle1',
  'mixamorigLeftHandMiddle2': 'LeftHandMiddle2',
  'mixamorigLeftHandMiddle3': 'LeftHandMiddle3',
  'mixamorigLeftHandRing1': 'LeftHandRing1',
  'mixamorigLeftHandRing2': 'LeftHandRing2',
  'mixamorigLeftHandRing3': 'LeftHandRing3',
  'mixamorigLeftHandPinky1': 'LeftHandPinky1',
  'mixamorigLeftHandPinky2': 'LeftHandPinky2',
  'mixamorigLeftHandPinky3': 'LeftHandPinky3',
  
  // Right arm
  'mixamorigRightShoulder': 'RightShoulder',
  'mixamorigRightArm': 'RightArm',
  'mixamorigRightForeArm': 'RightForeArm',
  'mixamorigRightHand': 'RightHand',
  
  // Right hand fingers
  'mixamorigRightHandThumb1': 'RightHandThumb1',
  'mixamorigRightHandThumb2': 'RightHandThumb2',
  'mixamorigRightHandThumb3': 'RightHandThumb3',
  'mixamorigRightHandIndex1': 'RightHandIndex1',
  'mixamorigRightHandIndex2': 'RightHandIndex2',
  'mixamorigRightHandIndex3': 'RightHandIndex3',
  'mixamorigRightHandMiddle1': 'RightHandMiddle1',
  'mixamorigRightHandMiddle2': 'RightHandMiddle2',
  'mixamorigRightHandMiddle3': 'RightHandMiddle3',
  'mixamorigRightHandRing1': 'RightHandRing1',
  'mixamorigRightHandRing2': 'RightHandRing2',
  'mixamorigRightHandRing3': 'RightHandRing3',
  'mixamorigRightHandPinky1': 'RightHandPinky1',
  'mixamorigRightHandPinky2': 'RightHandPinky2',
  'mixamorigRightHandPinky3': 'RightHandPinky3',
  
  // Left leg
  'mixamorigLeftUpLeg': 'LeftUpLeg',
  'mixamorigLeftLeg': 'LeftLeg',
  'mixamorigLeftFoot': 'LeftFoot',
  'mixamorigLeftToeBase': 'LeftToeBase',
  
  // Right leg
  'mixamorigRightUpLeg': 'RightUpLeg',
  'mixamorigRightLeg': 'RightLeg',
  'mixamorigRightFoot': 'RightFoot',
  'mixamorigRightToeBase': 'RightToeBase',
};

// Alternative bone names to check if the primary mapping fails
export const ALTERNATIVE_BONE_NAMES: Record<string, string[]> = {
  'Hips': ['Hip', 'pelvis', 'root', 'Pelvis', 'hips', 'ROOT', 'Root', 'mixamorigHips'],
  'Spine': ['spine', 'spine_01', 'spine01', 'Spine_01', 'SPINE', 'chest', 'mixamorigSpine'],
  'Spine1': ['spine1', 'spine_02', 'spine02', 'Spine_02', 'chest', 'torso', 'mixamorigSpine1'],
  'Spine2': ['spine2', 'spine_03', 'spine03', 'Spine_03', 'upper_chest', 'mixamorigSpine2'],
  'Neck': ['neck', 'neck_01', 'NECK', 'Neck_01', 'mixamorigNeck'],
  'Head': ['head', 'head_01', 'HEAD', 'Head_01', 'mixamorigHead'],
  
  // Arms
  'LeftShoulder': ['left_shoulder', 'l_shoulder', 'shoulder_l', 'LeftClavicle', 'Left_Shoulder', 'mixamorigLeftShoulder'],
  'LeftArm': ['left_arm', 'l_arm', 'arm_l', 'LeftUpperArm', 'Left_Arm', 'upperarm_l', 'mixamorigLeftArm'],
  'LeftForeArm': ['left_forearm', 'l_forearm', 'forearm_l', 'LeftLowerArm', 'Left_ForeArm', 'lowerarm_l', 'mixamorigLeftForeArm'],
  'LeftHand': ['left_hand', 'l_hand', 'hand_l', 'Left_Hand', 'mixamorigLeftHand'],
  
  'RightShoulder': ['right_shoulder', 'r_shoulder', 'shoulder_r', 'RightClavicle', 'Right_Shoulder', 'mixamorigRightShoulder'],
  'RightArm': ['right_arm', 'r_arm', 'arm_r', 'RightUpperArm', 'Right_Arm', 'upperarm_r', 'mixamorigRightArm'],
  'RightForeArm': ['right_forearm', 'r_forearm', 'forearm_r', 'RightLowerArm', 'Right_ForeArm', 'lowerarm_r', 'mixamorigRightForeArm'],
  'RightHand': ['right_hand', 'r_hand', 'hand_r', 'Right_Hand', 'mixamorigRightHand'],
  
  // Legs
  'LeftUpLeg': ['left_upleg', 'l_upleg', 'upleg_l', 'LeftThigh', 'Left_UpLeg', 'thigh_l', 'mixamorigLeftUpLeg'],
  'LeftLeg': ['left_leg', 'l_leg', 'leg_l', 'LeftShin', 'Left_Leg', 'shin_l', 'calf_l', 'mixamorigLeftLeg'],
  'LeftFoot': ['left_foot', 'l_foot', 'foot_l', 'Left_Foot', 'mixamorigLeftFoot'],
  'LeftToeBase': ['left_toe', 'l_toe', 'toe_l', 'Left_Toe', 'LeftToe', 'mixamorigLeftToeBase'],
  
  'RightUpLeg': ['right_upleg', 'r_upleg', 'upleg_r', 'RightThigh', 'Right_UpLeg', 'thigh_r', 'mixamorigRightUpLeg'],
  'RightLeg': ['right_leg', 'r_leg', 'leg_r', 'RightShin', 'Right_Leg', 'shin_r', 'calf_r', 'mixamorigRightLeg'],
  'RightFoot': ['right_foot', 'r_foot', 'foot_r', 'Right_Foot', 'mixamorigRightFoot'],
  'RightToeBase': ['right_toe', 'r_toe', 'toe_r', 'Right_Toe', 'RightToe', 'mixamorigRightToeBase'],
};

// Cache for discovered bone mappings
const discoveredMappings = new Map<string, string>();

/**
 * Get the target bone name for a given Mixamo bone name
 */
export function getTargetBoneName(mixamoBoneName: string): string | null {
  // Check if we have a cached discovery
  if (discoveredMappings.has(mixamoBoneName)) {
    return discoveredMappings.get(mixamoBoneName) || null;
  }
  
  return MIXAMO_TO_ECHO_BONE_MAP[mixamoBoneName] || null;
}

/**
 * Find a bone in the model, checking multiple possible names
 */
export function findBoneInModel(targetBoneName: string, model: THREE.Object3D): THREE.Object3D | null {
  // First try the exact name
  let bone = model.getObjectByName(targetBoneName);
  if (bone) return bone;
  
  // Try alternative names
  const alternatives = ALTERNATIVE_BONE_NAMES[targetBoneName] || [];
  for (const altName of alternatives) {
    bone = model.getObjectByName(altName);
    if (bone) {
      // Cache this discovery for future use
      console.log(`📝 Discovered bone mapping: ${targetBoneName} -> ${altName}`);
      discoveredMappings.set(targetBoneName, altName);
      return bone;
    }
  }
  
  // If no alternatives found, try smart discovery with all available bones
  const allBones = getAllBoneNames(model);
  const smartMatch = smartBoneDiscovery(targetBoneName, allBones);
  if (smartMatch) {
    bone = model.getObjectByName(smartMatch);
    if (bone) {
      console.log(`🧠 Smart discovery found: ${targetBoneName} -> ${smartMatch}`);
      discoveredMappings.set(targetBoneName, smartMatch);
      return bone;
    }
  }
  
  return null;
}

/**
 * Smart bone discovery - try to find similar bone names
 */
function smartBoneDiscovery(mixamoBoneName: string, allBones: string[]): string | null {
  // Check if we have a cached discovery
  if (discoveredMappings.has(mixamoBoneName)) {
    return discoveredMappings.get(mixamoBoneName) || null;
  }

  // Remove mixamorig prefix and try to find similar names
  const cleanName = mixamoBoneName.replace('mixamorig', '');
  
  // First, try to find bones with the same mixamorig prefix but with numeric suffixes
  for (const boneName of allBones) {
    // Check if this bone starts with the mixamoBoneName and has numeric suffix
    if (boneName.startsWith(mixamoBoneName + '_') || boneName.startsWith(mixamoBoneName + '_0')) {
      console.log(`🎯 Found bone with suffix: ${mixamoBoneName} -> ${boneName}`);
      discoveredMappings.set(mixamoBoneName, boneName);
      return boneName;
    }
  }
  
  // Try exact match without prefix
  if (allBones.includes(cleanName)) {
    discoveredMappings.set(mixamoBoneName, cleanName);
    return cleanName;
  }
  
  // Try case variations
  const lowerCleanName = cleanName.toLowerCase();
  const upperCleanName = cleanName.toUpperCase();
  
  for (const boneName of allBones) {
    if (boneName.toLowerCase() === lowerCleanName || boneName.toUpperCase() === upperCleanName) {
      discoveredMappings.set(mixamoBoneName, boneName);
      return boneName;
    }
  }
  
  // Try partial matches (now more flexible with numeric suffixes)
  for (const boneName of allBones) {
    // Remove numeric suffixes for comparison
    const cleanBoneName = boneName.replace(/_\d+$/, '').replace(/_0\d+$/, '');
    const cleanMixamoBoneName = mixamoBoneName.replace(/_\d+$/, '').replace(/_0\d+$/, '');
    
    if (cleanBoneName.toLowerCase().includes(cleanMixamoBoneName.toLowerCase()) ||
        cleanMixamoBoneName.toLowerCase().includes(cleanBoneName.toLowerCase())) {
      console.log(`🔍 Partial match found: ${mixamoBoneName} -> ${boneName}`);
      discoveredMappings.set(mixamoBoneName, boneName);
      return boneName;
    }
  }
  
  return null;
}

/**
 * Retarget animation from source to target model
 */
export function retargetAnimation(animation: THREE.AnimationClip, targetModel: THREE.Object3D): THREE.AnimationClip {
  console.log(`🎯 Retargeting animation: ${animation.name}`);
  
  const retargetedTracks: THREE.KeyframeTrack[] = [];
  const targetBoneNames = getAllBoneNames(targetModel);
  
  console.log(`🎯 Target model has ${targetBoneNames.length} bones:`, targetBoneNames.slice(0, 10), '...');
  
  for (const track of animation.tracks) {
    const trackName = track.name;
    const [boneName, property] = trackName.split('.');
    
    if (!boneName || !property) {
      console.warn(`⚠️ Invalid track name: ${trackName}`);
      continue;
    }
    
    // Get target bone name
    const targetBoneName = getTargetBoneName(boneName);
    if (!targetBoneName) {
      console.warn(`⚠️ No mapping found for bone: ${boneName}`);
      continue;
    }
    
    // Check if target bone exists in model
    const targetBone = findBoneInModel(targetBoneName, targetModel);
    if (!targetBone) {
      console.warn(`⚠️ Target bone not found: ${targetBoneName} (from ${boneName})`);
      continue;
    }
    
    // Create new track with target bone name
    const newTrackName = `${targetBone.name}.${property}`;
    let newTrack: THREE.KeyframeTrack;
    
    try {
      if (property === 'position') {
        newTrack = new THREE.VectorKeyframeTrack(newTrackName, track.times, track.values);
      } else if (property === 'quaternion') {
        newTrack = new THREE.QuaternionKeyframeTrack(newTrackName, track.times, track.values);
      } else if (property === 'scale') {
        newTrack = new THREE.VectorKeyframeTrack(newTrackName, track.times, track.values);
      } else {
        newTrack = new THREE.NumberKeyframeTrack(newTrackName, track.times, track.values);
      }
      
      retargetedTracks.push(newTrack);
      console.log(`✅ Retargeted track: ${trackName} -> ${newTrackName}`);
    } catch (error) {
      console.error(`❌ Failed to create track for ${newTrackName}:`, error);
    }
  }
  
  if (retargetedTracks.length === 0) {
    console.warn(`⚠️ No tracks could be retargeted for animation: ${animation.name}`);
    return animation; // Return original if no tracks could be retargeted
  }
  
  const retargetedClip = new THREE.AnimationClip(
    animation.name,
    animation.duration,
    retargetedTracks
  );
  
  console.log(`🎯 Successfully retargeted ${retargetedTracks.length}/${animation.tracks.length} tracks`);
  return retargetedClip;
}

/**
 * Get all bone names from a model
 */
export function getAllBoneNames(model: THREE.Object3D): string[] {
  const boneNames: string[] = [];
  
  function traverseBones(object: THREE.Object3D) {
    if (object.name) {
      boneNames.push(object.name);
    }
    for (const child of object.children) {
      traverseBones(child);
    }
  }
  
  traverseBones(model);
  return boneNames;
}

/**
 * Analyze and log the bone structure of a model
 */
export function analyzeBoneStructure(model: THREE.Object3D): void {
  console.log('🔍 Analyzing bone structure...');
  
  const boneNames = getAllBoneNames(model);
  console.log(`📊 Model has ${boneNames.length} bones`);
  
  // Log bones that might be relevant for animation
  const relevantBones = boneNames.filter(name => 
    name.toLowerCase().includes('spine') ||
    name.toLowerCase().includes('hip') ||
    name.toLowerCase().includes('arm') ||
    name.toLowerCase().includes('leg') ||
    name.toLowerCase().includes('hand') ||
    name.toLowerCase().includes('foot') ||
    name.toLowerCase().includes('head') ||
    name.toLowerCase().includes('neck')
  );
  
  console.log('🎯 Relevant bones found:', relevantBones);
  
  // Log bones that start with common prefixes
  const mixamoBones = boneNames.filter(name => name.startsWith('mixamorig'));
  if (mixamoBones.length > 0) {
    console.log('🎭 Mixamo bones found:', mixamoBones);
  }
  
  const spineBones = boneNames.filter(name => name.toLowerCase().includes('spine'));
  if (spineBones.length > 0) {
    console.log('🦴 Spine bones found:', spineBones);
  }
  
  // Log all bones for debugging
  console.log('📋 All available bones:', boneNames);
} 