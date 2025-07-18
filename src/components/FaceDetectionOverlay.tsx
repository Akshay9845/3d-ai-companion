import React from 'react';

interface DetectedFace {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  emotions?: {
    [emotion: string]: number;
  };
  age?: number;
  gender?: string;
  confidence: number;
}

interface FaceDetectionOverlayProps {
  faces: DetectedFace[];
  videoWidth: number;
  videoHeight: number;
  className?: string;
}

const FaceDetectionOverlay: React.FC<FaceDetectionOverlayProps> = ({
  faces,
  videoWidth,
  videoHeight,
  className = ''
}) => {
  const getDominantEmotion = (emotions: { [emotion: string]: number }) => {
    let maxEmotion = 'neutral';
    let maxScore = 0;

    for (const [emotion, score] of Object.entries(emotions)) {
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    }

    return { emotion: maxEmotion, score: maxScore };
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happy: 'border-green-400 text-green-400',
      sad: 'border-blue-400 text-blue-400',
      angry: 'border-red-400 text-red-400',
      surprised: 'border-yellow-400 text-yellow-400',
      fearful: 'border-purple-400 text-purple-400',
      disgusted: 'border-orange-400 text-orange-400',
      neutral: 'border-gray-400 text-gray-400'
    };
    return colors[emotion] || colors.neutral;
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
    return emojis[emotion] || emojis.neutral;
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {faces.map((face, index) => {
        const scaleX = 100 / videoWidth;
        const scaleY = 100 / videoHeight;
        
        const left = face.boundingBox.x * scaleX;
        const top = face.boundingBox.y * scaleY;
        const width = face.boundingBox.width * scaleX;
        const height = face.boundingBox.height * scaleY;

        const dominantEmotion = face.emotions 
          ? getDominantEmotion(face.emotions)
          : { emotion: 'neutral', score: 0 };

        const colorClass = getEmotionColor(dominantEmotion.emotion);
        const emoji = getEmotionEmoji(dominantEmotion.emotion);

        return (
          <div
            key={index}
            className={`absolute border-2 ${colorClass} bg-black/20`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
          >
            {/* Face info label */}
            <div className={`absolute -top-6 left-0 bg-black/80 px-1 py-0.5 rounded text-xs ${colorClass.split(' ')[1]} flex items-center gap-1`}>
              <span>{emoji}</span>
              <span className="font-medium">
                {dominantEmotion.emotion}
              </span>
              {face.age && (
                <span className="text-white/80">
                  {face.age}y
                </span>
              )}
              <span className="text-white/60">
                {Math.round(face.confidence * 100)}%
              </span>
            </div>
          </div>
        );
      })}
      
      {/* Detection status indicator */}
      {faces.length === 0 && (
        <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-xs text-gray-400 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
          <span>Scanning for faces...</span>
        </div>
      )}
    </div>
  );
};

export default FaceDetectionOverlay; 