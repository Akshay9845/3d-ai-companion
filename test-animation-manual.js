console.log("🎭 Testing animation system..."); 
if (window.playEchoAnimation) { 
  console.log("✅ playEchoAnimation is available"); 
  window.playEchoAnimation("waving-2", 1.0); 
  console.log("🎭 Triggered waving-2 animation"); 
} else { 
  console.log("❌ playEchoAnimation is NOT available"); 
}
