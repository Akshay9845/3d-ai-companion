// Emergency Backward Lean Fix - Copy and paste into browser console if lean issues persist
console.log('🚨 EMERGENCY BACKWARD LEAN FIX 🚨');

// Immediate posture correction
function fixPostureNow() {
  console.log('🔧 IMMEDIATE POSTURE FIX');
  
  // Force base idle to correct posture
  if (window.forceEchoBaseIdle) {
    window.forceEchoBaseIdle();
    console.log('✅ Base idle forced active');
  }
  
  // Emergency posture reset
  if (window.getEchoAnimationState) {
    const state = window.getEchoAnimationState();
    console.log('Current state before fix:', state);
  }
  
  // Try multiple correction methods
  setTimeout(() => {
    if (window.resetEchoAnimations) {
      window.resetEchoAnimations();
      console.log('✅ Animation state reset');
    }
  }, 500);
  
  setTimeout(() => {
    if (window.forceEchoBaseIdle) {
      window.forceEchoBaseIdle();
      console.log('✅ Second base idle force');
    }
  }, 1000);
  
  console.log('🎭 Posture should now be corrected');
}

// Run immediate fix
fixPostureNow();

// Create safe animation player with anti-lean protection
window.safePlayAnimation = function(animationName, blendDuration = 2.0) {
  console.log(`🛡️ SAFE PLAY: ${animationName} with anti-lean protection`);
  
  // Ensure base idle is active first
  if (window.forceEchoBaseIdle) {
    window.forceEchoBaseIdle();
  }
  
  // Play with maximum blending for safety
  if (window.playEchoAnimation) {
    window.playEchoAnimation(animationName, Math.max(blendDuration, 2.0));
    console.log(`✅ ${animationName} playing with ${Math.max(blendDuration, 2.0)}s crossfade`);
    
    // Monitor for lean and auto-correct
    const monitorLean = setInterval(() => {
      // Auto-correct after 3 seconds if needed
      if (window.forceEchoBaseIdle) {
        window.forceEchoBaseIdle(); // Subtle correction
      }
    }, 3000);
    
    // Stop monitoring after 10 seconds
    setTimeout(() => {
      clearInterval(monitorLean);
    }, 10000);
    
  } else {
    console.error('❌ playEchoAnimation not available');
  }
};

// Test problematic animations with safety
window.testProblematicSafely = function() {
  console.log('🧪 TESTING PROBLEMATIC ANIMATIONS SAFELY');
  
  const problematicAnims = [
    'salsa-dancing', 
    'gangnam-style', 
    'moonwalk', 
    'locking-hip-hop-dance',
    'fighting-idle',
    'fight-idle'
  ];
  
  let index = 0;
  
  function testNext() {
    if (index >= problematicAnims.length) {
      console.log('✅ Safe testing complete');
      return;
    }
    
    const anim = problematicAnims[index];
    console.log(`🧪 Safe testing: ${anim}`);
    
    // Use safe player
    window.safePlayAnimation(anim, 2.5);
    
    index++;
    setTimeout(testNext, 8000);
  }
  
  testNext();
};

// Ultra-conservative dance mode
window.ultraConservativeDance = function(animationName) {
  console.log(`🐌 ULTRA-CONSERVATIVE MODE: ${animationName}`);
  
  // Force base idle
  if (window.forceEchoBaseIdle) {
    window.forceEchoBaseIdle();
  }
  
  // Play with maximum safety
  if (window.playEchoAnimation) {
    window.playEchoAnimation(animationName, 3.0); // Very long crossfade
    
    // Constant posture monitoring
    const postureMonitor = setInterval(() => {
      if (window.forceEchoBaseIdle) {
        window.forceEchoBaseIdle(); // Constant correction
      }
    }, 1000);
    
    // Stop after 15 seconds
    setTimeout(() => {
      clearInterval(postureMonitor);
      if (window.forceEchoBaseIdle) {
        window.forceEchoBaseIdle();
      }
      console.log('🎭 Ultra-conservative mode complete');
    }, 15000);
  }
};

// Quick commands
console.log('\n🎮 EMERGENCY COMMANDS AVAILABLE:');
console.log('fixPostureNow() - Immediate posture correction');
console.log('safePlayAnimation("animationName") - Play with anti-lean protection');
console.log('testProblematicSafely() - Test all problematic animations safely');
console.log('ultraConservativeDance("animationName") - Maximum safety mode');

console.log('\n🎭 USAGE EXAMPLES:');
console.log('safePlayAnimation("salsa-dancing")');
console.log('ultraConservativeDance("fighting-idle")');
console.log('testProblematicSafely()');

console.log('\n✅ Emergency lean fix tools ready!');
console.log('🛡️ Use these if you still see backward leaning'); 