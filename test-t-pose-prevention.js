// Comprehensive T-Pose Prevention Test Script
console.log('\n🛡️ T-POSE PREVENTION SYSTEM TEST');
console.log('='.repeat(60));

// Test scenarios for T-pose prevention
const testScenarios = [
  {
    name: 'TTS Completion',
    description: 'Test T-pose prevention after TTS completes',
    test: testTTSCompletionTPosePrevention
  },
  {
    name: 'Manual Animation End',
    description: 'Test T-pose prevention when animations end manually',
    test: testManualAnimationEndTPosePrevention
  },
  {
    name: 'Long Idle Periods',
    description: 'Test T-pose prevention during long idle periods',
    test: testLongIdleTPosePrevention
  },
  {
    name: 'Emergency T-Pose Fix',
    description: 'Test emergency T-pose prevention functions',
    test: testEmergencyTPosePrevention
  },
  {
    name: 'Constant Idle Cycling',
    description: 'Test continuous idle animation cycling',
    test: testConstantIdleCycling
  }
];

// Main test runner
function runTPostPreventionTests() {
  console.log('🛡️ T-POSE PREVENTION COMPREHENSIVE TESTS');
  console.log('='.repeat(60));
  
  // Check if constant idle system is available
  checkConstantIdleSystemAvailability();
  
  // Run all test scenarios
  testScenarios.forEach((scenario, index) => {
    setTimeout(() => {
      console.log(`\n🧪 TEST ${index + 1}: ${scenario.name}`);
      console.log(`📋 ${scenario.description}`);
      console.log('-'.repeat(50));
      scenario.test();
    }, index * 15000); // 15 seconds between tests
  });
}

// Check if all required systems are available
function checkConstantIdleSystemAvailability() {
  console.log('\n🔍 CHECKING SYSTEM AVAILABILITY:');
  
  const requiredSystems = [
    { name: 'playEchoAnimation', available: !!window.playEchoAnimation },
    { name: 'forceEchoBaseIdle', available: !!window.forceEchoBaseIdle },
    { name: 'emergencyTPosePrevention', available: !!window.emergencyTPosePrevention },
    { name: 'forceConstantIdle', available: !!window.forceConstantIdle },
    { name: 'getIdleStatus', available: !!window.getIdleStatus },
    { name: 'restartIdleLoop', available: !!window.restartIdleLoop },
    { name: 'synchronizedSpeechAnimationController', available: !!window.synchronizedSpeechAnimationController },
    { name: 'geminiTTS', available: !!window.geminiTTS }
  ];
  
  requiredSystems.forEach(system => {
    console.log(`${system.available ? '✅' : '❌'} ${system.name}: ${system.available ? 'Available' : 'Missing'}`);
  });
  
  const missingCount = requiredSystems.filter(s => !s.available).length;
  if (missingCount > 0) {
    console.warn(`⚠️ ${missingCount} systems missing - some tests may fail`);
  } else {
    console.log('✅ All T-pose prevention systems available!');
  }
}

// Test 1: TTS completion T-pose prevention
function testTTSCompletionTPosePrevention() {
  console.log('🎭 Testing T-pose prevention after TTS completion...');
  
  const testText = "This is a test of T-pose prevention. When this speech ends, the character should smoothly return to idle animations without any T-pose.";
  
  console.log('📝 Test text:', testText);
  console.log('⏰ Expected: Character stays in idle animations after TTS');
  
  if (window.synchronizedSpeechAnimationController && window.geminiTTS) {
    console.log('🎭 Starting TTS with T-pose prevention monitoring...');
    
    // Monitor for T-pose after completion
    setTimeout(() => {
      console.log('🔍 Monitoring post-TTS state...');
      monitorForTPose(10000, 'TTS Completion Test');
    }, 8000); // Start monitoring 8 seconds after TTS starts
    
    window.synchronizedSpeechAnimationController.startSynchronizedSpeech(testText, window.geminiTTS);
    console.log('✅ TTS started - monitoring for T-pose prevention');
    
  } else {
    console.error('❌ TTS systems not available for test');
    fallbackIdleTest();
  }
}

// Test 2: Manual animation end T-pose prevention
function testManualAnimationEndTPosePrevention() {
  console.log('🎭 Testing T-pose prevention after manual animations...');
  
  const testAnimations = ['waving-2', 'clapping', 'happy-hand-gesture', 'head-nod-yes'];
  let animIndex = 0;
  
  function playNextTestAnimation() {
    if (animIndex >= testAnimations.length) {
      console.log('🔍 Manual animation test complete - monitoring for T-pose...');
      monitorForTPose(5000, 'Manual Animation Test');
      return;
    }
    
    const anim = testAnimations[animIndex];
    console.log(`🎭 Playing ${anim} (${animIndex + 1}/${testAnimations.length})`);
    
    if (window.playEchoAnimation) {
      window.playEchoAnimation(anim, 0.8);
      animIndex++;
      
      // Play next animation after 3 seconds
      setTimeout(playNextTestAnimation, 3000);
    } else {
      console.error('❌ Animation function not available');
    }
  }
  
  playNextTestAnimation();
}

// Test 3: Long idle period T-pose prevention
function testLongIdleTPosePrevention() {
  console.log('🛡️ Testing T-pose prevention during long idle periods...');
  
  console.log('⏰ Monitoring for 30 seconds to ensure constant idle...');
  console.log('👁️ Watch: Character should continuously cycle through idle animations');
  
  // Get initial idle status
  if (window.getIdleStatus) {
    const initialStatus = window.getIdleStatus();
    console.log('📊 Initial idle status:', initialStatus);
  }
  
  // Monitor for 30 seconds
  monitorForTPose(30000, 'Long Idle Test');
  
  // Also monitor idle cycling
  monitorIdleCycling(30000);
}

// Test 4: Emergency T-pose prevention functions
function testEmergencyTPosePrevention() {
  console.log('🚨 Testing emergency T-pose prevention functions...');
  
  // Test 1: Emergency T-pose prevention
  if (window.emergencyTPosePrevention) {
    console.log('🚨 Testing emergencyTPosePrevention()...');
    const result1 = window.emergencyTPosePrevention();
    console.log('✅ Emergency T-pose prevention result:', result1);
  }
  
  // Wait 3 seconds
  setTimeout(() => {
    // Test 2: Force constant idle
    if (window.forceConstantIdle) {
      console.log('🛡️ Testing forceConstantIdle()...');
      const result2 = window.forceConstantIdle();
      console.log('✅ Force constant idle result:', result2);
    }
    
    // Wait 3 more seconds
    setTimeout(() => {
      // Test 3: Restart idle loop
      if (window.restartIdleLoop) {
        console.log('🔄 Testing restartIdleLoop()...');
        const result3 = window.restartIdleLoop();
        console.log('✅ Restart idle loop result:', result3);
      }
      
      // Monitor after emergency functions
      setTimeout(() => {
        console.log('🔍 Monitoring after emergency functions...');
        monitorForTPose(8000, 'Emergency Functions Test');
      }, 2000);
      
    }, 3000);
  }, 3000);
}

// Test 5: Constant idle cycling
function testConstantIdleCycling() {
  console.log('🔄 Testing constant idle animation cycling...');
  
  console.log('⏰ Monitoring idle cycling for 45 seconds...');
  console.log('👁️ Expected: Idle animations should change every ~30 seconds');
  
  // Get current idle status
  if (window.getIdleStatus) {
    const status = window.getIdleStatus();
    console.log('📊 Current idle status:', status);
  }
  
  // Monitor cycling for 45 seconds
  monitorIdleCycling(45000);
  
  // Also monitor for T-pose during cycling
  monitorForTPose(45000, 'Idle Cycling Test');
}

// Monitor for T-pose detection
function monitorForTPose(durationMs, testName) {
  console.log(`🔍 Starting T-pose monitoring for ${durationMs}ms (${testName})`);
  
  let tPoseDetected = false;
  let monitorCount = 0;
  const maxMonitors = Math.floor(durationMs / 1000);
  
  const monitorInterval = setInterval(() => {
    monitorCount++;
    
    // Check if character is in T-pose (simplified check)
    let isTPose = false;
    
    if (window.getEchoAnimationState) {
      try {
        const state = window.getEchoAnimationState();
        // Check for T-pose indicators
        if (state.isTPose || 
            (state.activeAnimations && state.activeAnimations.length === 0) ||
            state.currentPose === 'T-pose') {
          isTPose = true;
        }
      } catch (error) {
        console.warn('Warning: Could not check animation state:', error);
      }
    }
    
    if (isTPose) {
      tPoseDetected = true;
      console.error(`❌ T-POSE DETECTED at ${monitorCount}s in ${testName}!`);
      
      // Trigger emergency prevention
      if (window.emergencyTPosePrevention) {
        console.log('🚨 Triggering emergency T-pose prevention...');
        window.emergencyTPosePrevention();
      }
    } else {
      console.log(`✅ ${monitorCount}s: No T-pose detected (${testName})`);
    }
    
    if (monitorCount >= maxMonitors) {
      clearInterval(monitorInterval);
      
      if (tPoseDetected) {
        console.error(`❌ ${testName} FAILED: T-pose was detected`);
      } else {
        console.log(`✅ ${testName} PASSED: No T-pose detected for ${durationMs}ms`);
      }
    }
    
  }, 1000); // Check every second
}

// Monitor idle animation cycling
function monitorIdleCycling(durationMs) {
  console.log(`🔄 Starting idle cycling monitoring for ${durationMs}ms`);
  
  let lastIdleAnimation = '';
  let idleChanges = 0;
  
  const cycleInterval = setInterval(() => {
    if (window.getIdleStatus) {
      try {
        const status = window.getIdleStatus();
        
        if (status.currentIdleAnimation !== lastIdleAnimation) {
          idleChanges++;
          console.log(`🔄 IDLE CHANGE ${idleChanges}: ${lastIdleAnimation} → ${status.currentIdleAnimation}`);
          lastIdleAnimation = status.currentIdleAnimation;
        }
      } catch (error) {
        console.warn('Warning: Could not check idle status:', error);
      }
    }
  }, 2000); // Check every 2 seconds
  
  setTimeout(() => {
    clearInterval(cycleInterval);
    console.log(`🔄 Idle cycling monitoring complete: ${idleChanges} changes detected`);
    
    if (idleChanges > 0) {
      console.log(`✅ Idle cycling working: ${idleChanges} animation changes`);
    } else {
      console.warn(`⚠️ No idle animation changes detected in ${durationMs}ms`);
    }
  }, durationMs);
}

// Fallback idle test if TTS not available
function fallbackIdleTest() {
  console.log('🔄 Running fallback idle test...');
  
  if (window.forceConstantIdle) {
    window.forceConstantIdle();
    console.log('✅ Fallback: Constant idle forced');
  }
  
  setTimeout(() => {
    monitorForTPose(5000, 'Fallback Test');
  }, 1000);
}

// Utility functions
function getTPosePreventionStatus() {
  console.log('\n📊 T-POSE PREVENTION STATUS:');
  console.log('-'.repeat(40));
  
  if (window.getIdleStatus) {
    const idleStatus = window.getIdleStatus();
    console.log('🛡️ Constant Idle System:', idleStatus);
  }
  
  if (window.getEchoAnimationState) {
    try {
      const animState = window.getEchoAnimationState();
      console.log('🎭 Animation State:', {
        isTPose: animState.isTPose || 'Unknown',
        activeAnimations: animState.activeAnimations?.length || 'Unknown',
        currentPose: animState.currentPose || 'Unknown'
      });
    } catch (error) {
      console.log('⚠️ Could not get animation state:', error.message);
    }
  }
  
  if (window.synchronizedSpeechAnimationController) {
    const speechState = window.synchronizedSpeechAnimationController.getState();
    console.log('🎤 Speech Controller:', {
      isSpeaking: speechState.isSpeaking,
      currentAnimation: speechState.currentAnimation
    });
  }
}

// Export functions for manual testing
window.runTPostPreventionTests = runTPostPreventionTests;
window.testTTSCompletionTPosePrevention = testTTSCompletionTPosePrevention;
window.testManualAnimationEndTPosePrevention = testManualAnimationEndTPosePrevention;
window.testLongIdleTPosePrevention = testLongIdleTPosePrevention;
window.testEmergencyTPosePrevention = testEmergencyTPosePrevention;
window.testConstantIdleCycling = testConstantIdleCycling;
window.getTPosePreventionStatus = getTPosePreventionStatus;
window.monitorForTPose = monitorForTPose;

// Ready message
console.log('🛡️ T-Pose Prevention Test Suite Ready!');
console.log('\n💡 Available functions:');
console.log('  • runTPostPreventionTests() - Run all T-pose prevention tests');
console.log('  • testTTSCompletionTPosePrevention() - Test TTS completion');
console.log('  • testManualAnimationEndTPosePrevention() - Test manual animations');
console.log('  • testLongIdleTPosePrevention() - Test long idle periods');
console.log('  • testEmergencyTPosePrevention() - Test emergency functions');
console.log('  • testConstantIdleCycling() - Test idle animation cycling');
console.log('  • getTPosePreventionStatus() - Check current T-pose prevention status');
console.log('\n🚀 Run: runTPostPreventionTests()');
console.log('🔍 Or check status: getTPosePreventionStatus()');
console.log('\n🛡️ T-pose should NEVER occur with this system!'); 