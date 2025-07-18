import React, { useEffect } from 'react';
import { animationService } from '../lib/animationService';

const QuickAnimationTest: React.FC = () => {
  
  useEffect(() => {
    console.log('🎭 Quick Animation Test Component Mounted');
    
    // Test animation after 2 seconds
    setTimeout(() => {
      console.log('🎭 Testing dance animation...');
      const result = animationService.findAnimationForText('dance for me');
      console.log('🎭 Animation result:', result);
      
      if (result.animation) {
        const animationName = result.animation.path.split('/').pop()?.replace('.glb', '') || '';
        console.log('🎭 Extracted animation name:', animationName);
        
        // Try all animation trigger methods
        if ((window as any).playEchoAnimation) {
          console.log('🎭 Calling playEchoAnimation...');
          (window as any).playEchoAnimation(animationName, 0.8);
        }
        
        if ((window as any).triggerEchoAnimation) {
          console.log('🎭 Calling triggerEchoAnimation...');
          (window as any).triggerEchoAnimation(animationName);
        }
        
        // Also trigger via service
        animationService.triggerAnimationChange(result.animation.path, result.animation);
      }
    }, 2000);
    
    // Test another animation after 5 seconds
    setTimeout(() => {
      console.log('🎭 Testing wave animation...');
      const result = animationService.findAnimationForText('wave hello');
      console.log('🎭 Wave result:', result);
      
      if (result.animation) {
        const animationName = result.animation.path.split('/').pop()?.replace('.glb', '') || '';
        console.log('🎭 Wave animation name:', animationName);
        
        if ((window as any).playEchoAnimation) {
          (window as any).playEchoAnimation(animationName, 0.8);
        }
      }
    }, 5000);
    
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#000', 
      color: '#fff', 
      padding: '10px', 
      borderRadius: '5px',
      zIndex: 9999
    }}>
      <h4>🎭 Animation Test</h4>
      <p>Check console for animation logs</p>
      <p>Dance at 2s, Wave at 5s</p>
    </div>
  );
};

export default QuickAnimationTest; 