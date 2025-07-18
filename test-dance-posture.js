// Test Dance Posture Fix
// Copy paste this into browser console to test the improved salsa dancing

function testDancePosture() {
  console.log('🕺 TESTING IMPROVED SALSA DANCE POSTURE');
  console.log('=====================================');
  
  // 1. Fix any existing posture issues
  console.log('1. 🎭 Fixing model posture...');
  if ((window).fixModelPosture) {
    const result = (window).fixModelPosture();
    console.log('Posture fix result:', result);
  }
  
  // 2. Wait a moment then test the improved salsa dance
  setTimeout(() => {
    console.log('2. 🕺 Testing improved salsa dancing...');
    console.log('   - Weight: 0.8 (blends with idle)');
    console.log('   - TimeScale: 0.4 (faster, less extreme poses)');
    console.log('   - CrossFade: 1.5s (smoother transition)');
    
    (window).testAnimation('salsa-dancing');
    
    console.log('✅ Improved salsa dance started!');
    console.log('👁️  Watch for:');
    console.log('   - Less backward lean');
    console.log('   - Smoother blending with idle pose');
    console.log('   - More natural body positioning');
    
  }, 1000);
  
  return 'Dance posture test initiated - should be less backward lean now!';
}

function testDanceComparison() {
  console.log('🔄 TESTING DANCE IMPROVEMENTS');
  
  // Test the dance and provide feedback instructions
  (window).testAnimation('salsa-dancing');
  
  console.log('📋 CHECK LIST:');
  console.log('✅ Model should stay more upright');
  console.log('✅ Less 60-degree backward lean');
  console.log('✅ Smoother hip movements');
  console.log('✅ Better arm positioning');
  console.log('');
  console.log('🛠️ If still leaning, run: (window).fixModelPosture()');
  
  return 'Dance comparison test running - check the improvements!';
}

// Make functions available
window.testDancePosture = testDancePosture;
window.testDanceComparison = testDanceComparison;

console.log('🕺 DANCE POSTURE TEST FUNCTIONS LOADED');
console.log('====================================');
console.log('Available functions:');
console.log('- testDancePosture() - Test improved dance with posture fix');
console.log('- testDanceComparison() - Compare dance improvements');
console.log('- (window).fixModelPosture() - Emergency posture reset');
console.log('');
console.log('🎯 RUN: testDancePosture()'); 