// Comprehensive Animation System Test
// Run this in browser console to test all animations

function testAllAnimations() {
  console.log('🎭 COMPREHENSIVE ANIMATION SYSTEM TEST 🎭');
  console.log('===============================================');
  
  // Test system status first
  const status = (window).animationStatus();
  console.log('📊 System Status:', status);
  
  if (!status.modelVisible) {
    console.error('❌ Model not visible - wait for loading');
    return;
  }
  
  // Define all animations by category
  const animations = {
    'Dance & Movement': [
      'salsa-dancing', 'gangnam-style', 'moonwalk', 'locking-hip-hop-dance',
      'happy-walk', 'jump', 'excited', 'happy'
    ],
    'Exercise & Fitness': [
      'warming-up', 'push-up', 'plank', 'end-plank', 'air-squat', 
      'idle-to-push-up', 'idle-to-situp'
    ],
    'Fighting & Combat': [
      'fighting-idle', 'fight-idle', 'fight-idle-1', 'fight-idle-2',
      'fight-idle-3', 'angry-gesture', 'being-cocky', 'dismissing-gesture', 'defeat'
    ],
    'Gestures & Social': [
      'waving-2', 'waving-3', 'waving-4', 'waving-gesture-3', 'standing-greeting',
      'quick-formal-bow', 'quick-informal-bow', 'clapping', 'reacting', 'weight-shift'
    ],
    'Talking & Communication': [
      'talking', 'talking-2', 'talking-3', 'talking-4', 'head-nod-yes',
      'shaking-head-no', 'no', 'look-away-gesture', 'sarcastic-head-nod', 'annoyed-head-shake'
    ],
    'Teaching & Education': [
      'acknowledging', 'happy-hand-gesture', 'looking', 'lengthy-head-nod', 'hard-head-nod'
    ],
    'Emotional Expressions': [
      'relieved-sigh', 'thoughtful-head-shake', 'yawn'
    ],
    'Sitting & Positions': [
      'sitting-idle', 'male-sitting-pose', 'male-sitting-pose-2'
    ]
  };
  
  let totalAnimations = 0;
  let successCount = 0;
  let failedAnimations = [];
  
  // Test each category
  Object.entries(animations).forEach(([category, animList]) => {
    console.log(`\n🎯 Testing ${category} (${animList.length} animations):`);
    
    animList.forEach(animName => {
      totalAnimations++;
      try {
        const result = (window).testAnimation(animName);
        console.log(`  ✅ ${animName}: ${result}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ ${animName}: FAILED - ${error.message}`);
        failedAnimations.push(animName);
      }
    });
  });
  
  // Final summary
  console.log('\n🎭 FINAL TEST RESULTS 🎭');
  console.log('===========================');
  console.log(`📊 Total Animations Tested: ${totalAnimations}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failedAnimations.length}`);
  console.log(`📈 Success Rate: ${((successCount / totalAnimations) * 100).toFixed(1)}%`);
  
  if (failedAnimations.length > 0) {
    console.log('\n❌ Failed Animations:');
    failedAnimations.forEach(anim => console.log(`  - ${anim}`));
  } else {
    console.log('\n🎉 ALL ANIMATIONS WORKING PERFECTLY! 🎉');
  }
  
  return {
    total: totalAnimations,
    successful: successCount,
    failed: failedAnimations.length,
    failedList: failedAnimations,
    successRate: `${((successCount / totalAnimations) * 100).toFixed(1)}%`
  };
}

// Test chat integration
function testChatAnimations() {
  console.log('\n🎤 CHAT INTEGRATION TEST 🎤');
  console.log('================================');
  
  const chatTests = [
    { input: 'hi', expected: 'waving-2', category: 'greeting' },
    { input: 'dance', expected: 'salsa-dancing', category: 'dance' },
    { input: 'jump', expected: 'jump', category: 'movement' },
    { input: 'fight', expected: 'fighting-idle', category: 'combat' },
    { input: 'exercise', expected: 'warming-up', category: 'fitness' },
    { input: 'yes', expected: 'head-nod-yes', category: 'communication' },
    { input: 'talk', expected: 'talking', category: 'speech' }
  ];
  
  console.log('To test chat integration, type these in the chat:');
  chatTests.forEach(test => {
    console.log(`  💬 "${test.input}" → should trigger ${test.expected} (${test.category})`);
  });
  
  console.log('\nWatch console for these logs:');
  console.log('  🎯 Animation Mapping: "input" → category:animation-name');
  console.log('  🎭 Animation service callback triggered');
  console.log('  🎭 SIMPLE: ===== PLAYING ANIMATION: animation-name =====');
}

// Quick system check
function quickCheck() {
  const status = (window).animationStatus();
  const hasTestFunction = typeof (window).testAnimation === 'function';
  const hasPlayFunction = typeof (window).playEchoAnimation === 'function';
  
  console.log('🔍 QUICK SYSTEM CHECK 🔍');
  console.log('==========================');
  console.log('✅ Model visible:', status.modelVisible);
  console.log('✅ Mixer available:', status.mixerExists);
  console.log('✅ Loader available:', status.loaderExists);
  console.log('✅ Test function:', hasTestFunction);
  console.log('✅ Play function:', hasPlayFunction);
  console.log('✅ Current animation:', status.currentAnimation);
  
  if (status.modelVisible && hasTestFunction && hasPlayFunction) {
    console.log('🎉 System ready for animation testing!');
    return true;
  } else {
    console.log('⚠️ System not ready - check the issues above');
    return false;
  }
}

// Export functions to window for easy access
window.testAllAnimations = testAllAnimations;
window.testChatAnimations = testChatAnimations;
window.quickCheck = quickCheck;

console.log('🎭 Animation Test Functions Loaded! 🎭');
console.log('=====================================');
console.log('Available functions:');
console.log('  quickCheck()        - Quick system status');
console.log('  testAllAnimations() - Test all 56 animations');
console.log('  testChatAnimations() - Show chat integration tests');
console.log('  (window).testAnimation("name") - Test specific animation');
console.log('  (window).animationStatus() - Get system status'); 