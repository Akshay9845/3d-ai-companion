import React, { useEffect, useState } from 'react';
import { faceDetectionService } from '../lib/faceDetectionService';
import { intelligentCameraService } from '../lib/intelligentCameraService';

interface DiagnosticResult {
  category: string;
  test: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  timestamp?: Date;
}

const VisionDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const addDiagnostic = (result: DiagnosticResult) => {
    setDiagnostics(prev => [...prev, { ...result, timestamp: new Date() }]);
  };

  const updateDiagnostic = (index: number, updates: Partial<DiagnosticResult>) => {
    setDiagnostics(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates, timestamp: new Date() } : item
    ));
  };

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    // 1. Environment Check
    addDiagnostic({
      category: 'Environment',
      test: 'Browser Support',
      status: 'running',
      message: 'Checking browser capabilities...'
    });

    const browserSupport = {
      getUserMedia: !!navigator.mediaDevices?.getUserMedia,
      webGL: !!document.createElement('canvas').getContext('webgl'),
      canvas: !!document.createElement('canvas').getContext('2d'),
      fetch: !!window.fetch,
      promises: !!window.Promise
    };

    const supportCount = Object.values(browserSupport).filter(Boolean).length;
    updateDiagnostic(diagnostics.length, {
      status: supportCount === Object.keys(browserSupport).length ? 'success' : 'warning',
      message: `Browser support: ${supportCount}/${Object.keys(browserSupport).length} features`,
      details: browserSupport
    });

    // 2. Model Files Check
    addDiagnostic({
      category: 'Models',
      test: 'Model File Accessibility',
      status: 'running',
      message: 'Checking model files...'
    });

    const modelFiles = [
      'tiny_face_detector_model-weights_manifest.json',
      'face_expression_model-weights_manifest.json',
      'age_gender_model-weights_manifest.json',
      'face_landmark_68_model-weights_manifest.json',
      'face_recognition_model-weights_manifest.json'
    ];

    const modelResults = await Promise.all(
      modelFiles.map(async (file) => {
        try {
          const response = await fetch(`/static/models/${file}`);
          return { file, accessible: response.ok, status: response.status };
        } catch (error) {
          return { file, accessible: false, error: String(error) };
        }
      })
    );

    const accessibleModels = modelResults.filter(r => r.accessible).length;
    updateDiagnostic(1, {
      status: accessibleModels === modelFiles.length ? 'success' : 'error',
      message: `${accessibleModels}/${modelFiles.length} model files accessible`,
      details: modelResults
    });

    // 3. Face Detection Service
    addDiagnostic({
      category: 'Services',
      test: 'Face Detection Service',
      status: 'running',
      message: 'Initializing face detection service...'
    });

    try {
      const faceInitSuccess = await faceDetectionService.initialize();
      updateDiagnostic(2, {
        status: faceInitSuccess ? 'success' : 'error',
        message: faceInitSuccess ? 'Face detection initialized' : 'Face detection failed',
        details: { 
          isReady: faceDetectionService.isReady(),
          config: faceDetectionService.constructor.name
        }
      });
    } catch (error) {
      updateDiagnostic(2, {
        status: 'error',
        message: 'Face detection initialization error',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }

    // 4. Intelligent Camera Service
    addDiagnostic({
      category: 'Services',
      test: 'Intelligent Camera Service',
      status: 'running',
      message: 'Initializing intelligent camera service...'
    });

    try {
      const cameraInitSuccess = await intelligentCameraService.initialize();
      updateDiagnostic(3, {
        status: cameraInitSuccess ? 'success' : 'error',
        message: cameraInitSuccess ? 'Camera service initialized' : 'Camera service failed',
        details: { isReady: intelligentCameraService.isReady() }
      });
    } catch (error) {
      updateDiagnostic(3, {
        status: 'error',
        message: 'Camera service initialization error',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }

    // 5. Camera Access Test (Check support only, no actual camera access)
    addDiagnostic({
      category: 'Hardware',
      test: 'Camera Support',
      status: 'success',
      message: 'Camera API support detected'
    });

    updateDiagnostic(4, {
      status: !!navigator.mediaDevices?.getUserMedia ? 'success' : 'error',
      message: !!navigator.mediaDevices?.getUserMedia 
        ? 'Camera API supported - use camera button to enable' 
        : 'Camera API not supported in this browser',
      details: { 
        mediaDevicesSupported: !!navigator.mediaDevices?.getUserMedia,
        getUserMediaSupported: !!navigator.mediaDevices?.getUserMedia,
        note: 'Camera is controlled only by the camera toggle button'
      }
    });

    // 6. Google Vision API Configuration
    addDiagnostic({
      category: 'Configuration',
      test: 'Google Vision API',
      status: 'running',
      message: 'Checking API configuration...'
    });

    const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem('googleVisionApiKey');
    updateDiagnostic(5, {
      status: googleApiKey ? 'success' : 'warning',
      message: googleApiKey ? 'API key found' : 'API key not configured',
      details: { 
        hasKey: !!googleApiKey,
        source: import.meta.env.VITE_GOOGLE_API_KEY ? 'environment' : 'localStorage',
        keyLength: googleApiKey?.length || 0
      }
    });

    // 7. Live Detection Test - Skip (camera controlled by button only)
    // Live face detection will work when user enables camera via toggle button

    setIsRunning(false);
  };

  const cleanup = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Remove manual camera test - camera should only be controlled by the toggle button

  useEffect(() => {
    runComprehensiveDiagnostics();
    return cleanup;
  }, []);

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'running': return 'text-blue-500';
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const successCount = diagnostics.filter(d => d.status === 'success').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;
  const errorCount = diagnostics.filter(d => d.status === 'error').length;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Vision System Diagnostics</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-green-600">✅ {successCount}</span>
              <span className="text-yellow-600 ml-2">⚠️ {warningCount}</span>
              <span className="text-red-600 ml-2">❌ {errorCount}</span>
            </div>
            <button
              onClick={runComprehensiveDiagnostics}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Run Tests'}
            </button>
            <div className="text-xs text-gray-600">
              Use camera toggle button to enable camera
            </div>
          </div>
        </div>

        {/* No hidden video elements - camera only controlled by toggle button */}

        <div className="space-y-3">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(diagnostic.status)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{diagnostic.test}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {diagnostic.category}
                      </span>
                    </div>
                    <p className={`text-sm ${getStatusColor(diagnostic.status)}`}>
                      {diagnostic.message}
                    </p>
                  </div>
                </div>
                {diagnostic.timestamp && (
                  <span className="text-xs text-gray-500">
                    {diagnostic.timestamp.toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              {diagnostic.details && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium text-gray-600">
                      Details
                    </summary>
                    <pre className="mt-2 text-xs text-gray-700 overflow-auto max-h-40">
                      {JSON.stringify(diagnostic.details, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>

        {diagnostics.length > 0 && !isRunning && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Overall Status</h3>
            <div className="text-sm text-blue-700">
              {errorCount === 0 && warningCount === 0 ? (
                <p className="text-green-700 font-medium">🎉 All systems operational!</p>
              ) : errorCount > 0 ? (
                <p className="text-red-700 font-medium">⚠️ Critical issues detected. Vision features may not work properly.</p>
              ) : (
                <p className="text-yellow-700 font-medium">⚠️ Some features may be limited due to configuration issues.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionDiagnostics; 