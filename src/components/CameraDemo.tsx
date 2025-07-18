import {
    BarChart3,
    Brain,
    Cloud,
    Eye,
    Info,
    Monitor,
    Settings,
    Smile,
    Users,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import CameraControls from './Camera/CameraControls';

interface DemoState {
  currentEmotion: string;
  faceCount: number;
  emotionHistory: Array<{ emotion: string; timestamp: number; confidence: number }>;
  sceneAnalysis: any;
  isRecording: boolean;
}

const CameraDemo: React.FC = () => {
  const [demoState, setDemoState] = useState<DemoState>({
    currentEmotion: '',
    faceCount: 0,
    emotionHistory: [],
    sceneAnalysis: null,
    isRecording: false
  });

  const [showStats, setShowStats] = useState(false);

  const handleEmotionChange = (emotion: string) => {
    setDemoState(prev => ({
      ...prev,
      currentEmotion: emotion,
      emotionHistory: [
        ...prev.emotionHistory.slice(-9), // Keep last 10 entries
        {
          emotion,
          timestamp: Date.now(),
          confidence: Math.random() * 0.3 + 0.7 // Mock confidence
        }
      ]
    }));
  };

  const handleFaceCountChange = (count: number) => {
    setDemoState(prev => ({
      ...prev,
      faceCount: count
    }));
  };

  const handleSceneAnalysis = (scene: any) => {
    setDemoState(prev => ({
      ...prev,
      sceneAnalysis: scene
    }));
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happy: '#4ade80',
      sad: '#3b82f6',
      angry: '#ef4444',
      surprised: '#f59e0b',
      fearful: '#8b5cf6',
      disgusted: '#10b981',
      neutral: '#6b7280'
    };
    return colors[emotion] || '#6b7280';
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      fearful: '😨',
      disgusted: '🤢',
      neutral: '😐'
    };
    return emojis[emotion] || '😐';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            🎥 Advanced Camera & AI Vision Demo
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Experience real-time face detection, emotion analysis, and scene understanding 
            powered by multiple AI backends including face-api.js, MediaPipe, and Google Cloud Vision.
          </p>
        </div>

        {/* Camera Controls */}
        <div className="flex justify-center">
          <CameraControls
            onEmotionChange={handleEmotionChange}
            onFaceCountChange={handleFaceCountChange}
            onSceneAnalysis={handleSceneAnalysis}
            className="mb-6"
          />
        </div>

        {/* Real-time Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Face Count Card */}
          <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-cyan-400/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-white">Faces Detected</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {demoState.faceCount}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {demoState.faceCount === 0 ? 'No faces detected' : 
               demoState.faceCount === 1 ? 'Single person' : 
               'Multiple people'}
            </p>
          </div>

          {/* Current Emotion Card */}
          <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-cyan-400/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-white">Current Emotion</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getEmotionEmoji(demoState.currentEmotion)}</span>
              <div>
                <div 
                  className="text-lg font-bold capitalize"
                  style={{ color: getEmotionColor(demoState.currentEmotion) }}
                >
                  {demoState.currentEmotion || 'None'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Processing Card */}
          <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-cyan-400/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-white">AI Processing</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-300">face-api.js</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-gray-300">MediaPipe Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-gray-300">Google Vision</span>
              </div>
            </div>
          </div>

          {/* Statistics Toggle */}
          <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-cyan-400/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-white">Analytics</span>
              </div>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm"
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
          </div>
        </div>

        {/* Detailed Analytics */}
        {showStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emotion History */}
            <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-cyan-400/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Smile className="w-5 h-5 text-blue-400" />
                Emotion Timeline
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {demoState.emotionHistory.length === 0 ? (
                  <p className="text-gray-400 text-sm">No emotion data yet</p>
                ) : (
                  demoState.emotionHistory.slice().reverse().map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-800/50">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getEmotionEmoji(entry.emotion)}</span>
                        <span 
                          className="capitalize font-medium"
                          style={{ color: getEmotionColor(entry.emotion) }}
                        >
                          {entry.emotion}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">
                          {Math.round(entry.confidence * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-cyan-400/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-400" />
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-gray-800/50">
                  <span className="text-sm text-gray-300">Camera Status</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400">Active</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded bg-gray-800/50">
                  <span className="text-sm text-gray-300">Face Detection Models</span>
                  <span className="text-xs text-cyan-400">Loaded</span>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded bg-gray-800/50">
                  <span className="text-sm text-gray-300">Processing Mode</span>
                  <span className="text-xs text-blue-400">Real-time</span>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded bg-gray-800/50">
                  <span className="text-sm text-gray-300">Frame Rate</span>
                  <span className="text-xs text-purple-400">~5 FPS</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Information */}
        <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-cyan-400/30 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-400" />
            Features & Capabilities
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-cyan-400 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Face Detection
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Real-time face detection</li>
                <li>• Multiple face tracking</li>
                <li>• Facial landmark points</li>
                <li>• Confidence scoring</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-blue-400 flex items-center gap-2">
                <Smile className="w-4 h-4" />
                Emotion Analysis
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 7 emotion categories</li>
                <li>• Real-time emotion tracking</li>
                <li>• Confidence percentages</li>
                <li>• Emotion history timeline</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-green-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Demographics
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Age estimation</li>
                <li>• Gender classification</li>
                <li>• Multiple person analysis</li>
                <li>• Demographic statistics</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-orange-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                MediaPipe Integration
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Face mesh (468 landmarks)</li>
                <li>• Pose estimation</li>
                <li>• Hand tracking</li>
                <li>• Holistic analysis</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-blue-400 flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Google Cloud Vision
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Cloud-based detection</li>
                <li>• Enhanced accuracy</li>
                <li>• Scene understanding</li>
                <li>• Text recognition</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-purple-400 flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Camera Features
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Photo capture</li>
                <li>• Video recording</li>
                <li>• Overlay controls</li>
                <li>• Position adjustment</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">🚀 Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <p className="mb-2"><strong>1. Enable Camera:</strong> Click "Start Camera" to begin</p>
              <p className="mb-2"><strong>2. Configure Settings:</strong> Use the settings icon to customize features</p>
              <p className="mb-2"><strong>3. View Analytics:</strong> Toggle "Show Stats" to see detailed information</p>
            </div>
            <div>
              <p className="mb-2"><strong>4. Position Camera:</strong> Choose camera position in settings</p>
              <p className="mb-2"><strong>5. Try Different Expressions:</strong> Watch real-time emotion detection</p>
              <p className="mb-2"><strong>6. Multiple People:</strong> Test with multiple faces in view</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraDemo; 