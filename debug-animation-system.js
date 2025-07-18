// Debug Animation System - Enhanced Logging
// Copy paste this into browser console to test animations

function debugAnimationSystem() {
  console.log('🔍 ===== ANIMATION SYSTEM DEBUG STARTED =====');
  
  // 1. Check system status
  console.log('\n1. 🔍 CHECKING SYSTEM STATUS:');
  const status = (window).animationStatus();
  console.log('Status:', status);
  
  if (!status.modelVisible) {
    console.error('❌ Model not visible! Cannot test animations.');
    return;
  }
  
  // 2. Test a simple animation with full logging
  console.log('\n2. 🎯 TESTING SIMPLE ANIMATION (waving-2):');
  console.log('Calling (window).testAnimation("waving-2")...');
  
  try {
    const result = (window).testAnimation('waving-2');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error during test:', error);
  }
  
  // 3. Wait a moment then test another animation
  setTimeout(() => {
    console.log('\n3. 🕺 TESTING DANCE ANIMATION (salsa-dancing):');
    console.log('Calling (window).testAnimation("salsa-dancing")...');
    
    try {
      const result = (window).testAnimation('salsa-dancing');
      console.log('Result:', result);
    } catch (error) {
      console.error('Error during dance test:', error);
    }
  }, 3000);
  
  return 'Debug test initiated - watch console for detailed logs';
}

function quickAnimationTest() {
  console.log('🚀 QUICK ANIMATION TEST');
  
  // Test the most basic animation
  console.log('Testing waving-2...');
  (window).playEchoAnimation('waving-2', 0.8);
  
  return 'Quick test started - should see detailed logs above';
}

function checkAnimationFlow() {
  console.log('🔄 CHECKING FULL ANIMATION FLOW');
  
  // Type "hi" programmatically to test the full flow
  console.log('1. Testing animation service detection...');
  
  // Check if animation service can detect "hi"
  if (typeof window.animationService !== 'undefined') {
    const result = window.animationService.findAnimationForText('hi');
    console.log('Animation service result for "hi":', result);
  } else {
    console.log('Animation service not available on window');
  }
  
  console.log('2. Testing direct playEchoAnimation...');
  (window).playEchoAnimation('waving-2', 0.8);
  
  return 'Animation flow test completed';
}

// Make functions available
window.debugAnimationSystem = debugAnimationSystem;
window.quickAnimationTest = quickAnimationTest;
window.checkAnimationFlow = checkAnimationFlow;

console.log('🛠️ DEBUG FUNCTIONS LOADED:');
console.log('- debugAnimationSystem() - Full system debug');
console.log('- quickAnimationTest() - Quick test');
console.log('- checkAnimationFlow() - Check full flow');
console.log('');
console.log('🎯 RUN: debugAnimationSystem()'); 