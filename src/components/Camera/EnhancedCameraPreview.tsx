import {
    Brain,
    Camera,
    CameraOff,
    CircleStop,
    Download,
    Eye,
    EyeOff,
    Maximize2,
    Minimize2,
    Settings,
    Smile,
    Users,
    Video,
    X
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFaceDetection } from '../../lib/useFaceDetection';

export interface EnhancedCameraPreviewProps {
  isActive: boolean;
  onClose: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  enableFaceDetection?: boolean;
  enableEmotions?: boolean;
  enableAgeGender?: boolean;
  enableMediaPipe?: boolean;
  enableGoogleVision?: boolean;
  googleVisionApiKey?: string;
  onEmotionChange?: (emotion: string) => void;
  onFaceCountChange?: (count: number) => void;
}

const EnhancedCameraPreview: React.FC<EnhancedCameraPreviewProps> = ({
  isActive,
  onClose,
  position = 'top-right',
  enableFaceDetection = true,
  enableEmotions = true,
  enableAgeGender = true,
  enableMediaPipe = false,
  enableGoogleVision = false,
  googleVisionApiKey,
  onEmotionChange,
  onFaceCountChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Face detection hook
  const faceDetection = useFaceDetection({
    enableEmotions,
    enableAgeGender,
    enableLandmarks: true,
    enableMediaPipe,
    useGoogleVision: enableGoogleVision,
    googleVisionApiKey,
    minConfidence: 0.6,
    processingInterval: 150,
    autoStart: false
  });

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  // Initialize face detection when camera starts
  useEffect(() => {
    if (stream && videoRef.current && enableFaceDetection) {
      faceDetection.initialize().then(() => {
        if (videoRef.current) {
          faceDetection.attachVideo(videoRef.current);
          faceDetection.startProcessing();
        }
      });
    }

    return () => {
      if (enableFaceDetection) {
        faceDetection.detachVideo();
      }
    };
  }, [stream, enableFaceDetection]);

  // Handle emotion and face count changes
  useEffect(() => {
    if (faceDetection.dominantEmotion && onEmotionChange) {
      onEmotionChange(faceDetection.dominantEmotion);
    }
  }, [faceDetection.dominantEmotion, onEmotionChange]);

  useEffect(() => {
    if (onFaceCountChange) {
      onFaceCountChange(faceDetection.faceCount);
    }
  }, [faceDetection.faceCount, onFaceCountChange]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (isRecording) {
      stopRecording();
    }

    faceDetection.detachVideo();
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleOverlays = () => {
    setShowOverlays(!showOverlays);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const startRecording = useCallback(() => {
    if (!stream) return;

    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const downloadRecording = useCallback(() => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `camera-recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    setRecordedChunks([]);
  }, [recordedChunks]);

  const capturePhoto = useCallback(() => {
    const frameData = faceDetection.captureFrame();
    if (frameData) {
      const a = document.createElement('a');
      a.href = frameData;
      a.download = `camera-photo-${Date.now()}.jpg`;
      a.click();
    }
  }, [faceDetection]);

  // Draw face detection overlays
  const drawOverlays = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || !showOverlays || !faceDetection.faces) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face detection results
    faceDetection.faces.faces.forEach((face, index) => {
      const { boundingBox, emotions, age, gender, confidence, landmarks } = face;

      // Scale coordinates to video size
      const scaleX = canvas.width / video.clientWidth;
      const scaleY = canvas.height / video.clientHeight;
      
      const x = boundingBox.x * scaleX;
      const y = boundingBox.y * scaleY;
      const width = boundingBox.width * scaleX;
      const height = boundingBox.height * scaleY;

      // Draw bounding box
      ctx.strokeStyle = '#00ffef';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw confidence
      ctx.fillStyle = 'rgba(0, 255, 239, 0.8)';
      ctx.fillRect(x, y - 20, 60, 18);
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(`${Math.round(confidence * 100)}%`, x + 2, y - 6);

      // Draw landmarks if available
      if (landmarks && landmarks.length > 0) {
        ctx.fillStyle = '#ff0080';
        landmarks.forEach(point => {
          const lx = point.x * scaleX;
          const ly = point.y * scaleY;
          ctx.beginPath();
          ctx.arc(lx, ly, 1, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Draw emotion and demographic info
      let infoY = y + height + 15;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(x, infoY - 12, 150, emotions ? 45 : 25);

      ctx.fillStyle = '#fff';
      ctx.font = '11px Arial';

      if (emotions) {
        const dominantEmotion = Object.entries(emotions).reduce((a, b) => 
          emotions[a[0]] > emotions[b[0]] ? a : b
        );
        ctx.fillText(`😊 ${dominantEmotion[0]}: ${Math.round(dominantEmotion[1] * 100)}%`, x + 2, infoY);
        infoY += 12;
      }

      if (age !== undefined) {
        ctx.fillText(`👤 Age: ${age}`, x + 2, infoY);
        infoY += 12;
      }

      if (gender) {
        const genderEmoji = gender === 'male' ? '👨' : '👩';
        ctx.fillText(`${genderEmoji} ${gender}`, x + 2, infoY);
      }
    });

    // Draw MediaPipe results if available
    if (faceDetection.mediaPipeResult?.faceMesh) {
      ctx.fillStyle = '#ff6b35';
      faceDetection.mediaPipeResult.faceMesh.forEach(point => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 0.5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [showOverlays, faceDetection.faces, faceDetection.mediaPipeResult]);

  // Update overlays when detection results change
  useEffect(() => {
    drawOverlays();
  }, [drawOverlays]);

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-[10000] pointer-events-auto';
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
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

  if (!isActive) return null;

  return (
    <div
      className={`${getPositionClasses()} transition-all duration-300 ease-in-out`}
      style={{
        width: isExpanded ? '500px' : '300px',
        height: isExpanded ? '400px' : '200px'
      }}
    >
      {/* Main Camera Container */}
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-black/90 backdrop-blur-lg border border-cyan-400/30 shadow-2xl">
        
        {/* Neon Border Effect */}
        <div
          className="absolute -inset-1 rounded-lg pointer-events-none opacity-75"
          style={{
            background: 'linear-gradient(45deg, rgba(0, 255, 247, 0.4), rgba(255, 107, 53, 0.2))',
            filter: 'blur(2px)'
          }}
        />
        
        {/* Control Panel */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-[10001]">
          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/90 font-medium">LIVE</span>
            </div>
            
            {enableFaceDetection && faceDetection.isReady && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/70">
                <Brain className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-cyan-400">AI</span>
              </div>
            )}

            {faceDetection.faceCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/70">
                <Users className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">{faceDetection.faceCount}</span>
              </div>
            )}

            {faceDetection.dominantEmotion && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/70"
                style={{ color: getEmotionColor(faceDetection.dominantEmotion) }}
              >
                <Smile className="w-3 h-3" />
                <span className="text-xs capitalize">{faceDetection.dominantEmotion}</span>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-1">
            <button
              onClick={toggleOverlays}
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                showOverlays ? 'bg-cyan-500/30 text-cyan-400' : 'bg-black/50 text-white/60'
              }`}
              title={showOverlays ? 'Hide Overlays' : 'Show Overlays'}
            >
              {showOverlays ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>

            <button
              onClick={capturePhoto}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 hover:bg-blue-500/30 transition-colors"
              title="Capture Photo"
            >
              <Camera className="w-3 h-3 text-white/80" />
            </button>

            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 hover:bg-red-500/30 transition-colors"
                title="Start Recording"
              >
                <Video className="w-3 h-3 text-white/80" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/30 text-red-400 animate-pulse"
                title="Stop Recording"
              >
                <CircleStop className="w-3 h-3" />
              </button>
            )}

            {recordedChunks.length > 0 && (
              <button
                onClick={downloadRecording}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 hover:bg-green-500/30 transition-colors"
                title="Download Recording"
              >
                <Download className="w-3 h-3 text-white/80" />
              </button>
            )}

            <button
              onClick={toggleSettings}
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                showSettings ? 'bg-cyan-500/30 text-cyan-400' : 'bg-black/50 text-white/60'
              }`}
              title="Settings"
            >
              <Settings className="w-3 h-3" />
            </button>

            <button
              onClick={toggleExpanded}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-3 h-3 text-white/80" /> : <Maximize2 className="w-3 h-3 text-white/80" />}
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 hover:bg-red-500/50 transition-colors"
              title="Close Camera"
            >
              <X className="w-3 h-3 text-white/80" />
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative w-full h-full">
          {error ? (
            <div className="flex items-center justify-center w-full h-full text-red-400 text-sm text-center p-4">
              <div className="text-center">
                <CameraOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {error}
              </div>
            </div>
          ) : (
            <>
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ transform: 'scaleX(-1)' }} // Mirror the overlay to match video
              />
            </>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-12 right-2 w-64 bg-black/90 backdrop-blur-lg rounded-lg border border-cyan-400/30 p-3 z-[10002]">
            <h3 className="text-sm font-medium text-white mb-3">Camera Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/80">Face Detection</span>
                <button
                  onClick={() => faceDetection.updateConfig({ enableEmotions: !enableEmotions })}
                  className={`w-8 h-4 rounded-full transition-colors ${
                    faceDetection.isReady ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    faceDetection.isReady ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/80">MediaPipe</span>
                <button
                  onClick={() => faceDetection.updateConfig({ enableMediaPipe: !enableMediaPipe })}
                  className={`w-8 h-4 rounded-full transition-colors ${
                    enableMediaPipe ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    enableMediaPipe ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/80">Google Vision</span>
                <button
                  onClick={() => faceDetection.updateConfig({ useGoogleVision: !enableGoogleVision })}
                  className={`w-8 h-4 rounded-full transition-colors ${
                    enableGoogleVision ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    enableGoogleVision ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Statistics */}
            {faceDetection.faces && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <h4 className="text-xs font-medium text-white/80 mb-2">Statistics</h4>
                <div className="space-y-1 text-xs text-white/60">
                  <div>Processing: {faceDetection.processingMode}</div>
                  <div>Faces: {faceDetection.faceCount}</div>
                  {faceDetection.averageAge && <div>Avg Age: {faceDetection.averageAge}</div>}
                  {faceDetection.dominantGender && <div>Gender: {faceDetection.dominantGender}</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {faceDetection.error && (
          <div className="absolute bottom-2 left-2 right-2 bg-red-500/20 border border-red-500/50 rounded px-2 py-1">
            <span className="text-xs text-red-200">{faceDetection.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCameraPreview; 