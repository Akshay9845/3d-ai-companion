// Test Backward Lean Fix - Copy and paste into browser console
console.log('🎭 TESTING BACKWARD LEAN FIX 🎭');

// Animations that previously caused backward lean
const problematicAnimations = [
  { name: 'salsa-dancing', label: 'Salsa Dancing' },
  { name: 'gangnam-style', label: 'Gangnam Style' },
  { name: 'moonwalk', label: 'Moonwalk' },
  { name: 'locking-hip-hop-dance', label: 'Hip Hop Dancing' },
  { name: 'fighting-idle', label: 'Fighting Stance' },
  { name: 'fight-idle', label: 'Combat Ready' },
  { name: 'fight-idle-1', label: 'Fighting Stance 1' },
  { name: 'fight-idle-2', label: 'Fighting Stance 2' },
  { name: 'fight-idle-3', label: 'Fighting Stance 3' }
];

let currentTestIndex = 0;

function testNextAnimation() {
  if (currentTestIndex >= problematicAnimations.length) {
    console.log('✅ ALL BACKWARD LEAN TESTS COMPLETED');
    console.log('🎭 The character should maintain proper posture in all animations');
    return;
  }

  const animation = problematicAnimations[currentTestIndex];
  console.log(`\n🎭 TEST ${currentTestIndex + 1}/${problematicAnimations.length}: ${animation.label} (${animation.name})`);
  
  // Ensure base idle is active first
  if (window.forceEchoBaseIdle) {
    window.forceEchoBaseIdle();
    console.log('🚫 Base idle forced active');
  }

  // Test the problematic animation
  if (window.playEchoAnimation) {
    try {
      console.log(`🎭 Triggering: ${animation.name}`);
      console.log('🔍 WATCH FOR: No backward lean, proper posture maintained');
      window.playEchoAnimation(animation.name, 2.0); // Long crossfade
      
      console.log('⏱️ Animation playing - observe posture for 8 seconds...');
      console.log('✅ Expected: Character stays upright, no backward tilt');
      console.log('❌ Problem: Character leans backward >30 degrees');
      
      // Move to next test after 8 seconds
      setTimeout(() => {
        currentTestIndex++;
        testNextAnimation();
      }, 8000);
      
    } catch (error) {
      console.error(`❌ Failed to trigger ${animation.name}:`, error);
      currentTestIndex++;
      testNextAnimation();
    }
  } else {
    console.error('❌ playEchoAnimation not available');
    return;
  }
}

// Show current animation configuration for problematic animations
console.log('\n📋 CURRENT ANTI-LEAN SETTINGS:');
problematicAnimations.forEach(anim => {
  console.log(`${anim.label}:`);
  console.log(`  - Weight: 0.5 (very low to blend with happy-idle)`);
  console.log(`  - TimeScale: 1.1-1.4x (faster to prevent extreme poses)`);
  console.log(`  - CrossFade: 2.0s (very long for smooth blending)`);
});

// Check if the model is ready
console.log('\n🎭 CHECKING MODEL STATUS:');
if (window.getEchoAnimationState) {
  const state = window.getEchoAnimationState();
  console.log('Model state:', state);
} else {
  console.log('❌ Model state not available');
}

if (window.forceEchoBaseIdle) {
  window.forceEchoBaseIdle();
  console.log('✅ Base idle ensured');
}

// Start the test sequence
console.log('\n🎭 STARTING BACKWARD LEAN TEST SEQUENCE...');
console.log('Each animation will play for 8 seconds, then move to next');
console.log('Watch the character - they should NOT lean backward!');

setTimeout(() => {
  testNextAnimation();
}, 2000);

// Emergency stop function
window.stopLeanTest = function() {
  currentTestIndex = problematicAnimations.length;
  if (window.forceEchoBaseIdle) {
    window.forceEchoBaseIdle();
  }
  console.log('🛑 Test stopped, returned to base idle');
};

console.log('\n🛑 Type "stopLeanTest()" to stop the test early');
console.log('🎭 Watch carefully for any backward leaning during the test!');

// Debug function to check current animation settings
window.checkAnimationSettings = function(animName) {
  if (window.getCurrentAnimationState) {
    const state = window.getCurrentAnimationState();
    console.log(`Animation "${animName}" current state:`, state);
  }
  return 'Settings checked - see console for details';
};

console.log('\n🔧 Debug function available: checkAnimationSettings("animationName")');
console.log('🎭 Watch for smooth, natural movements without backward leaning!'); 