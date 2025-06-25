import React, { useEffect, useState } from 'react';
import { GeminiTTSService } from '../lib/geminiTTSService';
import { humanLikeAnimationService } from '../lib/humanLikeAnimationService';
import { synchronizedSpeechAnimationController } from '../lib/synchronizedSpeechAnimationController';

const FixedAnimationTest: React.FC = () => {
  const [ttsService, setTtsService] = useState<GeminiTTSService | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [testText, setTestText] = useState('Hello! This is a test of the fixed animation system. No T-pose, very slow animations, and no duplicate speech.');
  const [status, setStatus] = useState('Ready');
  const [speechCount, setSpeechCount] = useState(0);

  useEffect(() => {
    const initializeTTS = async () => {
      try {
        const service = new GeminiTTSService();
        await service.initialize();
        setTtsService(service);
        setStatus('TTS Service Ready');
      } catch (error) {
        console.error('Failed to initialize TTS:', error);
        setStatus('TTS Service Failed');
      }
    };

    initializeTTS();
  }, []);

  const handleSpeak = async () => {
    if (!ttsService || isSpeaking) {
      console.log('TTS not ready or already speaking');
      return;
    }

    setIsSpeaking(true);
    setStatus('Speaking...');
    setSpeechCount(prev => prev + 1);

    try {
      await ttsService.speak(testText);
      setStatus('Speech completed');
    } catch (error) {
      console.error('Speech error:', error);
      setStatus('Speech failed');
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleStop = () => {
    if (ttsService) {
      ttsService.stopAudio();
      synchronizedSpeechAnimationController.forceStop();
      setIsSpeaking(false);
      setStatus('Stopped');
    }
  };

  const handleRapidCalls = async () => {
    if (!ttsService || isSpeaking) return;

    setIsSpeaking(true);
    setStatus('Testing rapid calls...');

    try {
      // Test multiple rapid calls to ensure no duplicates
      const promises = [
        ttsService.speak('First test message.'),
        ttsService.speak('Second test message.'),
        ttsService.speak('Third test message.')
      ];

      await Promise.all(promises);
      setStatus('Rapid calls test completed');
    } catch (error) {
      console.error('Rapid calls test error:', error);
      setStatus('Rapid calls test failed');
    } finally {
      setIsSpeaking(false);
    }
  };

  const forceIdle = () => {
    console.log('🎭 Forcing idle state');
    synchronizedSpeechAnimationController.forceStop();
    humanLikeAnimationService.stopAndReturnToIdle();
    setStatus('Forced to idle');
  };

  const getStateInfo = () => {
    const state = synchronizedSpeechAnimationController.getState();
    return {
      isSpeaking: state.isSpeaking,
      estimatedDuration: state.estimatedDuration,
      currentAnimation: state.currentAnimation,
      speechStartTime: state.speechStartTime,
      currentHumanAnimation: humanLikeAnimationService.getCurrentAnimation()
    };
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Fixed Animation System Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Speech Count:</strong> {speechCount}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Animation State:</strong>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(getStateInfo(), null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <strong>Test Text:</strong>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            style={{ 
              width: '100%', 
              height: '100px', 
              marginTop: '10px',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleSpeak}
          disabled={!ttsService || isSpeaking}
          style={{
            padding: '10px 20px',
            backgroundColor: isSpeaking ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSpeaking ? 'not-allowed' : 'pointer'
          }}
        >
          {isSpeaking ? 'Speaking...' : 'Test Speech'}
        </button>

        <button
          onClick={handleStop}
          disabled={!ttsService}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Stop
        </button>

        <button
          onClick={handleRapidCalls}
          disabled={!ttsService || isSpeaking}
          style={{
            padding: '10px 20px',
            backgroundColor: isSpeaking ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSpeaking ? 'not-allowed' : 'pointer'
          }}
        >
          Test Rapid Calls
        </button>

        <button
          onClick={forceIdle}
          style={{
            padding: '10px 20px',
            backgroundColor: '#722ed1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Force Idle
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
        <h4>✅ Fixed Issues:</h4>
        <ul>
          <li>🚫 <strong>No T-pose:</strong> Long crossfades (3.0s) prevent T-pose</li>
          <li>🎭 <strong>One Idle Animation:</strong> Only sitting-idle runs continuously</li>
          <li>🐌 <strong>Very Slow:</strong> 10% speed (timeScale: 0.1)</li>
          <li>🚫 <strong>No Duplicate Speech:</strong> State management prevents duplicates</li>
          <li>🔄 <strong>Smooth Transitions:</strong> Continuous movement without breaks</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff7e6', borderRadius: '4px' }}>
        <h4>🎯 Expected Behavior:</h4>
        <ul>
          <li>Model should be in slow idle animation continuously</li>
          <li>When you say "hi" → waving animation → talking animation → speech</li>
          <li>No T-pose should appear at any time</li>
          <li>Speech should only play once, never twice</li>
          <li>All animations should be very slow and smooth</li>
        </ul>
      </div>
    </div>
  );
};

export default FixedAnimationTest; 