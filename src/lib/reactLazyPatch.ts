// React lazy loading patch to fix "Cannot convert object to primitive value" error

import React from 'react';

// Store original React.lazy
const originalLazy = React.lazy;

// Enhanced lazy wrapper that handles errors better
React.lazy = function<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return originalLazy(() => {
    return factory().catch(error => {
      console.error('Lazy loading error:', error);
      // Return a fallback component instead of throwing
      return {
        default: (() => {
          return React.createElement('div', {
            style: { 
              color: 'red', 
              padding: '20px',
              textAlign: 'center'
            }
          }, `Failed to load component: ${error.message}`);
        }) as T
      };
    });
  });
};

console.log('React lazy patch applied'); 