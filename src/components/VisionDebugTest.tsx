import * as faceapi from 'face-api.js';
import React, { useState } from 'react';

const VisionDebugTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testFaceApiLoading = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      addResult('🔄 Starting face-api.js debug test...');
      
      // Test 1: Check if face-api.js is available
      addResult(`📦 face-api.js available: ${!!faceapi ? 'YES' : 'NO'}`);
      addResult(`📦 face-api.js version: ${faceapi.version || 'Unknown'}`);

      // Test 2: Test model file accessibility
      const modelPath = '/static/models';
      const modelFiles = [
        'tiny_face_detector_model-weights_manifest.json',
        'face_expression_model-weights_manifest.json',
        'age_gender_model-weights_manifest.json',
        'face_landmark_68_model-weights_manifest.json'
      ];

      addResult('🔍 Testing model file accessibility...');
      for (const file of modelFiles) {
        try {
          const response = await fetch(`${modelPath}/${file}`);
          addResult(`${response.ok ? '✅' : '❌'} ${file}: ${response.status}`);
        } catch (error) {
          addResult(`❌ ${file}: ${error}`);
        }
      }

      // Test 3: Try loading models individually
      addResult('📦 Attempting to load face-api.js models...');
      
      try {
        addResult('Loading TinyFaceDetector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
        addResult('✅ TinyFaceDetector loaded successfully');
      } catch (error) {
        addResult(`❌ TinyFaceDetector failed: ${error}`);
        throw error;
      }

      try {
        addResult('Loading FaceLandmark68Net...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
        addResult('✅ FaceLandmark68Net loaded successfully');
      } catch (error) {
        addResult(`❌ FaceLandmark68Net failed: ${error}`);
        throw error;
      }

      try {
        addResult('Loading FaceExpressionNet...');
        await faceapi.nets.faceExpressionNet.loadFromUri(modelPath);
        addResult('✅ FaceExpressionNet loaded successfully');
      } catch (error) {
        addResult(`❌ FaceExpressionNet failed: ${error}`);
        throw error;
      }

      addResult('🎉 All tests passed! Face detection should work.');

    } catch (error) {
      addResult(`💥 Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-4 text-gray-800">🔬 Face-API.js Debug Test</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={testFaceApiLoading}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? 'Running Tests...' : 'Run Debug Test'}
        </button>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
        {testResults.length === 0 ? (
          <p className="text-gray-500 italic">No test results yet. Click "Run Debug Test" to start.</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result.includes('✅') && <span className="text-green-600">{result}</span>}
                {result.includes('❌') && <span className="text-red-600">{result}</span>}
                {result.includes('🔄') && <span className="text-blue-600">{result}</span>}
                {result.includes('🎉') && <span className="text-green-700 font-bold">{result}</span>}
                {result.includes('💥') && <span className="text-red-700 font-bold">{result}</span>}
                {!result.includes('✅') && !result.includes('❌') && !result.includes('🔄') && !result.includes('🎉') && !result.includes('💥') && (
                  <span className="text-gray-700">{result}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionDebugTest; 