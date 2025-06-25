import React, { useEffect, useState } from 'react';
import { humanLikeAnimationService } from '../lib/humanLikeAnimationService';
import { synchronizedSpeechAnimationController } from '../lib/synchronizedSpeechAnimationController';

const SlowIdleTest: React.FC = () => {
  const [isIdle, setIsIdle] = useState(true);
  const [idleCount, setIdleCount] = useState(0);
  const [lastIdleTime, setLastIdleTime] = useState<Date | null>(null);

  useEffect(() => {
    // Monitor idle state changes
    const checkIdleState = () => {
      const state = synchronizedSpeechAnimationController.getState();
      const wasIdle = isIdle;
      const nowIdle = !state.isSpeaking && !state.isTransitioning;
      
      if (nowIdle && !wasIdle) {
        // Just entered idle state
        setIdleCount(prev => prev + 1);
        setLastIdleTime(new Date());
        console.log('🎭 Entered idle state');
      }
      
      setIsIdle(nowIdle);
    };

    const interval = setInterval(checkIdleState, 1000);
    return () => clearInterval(interval);
  }, [isIdle]);

  const forceIdle = () => {
    console.log('🎭 Forcing idle state');
    synchronizedSpeechAnimationController.forceStop();
    humanLikeAnimationService.stopAndReturnToIdle();
  };

  const testSlowIdle = async () => {
    console.log('🎭 Testing slow idle animation');
    await humanLikeAnimationService.startIdleSequence();
  };

  const getTimeSinceLastIdle = () => {
    if (!lastIdleTime) return 'Never';
    const diff = Date.now() - lastIdleTime.getTime();
    const seconds = Math.floor(diff / 1000);
    return `${seconds}s ago`;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h3>Slow Idle Animation Test</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Current State:</strong> {isIdle ? '🟢 Idle' : '🔴 Speaking/Transitioning'}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Idle Count:</strong> {idleCount}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Last Idle:</strong> {getTimeSinceLastIdle()}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Current Animation:</strong> {humanLikeAnimationService.getCurrentAnimation()}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={forceIdle}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Force Idle
        </button>

        <button
          onClick={testSlowIdle}
          style={{
            padding: '10px 20px',
            backgroundColor: '#52c41a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Slow Idle
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
        <h4>Slow Idle Features:</h4>
        <ul>
          <li>⏱️ Idle animations every 15-25 seconds (much slower)</li>
          <li>🐌 Time scale: 0.3 (30% speed - very slow)</li>
          <li>🎭 Weight: 0.4 (subtle movement)</li>
          <li>🔄 Smooth transitions: 1.5s crossfade</li>
          <li>🔄 Continues until user input</li>
        </ul>
      </div>
    </div>
  );
};

export default SlowIdleTest; 