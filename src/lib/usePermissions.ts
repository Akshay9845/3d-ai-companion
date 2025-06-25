import { useState, useEffect, useCallback } from 'react';

// Permission types
type PermissionName =
  | 'camera'
  | 'microphone'
  | 'geolocation'
  | 'notifications'
  | 'persistent-storage';

// Permission states
export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

// Permission storage interface
interface PermissionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Storage implementation - uses localStorage by default, but can be replaced
const defaultStorage: PermissionStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Failed to store permission preference:', e);
    }
  },
};

/**
 * Hook for managing permissions
 * @param permissionType Type of permission to request ('camera', 'microphone', etc.)
 * @param options Configuration options
 * @returns Permission state and control functions
 */
export function usePermissions(
  permissionType: PermissionName,
  options = {
    storage: defaultStorage,
    storageKey: `permission_${permissionType}`,
    autoRequest: false,
  }
) {
  const [permissionState, setPermissionState] =
    useState<PermissionState>('prompt');
  const [isChecking, setIsChecking] = useState(false);

  // Check if permissions API is available
  const isPermissionsApiAvailable = useCallback(() => {
    return !!(navigator.permissions && navigator.permissions.query);
  }, []);

  // Check permission status
  const checkPermission = useCallback(async () => {
    setIsChecking(true);

    try {
      // Check if we have a stored preference
      const storedPreference = options.storage.getItem(options.storageKey);

      if (!isPermissionsApiAvailable()) {
        // If permissions API isn't available, use stored preference as best guess
        if (storedPreference) {
          setPermissionState(storedPreference as PermissionState);
        } else {
          setPermissionState('prompt');
        }
      } else {
        // Use permissions API to get current state
        const result = await navigator.permissions.query({
          name: permissionType as PermissionName,
        });

        setPermissionState(result.state as PermissionState);

        // Add event listener for permission changes
        result.addEventListener('change', () => {
          setPermissionState(result.state as PermissionState);

          // Update stored preference
          options.storage.setItem(options.storageKey, result.state);
        });
      }
    } catch (err) {
      console.error(`Error checking ${permissionType} permission:`, err);
      setPermissionState('unavailable');
    } finally {
      setIsChecking(false);
    }
  }, [
    permissionType,
    options.storage,
    options.storageKey,
    isPermissionsApiAvailable,
  ]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);

    try {
      switch (permissionType) {
        case 'camera': {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          stream.getTracks().forEach(track => track.stop());
          setPermissionState('granted');
          options.storage.setItem(options.storageKey, 'granted');
          return true;
        }

        case 'microphone': {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          stream.getTracks().forEach(track => track.stop());
          setPermissionState('granted');
          options.storage.setItem(options.storageKey, 'granted');
          return true;
        }

        case 'geolocation': {
          return new Promise<boolean>(resolve => {
            navigator.geolocation.getCurrentPosition(
              () => {
                setPermissionState('granted');
                options.storage.setItem(options.storageKey, 'granted');
                resolve(true);
              },
              () => {
                setPermissionState('denied');
                options.storage.setItem(options.storageKey, 'denied');
                resolve(false);
              }
            );
          });
        }

        case 'notifications': {
          if (Notification) {
            const permission = await Notification.requestPermission();
            setPermissionState(permission as PermissionState);
            options.storage.setItem(options.storageKey, permission);
            return permission === 'granted';
          }
          return false;
        }

        default:
          console.warn(`Unsupported permission type: ${permissionType}`);
          return false;
      }
    } catch (err) {
      console.error(`Error requesting ${permissionType} permission:`, err);
      setPermissionState('denied');
      options.storage.setItem(options.storageKey, 'denied');
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [permissionType, options.storage, options.storageKey]);

  // Initialize permission check on mount
  useEffect(() => {
    checkPermission();

    // Auto-request permission if option is set
    if (options.autoRequest && permissionState === 'prompt') {
      requestPermission();
    }
  }, [checkPermission, options.autoRequest, permissionState]);

  // Utility function to check if permission is granted
  const hasPermission = permissionState === 'granted';

  return {
    permissionState,
    isChecking,
    checkPermission,
    requestPermission,
    hasPermission,
  };
}

// For backward compatibility
export function useCameraPermission() {
  const {
    permissionState,
    isChecking,
    checkPermission: checkCameraPermission,
    requestPermission: requestCameraPermission,
  } = usePermissions('camera');

  return {
    permissionState,
    isChecking,
    checkCameraPermission,
    requestCameraPermission,
  };
}

// Helper function to store permission state in localStorage (for backwards compatibility)
export const storePermissionPreference = (
  key: string,
  state: boolean
): void => {
  try {
    localStorage.setItem(`permission_${key}`, state ? 'granted' : 'denied');
  } catch (err) {
    console.error('Error storing permission preference:', err);
  }
};

// Helper function to get stored permission preference (for backwards compatibility)
export const getPermissionPreference = (key: string): string | null => {
  try {
    return localStorage.getItem(`permission_${key}`);
  } catch (err) {
    console.error('Error retrieving permission preference:', err);
    return null;
  }
};
