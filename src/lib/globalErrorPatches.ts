// Global error patches for common issues in 3D applications

// Patch for "Cannot convert object to primitive value" error
const originalValueOf = Object.prototype.valueOf;
Object.prototype.valueOf = function() {
  try {
    return originalValueOf.call(this);
  } catch (error) {
    console.warn('valueOf error caught:', error);
    return this.toString();
  }
};

// Patch for toString errors
const originalToString = Object.prototype.toString;
Object.prototype.toString = function() {
  try {
    return originalToString.call(this);
  } catch (error) {
    console.warn('toString error caught:', error);
    return '[Object]';
  }
};

// Patch for WebGL context lost errors
window.addEventListener('webglcontextlost', (event) => {
  console.warn('WebGL context lost:', event);
  event.preventDefault();
});

window.addEventListener('webglcontextrestored', (event) => {
  console.log('WebGL context restored:', event);
});

// Patch for AudioContext issues
window.addEventListener('beforeunload', () => {
  // Clean up any active audio contexts
  if (window.AudioContext || (window as any).webkitAudioContext) {
    const contexts = (window as any).__audioContexts || [];
    contexts.forEach((ctx: any) => {
      if (ctx && typeof ctx.close === 'function') {
        ctx.close().catch(console.warn);
      }
    });
  }
});

// Global error handler with better categorization
window.addEventListener('error', (event) => {
  const error = event.error;
  const message = error?.message || 'Unknown error';
  
  // Categorize errors for better debugging
  if (message.includes('WebGL') || message.includes('gl')) {
    console.warn('WebGL error (non-critical):', error);
  } else if (message.includes('Audio') || message.includes('audio')) {
    console.warn('Audio error (non-critical):', error);
  } else if (message.includes('fetch') || message.includes('network')) {
    console.warn('Network error:', error);
  } else {
    console.error('Critical error:', error);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason?.message || 'Unknown promise rejection';
  
  // Categorize promise rejections
  if (message.includes('aborted') || message.includes('cancelled')) {
    console.warn('Request aborted (non-critical):', reason);
  } else if (message.includes('network') || message.includes('fetch')) {
    console.warn('Network promise rejection:', reason);
  } else {
    console.error('Unhandled promise rejection:', reason);
  }
});

// Patch for React Three Fiber specific issues
if (typeof window !== 'undefined') {
  (window as any).__THREE_DEVTOOLS__ = {
    dispatchEvent: () => {},
    enabled: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    register: () => {},
    unregister: () => {}
  }; // Comprehensive Three.js devtools mock to prevent dispatchEvent errors
}

console.log('Global error patches applied'); 