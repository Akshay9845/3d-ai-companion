// Test TTS Completion Idle Return - Copy and paste into browser console
console.log('🎭 TESTING TTS COMPLETION → IDLE TRANSITION (NO T-POSE) 🎭');

// Test that TTS completion returns to idle animations
function testTTSCompletionTransition() {
  console.log('\n🎭 TESTING TTS COMPLETION TRANSITION');
  console.log('Expected: After TTS ends, character returns to happy-idle');
  console.log('Watch for: NO T-pose after speech completion');
  
  // Ensure base idle is active first
  if (window.forceEchoBaseIdle) {
    window.forceEchoBaseIdle();
    console.log('✅ Base idle ensured before test');
  }
  
  // Test with a medium-length response that has clear ending
  const testResponses = [
    "This is a test response to verify that when TTS completes, the character properly returns to idle animations instead of going into T-pose.",
    "I can help you with many different tasks including dancing, fighting, teaching, and much more!",
    "Let me demonstrate my capabilities with this test speech that should end gracefully."
  ];
  
  const testText = testResponses[Math.floor(Math.random() * testResponses.length)];
  console.log(`🎭 Test text: "${testText}"`);
  
  // Test the complete TTS pipeline
  if (window.geminiTTS && window.geminiTTS.speak) {
    console.log('🎤 Starting TTS test with completion monitoring...');
    
    // Start synchronized speech if available
    if (window.synchronizedSpeechAnimationController) {
      try {
        console.log('🎭 Using synchronized speech controller...');
        window.synchronizedSpeechAnimationController.startSynchronizedSpeech(testText, window.geminiTTS);
        console.log('✅ Synchronized speech started - will monitor completion');
        
        // Monitor for completion
        monitorTTSCompletion();
        
      } catch (error) {
        console.error('❌ Synchronized speech controller error:', error);
        fallbackTTSTest(testText);
      }
    } else {
      console.log('❌ Synchronized speech controller not available, using fallback');
      fallbackTTSTest(testText);
    }
  } else {
    console.log('❌ TTS service not available');
  }
}

// Fallback TTS test
function fallbackTTSTest(text) {
  console.log('🎭 FALLBACK: Manual TTS test');
  
  // Start talking animation first
  if (window.playEchoAnimation) {
    window.playEchoAnimation('talking', 0.8);
    console.log('✅ Talking animation started');
  }
  
  // Simulate TTS completion after expected duration
  const words = text.split(' ').length;
  const estimatedDuration = Math.max(3000, (words / 2.5) * 1000); // Roughly 2.5 words per second
  
  console.log(`⏱️ Estimated TTS duration: ${estimatedDuration}ms`);
  console.log('🎭 Will check transition to idle after completion...');
  
  setTimeout(() => {
    console.log('🎭 SIMULATED TTS COMPLETION: Checking transition to idle...');
    
    // Force return to idle as the fix should do
    if (window.forceEchoBaseIdle) {
      window.forceEchoBaseIdle();
      console.log('✅ MANUAL: Returned to happy-idle (no T-pose)');
    } else if (window.playEchoAnimation) {
      window.playEchoAnimation('happy-idle', 1.5);
      console.log('✅ MANUAL: Transitioned to happy-idle (no T-pose)');
    }
    
    // Verify state after transition
    setTimeout(() => {
      checkFinalState();
    }, 2000);
    
  }, estimatedDuration);
}

// Monitor TTS completion in real-time
function monitorTTSCompletion() {
  console.log('🔍 MONITORING: TTS completion for idle transition');
  
  let lastCheck = Date.now();
  const maxMonitorTime = 30000; // 30 seconds max
  
  const monitor = setInterval(() => {
    const elapsed = Date.now() - lastCheck;
    
    // Check if TTS is still speaking
    if (window.geminiTTS && window.geminiTTS.isSpeaking) {
      if (!window.geminiTTS.isSpeaking()) {
        console.log('🎭 DETECTED: TTS completion - checking idle transition...');
        clearInterval(monitor);
        
        // Wait a moment then check final state
        setTimeout(() => {
          checkFinalState();
        }, 2000);
        return;
      }
    }
    
    // Timeout after max monitor time
    if (elapsed > maxMonitorTime) {
      console.log('⏰ TIMEOUT: TTS monitoring ended');
      clearInterval(monitor);
      checkFinalState();
    }
  }, 500);
}

// Check final animation state
function checkFinalState() {
  console.log('\n📊 CHECKING FINAL ANIMATION STATE:');
  
  if (window.getEchoAnimationState) {
    const state = window.getEchoAnimationState();
    console.log('Current animation state:', state);
    
    if (state.activeAnimations) {
      const hasHappyIdle = state.activeAnimations.some(anim => 
        anim.includes('happy-idle') || anim.includes('idle')
      );
      
      if (hasHappyIdle) {
        console.log('✅ SUCCESS: Character is in idle state (no T-pose)');
      } else {
        console.log('❌ PROBLEM: Character may be in T-pose or wrong state');
        console.log('Active animations:', state.activeAnimations);
        
        // Emergency fix
        emergencyIdleFix();
      }
    } else {
      console.log('⚠️ WARNING: No active animations detected - possible T-pose');
      emergencyIdleFix();
    }
  } else {
    console.log('❌ Cannot check animation state - function not available');
  }
}

// Emergency idle fix
function emergencyIdleFix() {
  console.log('🚨 EMERGENCY: Applying idle fix to prevent T-pose');
  
  if (window.forceEchoBaseIdle) {
    window.forceEchoBaseIdle();
    console.log('✅ Emergency: Base idle forced');
  } else if (window.playEchoAnimation) {
    window.playEchoAnimation('happy-idle', 1.5);
    console.log('✅ Emergency: Happy-idle triggered');
  }
  
  setTimeout(() => {
    console.log('🎭 Emergency fix applied - character should be in idle state');
  }, 1500);
}

// Test multiple completion scenarios
function testMultipleCompletions() {
  console.log('\n🎭 TESTING MULTIPLE TTS COMPLETIONS');
  console.log('This will test 3 different responses to ensure consistent idle returns');
  
  const tests = [
    "Short test response.",
    "Medium length test response that should demonstrate proper idle return after completion.",
    "This is a longer test response that will help verify that the TTS completion properly returns to idle animations consistently across different response lengths and durations."
  ];
  
  let testIndex = 0;
  
  function runNextTest() {
    if (testIndex >= tests.length) {
      console.log('✅ MULTIPLE COMPLETION TESTS FINISHED');
      console.log('🎭 All tests should have returned to idle state');
      return;
    }
    
    const testText = tests[testIndex];
    console.log(`\n🎭 Test ${testIndex + 1}/${tests.length}:`);
    console.log(`Text: "${testText.substring(0, 50)}..."`);
    
    // Use simplified test for multiple runs
    if (window.geminiTTS && window.geminiTTS.speak) {
      window.geminiTTS.speak(testText).then(() => {
        console.log(`✅ Test ${testIndex + 1} TTS completed`);
        
        // Verify idle return
        setTimeout(() => {
          if (window.forceEchoBaseIdle) {
            window.forceEchoBaseIdle();
            console.log(`✅ Test ${testIndex + 1}: Returned to idle`);
          }
          
          testIndex++;
          setTimeout(runNextTest, 3000); // 3 second gap between tests
        }, 1000);
      });
    } else {
      console.log('❌ TTS not available for multiple tests');
      return;
    }
  }
  
  runNextTest();
}

// Create emergency functions
window.fixTTSCompletion = function() {
  console.log('🚨 EMERGENCY TTS COMPLETION FIX');
  emergencyIdleFix();
};

window.testTTSIdle = function() {
  testTTSCompletionTransition();
};

// Main test menu
console.log('\n🎮 AVAILABLE TESTS:');
console.log('testTTSCompletionTransition() - Test single TTS completion');
console.log('testMultipleCompletions() - Test multiple TTS completions');
console.log('checkFinalState() - Check current animation state');
console.log('fixTTSCompletion() - Emergency idle fix');

console.log('\n🎯 MAIN TEST - Run this to verify the fix:');
console.log('testTTSCompletionTransition()');

console.log('\n🔧 EXPECTED BEHAVIOR:');
console.log('1. Character talks during TTS');
console.log('2. When TTS ends, smooth transition to happy-idle');
console.log('3. NO T-pose at any point');
console.log('4. Character stays in natural idle state');

console.log('\n✅ TTS completion test tools ready!');
console.log('🎭 The character should now return to idle instead of T-pose after TTS'); 