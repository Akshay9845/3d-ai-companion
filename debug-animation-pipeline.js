// Debug Animation Pipeline Test
console.log('🎭🎭🎭 DEBUGGING ANIMATION PIPELINE 🎭🎭🎭');

// Test 1: Check if playEchoAnimation is available
console.log('\n=== TEST 1: playEchoAnimation Availability ===');
if (window.playEchoAnimation) {
  console.log('✅ playEchoAnimation is available on window');
  console.log('Function type:', typeof window.playEchoAnimation);
} else {
  console.log('❌ playEchoAnimation is NOT available on window');
  console.log('Available window functions:', Object.keys(window).filter(key => key.includes('Echo') || key.includes('animation')));
}

// Test 2: Check animation service
console.log('\n=== TEST 2: Animation Service Test ===');
const testInputs = ['hi', 'hello', 'what can you do'];

for (const input of testInputs) {
  console.log(`\n--- Testing input: "${input}" ---`);
  
  // Import animation service dynamically
  import('./src/lib/animationService.js').then(({ animationService }) => {
    console.log('Animation service imported successfully');
    
    // Test finding animation
    const result = animationService.findAnimationForText(input);
    console.log('Animation result:', result);
    
    if (result.animation) {
      console.log('✅ Animation found:', result.animation.path);
      console.log('Category:', result.category);
      console.log('Duration:', result.animation.duration);
      console.log('TimeScale:', result.animation.timeScale);
    } else {
      console.log('❌ No animation found for:', input);
    }
    
    // Test explicit request detection
    const isExplicit = animationService.isExplicitAnimationRequest ? animationService.isExplicitAnimationRequest(input.toLowerCase()) : 'Function not available';
    console.log('Is explicit animation request:', isExplicit);
    
    // Test action words detection
    const hasActionWords = animationService.hasActionWords(input);
    console.log('Has action words:', hasActionWords);
    
    // Test action category
    const actionCategory = animationService.getActionCategory(input);
    console.log('Action category:', actionCategory);
    
  }).catch(error => {
    console.error('❌ Failed to import animation service:', error);
  });
}

// Test 3: Manual animation trigger
console.log('\n=== TEST 3: Manual Animation Trigger ===');
if (window.playEchoAnimation) {
  console.log('🎭 Attempting to trigger waving-2 animation manually...');
  try {
    window.playEchoAnimation('waving-2', 1.0);
    console.log('✅ Manual animation trigger successful');
  } catch (error) {
    console.error('❌ Manual animation trigger failed:', error);
  }
} else {
  console.log('❌ Cannot test manual trigger - playEchoAnimation not available');
}

// Test 4: Check TTS service
console.log('\n=== TEST 4: TTS Service Check ===');
if (window.geminiTTS) {
  console.log('✅ geminiTTS is available');
  console.log('TTS service type:', window.geminiTTS.constructor.name);
  console.log('Is speaking method available:', typeof window.geminiTTS.speak);
} else {
  console.log('❌ geminiTTS is NOT available');
}

// Test 5: Check enhanced chat integration
console.log('\n=== TEST 5: Enhanced Chat Integration Test ===');
import('./src/lib/enhancedChatIntegrationService.js').then(({ enhancedChatIntegrationService }) => {
  console.log('Enhanced chat integration service imported');
  
  // Test processing user input
  enhancedChatIntegrationService.processUserInput('hi').then(result => {
    console.log('Chat integration result for "hi":', result);
    console.log('Should speak:', result.shouldSpeak);
    console.log('Has animation:', !!result.animation);
    if (result.animation) {
      console.log('Animation details:', result.animation);
    }
  }).catch(error => {
    console.error('❌ Chat integration test failed:', error);
  });
  
}).catch(error => {
  console.error('❌ Failed to import enhanced chat integration:', error);
});

// Test 6: Check current animation state
console.log('\n=== TEST 6: Current Animation State ===');
if (window.getEchoAnimationState) {
  console.log('✅ getEchoAnimationState is available');
  try {
    const state = window.getEchoAnimationState();
    console.log('Current animation state:', state);
  } catch (error) {
    console.error('❌ Failed to get animation state:', error);
  }
} else {
  console.log('❌ getEchoAnimationState is NOT available');
}

// Test 7: Force base idle (to ensure model is not in T-pose)
console.log('\n=== TEST 7: Force Base Idle Test ===');
if (window.forceEchoBaseIdle) {
  console.log('✅ forceEchoBaseIdle is available');
  try {
    window.forceEchoBaseIdle();
    console.log('✅ Base idle forced successfully');
  } catch (error) {
    console.error('❌ Failed to force base idle:', error);
  }
} else {
  console.log('❌ forceEchoBaseIdle is NOT available');
}

console.log('\n🎭🎭🎭 DEBUG PIPELINE TEST COMPLETE 🎭🎭🎭');
console.log('Copy and paste this entire script into your browser console to run the test'); 