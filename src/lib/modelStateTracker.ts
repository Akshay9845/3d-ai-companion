/**
 * Model State Tracker - Prevents T-pose and manages live model state
 * Tracks bone positions, morph targets, and animation states in real-time
 */

import { AnimationAction, AnimationMixer, Bone, Object3D, SkinnedMesh } from 'three';

export interface BoneState {
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
}

export interface MorphTargetState {
  name: string;
  value: number;
}

export interface ModelPose {
  name: string;
  confidence: number;
  bones: BoneState[];
  morphTargets: MorphTargetState[];
}

export interface AnimationState {
  currentAnimation: string | null;
  isPlaying: boolean;
  timePosition: number;
  weight: number;
  isTPose: boolean;
  lastValidPose: ModelPose | null;
}

export class ModelStateTracker {
  private model: Object3D | null = null;
  private mixer: AnimationMixer | null = null;
  private skinnedMeshes: SkinnedMesh[] = [];
  private bones: Map<string, Bone> = new Map();
  private animationState: AnimationState = {
    currentAnimation: null,
    isPlaying: false,
    timePosition: 0,
    weight: 0,
    isTPose: false,
    lastValidPose: null
  };
  
  private tPoseThreshold = 0.85; // Confidence threshold for T-pose detection
  private updateInterval: number = 16; // ~60fps monitoring
  private monitoringActive = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  // T-pose detection patterns
  private tPosePatterns = {
    // Arms extended horizontally
    leftArm: { minAngle: 80, maxAngle: 100 }, // degrees from body
    rightArm: { minAngle: 80, maxAngle: 100 },
    // Legs straight down
    leftLeg: { minAngle: -10, maxAngle: 10 },
    rightLeg: { minAngle: -10, maxAngle: 10 },
    // Spine straight
    spine: { minAngle: -5, maxAngle: 5 }
  };
  
  // Fallback animations to prevent T-pose
  private fallbackAnimations = [
    'happy-idle',
    'talking',
    'talking-2',
    'sitting-idle',
    'weight-shift'
  ];
  
  private onTPoseDetected?: () => void;
  private onAnimationChange?: (animation: string, pose: ModelPose) => void;
  private onStateUpdate?: (state: AnimationState) => void;

  constructor() {
    console.log('🦴 Model State Tracker initialized - T-pose prevention active');
  }

  /**
   * Initialize tracking for a model
   */
  public initializeTracking(model: Object3D, mixer: AnimationMixer): void {
    this.model = model;
    this.mixer = mixer;
    
    // Find all skinned meshes and bones
    this.discoverSkinnedMeshes();
    this.discoverBones();
    
    console.log(`🦴 Tracking initialized: ${this.skinnedMeshes.length} meshes, ${this.bones.size} bones`);
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Discover all skinned meshes in the model
   */
  private discoverSkinnedMeshes(): void {
    this.skinnedMeshes = [];
    
    if (!this.model) return;
    
    this.model.traverse((child) => {
      if (child instanceof SkinnedMesh) {
        this.skinnedMeshes.push(child);
        console.log(`🦴 Found skinned mesh: ${child.name}`);
      }
    });
  }

  /**
   * Discover and map all bones
   */
  private discoverBones(): void {
    this.bones.clear();
    
    this.skinnedMeshes.forEach(mesh => {
      if (mesh.skeleton) {
        mesh.skeleton.bones.forEach(bone => {
          this.bones.set(bone.name, bone);
        });
      }
    });
    
    console.log(`🦴 Mapped ${this.bones.size} bones:`, Array.from(this.bones.keys()));
  }

  /**
   * Start real-time monitoring
   */
  public startMonitoring(): void {
    if (this.monitoringActive) return;
    
    this.monitoringActive = true;
    this.intervalId = setInterval(() => {
      this.updateState();
      this.detectTPose();
      this.preventTPose();
    }, this.updateInterval);
    
    console.log('🦴 Real-time monitoring started');
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.monitoringActive = false;
    console.log('🦴 Monitoring stopped');
  }

  /**
   * Update current model state
   */
  private updateState(): void {
    if (!this.model || !this.mixer) return;
    
    // Update animation state
    const actions = this.mixer._actions;
    let currentAction: AnimationAction | null = null;
    let maxWeight = 0;
    
    actions.forEach(action => {
      if (action.isRunning() && action.getEffectiveWeight() > maxWeight) {
        maxWeight = action.getEffectiveWeight();
        currentAction = action;
      }
    });
    
    this.animationState.currentAnimation = currentAction ? currentAction.getClip().name : null;
    this.animationState.isPlaying = currentAction ? currentAction.isRunning() : false;
    this.animationState.timePosition = currentAction ? currentAction.time : 0;
    this.animationState.weight = maxWeight;
    
    // Capture current pose
    const currentPose = this.captureCurrentPose();
    if (currentPose && !this.animationState.isTPose) {
      this.animationState.lastValidPose = currentPose;
    }
    
    // Notify listeners
    this.onStateUpdate?.(this.animationState);
  }

  /**
   * Capture current model pose
   */
  private captureCurrentPose(): ModelPose | null {
    if (!this.model) return null;
    
    const bones: BoneState[] = [];
    const morphTargets: MorphTargetState[] = [];
    
    // Capture bone states
    this.bones.forEach((bone, name) => {
      bones.push({
        name,
        position: { x: bone.position.x, y: bone.position.y, z: bone.position.z },
        rotation: { x: bone.quaternion.x, y: bone.quaternion.y, z: bone.quaternion.z, w: bone.quaternion.w },
        scale: { x: bone.scale.x, y: bone.scale.y, z: bone.scale.z }
      });
    });
    
    // Capture morph target states
    this.skinnedMeshes.forEach(mesh => {
      if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
        Object.keys(mesh.morphTargetDictionary).forEach(name => {
          const index = mesh.morphTargetDictionary![name];
          morphTargets.push({
            name,
            value: mesh.morphTargetInfluences![index] || 0
          });
        });
      }
    });
    
    return {
      name: this.animationState.currentAnimation || 'unknown',
      confidence: this.calculatePoseConfidence(bones),
      bones,
      morphTargets
    };
  }

  /**
   * Calculate pose confidence based on bone positions
   */
  private calculatePoseConfidence(bones: BoneState[]): number {
    // Simple confidence calculation based on bone movement from rest position
    let totalMovement = 0;
    let boneCount = 0;
    
    bones.forEach(bone => {
      const movement = Math.sqrt(
        bone.position.x ** 2 + bone.position.y ** 2 + bone.position.z ** 2
      );
      totalMovement += movement;
      boneCount++;
    });
    
    const averageMovement = boneCount > 0 ? totalMovement / boneCount : 0;
    return Math.min(1.0, averageMovement * 10); // Normalize to 0-1
  }

  /**
   * Detect T-pose using bone analysis
   */
  private detectTPose(): void {
    if (!this.model || this.bones.size === 0) return;
    
    let tPoseScore = 0;
    let checksPerformed = 0;
    
    // Check arm positions (most reliable T-pose indicator)
    const leftShoulder = this.bones.get('LeftShoulder') || this.bones.get('mixamorigLeftShoulder');
    const rightShoulder = this.bones.get('RightShoulder') || this.bones.get('mixamorigRightShoulder');
    const leftArm = this.bones.get('LeftArm') || this.bones.get('mixamorigLeftArm');
    const rightArm = this.bones.get('RightArm') || this.bones.get('mixamorigRightArm');
    
    if (leftArm && rightArm) {
      const leftArmAngle = this.calculateArmAngle(leftArm);
      const rightArmAngle = this.calculateArmAngle(rightArm);
      
      // Check if arms are extended horizontally (T-pose characteristic)
      if (this.isInRange(leftArmAngle, this.tPosePatterns.leftArm)) {
        tPoseScore += 0.4;
      }
      if (this.isInRange(rightArmAngle, this.tPosePatterns.rightArm)) {
        tPoseScore += 0.4;
      }
      checksPerformed += 2;
    }
    
    // Check spine alignment
    const spine = this.bones.get('Spine') || this.bones.get('mixamorigSpine');
    if (spine) {
      const spineAngle = this.calculateSpineAngle(spine);
      if (this.isInRange(spineAngle, this.tPosePatterns.spine)) {
        tPoseScore += 0.2;
      }
      checksPerformed += 1;
    }
    
    // Determine if it's a T-pose
    const confidence = checksPerformed > 0 ? tPoseScore / (checksPerformed * 0.2) : 0;
    const wasTPose = this.animationState.isTPose;
    this.animationState.isTPose = confidence >= this.tPoseThreshold;
    
    // Log T-pose detection
    if (this.animationState.isTPose && !wasTPose) {
      console.warn(`🚨 T-POSE DETECTED! Confidence: ${(confidence * 100).toFixed(1)}%`);
      this.onTPoseDetected?.();
    }
  }

  /**
   * Calculate arm angle from body
   */
  private calculateArmAngle(armBone: Bone): number {
    // Calculate angle of arm relative to body (simplified)
    const rotation = armBone.rotation;
    return Math.abs(rotation.z * 180 / Math.PI);
  }

  /**
   * Calculate spine angle
   */
  private calculateSpineAngle(spineBone: Bone): number {
    const rotation = spineBone.rotation;
    return Math.abs(rotation.x * 180 / Math.PI);
  }

  /**
   * Check if value is in range
   */
  private isInRange(value: number, range: { minAngle: number; maxAngle: number }): boolean {
    return value >= range.minAngle && value <= range.maxAngle;
  }

  /**
   * Prevent T-pose by forcing appropriate animations
   */
  private preventTPose(): void {
    if (!this.animationState.isTPose) return;
    
    console.log('🚫 PREVENTING T-POSE: Forcing fallback animation');
    
    // Try to restore last valid pose first
    if (this.animationState.lastValidPose) {
      console.log('🔄 Attempting to restore last valid pose');
      this.restorePose(this.animationState.lastValidPose);
      return;
    }
    
    // Force a fallback animation
    this.forceFallbackAnimation();
  }

  /**
   * Restore a previous valid pose
   */
  private restorePose(pose: ModelPose): void {
    if (!this.model) return;
    
    // Apply bone states
    pose.bones.forEach(boneState => {
      const bone = this.bones.get(boneState.name);
      if (bone) {
        bone.position.set(boneState.position.x, boneState.position.y, boneState.position.z);
        bone.quaternion.set(boneState.rotation.x, boneState.rotation.y, boneState.rotation.z, boneState.rotation.w);
        bone.scale.set(boneState.scale.x, boneState.scale.y, boneState.scale.z);
      }
    });
    
    // Apply morph targets
    pose.morphTargets.forEach(morphState => {
      this.skinnedMeshes.forEach(mesh => {
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          const index = mesh.morphTargetDictionary[morphState.name];
          if (index !== undefined) {
            mesh.morphTargetInfluences[index] = morphState.value;
          }
        }
      });
    });
    
    console.log('✅ Pose restored successfully');
  }

  /**
   * Force a fallback animation to prevent T-pose
   */
  private forceFallbackAnimation(): void {
    // Try fallback animations in order of preference
    for (const animationName of this.fallbackAnimations) {
      if (this.tryPlayAnimation(animationName)) {
        console.log(`✅ T-pose prevented with fallback: ${animationName}`);
        return;
      }
    }
    
    console.error('❌ All fallback animations failed - T-pose may persist');
  }

  /**
   * Try to play a specific animation
   */
  private tryPlayAnimation(animationName: string): boolean {
    if (!this.mixer) return false;
    
    try {
      // Use global playEchoAnimation if available
      if ((window as any).playEchoAnimation) {
        (window as any).playEchoAnimation(animationName, 0.3); // Quick blend
        return true;
      }
      
      // Fallback to direct mixer control
      const action = this.mixer.clipAction(animationName);
      if (action) {
        action.reset();
        action.setEffectiveWeight(1.0);
        action.play();
        return true;
      }
    } catch (error) {
      console.warn(`Failed to play fallback animation ${animationName}:`, error);
    }
    
    return false;
  }

  /**
   * Get current animation state
   */
  public getAnimationState(): AnimationState {
    return { ...this.animationState };
  }

  /**
   * Get current pose
   */
  public getCurrentPose(): ModelPose | null {
    return this.captureCurrentPose();
  }

  /**
   * Check if model is in T-pose
   */
  public isTPose(): boolean {
    return this.animationState.isTPose;
  }

  /**
   * Get bone information
   */
  public getBoneInfo(): { name: string; position: any; rotation: any }[] {
    const info: { name: string; position: any; rotation: any }[] = [];
    
    this.bones.forEach((bone, name) => {
      info.push({
        name,
        position: { x: bone.position.x, y: bone.position.y, z: bone.position.z },
        rotation: { x: bone.rotation.x, y: bone.rotation.y, z: bone.rotation.z }
      });
    });
    
    return info;
  }

  /**
   * Set event callbacks
   */
  public setCallbacks(callbacks: {
    onTPoseDetected?: () => void;
    onAnimationChange?: (animation: string, pose: ModelPose) => void;
    onStateUpdate?: (state: AnimationState) => void;
  }): void {
    this.onTPoseDetected = callbacks.onTPoseDetected;
    this.onAnimationChange = callbacks.onAnimationChange;
    this.onStateUpdate = callbacks.onStateUpdate;
  }

  /**
   * Force immediate T-pose check and prevention
   */
  public forceTPoseCheck(): void {
    this.updateState();
    this.detectTPose();
    this.preventTPose();
  }

  /**
   * Emergency T-pose prevention (call this when T-pose is visually detected)
   */
  public emergencyTPosePrevention(): void {
    console.log('🚨 EMERGENCY T-POSE PREVENTION ACTIVATED');
    this.animationState.isTPose = true;
    this.forceFallbackAnimation();
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopMonitoring();
    this.bones.clear();
    this.skinnedMeshes = [];
    this.model = null;
    this.mixer = null;
    console.log('🦴 Model State Tracker cleaned up');
  }
}

// Export singleton instance
export const modelStateTracker = new ModelStateTracker(); 