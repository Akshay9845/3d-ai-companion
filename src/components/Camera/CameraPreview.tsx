import { Maximize2, Minimize2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface CameraPreviewProps {
  isActive: boolean;
  onClose: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ 
  isActive, 
  onClose, 
  position = 'top-right' 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
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
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

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

  if (!isActive) return null;

  return (
    <div
      className={`${getPositionClasses()} transition-all duration-300 ease-in-out`}
      style={{
        width: isExpanded ? '400px' : '200px',
        height: isExpanded ? '300px' : '150px'
      }}
    >
      {/* Camera Preview Container */}
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-black/80 backdrop-blur-lg border border-cyan-400/30 shadow-xl">
        
        {/* Neon Border Effect */}
        <div
          className="absolute -inset-1 rounded-lg pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, rgba(0, 255, 247, 0.3), rgba(0, 255, 247, 0.1))',
            filter: 'blur(1px)'
          }}
        />
        
        {/* Control Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 z-[10001]">
          <button
            onClick={toggleExpanded}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? (
              <Minimize2 className="w-3 h-3 text-white/80" />
            ) : (
              <Maximize2 className="w-3 h-3 text-white/80" />
            )}
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-black/50 hover:bg-red-500/50 transition-colors"
            title="Close Camera"
          >
            <X className="w-3 h-3 text-white/80" />
          </button>
        </div>

        {/* Camera Status Indicator */}
        <div className="absolute top-2 left-2 z-[10001]">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/80 font-medium">LIVE</span>
          </div>
        </div>

        {/* Video Element */}
        {error ? (
          <div className="flex items-center justify-center w-full h-full text-red-400 text-sm text-center p-4">
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Vision Processing Indicator */}
        <div className="absolute bottom-2 left-2 right-2 z-[10001]">
          <div className="flex items-center justify-center px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-xs text-cyan-400 font-medium">Vision Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPreview;
