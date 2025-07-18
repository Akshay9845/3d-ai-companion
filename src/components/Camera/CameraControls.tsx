import {
    AlertCircle,
    Brain,
    Camera,
    CameraOff,
    CheckCircle,
    Cloud,
    Eye,
    Loader,
    Monitor,
    Settings,
    X,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import EnhancedCameraPreview from './EnhancedCameraPreview';

export interface CameraControlsProps {
  onEmotionChange?: (emotion: string) => void;
  onFaceCountChange?: (count: number) => void;
  onSceneAnalysis?: (scene: any) => void;
  className?: string;
}

export interface CameraSettings {
  enableFaceDetection: boolean;
  enableEmotions: boolean;
  enableAgeGender: boolean;
  enableMediaPipe: boolean;
  enableGoogleVision: boolean;
  enableSceneAnalysis: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  googleVisionApiKey: string;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  onEmotionChange,
  onFaceCountChange,
  onSceneAnalysis,
  className = ''
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [faceCount, setFaceCount] = useState(0);
  const [settings, setSettings] = useState<CameraSettings>({
    enableFaceDetection: true,
    enableEmotions: true,
    enableAgeGender: true,
    enableMediaPipe: false,
    enableGoogleVision: false,
    enableSceneAnalysis: false,
    position: 'top-right',
    googleVisionApiKey: ''
  });

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('cameraSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse camera settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('cameraSettings', JSON.stringify(settings));
  }, [settings]);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (error) {
      setHasPermission(false);
      console.error('Camera permission denied:', error);
    }
  };

  const toggleCamera = async () => {
    if (!hasPermission) {
      await checkCameraPermission();
      if (!hasPermission) return;
    }

    setIsCameraActive(!isCameraActive);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const updateSetting = <K extends keyof CameraSettings>(
    key: K, 
    value: CameraSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleEmotionChange = (emotion: string) => {
    setCurrentEmotion(emotion);
    if (onEmotionChange) {
      onEmotionChange(emotion);
    }
  };

  const handleFaceCountChange = (count: number) => {
    setFaceCount(count);
    if (onFaceCountChange) {
      onFaceCountChange(count);
    }
  };

  const getStatusColor = () => {
    if (hasPermission === null) return 'text-yellow-400';
    if (!hasPermission) return 'text-red-400';
    return isCameraActive ? 'text-green-400' : 'text-gray-400';
  };

  const getStatusIcon = () => {
    if (hasPermission === null) return <Loader className="w-4 h-4 animate-spin" />;
    if (!hasPermission) return <AlertCircle className="w-4 h-4" />;
    return isCameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Camera Control Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleCamera}
          disabled={hasPermission === false}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${hasPermission === false 
              ? 'bg-red-500/20 text-red-400 cursor-not-allowed' 
              : isCameraActive 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }
            border border-current/30 backdrop-blur-sm
          `}
          title={
            hasPermission === false 
              ? 'Camera permission required' 
              : isCameraActive 
                ? 'Stop camera' 
                : 'Start camera'
          }
        >
          {getStatusIcon()}
          <span className="text-sm">
            {hasPermission === null ? 'Checking...' : 
             hasPermission === false ? 'No Permission' :
             isCameraActive ? 'Camera Active' : 'Start Camera'}
          </span>
        </button>

        {/* Settings Button */}
        <button
          onClick={toggleSettings}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
            ${showSettings 
              ? 'bg-cyan-500/30 text-cyan-400' 
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }
            border border-current/30 backdrop-blur-sm
          `}
          title="Camera Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Status Indicators */}
      {isCameraActive && (
        <div className="flex items-center gap-2 mt-2">
          {settings.enableFaceDetection && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-xs">
              <Brain className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400">AI Vision</span>
            </div>
          )}
          
          {faceCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-xs">
              <Eye className="w-3 h-3 text-green-400" />
              <span className="text-green-400">{faceCount} face{faceCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          {currentEmotion && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-xs">
              <span className="text-blue-400">😊 {currentEmotion}</span>
            </div>
          )}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-black/95 backdrop-blur-lg rounded-lg border border-cyan-400/30 p-4 z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Camera Settings</h3>
            <button
              onClick={toggleSettings}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Permission Status */}
          <div className="mb-4 p-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              {hasPermission ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm font-medium text-white">
                Camera {hasPermission ? 'Permission Granted' : 'Permission Required'}
              </span>
            </div>
            {!hasPermission && (
              <button
                onClick={checkCameraPermission}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Request Permission
              </button>
            )}
          </div>

          {/* Camera Position */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-2">
              Camera Position
            </label>
            <select
              value={settings.position}
              onChange={(e) => updateSetting('position', e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-white">Face Detection</span>
              </div>
              <ToggleSwitch
                enabled={settings.enableFaceDetection}
                onChange={(enabled) => updateSetting('enableFaceDetection', enabled)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white ml-6">Emotions</span>
              </div>
              <ToggleSwitch
                enabled={settings.enableEmotions}
                onChange={(enabled) => updateSetting('enableEmotions', enabled)}
                disabled={!settings.enableFaceDetection}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white ml-6">Age & Gender</span>
              </div>
              <ToggleSwitch
                enabled={settings.enableAgeGender}
                onChange={(enabled) => updateSetting('enableAgeGender', enabled)}
                disabled={!settings.enableFaceDetection}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-white">MediaPipe</span>
              </div>
              <ToggleSwitch
                enabled={settings.enableMediaPipe}
                onChange={(enabled) => updateSetting('enableMediaPipe', enabled)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white">Google Vision</span>
              </div>
              <ToggleSwitch
                enabled={settings.enableGoogleVision}
                onChange={(enabled) => updateSetting('enableGoogleVision', enabled)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white">Scene Analysis</span>
              </div>
              <ToggleSwitch
                enabled={settings.enableSceneAnalysis}
                onChange={(enabled) => updateSetting('enableSceneAnalysis', enabled)}
              />
            </div>
          </div>

          {/* Google Vision API Key */}
          {settings.enableGoogleVision && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-white mb-2">
                Google Vision API Key
              </label>
              <input
                type="password"
                value={settings.googleVisionApiKey}
                onChange={(e) => updateSetting('googleVisionApiKey', e.target.value)}
                placeholder="Enter your Google Vision API key"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                Required for Google Cloud Vision features
              </p>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-200">
              💡 The camera uses local AI models for face detection and emotion analysis. 
              MediaPipe and Google Vision are optional for enhanced features.
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Camera Preview */}
      <EnhancedCameraPreview
        isActive={isCameraActive}
        onClose={() => setIsCameraActive(false)}
        position={settings.position}
        enableFaceDetection={settings.enableFaceDetection}
        enableEmotions={settings.enableEmotions}
        enableAgeGender={settings.enableAgeGender}
        enableMediaPipe={settings.enableMediaPipe}
        enableGoogleVision={settings.enableGoogleVision}
        googleVisionApiKey={settings.googleVisionApiKey}
        onEmotionChange={handleEmotionChange}
        onFaceCountChange={handleFaceCountChange}
      />
    </div>
  );
};

// Toggle Switch Component
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, disabled = false }) => {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative w-10 h-5 rounded-full transition-colors duration-200
        ${disabled 
          ? 'bg-gray-600 cursor-not-allowed' 
          : enabled 
            ? 'bg-green-500' 
            : 'bg-gray-500'
        }
      `}
    >
      <div
        className={`
          absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200
          ${enabled && !disabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
};

export default CameraControls; 