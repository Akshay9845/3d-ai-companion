// Disable Three.js DevTools immediately to prevent dispatchEvent errors
if (typeof window !== 'undefined') {
  (window as any).__THREE_DEVTOOLS__ = {
    dispatchEvent: () => {},
    enabled: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    register: () => {},
    unregister: () => {}
  };
}

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import LoadingScreen from './components/LoadingScreen.tsx';
import './index.css';

// Apply global error patches first
import './lib/globalErrorPatches';

// Apply React.lazy patch to fix "Cannot convert object to primitive value" error
import './lib/reactLazyPatch';

// Initialize error monitoring for lazy loading issues
console.log('Echo AI initializing with enhanced lazy loading support...');

function AppWithLoading() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <LoadingScreen progress={progress} onComplete={() => setIsLoading(false)} />;
  }

  return <App />;
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(<AppWithLoading />);
