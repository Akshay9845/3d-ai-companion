import { Camera, CameraOff } from 'lucide-react';
import React from 'react';

interface CameraStatusProps {
  isActive: boolean;
  className?: string;
}

const CameraStatus: React.FC<CameraStatusProps> = ({ isActive, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {isActive ? (
        <>
          <Camera className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">Camera Active</span>
        </>
      ) : (
        <>
          <CameraOff className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500">Camera Off</span>
        </>
      )}
    </div>
  );
};

export default CameraStatus; 