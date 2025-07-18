// Robust Talking Animation Loop Test
console.log('\n🎭 ROBUST TALKING ANIMATION LOOP TEST');
console.log('='.repeat(50));

// Test function for robust talking animation loop
function testRobustTalkingLoop() {
  console.log('🎭 Testing robust talking animation loop...');
  console.log('Expected: Talking animations cycle every 6 seconds until TTS ends');
  console.log('Expected: NO T-pose return after TTS completion');
  
  // Test text - medium length to see multiple cycles
  const testText = "This is a comprehensive test of the robust talking animation system. The character should continuously cycle through different talking animations every 6 seconds while speaking this text. The animations should continue until the TTS completely finishes, and then smoothly return to idle animations without any T-pose. Watch for seamless transitions and no gaps.";
  
  console.log('📝 Test text length:', testText.length, 'characters');
  console.log('📝 Estimated speech time: ~25-30 seconds');
  console.log('📝 Expected animation cycles: 4-5 cycles (every 6 seconds)');
  console.log('📝 Animation speed: 0.3x (slow but robust)');
  
  // Check if required functions are available
  if (!window.synchronizedSpeechAnimationController) {
    console.error('❌ synchronizedSpeechAnimationController not available');
    return false;
  }
  
  if (!window.geminiTTS) {
    console.error('❌ geminiTTS not available');
    return false;
  }
  
  if (!window.playEchoAnimation) {
    console.error('❌ playEchoAnimation not available');
    return false;
  }
  
  if (!window.forceEchoBaseIdle) {
    console.error('❌ forceEchoBaseIdle not available');
    return false;
  }
  
  console.log('✅ All required systems available');
  
  // Start the test
  try {
    console.log('🎭 Starting robust talking animation test...');
    
    // Monitor the animation cycles
    monitorTalkingCycles();
    
    // Monitor for T-pose prevention
    setTimeout(() => {
      console.log('🔍 Starting T-pose monitoring...');
      monitorForTPoseAfterTTS();
    }, 20000); // Start monitoring near expected end of TTS
    
    // Start synchronized speech with robust monitoring
    window.synchronizedSpeechAnimationController.startSynchronizedSpeech(testText, window.geminiTTS);
    
    console.log('✅ Robust talking test started!');
    console.log('\n👁️ WATCH FOR:');
    console.log('  • Talking animations cycling every 6 seconds');
    console.log('  • 0.3x speed animations (slow but visible)');
    console.log('  • Continuous animation until TTS completely ends');
    console.log('  • Smooth return to idle (NO T-pose)');
    console.log('  • Triple T-pose prevention system activation');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed to start:', error);
    return false;
  }
}

// Monitor talking animation cycles during TTS
function monitorTalkingCycles() {
  console.log('🔍 Starting talking cycle monitoring...');
  
  let lastAnimation = '';
  let cycleCount = 0;
  let startTime = Date.now();
  
  const monitorInterval = setInterval(() => {
    // Check if still speaking
    if (window.synchronizedSpeechAnimationController && 
        window.synchronizedSpeechAnimationController.isCurrentlySpeaking()) {
      
      const state = window.synchronizedSpeechAnimationController.getState();
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      if (state.currentAnimation !== lastAnimation && state.currentAnimation.includes('talking')) {
        cycleCount++;
        console.log(`🎭 ROBUST CYCLE ${cycleCount} (${elapsed}s): ${lastAnimation} → ${state.currentAnimation}`);
        lastAnimation = state.currentAnimation;
      }
      
    } else {
      // Speech ended
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`\n🏁 TALKING CYCLES COMPLETE - Total time: ${totalTime}s, Cycles: ${cycleCount}`);
      console.log('✅ Robust talking animation cycles finished');
      clearInterval(monitorInterval);
    }
    
  }, 1000); // Check every second
  
  // Safety timeout
  setTimeout(() => {
    clearInterval(monitorInterval);
    console.log('\n⏰ Cycle monitoring timeout');
  }, 60000);
}

// Monitor for T-pose after TTS completion
function monitorForTPoseAfterTTS() {
  console.log('🛡️ Starting T-pose prevention monitoring...');
  
  let monitorCount = 0;
  let tPoseDetected = false;
  
  const tPoseMonitor = setInterval(() => {
    monitorCount++;
    
    // Check if TTS has ended
    const isSpeaking = window.synchronizedSpeechAnimationController && 
                      window.synchronizedSpeechAnimationController.isCurrentlySpeaking();
    
    if (!isSpeaking) {
      console.log(`🔍 Post-TTS check ${monitorCount}: Checking for T-pose...`);
      
      // Check animation state
      if (window.getEchoAnimationState) {
        try {
          const state = window.getEchoAnimationState();
          const isTPose = state.isTPose || 
                         (state.activeAnimations && state.activeAnimations.length === 0) ||
                         !state.currentAnimation;
          
          if (isTPose) {
            tPoseDetected = true;
            console.error(`❌ T-POSE DETECTED after TTS completion!`);
            
            // Trigger emergency prevention
            if (window.emergencyTPosePrevention) {
              console.log('🚨 Triggering emergency T-pose prevention...');
              window.emergencyTPosePrevention();
            }
          } else {
            console.log(`✅ ${monitorCount}: No T-pose - character in ${state.currentAnimation || 'unknown'} animation`);
          }
        } catch (error) {
          console.warn('Warning: Could not check animation state:', error);
        }
      }
      
      if (monitorCount >= 10) {
        clearInterval(tPoseMonitor);
        
        if (tPoseDetected) {
          console.error('❌ TEST FAILED: T-pose was detected after TTS completion');
        } else {
          console.log('✅ TEST PASSED: No T-pose detected - robust system working!');
        }
      }
    }
    
  }, 1000); // Check every second
  
  // Safety timeout
  setTimeout(() => {
    clearInterval(tPoseMonitor);
    console.log('⏰ T-pose monitoring timeout');
  }, 30000);
}

// Manual talking cycle test (fallback)
function testManualRobustTalking() {
  console.log('\n🎭 MANUAL ROBUST TALKING TEST');
  
  if (!window.playEchoAnimation) {
    console.error('❌ playEchoAnimation not available');
    return false;
  }
  
  const talkingAnimations = ['talking', 'talking-2', 'talking-3', 'talking-4'];
  let animIndex = 0;
  let cycleCount = 0;
  const maxCycles = 5; // 5 cycles = 30 seconds
  
  console.log(`🎭 Testing ${maxCycles} manual robust cycles (${maxCycles * 6} seconds total)`);
  console.log('🎭 Cycles every 6 seconds with 0.3x speed');
  
  function playNextRobustTalking() {
    if (cycleCount >= maxCycles) {
      console.log('✅ Manual robust talking test complete');
      
      // Test T-pose prevention after manual test
      setTimeout(() => {
        console.log('🔍 Testing T-pose prevention after manual cycles...');
        
        if (window.forceEchoBaseIdle) {
          window.forceEchoBaseIdle();
          console.log('✅ T-pose prevention: Base idle forced');
        }
        
        if (window.emergencyTPosePrevention) {
          setTimeout(() => {
            window.emergencyTPosePrevention();
            console.log('✅ T-pose prevention: Emergency system activated');
          }, 2000);
        }
      }, 1000);
      
      return;
    }
    
    const anim = talkingAnimations[animIndex % talkingAnimations.length];
    console.log(`🎭 MANUAL ROBUST CYCLE ${cycleCount + 1}/${maxCycles}: ${anim} (0.3x speed)`);
    
    // Use settings matching synchronized controller
    window.playEchoAnimation(anim, 0.8); // 0.8s crossfade
    
    animIndex++;
    cycleCount++;
    
    // Continue cycle every 6 seconds to match robust controller
    setTimeout(playNextRobustTalking, 6000);
  }
  
  // Start the robust cycle
  playNextRobustTalking();
  return true;
}

// Status check function
function getRobustTalkingStatus() {
  console.log('\n📊 ROBUST TALKING ANIMATION STATUS:');
  console.log('-'.repeat(45));
  
  if (window.synchronizedSpeechAnimationController) {
    const state = window.synchronizedSpeechAnimationController.getState();
    console.log('🎭 Speech Controller:', {
      isSpeaking: state.isSpeaking,
      currentAnimation: state.currentAnimation,
      speechStartTime: state.speechStartTime ? new Date(state.speechStartTime).toLocaleTimeString() : 'None',
      estimatedDuration: state.estimatedDuration + 'ms'
    });
    
    if (state.isSpeaking) {
      const elapsed = Math.round((Date.now() - state.speechStartTime) / 1000);
      console.log('🎭 Elapsed Time:', elapsed, 'seconds');
      console.log('🎭 Next Animation Change: ~every 6 seconds');
    }
  }
  
  if (window.getEchoAnimationState) {
    try {
      const animState = window.getEchoAnimationState();
      console.log('🎭 Animation State:', {
        currentAnimation: animState.currentAnimation,
        isTPose: animState.isTPose || false,
        activeAnimations: animState.activeAnimations?.length || 0
      });
    } catch (error) {
      console.log('⚠️ Could not get animation state:', error.message);
    }
  }
  
  // Check constant idle system
  if (window.getIdleStatus) {
    const idleStatus = window.getIdleStatus();
    console.log('🛡️ Constant Idle System:', idleStatus);
  }
  
  console.log('🎭 System Readiness:');
  console.log('  • Animation Function:', !!window.playEchoAnimation);
  console.log('  • Base Idle Function:', !!window.forceEchoBaseIdle);
  console.log('  • Emergency T-pose Prevention:', !!window.emergencyTPosePrevention);
  console.log('  • TTS Service:', !!window.geminiTTS);
}

// Export functions to window
window.testRobustTalkingLoop = testRobustTalkingLoop;
window.testManualRobustTalking = testManualRobustTalking;
window.getRobustTalkingStatus = getRobustTalkingStatus;
window.monitorTalkingCycles = monitorTalkingCycles;

// Ready message
console.log('🎭 Robust Talking Animation Loop Test Ready!');
console.log('\n💡 Available functions:');
console.log('  • testRobustTalkingLoop() - Test full robust talking system');
console.log('  • testManualRobustTalking() - Test manual robust cycles');
console.log('  • getRobustTalkingStatus() - Check current system status');
console.log('\n🚀 Run: testRobustTalkingLoop()');
console.log('🔍 Or check status: getRobustTalkingStatus()');
console.log('\n✅ This should fix the T-pose issue and ensure continuous talking!'); 