// COMPREHENSIVE TALKING LOOP DIAGNOSIS
console.log('\n🔍 TALKING LOOP DIAGNOSIS - FINDING THE PROBLEM');
console.log('='.repeat(60));

// Diagnosis function
function diagnoseTalkingLoopIssues() {
  console.log('🔍 DIAGNOSING TALKING ANIMATION LOOP ISSUES...');
  console.log('\n📋 CHECKING EACH COMPONENT:');
  
  const diagnosis = {
    issues: [],
    systems: {},
    recommendations: []
  };
  
  // 1. Check if global functions exist
  console.log('\n1️⃣ CHECKING GLOBAL FUNCTIONS:');
  const globalFunctions = [
    'playEchoAnimation',
    'forceEchoBaseIdle', 
    'getEchoAnimationState',
    'synchronizedSpeechAnimationController',
    'geminiTTS',
    'emergencyTPosePrevention',
    'constantIdleAnimationController'
  ];
  
  globalFunctions.forEach(func => {
    const exists = !!window[func];
    diagnosis.systems[func] = exists;
    console.log(`${exists ? '✅' : '❌'} ${func}: ${exists ? 'Available' : 'MISSING'}`);
    
    if (!exists) {
      diagnosis.issues.push(`Missing critical function: ${func}`);
    }
  });
  
  // 2. Test playEchoAnimation directly
  console.log('\n2️⃣ TESTING playEchoAnimation DIRECTLY:');
  if (window.playEchoAnimation) {
    try {
      console.log('🧪 Testing direct animation call...');
      const result = window.playEchoAnimation('talking', 0.8);
      console.log('✅ playEchoAnimation result:', result);
      
      // Check if animation actually started
      setTimeout(() => {
        if (window.getEchoAnimationState) {
          const state = window.getEchoAnimationState();
          console.log('📊 Animation state after direct call:', state);
          
          if (state.currentAnimation !== 'talking') {
            diagnosis.issues.push('Animation not actually playing despite successful call');
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ playEchoAnimation error:', error);
      diagnosis.issues.push(`playEchoAnimation error: ${error.message}`);
    }
  } else {
    diagnosis.issues.push('playEchoAnimation function not available');
  }
  
  // 3. Check TTS service
  console.log('\n3️⃣ CHECKING TTS SERVICE:');
  if (window.geminiTTS) {
    console.log('✅ TTS service exists');
    
    // Check TTS methods
    const ttsMethods = ['speak', 'isSpeaking', 'setSpeechEndCallback', 'stopAudio'];
    ttsMethods.forEach(method => {
      const hasMethod = typeof window.geminiTTS[method] === 'function';
      console.log(`${hasMethod ? '✅' : '❌'} TTS.${method}: ${hasMethod ? 'Available' : 'Missing'}`);
      
      if (!hasMethod) {
        diagnosis.issues.push(`TTS missing method: ${method}`);
      }
    });
    
  } else {
    diagnosis.issues.push('TTS service not available');
  }
  
  // 4. Check synchronized speech controller
  console.log('\n4️⃣ CHECKING SYNCHRONIZED SPEECH CONTROLLER:');
  if (window.synchronizedSpeechAnimationController) {
    console.log('✅ Speech controller exists');
    
    try {
      const state = window.synchronizedSpeechAnimationController.getState();
      console.log('📊 Current speech state:', state);
      
      const methods = ['startSynchronizedSpeech', 'isCurrentlySpeaking', 'forceStop'];
      methods.forEach(method => {
        const hasMethod = typeof window.synchronizedSpeechAnimationController[method] === 'function';
        console.log(`${hasMethod ? '✅' : '❌'} SpeechController.${method}: ${hasMethod ? 'Available' : 'Missing'}`);
      });
      
    } catch (error) {
      console.error('❌ Speech controller error:', error);
      diagnosis.issues.push(`Speech controller error: ${error.message}`);
    }
    
  } else {
    diagnosis.issues.push('Synchronized speech controller not available');
  }
  
  // 5. Check constant idle system
  console.log('\n5️⃣ CHECKING CONSTANT IDLE SYSTEM:');
  if (window.getIdleStatus) {
    try {
      const idleStatus = window.getIdleStatus();
      console.log('✅ Constant idle system active:', idleStatus);
    } catch (error) {
      console.error('❌ Constant idle system error:', error);
      diagnosis.issues.push(`Constant idle system error: ${error.message}`);
    }
  } else {
    diagnosis.issues.push('Constant idle system not initialized');
  }
  
  // 6. Check current animation state
  console.log('\n6️⃣ CHECKING CURRENT ANIMATION STATE:');
  if (window.getEchoAnimationState) {
    try {
      const animState = window.getEchoAnimationState();
      console.log('📊 Current animation state:', animState);
      
      if (animState.isTPose) {
        diagnosis.issues.push('Character is currently in T-pose');
        console.error('❌ CHARACTER IS IN T-POSE RIGHT NOW!');
      }
      
      if (!animState.currentAnimation || animState.currentAnimation === '') {
        diagnosis.issues.push('No current animation active');
      }
      
    } catch (error) {
      console.error('❌ Animation state error:', error);
      diagnosis.issues.push(`Animation state error: ${error.message}`);
    }
  } else {
    diagnosis.issues.push('Cannot check animation state - function missing');
  }
  
  // 7. Generate recommendations
  console.log('\n7️⃣ GENERATING RECOMMENDATIONS:');
  
  if (diagnosis.issues.length === 0) {
    console.log('✅ No critical issues found - system should work');
    diagnosis.recommendations.push('Try running a talking loop test');
  } else {
    console.log(`❌ Found ${diagnosis.issues.length} critical issues:`);
    diagnosis.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    
    // Generate specific recommendations
    if (!diagnosis.systems.playEchoAnimation) {
      diagnosis.recommendations.push('CRITICAL: EchoModel component not properly loaded - refresh page');
    }
    
    if (!diagnosis.systems.synchronizedSpeechAnimationController) {
      diagnosis.recommendations.push('CRITICAL: Speech controller not initialized - check imports');
    }
    
    if (!diagnosis.systems.geminiTTS) {
      diagnosis.recommendations.push('CRITICAL: TTS service not available - check initialization');
    }
    
    if (!diagnosis.systems.emergencyTPosePrevention) {
      diagnosis.recommendations.push('WARNING: Emergency T-pose prevention not available');
    }
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  diagnosis.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });
  
  return diagnosis;
}

// Test the actual talking loop step by step
function testTalkingLoopStepByStep() {
  console.log('\n🧪 STEP-BY-STEP TALKING LOOP TEST');
  console.log('='.repeat(50));
  
  let step = 0;
  
  function nextStep(description, testFunction, delay = 2000) {
    step++;
    setTimeout(() => {
      console.log(`\n🧪 STEP ${step}: ${description}`);
      console.log('-'.repeat(30));
      try {
        testFunction();
        console.log(`✅ STEP ${step} completed`);
      } catch (error) {
        console.error(`❌ STEP ${step} failed:`, error);
      }
    }, (step - 1) * delay);
  }
  
  // Step 1: Force base idle
  nextStep('Force base idle to ensure starting point', () => {
    if (window.forceEchoBaseIdle) {
      window.forceEchoBaseIdle();
      console.log('🛡️ Base idle forced');
    } else {
      throw new Error('forceEchoBaseIdle not available');
    }
  });
  
  // Step 2: Test single talking animation
  nextStep('Test single talking animation', () => {
    if (window.playEchoAnimation) {
      const result = window.playEchoAnimation('talking', 0.8);
      console.log('🎭 Single talking animation result:', result);
      
      // Check if it worked
      setTimeout(() => {
        if (window.getEchoAnimationState) {
          const state = window.getEchoAnimationState();
          console.log('📊 State after single talking:', state);
        }
      }, 500);
    } else {
      throw new Error('playEchoAnimation not available');
    }
  });
  
  // Step 3: Test animation cycling
  nextStep('Test manual animation cycling', () => {
    const talkingAnimations = ['talking', 'talking-2', 'talking-3', 'talking-4'];
    let cycleIndex = 0;
    
    function cycleTalking() {
      if (cycleIndex >= 4) {
        console.log('🎭 Manual cycling complete');
        return;
      }
      
      const anim = talkingAnimations[cycleIndex];
      console.log(`🎭 Cycling to: ${anim}`);
      
      if (window.playEchoAnimation) {
        window.playEchoAnimation(anim, 0.8);
        cycleIndex++;
        
        if (cycleIndex < 4) {
          setTimeout(cycleTalking, 3000); // 3 second intervals
        }
      }
    }
    
    cycleTalking();
  });
  
  // Step 4: Test TTS detection
  nextStep('Test TTS service', () => {
    if (window.geminiTTS) {
      console.log('🎤 TTS service available');
      console.log('🎤 TTS methods:', Object.getOwnPropertyNames(window.geminiTTS.__proto__));
      
      if (typeof window.geminiTTS.isSpeaking === 'function') {
        const isSpeaking = window.geminiTTS.isSpeaking();
        console.log('🎤 TTS currently speaking:', isSpeaking);
      }
    } else {
      throw new Error('TTS service not available');
    }
  }, 15000); // Longer delay for cycling
  
  // Step 5: Test synchronized speech controller
  nextStep('Test synchronized speech controller', () => {
    if (window.synchronizedSpeechAnimationController) {
      const testText = "This is a short test to see if the talking loop works.";
      console.log('🎭 Testing synchronized speech with short text...');
      
      // Monitor the process
      const startTime = Date.now();
      let monitorCount = 0;
      
      const monitor = setInterval(() => {
        monitorCount++;
        const elapsed = Date.now() - startTime;
        
        if (window.synchronizedSpeechAnimationController.isCurrentlySpeaking()) {
          const state = window.synchronizedSpeechAnimationController.getState();
          console.log(`🔍 Monitor ${monitorCount} (${Math.round(elapsed/1000)}s): Speaking - ${state.currentAnimation}`);
        } else {
          console.log(`🔍 Monitor ${monitorCount} (${Math.round(elapsed/1000)}s): Not speaking`);
          
          if (elapsed > 5000) { // After 5 seconds, stop monitoring
            clearInterval(monitor);
            console.log('🎭 Synchronized speech test complete');
          }
        }
      }, 1000);
      
      // Start the test
      window.synchronizedSpeechAnimationController.startSynchronizedSpeech(testText, window.geminiTTS);
      
    } else {
      throw new Error('Synchronized speech controller not available');
    }
  }, 20000);
}

// Comprehensive system status
function getComprehensiveSystemStatus() {
  console.log('\n📊 COMPREHENSIVE SYSTEM STATUS');
  console.log('='.repeat(50));
  
  // Animation system
  console.log('\n🎭 ANIMATION SYSTEM:');
  if (window.getEchoAnimationState) {
    const state = window.getEchoAnimationState();
    console.log('  Current Animation:', state.currentAnimation || 'NONE');
    console.log('  Is T-Pose:', state.isTPose || false);
    console.log('  Active Animations:', state.activeAnimations?.length || 0);
    console.log('  Model Visible:', state.isModelVisible);
    console.log('  Mixer Available:', state.mixer);
    console.log('  Loader Available:', state.loader);
  } else {
    console.log('  ❌ Animation state not available');
  }
  
  // Speech system
  console.log('\n🎤 SPEECH SYSTEM:');
  if (window.synchronizedSpeechAnimationController) {
    const state = window.synchronizedSpeechAnimationController.getState();
    console.log('  Is Speaking:', state.isSpeaking);
    console.log('  Current Animation:', state.currentAnimation);
    console.log('  Speech Start Time:', state.speechStartTime || 'None');
    console.log('  Estimated Duration:', state.estimatedDuration || 'None');
  } else {
    console.log('  ❌ Speech controller not available');
  }
  
  // TTS system
  console.log('\n🔊 TTS SYSTEM:');
  if (window.geminiTTS) {
    console.log('  TTS Service:', 'Available');
    if (typeof window.geminiTTS.isSpeaking === 'function') {
      console.log('  Currently Speaking:', window.geminiTTS.isSpeaking());
    }
  } else {
    console.log('  ❌ TTS service not available');
  }
  
  // Idle system
  console.log('\n🛡️ IDLE SYSTEM:');
  if (window.getIdleStatus) {
    const idleStatus = window.getIdleStatus();
    console.log('  Idle Active:', idleStatus.isIdleActive);
    console.log('  Current Idle:', idleStatus.currentIdleAnimation);
    console.log('  Last Change:', new Date(idleStatus.lastIdleChange).toLocaleTimeString());
  } else {
    console.log('  ❌ Idle system not available');
  }
}

// Export functions
window.diagnoseTalkingLoopIssues = diagnoseTalkingLoopIssues;
window.testTalkingLoopStepByStep = testTalkingLoopStepByStep;
window.getComprehensiveSystemStatus = getComprehensiveSystemStatus;

// Auto-run diagnosis
console.log('🔍 RUNNING AUTOMATIC DIAGNOSIS...');
diagnoseTalkingLoopIssues();

console.log('\n💡 AVAILABLE DIAGNOSIS FUNCTIONS:');
console.log('  • diagnoseTalkingLoopIssues() - Find problems');
console.log('  • testTalkingLoopStepByStep() - Test each component');
console.log('  • getComprehensiveSystemStatus() - Check all systems');
console.log('\n🚀 Run: testTalkingLoopStepByStep() for detailed testing'); 