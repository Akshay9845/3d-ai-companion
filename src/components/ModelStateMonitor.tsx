/**
 * Model State Monitor - Real-time display of model state and T-pose prevention controls
 */

import { useEffect, useState } from 'react';
import { modelStateTracker } from '../lib/modelStateTracker';

interface ModelStateMonitorProps {
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export function ModelStateMonitor({ isVisible = false, onToggleVisibility }: ModelStateMonitorProps) {
  const [animationState, setAnimationState] = useState<any>(null);
  const [modelPose, setModelPose] = useState<any>(null);
  const [boneInfo, setBoneInfo] = useState<any[]>([]);
  const [isTPose, setIsTPose] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!isVisible) return;

    const updateInterval = setInterval(() => {
      // Get state from global functions
      if ((window as any).getEchoAnimationState) {
        const state = (window as any).getEchoAnimationState();
        setAnimationState(state);
        setIsTPose(state.isTPose || false);
        setBoneInfo(state.boneInfo || []);
      }

      // Get current pose from tracker
      const pose = modelStateTracker.getCurrentPose();
      setModelPose(pose);
      
      setLastUpdate(new Date());
    }, 100); // Update every 100ms for real-time monitoring

    return () => clearInterval(updateInterval);
  }, [isVisible]);

  const handleEmergencyTPosePrevention = () => {
    if ((window as any).emergencyTPosePrevention) {
      (window as any).emergencyTPosePrevention();
    }
  };

  const handleForceIdle = () => {
    if ((window as any).forceEchoBaseIdle) {
      (window as any).forceEchoBaseIdle();
    }
  };

  const handlePlayAnimation = (animationName: string) => {
    if ((window as any).playEchoAnimation) {
      (window as any).playEchoAnimation(animationName, 0.5);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
      >
        🦴 Model State
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg max-w-md max-h-96 overflow-y-auto text-xs font-mono">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold">🦴 Model State Monitor</h3>
        <button
          onClick={onToggleVisibility}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* T-Pose Status */}
      <div className={`p-2 rounded mb-3 ${isTPose ? 'bg-red-900 border border-red-500' : 'bg-green-900 border border-green-500'}`}>
        <div className="flex items-center justify-between">
          <span className="font-bold">
            {isTPose ? '🚨 T-POSE DETECTED!' : '✅ Normal Pose'}
          </span>
          {isTPose && (
            <button
              onClick={handleEmergencyTPosePrevention}
              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
            >
              FIX NOW
            </button>
          )}
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="mb-3 p-2 bg-gray-800 rounded">
        <div className="text-xs text-gray-300 mb-2">Emergency Controls:</div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleForceIdle}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            Force Idle
          </button>
          <button
            onClick={() => handlePlayAnimation('talking')}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
          >
            Force Talk
          </button>
          <button
            onClick={() => handlePlayAnimation('happy')}
            className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs"
          >
            Force Happy
          </button>
        </div>
      </div>

      {/* Animation State */}
      <div className="mb-3">
        <div className="text-xs text-gray-300 mb-1">Current Animation:</div>
        <div className="bg-gray-800 p-2 rounded">
          <div>Name: <span className="text-blue-300">{animationState?.current || 'None'}</span></div>
          <div>Playing: <span className={animationState?.isPlaying ? 'text-green-300' : 'text-red-300'}>{animationState?.isPlaying ? 'Yes' : 'No'}</span></div>
          <div>Active Actions: <span className="text-yellow-300">{animationState?.activeAnimations?.length || 0}</span></div>
          <div>Model Visible: <span className={animationState?.modelVisible ? 'text-green-300' : 'text-red-300'}>{animationState?.modelVisible ? 'Yes' : 'No'}</span></div>
        </div>
      </div>

      {/* Pose Information */}
      {modelPose && (
        <div className="mb-3">
          <div className="text-xs text-gray-300 mb-1">Current Pose:</div>
          <div className="bg-gray-800 p-2 rounded">
            <div>Name: <span className="text-purple-300">{modelPose.name}</span></div>
            <div>Confidence: <span className="text-orange-300">{(modelPose.confidence * 100).toFixed(1)}%</span></div>
            <div>Bones: <span className="text-cyan-300">{modelPose.bones?.length || 0}</span></div>
            <div>Morph Targets: <span className="text-pink-300">{modelPose.morphTargets?.length || 0}</span></div>
          </div>
        </div>
      )}

      {/* Key Bone Positions */}
      {boneInfo && boneInfo.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-300 mb-1">Key Bones (First 5):</div>
          <div className="bg-gray-800 p-2 rounded max-h-24 overflow-y-auto">
            {boneInfo.map((bone, index) => (
              <div key={index} className="text-xs mb-1">
                <span className="text-blue-300">{bone.name}:</span>
                <span className="text-gray-400 ml-1">
                  P({bone.position?.x?.toFixed(2)}, {bone.position?.y?.toFixed(2)}, {bone.position?.z?.toFixed(2)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
        <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>
        <div>Tracker Active: <span className="text-green-300">Yes</span></div>
        <div>Monitor Rate: <span className="text-blue-300">10 FPS</span></div>
      </div>
    </div>
  );
}

export default ModelStateMonitor; 