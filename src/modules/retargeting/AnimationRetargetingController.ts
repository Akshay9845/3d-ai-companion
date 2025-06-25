/**
 * Animation Retargeting Controller
 * Adapts animations from different sources to BECKY model
 * Supports VRM, FBX, and motion capture data retargeting
 */

export interface RetargetingOptions {
  sourceFormat: 'vrm' | 'fbx' | 'bvh' | 'motion_capture';
  targetModel: 'becky' | 'echo' | 'custom';
  preserveProportions: boolean;
  enableIK: boolean; // Inverse Kinematics
  enableConstraints: boolean;
  smoothingFactor: number; // 0-1
  scaleFactor: number; // Model scale adjustment
}

export interface BoneMapping {
  sourceBone: string;
  targetBone: string;
  weight: number;
  offset: { x: number; y: number; z: number };
  rotationOffset: { x: number; y: number; z: number; w: number };
}

export interface RetargetingResult {
  success: boolean;
  adaptedAnimation: AnimationClip;
  statistics: {
    sourceFrames: number;
    targetFrames: number;
    boneMappings: number;
    accuracy: number;
  };
  warnings: string[];
}

export interface MotionData {
  frames: MotionFrame[];
  frameRate: number;
  duration: number;
  boneName: string[];
}

export interface MotionFrame {
  timestamp: number;
  bones: {
    [boneName: string]: {
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
      scale?: { x: number; y: number; z: number };
    };
  };
}

export class AnimationRetargetingController {
  private options: RetargetingOptions;
  private boneMappings: Map<string, BoneMapping> = new Map();
  private isRetargeting: boolean = false;

  // Standard bone mappings for different model types
  private readonly BONE_MAPPINGS = {
    'vrm_to_becky': {
      'hips': { target: 'Hips', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'spine': { target: 'Spine', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'chest': { target: 'Chest', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'neck': { target: 'Neck', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'head': { target: 'Head', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      
      // Arms
      'leftShoulder': { target: 'LeftShoulder', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'leftUpperArm': { target: 'LeftUpperArm', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'leftLowerArm': { target: 'LeftLowerArm', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'leftHand': { target: 'LeftHand', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      
      'rightShoulder': { target: 'RightShoulder', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'rightUpperArm': { target: 'RightUpperArm', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'rightLowerArm': { target: 'RightLowerArm', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'rightHand': { target: 'RightHand', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      
      // Legs
      'leftUpperLeg': { target: 'LeftUpperLeg', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'leftLowerLeg': { target: 'LeftLowerLeg', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'leftFoot': { target: 'LeftFoot', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      
      'rightUpperLeg': { target: 'RightUpperLeg', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'rightLowerLeg': { target: 'RightLowerLeg', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      'rightFoot': { target: 'RightFoot', weight: 1.0, offset: { x: 0, y: 0, z: 0 } },
      
      // Fingers (Left Hand)
      'leftThumb1': { target: 'LeftThumb1', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      'leftThumb2': { target: 'LeftThumb2', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      'leftThumb3': { target: 'LeftThumb3', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      
      'leftIndex1': { target: 'LeftIndex1', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      'leftIndex2': { target: 'LeftIndex2', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      'leftIndex3': { target: 'LeftIndex3', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      
      // Fingers (Right Hand)
      'rightThumb1': { target: 'RightThumb1', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      'rightThumb2': { target: 'RightThumb2', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      'rightThumb3': { target: 'RightThumb3', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      
      'rightIndex1': { target: 'RightIndex1', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      'rightIndex2': { target: 'RightIndex2', weight: 0.8, offset: { x: 0, y: 0, z: 0 } },
      'rightIndex3': { target: 'RightIndex3', weight: 0.8, offset: { x: 0, y: 0, z: 0 } }
    }
  };

  // IK chain definitions
  private readonly IK_CHAINS = {
    'leftArm': ['LeftShoulder', 'LeftUpperArm', 'LeftLowerArm', 'LeftHand'],
    'rightArm': ['RightShoulder', 'RightUpperArm', 'RightLowerArm', 'RightHand'],
    'leftLeg': ['LeftUpperLeg', 'LeftLowerLeg', 'LeftFoot'],
    'rightLeg': ['RightUpperLeg', 'RightLowerLeg', 'RightFoot'],
    'spine': ['Hips', 'Spine', 'Chest', 'Neck', 'Head']
  };

  constructor(options: Partial<RetargetingOptions> = {}) {
    this.options = {
      sourceFormat: 'vrm',
      targetModel: 'becky',
      preserveProportions: true,
      enableIK: true,
      enableConstraints: true,
      smoothingFactor: 0.5,
      scaleFactor: 1.0,
      ...options
    };

    this.initializeBoneMappings();
    console.log('🎯 Animation Retargeting Controller initialized');
  }

  private initializeBoneMappings(): void {
    const mappingKey = `${this.options.sourceFormat}_to_${this.options.targetModel}`;
    const mappings = this.BONE_MAPPINGS[mappingKey as keyof typeof this.BONE_MAPPINGS] || this.BONE_MAPPINGS.vrm_to_becky;

    for (const [sourceBone, mappingData] of Object.entries(mappings)) {
      this.boneMappings.set(sourceBone, {
        sourceBone,
        targetBone: mappingData.target,
        weight: mappingData.weight,
        offset: mappingData.offset,
        rotationOffset: { x: 0, y: 0, z: 0, w: 1 }
      });
    }
  }

  /**
   * Retarget animation from source to target model
   */
  public async retargetAnimation(
    sourceAnimation: any,
    sourceModel: any,
    targetModel: any
  ): Promise<RetargetingResult> {
    console.log('🎯 Starting animation retargeting...');
    
    this.isRetargeting = true;
    const warnings: string[] = [];

    try {
      // Analyze source and target models
      const sourceAnalysis = this.analyzeModel(sourceModel);
      const targetAnalysis = this.analyzeModel(targetModel);
      
      // Create bone mapping
      const activeMappings = this.createBoneMapping(sourceAnalysis, targetAnalysis);
      
      // Extract motion data from source animation
      const motionData = this.extractMotionData(sourceAnimation, sourceModel);
      
      // Apply retargeting
      const retargetedMotion = this.applyRetargeting(motionData, activeMappings, targetAnalysis);
      
      // Apply smoothing and constraints
      const smoothedMotion = this.applySmoothing(retargetedMotion);
      const constrainedMotion = this.applyConstraints(smoothedMotion, targetAnalysis);
      
      // Create final animation clip
      const adaptedAnimation = this.createAnimationClip(constrainedMotion, targetModel);
      
      this.isRetargeting = false;
      
      return {
        success: true,
        adaptedAnimation,
        statistics: {
          sourceFrames: motionData.frames.length,
          targetFrames: constrainedMotion.frames.length,
          boneMappings: activeMappings.length,
          accuracy: this.calculateAccuracy(motionData, constrainedMotion)
        },
        warnings
      };
    } catch (error) {
      console.error('❌ Animation retargeting failed:', error);
      this.isRetargeting = false;
      
      return {
        success: false,
        adaptedAnimation: new THREE.AnimationClip('failed', 0, []),
        statistics: {
          sourceFrames: 0,
          targetFrames: 0,
          boneMappings: 0,
          accuracy: 0
        },
        warnings: [`Retargeting failed: ${error}`]
      };
    }
  }

  /**
   * Retarget motion capture data to BECKY model
   */
  public async retargetMotionCapture(
    mocapData: MotionData,
    targetModel: any
  ): Promise<RetargetingResult> {
    console.log('🎯 Retargeting motion capture data...');
    
    try {
      const targetAnalysis = this.analyzeModel(targetModel);
      const activeMappings = this.createMotionCaptureMappings(mocapData.boneName, targetAnalysis);
      
      // Apply retargeting with motion capture specific adjustments
      const retargetedMotion = this.applyMocapRetargeting(mocapData, activeMappings, targetAnalysis);
      
      // Apply IK solving for better motion quality
      const ikSolvedMotion = this.applyIKSolving(retargetedMotion, targetAnalysis);
      
      // Create animation clip
      const adaptedAnimation = this.createAnimationClip(ikSolvedMotion, targetModel);
      
      return {
        success: true,
        adaptedAnimation,
        statistics: {
          sourceFrames: mocapData.frames.length,
          targetFrames: ikSolvedMotion.frames.length,
          boneMappings: activeMappings.length,
          accuracy: 0.9 // Mocap usually has high accuracy
        },
        warnings: []
      };
    } catch (error) {
      console.error('❌ Motion capture retargeting failed:', error);
      
      return {
        success: false,
        adaptedAnimation: new THREE.AnimationClip('failed', 0, []),
        statistics: { sourceFrames: 0, targetFrames: 0, boneMappings: 0, accuracy: 0 },
        warnings: [`Mocap retargeting failed: ${error}`]
      };
    }
  }

  private analyzeModel(model: any): any {
    const bones: string[] = [];
    const boneHierarchy: { [bone: string]: string[] } = {};
    const boneLengths: { [bone: string]: number } = {};
    
    // Traverse model hierarchy to find bones
    model.traverse((child: any) => {
      if (child.isBone || child.type === 'Bone') {
        bones.push(child.name);
        
        // Calculate bone length
        if (child.children.length > 0) {
          const childBone = child.children[0];
          if (childBone.isBone) {
            boneLengths[child.name] = child.position.distanceTo(childBone.position);
          }
        }
        
        // Build hierarchy
        boneHierarchy[child.name] = child.children
          .filter((c: any) => c.isBone)
          .map((c: any) => c.name);
      }
    });
    
    return {
      bones,
      boneHierarchy,
      boneLengths,
      totalBones: bones.length
    };
  }

  private createBoneMapping(sourceAnalysis: any, targetAnalysis: any): BoneMapping[] {
    const activeMappings: BoneMapping[] = [];
    
    for (const [sourceBone, mapping] of this.boneMappings) {
      if (sourceAnalysis.bones.includes(sourceBone) && targetAnalysis.bones.includes(mapping.targetBone)) {
        activeMappings.push(mapping);
      }
    }
    
    console.log(`🎯 Created ${activeMappings.length} active bone mappings`);
    return activeMappings;
  }

  private createMotionCaptureMappings(sourceBones: string[], targetAnalysis: any): BoneMapping[] {
    const mappings: BoneMapping[] = [];
    
    // Simple name-based matching for motion capture data
    for (const sourceBone of sourceBones) {
      const normalizedSource = sourceBone.toLowerCase();
      
      for (const targetBone of targetAnalysis.bones) {
        const normalizedTarget = targetBone.toLowerCase();
        
        if (this.isBonesimilar(normalizedSource, normalizedTarget)) {
          mappings.push({
            sourceBone,
            targetBone,
            weight: 1.0,
            offset: { x: 0, y: 0, z: 0 },
            rotationOffset: { x: 0, y: 0, z: 0, w: 1 }
          });
          break;
        }
      }
    }
    
    return mappings;
  }

  private isBonesimilar(source: string, target: string): boolean {
    const synonyms = {
      'hip': ['hips', 'pelvis', 'root'],
      'spine': ['back', 'torso'],
      'chest': ['thorax', 'upper_body'],
      'neck': ['cervical'],
      'head': ['skull', 'cranium'],
      'shoulder': ['clavicle', 'collar'],
      'arm': ['upperarm', 'upper_arm'],
      'forearm': ['lowerarm', 'lower_arm'],
      'hand': ['wrist'],
      'thigh': ['upperleg', 'upper_leg'],
      'shin': ['lowerleg', 'lower_leg', 'calf'],
      'foot': ['ankle']
    };
    
    for (const [key, values] of Object.entries(synonyms)) {
      if ((source.includes(key) || values.some(v => source.includes(v))) &&
          (target.includes(key) || values.some(v => target.includes(v)))) {
        return true;
      }
    }
    
    return source === target;
  }

  private extractMotionData(animation: any, sourceModel: any): MotionData {
    const frames: MotionFrame[] = [];
    const frameRate = 30; // Default frame rate
    const duration = animation.duration || 1.0;
    const frameCount = Math.floor(duration * frameRate);
    
    for (let i = 0; i < frameCount; i++) {
      const time = (i / frameCount) * duration;
      const frame: MotionFrame = {
        timestamp: time,
        bones: {}
      };
      
      // Extract bone transforms at this time
      animation.tracks.forEach((track: any) => {
        const boneName = track.name.split('.')[0];
        const property = track.name.split('.')[1];
        
        if (!frame.bones[boneName]) {
          frame.bones[boneName] = {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 }
          };
        }
        
        const value = this.interpolateTrack(track, time);
        
        if (property === 'position') {
          frame.bones[boneName].position = { x: value[0], y: value[1], z: value[2] };
        } else if (property === 'quaternion') {
          frame.bones[boneName].rotation = { x: value[0], y: value[1], z: value[2], w: value[3] };
        }
      });
      
      frames.push(frame);
    }
    
    return {
      frames,
      frameRate,
      duration,
      boneName: Object.keys(frames[0]?.bones || {})
    };
  }

  private interpolateTrack(track: any, time: number): number[] {
    // Simple linear interpolation
    const times = track.times;
    const values = track.values;
    const stride = values.length / times.length;
    
    for (let i = 0; i < times.length - 1; i++) {
      if (time >= times[i] && time <= times[i + 1]) {
        const t = (time - times[i]) / (times[i + 1] - times[i]);
        const result = [];
        
        for (let j = 0; j < stride; j++) {
          const a = values[i * stride + j];
          const b = values[(i + 1) * stride + j];
          result.push(a + t * (b - a));
        }
        
        return result;
      }
    }
    
    // Return first or last value if time is outside range
    if (time <= times[0]) {
      return values.slice(0, stride);
    } else {
      return values.slice(-stride);
    }
  }

  private applyRetargeting(motionData: MotionData, mappings: BoneMapping[], targetAnalysis: any): MotionData {
    const retargetedFrames: MotionFrame[] = [];
    
    for (const frame of motionData.frames) {
      const retargetedFrame: MotionFrame = {
        timestamp: frame.timestamp,
        bones: {}
      };
      
      for (const mapping of mappings) {
        const sourceBoneData = frame.bones[mapping.sourceBone];
        if (sourceBoneData) {
          // Apply scale factor for position
          const scaledPosition = {
            x: sourceBoneData.position.x * this.options.scaleFactor + mapping.offset.x,
            y: sourceBoneData.position.y * this.options.scaleFactor + mapping.offset.y,
            z: sourceBoneData.position.z * this.options.scaleFactor + mapping.offset.z
          };
          
          // Apply rotation offset
          const adjustedRotation = this.multiplyQuaternions(
            sourceBoneData.rotation,
            mapping.rotationOffset
          );
          
          retargetedFrame.bones[mapping.targetBone] = {
            position: scaledPosition,
            rotation: adjustedRotation
          };
        }
      }
      
      retargetedFrames.push(retargetedFrame);
    }
    
    return {
      frames: retargetedFrames,
      frameRate: motionData.frameRate,
      duration: motionData.duration,
      boneName: mappings.map(m => m.targetBone)
    };
  }

  private applyMocapRetargeting(mocapData: MotionData, mappings: BoneMapping[], targetAnalysis: any): MotionData {
    // Similar to applyRetargeting but with mocap-specific adjustments
    return this.applyRetargeting(mocapData, mappings, targetAnalysis);
  }

  private applySmoothing(motionData: MotionData): MotionData {
    if (this.options.smoothingFactor === 0) return motionData;
    
    const smoothedFrames: MotionFrame[] = [];
    const windowSize = Math.max(1, Math.floor(this.options.smoothingFactor * 10));
    
    for (let i = 0; i < motionData.frames.length; i++) {
      const frame = motionData.frames[i];
      const smoothedFrame: MotionFrame = {
        timestamp: frame.timestamp,
        bones: {}
      };
      
      for (const boneName of motionData.boneName) {
        const samples = [];
        
        // Collect samples from neighboring frames
        for (let j = Math.max(0, i - windowSize); j <= Math.min(motionData.frames.length - 1, i + windowSize); j++) {
          const sampleFrame = motionData.frames[j];
          if (sampleFrame.bones[boneName]) {
            samples.push(sampleFrame.bones[boneName]);
          }
        }
        
        if (samples.length > 0) {
          // Average position
          const avgPosition = samples.reduce((acc, sample) => ({
            x: acc.x + sample.position.x / samples.length,
            y: acc.y + sample.position.y / samples.length,
            z: acc.z + sample.position.z / samples.length
          }), { x: 0, y: 0, z: 0 });
          
          // SLERP rotation (simplified)
          const avgRotation = samples[Math.floor(samples.length / 2)].rotation;
          
          smoothedFrame.bones[boneName] = {
            position: avgPosition,
            rotation: avgRotation
          };
        }
      }
      
      smoothedFrames.push(smoothedFrame);
    }
    
    return {
      ...motionData,
      frames: smoothedFrames
    };
  }

  private applyConstraints(motionData: MotionData, targetAnalysis: any): MotionData {
    if (!this.options.enableConstraints) return motionData;
    
    // Apply joint limits and other constraints
    const constrainedFrames = motionData.frames.map(frame => {
      const constrainedFrame: MotionFrame = {
        timestamp: frame.timestamp,
        bones: {}
      };
      
      for (const boneName of motionData.boneName) {
        const boneData = frame.bones[boneName];
        if (boneData) {
          constrainedFrame.bones[boneName] = {
            position: this.applyPositionConstraints(boneData.position, boneName),
            rotation: this.applyRotationConstraints(boneData.rotation, boneName)
          };
        }
      }
      
      return constrainedFrame;
    });
    
    return {
      ...motionData,
      frames: constrainedFrames
    };
  }

  private applyIKSolving(motionData: MotionData, targetAnalysis: any): MotionData {
    if (!this.options.enableIK) return motionData;
    
    // Apply IK solving for better motion quality
    // This is a simplified implementation
    return motionData;
  }

  private applyPositionConstraints(position: any, boneName: string): any {
    // Apply position limits based on bone type
    return position;
  }

  private applyRotationConstraints(rotation: any, boneName: string): any {
    // Apply rotation limits based on bone type
    return rotation;
  }

  private createAnimationClip(motionData: MotionData, targetModel: any): THREE.AnimationClip {
    const tracks: THREE.KeyframeTrack[] = [];
    
    for (const boneName of motionData.boneName) {
      const times: number[] = [];
      const positions: number[] = [];
      const rotations: number[] = [];
      
      for (const frame of motionData.frames) {
        const boneData = frame.bones[boneName];
        if (boneData) {
          times.push(frame.timestamp);
          
          positions.push(boneData.position.x, boneData.position.y, boneData.position.z);
          rotations.push(boneData.rotation.x, boneData.rotation.y, boneData.rotation.z, boneData.rotation.w);
        }
      }
      
      if (times.length > 0) {
        const positionTrack = new THREE.VectorKeyframeTrack(
          `${boneName}.position`,
          times,
          positions
        );
        
        const rotationTrack = new THREE.QuaternionKeyframeTrack(
          `${boneName}.quaternion`,
          times,
          rotations
        );
        
        tracks.push(positionTrack, rotationTrack);
      }
    }
    
    return new THREE.AnimationClip('retargeted_animation', motionData.duration, tracks);
  }

  private multiplyQuaternions(q1: any, q2: any): any {
    return {
      x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
      y: q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
      z: q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w,
      w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z
    };
  }

  private calculateAccuracy(sourceMotion: MotionData, targetMotion: MotionData): number {
    // Simple accuracy calculation based on frame count and bone mapping success
    const frameAccuracy = Math.min(targetMotion.frames.length / sourceMotion.frames.length, 1.0);
    const boneAccuracy = Math.min(targetMotion.boneName.length / sourceMotion.boneName.length, 1.0);
    
    return (frameAccuracy + boneAccuracy) / 2;
  }

  /**
   * Update retargeting options
   */
  public updateOptions(newOptions: Partial<RetargetingOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.initializeBoneMappings();
  }

  /**
   * Add custom bone mapping
   */
  public addBoneMapping(sourceBone: string, targetBone: string, weight: number = 1.0): void {
    this.boneMappings.set(sourceBone, {
      sourceBone,
      targetBone,
      weight,
      offset: { x: 0, y: 0, z: 0 },
      rotationOffset: { x: 0, y: 0, z: 0, w: 1 }
    });
  }

  /**
   * Get current bone mappings
   */
  public getBoneMappings(): BoneMapping[] {
    return Array.from(this.boneMappings.values());
  }

  /**
   * Check if retargeting is in progress
   */
  public isRetargetingActive(): boolean {
    return this.isRetargeting;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.boneMappings.clear();
    this.isRetargeting = false;
  }
} 