// Test script to verify 0.3x speed talking animations repeat during TTS
console.log('\n🎭 TESTING 0.3x SPEED TALKING ANIMATION REPETITION');
console.log('='.repeat(60));

// Test function for 0.3x speed talking animations
function testSlowTalkingAnimationRepeat() {
  console.log('🎭 Starting 0.3x speed talking animation repeat test...');
  console.log('Expected behavior: Talking animations should cycle every 10 seconds at 0.3x speed during TTS');
  
  // Test text - long enough to see multiple slow cycles
  const testText = "This is a comprehensive test of the 0.3x speed talking animation system. The character should continuously cycle through different talking animations at very slow speed while speaking this text. Watch carefully to ensure there are no gaps, T-pose returns, or interruptions. The animations should flow smoothly from talking to talking-2 to talking-3 to talking-4 at 0.3x speed and then repeat the cycle every 10 seconds. This should continue for the entire duration of the speech without any breaks or returns to idle poses. The animations should be very slow and graceful.";
  
  console.log('📝 Test text length:', testText.length, 'characters');
  console.log('📝 Estimated speech time: ~40-50 seconds');
  console.log('📝 Expected animation cycles: 4-5 cycles (every 10 seconds)');
  console.log('📝 Animation speed: 0.3x (very slow)');
  
  // Check if required functions are available
  const requiredFunctions = [
    'synchronizedSpeechAnimationController',
    'geminiTTS',
    'playEchoAnimation'
  ];
  
  let missingFunctions = [];
  
  // Check synchronizedSpeechAnimationController
  if (!window.synchronizedSpeechAnimationController) {
    missingFunctions.push('synchronizedSpeechAnimationController');
  }
  
  // Check geminiTTS
  if (!window.geminiTTS) {
    missingFunctions.push('geminiTTS');
  }
  
  // Check playEchoAnimation
  if (!window.playEchoAnimation) {
    missingFunctions.push('playEchoAnimation');
  }
  
  if (missingFunctions.length > 0) {
    console.error('❌ Missing required functions:', missingFunctions.join(', '));
    console.log('💡 Make sure the app is fully loaded and try again');
    return false;
  }
  
  console.log('✅ All required functions available');
  
  // Start the test
  try {
    console.log('🎭 Starting synchronized speech with 0.3x speed talking animations...');
    
    // Use the fixed synchronized speech controller
    window.synchronizedSpeechAnimationController.startSynchronizedSpeech(testText, window.geminiTTS);
    
    console.log('✅ Test started successfully!');
    console.log('\n👁️ WATCH FOR:');
    console.log('  • Talking animations cycling every 10 seconds');
    console.log('  • Very slow 0.3x speed animations');
    console.log('  • No gaps or T-pose returns');
    console.log('  • Smooth 1.0s transitions between animations');
    console.log('  • Return to idle only after speech completes (with 3s delay)');
    
    // Set up monitoring for slow animations
    monitorSlowTalkingAnimations();
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed to start:', error);
    return false;
  }
}

// Monitor slow talking animations during the test
function monitorSlowTalkingAnimations() {
  console.log('\n🔍 Starting slow animation monitoring...');
  console.log('⏰ Monitoring every 2 seconds for 10-second animation cycles');
  
  let cycleCount = 0;
  let lastAnimation = '';
  let startTime = Date.now();
  
  const monitorInterval = setInterval(() => {
    // Check if still speaking
    if (window.synchronizedSpeechAnimationController && 
        window.synchronizedSpeechAnimationController.isCurrentlySpeaking()) {
      
      const state = window.synchronizedSpeechAnimationController.getState();
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      if (state.currentAnimation !== lastAnimation) {
        cycleCount++;
        console.log(`🎭 SLOW CYCLE ${cycleCount} (${elapsed}s): ${lastAnimation} → ${state.currentAnimation} (0.3x speed)`);
        lastAnimation = state.currentAnimation;
      }
      
    } else {
      // Speech ended
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`\n🏁 TEST COMPLETED - Total time: ${totalTime}s, Animation cycles: ${cycleCount}`);
      console.log('✅ Speech and slow animations finished');
      clearInterval(monitorInterval);
    }
    
  }, 2000); // Check every 2 seconds for slow animations
  
  // Safety timeout - stop monitoring after 90 seconds
  setTimeout(() => {
    clearInterval(monitorInterval);
    console.log('\n⏰ Monitoring timeout - test completed');
  }, 90000);
}

// Test manual slow talking animation cycling (fallback test)
function testManualSlowTalkingCycle() {
  console.log('\n🎭 FALLBACK TEST - Manual 0.3x speed talking animation cycling');
  
  if (!window.playEchoAnimation) {
    console.error('❌ playEchoAnimation not available');
    return false;
  }
  
  const talkingAnimations = ['talking', 'talking-2', 'talking-3', 'talking-4'];
  let animIndex = 0;
  let cycleCount = 0;
  const maxCycles = 4; // 4 cycles = ~40 seconds with 10s intervals
  
  console.log(`🎭 Testing ${maxCycles} manual slow cycles (${maxCycles * 10} seconds total)`);
  console.log('🎭 Each animation plays for 12 seconds at 0.3x speed');
  
  function playNextSlowTalking() {
    if (cycleCount >= maxCycles) {
      console.log('✅ Manual slow talking cycle test complete');
      // Return to idle after longer delay
      setTimeout(() => {
        if (window.forceEchoBaseIdle) {
          window.forceEchoBaseIdle();
          console.log('✅ Returned to idle after manual slow test');
        }
      }, 3000); // 3 second delay like the real controller
      return;
    }
    
    const anim = talkingAnimations[animIndex % talkingAnimations.length];
    console.log(`🎭 MANUAL SLOW CYCLE ${cycleCount + 1}/${maxCycles}: ${anim} (0.3x speed, 12s duration)`);
    
    // Use same settings as synchronized controller for slow animations
    window.playEchoAnimation(anim, 1.0); // 1.0s crossfade for slow transitions
    
    animIndex++;
    cycleCount++;
    
    // Continue cycle every 10 seconds to match slow controller
    setTimeout(playNextSlowTalking, 10000);
  }
  
  // Start the slow cycle
  playNextSlowTalking();
  return true;
}

// Main test function for slow animations
function runSlowTalkingAnimationTests() {
  console.log('🎭 0.3x SPEED TALKING ANIMATION REPETITION TESTS');
  console.log('=' .repeat(60));
  
  // Test 1: Full synchronized speech test with slow animations
  console.log('\n🧪 TEST 1: Synchronized Speech with 0.3x Speed Continuous Talking');
  const test1Success = testSlowTalkingAnimationRepeat();
  
  if (!test1Success) {
    console.log('\n🧪 TEST 1 FAILED - Running fallback test...');
    
    // Test 2: Manual slow talking cycle (fallback)
    setTimeout(() => {
      console.log('\n🧪 TEST 2: Manual 0.3x Speed Talking Animation Cycling');
      testManualSlowTalkingCycle();
    }, 2000);
  }
}

// Updated utility functions for slow animations
function stopAllSlowTests() {
  console.log('🛑 Stopping all 0.3x speed talking animation tests...');
  
  if (window.synchronizedSpeechAnimationController) {
    window.synchronizedSpeechAnimationController.forceStop();
  }
  
  if (window.geminiTTS && window.geminiTTS.stopAudio) {
    window.geminiTTS.stopAudio();
  }
  
  // Return to idle with delay to prevent T-pose
  setTimeout(() => {
    if (window.forceEchoBaseIdle) {
      window.forceEchoBaseIdle();
      console.log('✅ Returned to idle pose (with delay to prevent T-pose)');
    }
  }, 3000);
}

function getSlowTalkingAnimationStatus() {
  console.log('\n📊 0.3x SPEED TALKING ANIMATION STATUS');
  console.log('-'.repeat(40));
  
  if (window.synchronizedSpeechAnimationController) {
    const state = window.synchronizedSpeechAnimationController.getState();
    console.log('🎭 Is Speaking:', state.isSpeaking);
    console.log('🎭 Current Animation:', state.currentAnimation);
    console.log('🎭 Speech Start Time:', new Date(state.speechStartTime).toLocaleTimeString());
    console.log('🎭 Estimated Duration:', state.estimatedDuration, 'ms');
    
    if (state.isSpeaking) {
      const elapsed = Math.round((Date.now() - state.speechStartTime) / 1000);
      console.log('🎭 Elapsed Time:', elapsed, 'seconds');
      console.log('🎭 Next Animation Change: ~every 10 seconds');
    }
  } else {
    console.log('❌ Synchronized speech controller not available');
  }
  
  if (window.geminiTTS) {
    console.log('🎤 TTS Available:', true);
    if (window.geminiTTS.isSpeaking) {
      console.log('🎤 TTS Speaking:', window.geminiTTS.isSpeaking());
    }
  } else {
    console.log('❌ TTS service not available');
  }
  
  console.log('🎭 Animation Function Available:', !!window.playEchoAnimation);
  console.log('🎭 Idle Function Available:', !!window.forceEchoBaseIdle);
  console.log('🎭 Animation Speed: 0.3x (very slow)');
  console.log('🎭 Animation Duration: 12 seconds each');
  console.log('🎭 Cycle Interval: 10 seconds');
}

// Export functions to window for easy console access
window.testSlowTalkingAnimationRepeat = testSlowTalkingAnimationRepeat;
window.testManualSlowTalkingCycle = testManualSlowTalkingCycle;
window.runSlowTalkingAnimationTests = runSlowTalkingAnimationTests;
window.stopAllSlowTests = stopAllSlowTests;
window.getSlowTalkingAnimationStatus = getSlowTalkingAnimationStatus;

// Maintain backward compatibility
window.testTalkingAnimationRepeat = testSlowTalkingAnimationRepeat;
window.runTalkingAnimationTests = runSlowTalkingAnimationTests;
window.stopAllTests = stopAllSlowTests;
window.getTalkingAnimationStatus = getSlowTalkingAnimationStatus;

// Auto-run message
console.log('🎭 0.3x Speed Talking Animation Repeat Test Ready!');
console.log('\n💡 Available functions:');
console.log('  • testSlowTalkingAnimationRepeat() - Test 0.3x speed talking during TTS');
console.log('  • testManualSlowTalkingCycle() - Test manual 0.3x speed animation cycling');
console.log('  • runSlowTalkingAnimationTests() - Run all slow animation tests');
console.log('  • stopAllSlowTests() - Stop all tests and return to idle');
console.log('  • getSlowTalkingAnimationStatus() - Check current slow animation status');
console.log('\n🚀 Run: runSlowTalkingAnimationTests()');
console.log('⏰ Note: Animations now cycle every 10 seconds at 0.3x speed!'); 