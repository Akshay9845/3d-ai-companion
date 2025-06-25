import React, { useEffect, useState } from 'react';
import { GeminiTTSService } from '../lib/geminiTTSService';
import { synchronizedSpeechAnimationController } from '../lib/synchronizedSpeechAnimationController';

const SynchronizedSpeechTest: React.FC = () => {
  const [ttsService, setTtsService] = useState<GeminiTTSService | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [testText, setTestText] = useState('Hello! This is a test of the synchronized speech and animation system. The animation should perfectly match the speech duration and there should be no duplicate speech responses.');
  const [status, setStatus] = useState('Ready');

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

  const handleQuickTest = async () => {
    if (!ttsService || isSpeaking) return;

    setIsSpeaking(true);
    setStatus('Quick test...');

    try {
      // Test multiple rapid calls to ensure no duplicates
      const promises = [
        ttsService.speak('First test message.'),
        ttsService.speak('Second test message.'),
        ttsService.speak('Third test message.')
      ];

      await Promise.all(promises);
      setStatus('Quick test completed');
    } catch (error) {
      console.error('Quick test error:', error);
      setStatus('Quick test failed');
    } finally {
      setIsSpeaking(false);
    }
  };

  const getStateInfo = () => {
    const state = synchronizedSpeechAnimationController.getState();
    return {
      isSpeaking: state.isSpeaking,
      estimatedDuration: state.estimatedDuration,
      currentAnimation: state.currentAnimation,
      speechStartTime: state.speechStartTime
    };
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Synchronized Speech & Animation Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
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
          {isSpeaking ? 'Speaking...' : 'Speak'}
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
          onClick={handleQuickTest}
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
          Quick Test (No Duplicates)
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h4>Test Instructions:</h4>
        <ul>
          <li>Click "Speak" to test synchronized speech and animation</li>
          <li>Click "Quick Test" to verify no duplicate speech responses</li>
          <li>Watch the animation state to see timing synchronization</li>
          <li>Animation should last exactly as long as speech</li>
          <li>No duplicate speech should occur even with rapid clicks</li>
        </ul>
      </div>
    </div>
  );
};

export default SynchronizedSpeechTest; 