import React, { useEffect, useState } from 'react';

const AnimationDebugTest: React.FC = () => {
  const [animationState, setAnimationState] = useState('No animation');
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);

  useEffect(() => {
    // Check if EchoModel is loaded and animation methods are available
    const checkAnimationMethods = () => {
      const methods = [
        'playEchoAnimation',
        'blendEchoAnimations', 
        'returnEchoToIdle',
        'getEchoAnimationState'
      ];
      
      const available = methods.filter(method => typeof (window as any)[method] === 'function');
      setAvailableAnimations(available);
      
      console.log('🎭 Available animation methods:', available);
    };

    // Check every second until methods are available
    const interval = setInterval(checkAnimationMethods, 1000);
    
    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(interval), 10000);
    
    return () => clearInterval(interval);
  }, []);

  const testAnimation = (animationName: string) => {
    console.log('🎭 Testing animation:', animationName);
    
    if (typeof (window as any).playEchoAnimation === 'function') {
      (window as any).playEchoAnimation(animationName, 1.0);
      setAnimationState(`Playing: ${animationName}`);
      console.log('✅ Called playEchoAnimation successfully');
    } else {
      console.error('❌ playEchoAnimation not available');
      setAnimationState('Error: Animation method not available');
    }
  };

  const testIdle = () => {
    console.log('🎭 Testing idle animation');
    
    if (typeof (window as any).returnEchoToIdle === 'function') {
      (window as any).returnEchoToIdle(1.0);
      setAnimationState('Playing: sitting-idle');
      console.log('✅ Called returnEchoToIdle successfully');
    } else {
      console.error('❌ returnEchoToIdle not available');
      setAnimationState('Error: Idle method not available');
    }
  };

  const getAnimationState = () => {
    if (typeof (window as any).getEchoAnimationState === 'function') {
      const state = (window as any).getEchoAnimationState();
      console.log('🎭 Current animation state:', state);
      return state;
    }
    return 'State method not available';
  };

  const testAnimationService = () => {
    console.log('🎭 Testing animation service');
    
    // Import and test the animation service
    import('../lib/animationService').then(({ animationService }) => {
      console.log('✅ Animation service imported');
      
      // Test triggering an animation
      animationService.triggerAnimationChange('/ECHO/animations/basic reactions/sitting-idle.glb', {
        timeScale: 0.1,
        weight: 0.3,
        crossFadeDuration: 3.0
      });
      
      setAnimationState('Testing animation service...');
    }).catch(error => {
      console.error('❌ Failed to import animation service:', error);
      setAnimationState('Error: Failed to import animation service');
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h3>Animation Debug Test</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Current State:</strong> {animationState}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Available Methods:</strong>
        <ul>
          {availableAnimations.map(method => (
            <li key={method}>✅ {method}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Animation State:</strong>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(getAnimationState(), null, 2)}
        </pre>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button
          onClick={() => testAnimation('sitting-idle')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Sitting Idle
        </button>

        <button
          onClick={() => testAnimation('waving-2')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Waving
        </button>

        <button
          onClick={() => testAnimation('talking')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Talking
        </button>

        <button
          onClick={testIdle}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Idle Method
        </button>

        <button
          onClick={testAnimationService}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Animation Service
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
        <h4>🔍 Debug Instructions:</h4>
        <ul>
          <li>Check if animation methods are available (should show ✅)</li>
          <li>Test individual animations to see if they play</li>
          <li>Check browser console for detailed logs</li>
          <li>Watch the 3D model for actual animation movement</li>
          <li>If animations don't play, check for errors in console</li>
        </ul>
      </div>
    </div>
  );
};

export default AnimationDebugTest; 