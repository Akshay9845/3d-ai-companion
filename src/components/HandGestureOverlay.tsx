import React from 'react';
import { GestureDetectionResult, HandGesture } from '../lib/mediapipeGestureService';

interface HandGestureOverlayProps {
  gestureResult: GestureDetectionResult | null;
  isActive: boolean;
}

const HandGestureOverlay: React.FC<HandGestureOverlayProps> = ({ gestureResult, isActive }) => {
  if (!isActive || !gestureResult || gestureResult.gestures.length === 0) {
    return null;
  }

  const getGestureColor = (gestureType: HandGesture['type']): string => {
    const colors = {
      wave: '#10b981', // green
      thumbsUp: '#3b82f6', // blue
      thumbsDown: '#ef4444', // red
      peace: '#8b5cf6', // purple
      pointing: '#f59e0b', // yellow
      openPalm: '#06b6d4', // cyan
      fist: '#dc2626', // dark red
      ok: '#22c55e', // light green
      unknown: '#6b7280' // gray
    };
    return colors[gestureType] || colors.unknown;
  };

  const getGestureEmoji = (gestureType: HandGesture['type']): string => {
    const emojis = {
      wave: '👋',
      thumbsUp: '👍',
      thumbsDown: '👎',
      peace: '✌️',
      pointing: '👉',
      openPalm: '✋',
      fist: '✊',
      ok: '👌',
      unknown: '❓'
    };
    return emojis[gestureType] || emojis.unknown;
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Gesture indicators */}
      <div className="absolute top-2 left-2 space-y-1">
        {gestureResult.gestures.map((gesture, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2"
            style={{ borderLeft: `4px solid ${getGestureColor(gesture.type)}` }}
          >
            <span className="text-xl">{getGestureEmoji(gesture.type)}</span>
            <div className="text-white text-sm">
              <div className="font-medium capitalize">
                {gesture.hand} {gesture.type.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </div>
              <div className="text-xs text-white/70">
                {Math.round(gesture.confidence * 100)}% confidence
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Auto-response indicator */}
      {gestureResult.automaticResponse && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-purple-600/90 backdrop-blur-sm rounded-lg p-3 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-lg">🤖</span>
              <span className="font-medium">Auto Response</span>
            </div>
            <div className="text-sm text-purple-100">
              {gestureResult.automaticResponse.message}
            </div>
          </div>
        </div>
      )}

      {/* Hand landmarks visualization (simplified) */}
      {gestureResult.gestures.map((gesture, gestureIndex) => (
        <div key={gestureIndex} className="absolute inset-0">
          {/* Draw hand outline or key points */}
          {gesture.landmarks.slice(0, 5).map((landmark, landmarkIndex) => (
            <div
              key={landmarkIndex}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${landmark.x * 100}%`,
                top: `${landmark.y * 100}%`,
                backgroundColor: getGestureColor(gesture.type),
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 6px ${getGestureColor(gesture.type)}`,
                opacity: 0.8
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default HandGestureOverlay; 