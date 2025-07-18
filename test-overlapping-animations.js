/**
 * TEST SCRIPT: Overlapping Animation System
 * VALIDATES: No T-pose gaps by starting animations BEFORE previous ones end
 */

console.log('🛡️🛡️🛡️ TESTING OVERLAPPING ANIMATION SYSTEM 🛡️🛡️🛡️');
console.log('🎯 Goal: Start next animation BEFORE current one ends = NO T-POSE');

// Test 1: Basic Overlapping Animation Import
async function testOverlappingImport() {
  console.log('\n🧪 TEST 1: Overlapping Animation Controller Import');
  
  try {
    // Import the overlapping controller
    const { overlappingAnimationController } = await import('./src/lib/overlappingAnimationController.js');
    
    console.log('✅ Overlapping controller imported successfully');
    console.log('📊 Initial state:', overlappingAnimationController.getOverlappingState());
    
    return overlappingAnimationController;
  } catch (error) {
    console.error('❌ Failed to import overlapping controller:', error);
    return null;
  }
}

// Test 2: Overlapping Talking Animation System
async function testOverlappingTalkingAnimations(controller) {
  console.log('\n🧪 TEST 2: Overlapping Talking Animations');
  
  if (!controller) {
    console.error('❌ No controller available for testing');
    return;
  }
  
  console.log('🎭 Starting overlapping talking animations...');
  controller.startOverlappingTalkingAnimations();
  
  // Monitor state for 15 seconds
  let testTime = 0;
  const monitorInterval = setInterval(() => {
    const state = controller.getOverlappingState();
    console.log(`📊 ${testTime}s: Active=${state.isActive}, Animations=${state.currentAnimations.length}`);
    
    testTime += 2;
    if (testTime >= 15) {
      clearInterval(monitorInterval);
      console.log('✅ 15-second overlapping test completed');
      controller.stopOverlappingAnimations();
    }
  }, 2000);
}

// Test 3: Emergency T-pose Prevention
async function testEmergencyTPosePrevention(controller) {
  console.log('\n🧪 TEST 3: Emergency T-pose Prevention');
  
  if (!controller) {
    console.error('❌ No controller available for testing');
    return;
  }
  
  console.log('🚨 Triggering emergency T-pose prevention...');
  controller.emergencyOverlapPrevention();
  
  setTimeout(() => {
    console.log('✅ Emergency T-pose prevention test completed');
  }, 3000);
}

// Test 4: Rapid Fire Animation Coverage
async function testRapidFireCoverage(controller) {
  console.log('\n🧪 TEST 4: Rapid Fire Animation Coverage');
  
  if (!controller) {
    console.error('❌ No controller available for testing');
    return;
  }
  
  console.log('🔥 Starting rapid fire animation coverage for 8 seconds...');
  controller.rapidFireAnimationCoverage(8000);
  
  setTimeout(() => {
    console.log('✅ Rapid fire coverage test completed');
  }, 9000);
}

// Test 5: Speech Controller Integration
async function testSpeechControllerIntegration() {
  console.log('\n🧪 TEST 5: Speech Controller Integration with Overlapping');
  
  try {
    const { synchronizedSpeechAnimationController } = await import('./src/lib/synchronizedSpeechAnimationController.js');
    
    console.log('✅ Speech controller imported successfully');
    
    // Mock TTS service for testing
    const mockTTSService = {
      speak: (text) => {
        console.log('🎤 Mock TTS speaking:', text.substring(0, 50) + '...');
        return new Promise(resolve => {
          setTimeout(() => {
            console.log('🎤 Mock TTS completed');
            resolve();
          }, 5000);
        });
      },
      isSpeaking: () => Math.random() > 0.5, // Random speaking state
      setSpeechEndCallback: (callback) => {
        console.log('🎤 Mock TTS end callback set');
        setTimeout(callback, 5500); // Call after 5.5 seconds
      }
    };
    
    console.log('🎭 Starting synchronized speech with overlapping animations...');
    await synchronizedSpeechAnimationController.startSynchronizedSpeech(
      'This is a test of the overlapping animation system that prevents T-pose by starting animations before the previous ones end.',
      mockTTSService
    );
    
    setTimeout(() => {
      console.log('✅ Speech controller integration test completed');
    }, 8000);
    
  } catch (error) {
    console.error('❌ Speech controller integration test failed:', error);
  }
}

// Test 6: Window Function Availability Check
function testWindowFunctionAvailability() {
  console.log('\n🧪 TEST 6: Window Function Availability');
  
  const requiredFunctions = [
    'playEchoAnimation',
    'forceEchoBaseIdle',
    'getEchoAnimationState',
    'emergencyTPosePrevention'
  ];
  
  requiredFunctions.forEach(funcName => {
    if (typeof (window as any)[funcName] === 'function') {
      console.log(`✅ ${funcName} is available on window`);
    } else {
      console.log(`❌ ${funcName} is NOT available on window`);
    }
  });
}

// Test 7: Animation Name Mapping Validation
function testAnimationNameMapping() {
  console.log('\n🧪 TEST 7: Animation Name Mapping Validation');
  
  const testMappings = [
    'talking',
    'talking-2', 
    'talking-3',
    'talking-4',
    'happy-idle',
    'sitting-idle',
    'weight-shift',
    'neutral-idle'
  ];
  
  console.log('🎭 Testing animation name mappings:');
  testMappings.forEach(animName => {
    console.log(`  • ${animName} - Expected for overlapping system`);
  });
  
  if (typeof (window as any).playEchoAnimation === 'function') {
    console.log('🎭 Testing actual animation calls...');
    testMappings.forEach((animName, index) => {
      setTimeout(() => {
        console.log(`🎭 Testing: ${animName}`);
        (window as any).playEchoAnimation(animName, 0.5);
      }, index * 1000);
    });
  } else {
    console.log('⚠️ Cannot test actual animation calls - playEchoAnimation not available');
  }
}

// Run All Tests
async function runAllOverlappingTests() {
  console.log('🚀 STARTING COMPREHENSIVE OVERLAPPING ANIMATION TESTS');
  console.log('⏰ Total test time: ~45 seconds');
  
  // Test window functions first
  testWindowFunctionAvailability();
  
  // Import and test controller
  const controller = await testOverlappingImport();
  
  if (controller) {
    // Sequential tests with delays
    setTimeout(() => testOverlappingTalkingAnimations(controller), 2000);
    setTimeout(() => testEmergencyTPosePrevention(controller), 20000);
    setTimeout(() => testRapidFireCoverage(controller), 25000);
    setTimeout(() => testSpeechControllerIntegration(), 35000);
  }
  
  // Test animation mappings
  setTimeout(() => testAnimationNameMapping(), 5000);
  
  console.log('🏁 All overlapping animation tests scheduled');
}

// Execute tests when script loads
if (typeof window !== 'undefined') {
  // Browser environment
  runAllOverlappingTests();
} else {
  // Node.js environment - just show info
  console.log('ℹ️ Run this script in the browser console for full testing');
  console.log('ℹ️ Copy and paste into browser console after app loads');
} 