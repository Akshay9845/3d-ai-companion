// Quick Animation Test - Copy and paste this into browser console
console.log('🎭 QUICK ANIMATION TEST - Copy this into browser console 🎭');

// Test the 3 most critical issues:

// 1. Is playEchoAnimation available?
console.log('\n1. 🎭 playEchoAnimation availability:');
if (window.playEchoAnimation) {
  console.log('✅ Available - trying manual trigger...');
  window.playEchoAnimation('waving-2', 1.0);
  console.log('✅ Manual waving-2 triggered (should see animation now)');
} else {
  console.log('❌ NOT AVAILABLE - This is the main issue!');
  console.log('Available window methods:', Object.keys(window).filter(key => key.toLowerCase().includes('echo')));
}

// 2. Test animation service directly 
console.log('\n2. 🎭 Testing animation service for "hi":');
// Simple test without import
try {
  // Check if animation service is available globally
  if (window.animationService) {
    const result = window.animationService.findAnimationForText('hi');
    console.log('Animation service result:', result);
  } else {
    console.log('❌ Animation service not available globally');
  }
} catch (error) {
  console.log('❌ Animation service test failed:', error.message);
}

// 3. Check 3D model state
console.log('\n3. 🎭 3D model state:');
if (window.getEchoAnimationState) {
  console.log('✅ Model state available:', window.getEchoAnimationState());
} else {
  console.log('❌ Model state not available');
}

// 4. Force base idle to ensure model is active
console.log('\n4. 🎭 Ensuring model is active:');
if (window.forceEchoBaseIdle) {
  window.forceEchoBaseIdle();
  console.log('✅ Base idle forced');
} else {
  console.log('❌ Base idle function not available');
}

// 5. Quick TTS test
console.log('\n5. 🎭 TTS availability:');
if (window.geminiTTS && window.geminiTTS.speak) {
  console.log('✅ TTS available');
} else {
  console.log('❌ TTS not available');
}

console.log('\n🎭 QUICK TEST COMPLETE - Check the results above! 🎭'); 