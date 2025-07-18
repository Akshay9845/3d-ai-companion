import { Alert, Button, Card, Input, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { enhancedGoogleTTSService } from '../lib/enhancedGoogleTTSService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const GoogleTTSTestSimple: React.FC = () => {
  const [testText, setTestText] = useState('Hello! I am Echo, your AI assistant. I can dance, fight, exercise, and help you learn new things!');
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<string>('Ready to test');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Google TTS
  const initializeTTS = async () => {
    try {
      setStatus('Initializing Google TTS...');
      const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyB-6aBzVSQo9pWXDKBKyxA1towrHqdYN2g';
      await enhancedGoogleTTSService.initialize(googleApiKey);
      setIsInitialized(true);
      setStatus('✅ Google TTS initialized successfully!');
    } catch (error) {
      console.error('TTS initialization error:', error);
      setStatus('❌ TTS initialization failed - will use browser fallback');
      setIsInitialized(true); // Still allow testing with fallback
    }
  };

  // Test Google TTS with Indian male voice
  const testIndianMaleVoice = async () => {
    if (!isInitialized) {
      await initializeTTS();
    }

    try {
      setIsPlaying(true);
      setStatus('🎤 Speaking with Indian male voice...');
      
      await enhancedGoogleTTSService.speak(testText, {
        language: 'en-IN',
        voice: 'en-IN-Neural2-B', // Indian English Male Neural
        rate: 1.0, // Normal speed
        pitch: 0.0, // Normal pitch
        volume: 0.0, // Normal volume
        emotion: 'neutral'
      });
      
      setStatus('✅ Speech completed successfully!');
    } catch (error) {
      console.error('TTS error:', error);
      setStatus('❌ Speech failed - check console for details');
    } finally {
      setIsPlaying(false);
    }
  };

  // Test different Indian voices
  const testVoice = async (voiceCode: string, voiceName: string) => {
    if (!isInitialized) {
      await initializeTTS();
    }

    try {
      setIsPlaying(true);
      setStatus(`🎤 Testing ${voiceName}...`);
      
      await enhancedGoogleTTSService.speak(`Hello! This is ${voiceName} speaking.`, {
        language: 'en-IN',
        voice: voiceCode,
        rate: 1.0,
        pitch: 0.0,
        volume: 0.0,
        emotion: 'neutral'
      });
      
      setStatus(`✅ ${voiceName} test completed!`);
    } catch (error) {
      console.error('TTS error:', error);
      setStatus(`❌ ${voiceName} test failed`);
    } finally {
      setIsPlaying(false);
    }
  };

  // Stop current speech
  const stopSpeech = () => {
    enhancedGoogleTTSService.stopAudio();
    setIsPlaying(false);
    setStatus('🛑 Speech stopped');
  };

  React.useEffect(() => {
    // Auto-initialize on component mount
    initializeTTS();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🇮🇳 Google TTS - Indian Male Voice Test</Title>
      
      <Alert
        type="info"
        style={{ marginBottom: '20px' }}
        message="Testing Google Cloud TTS with Indian English Male Voice"
        description="This test uses the en-IN-Neural2-B voice for natural Indian accent speech synthesis."
      />

      <Card title="Test Configuration" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>API Key Status: </Text>
            <Text code>AIzaSyB-6aBzVSQo9pWXDKBKyxA1towrHqdYN2g</Text>
          </div>
          <div>
            <Text strong>Voice: </Text>
            <Text>en-IN-Neural2-B (Indian English Male Neural)</Text>
          </div>
          <div>
            <Text strong>Settings: </Text>
            <Text>Rate: 1.0, Pitch: 0.0, Volume: 0.0 (Normal)</Text>
          </div>
        </Space>
      </Card>

      <Card title="Test Text" style={{ marginBottom: '20px' }}>
        <TextArea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Enter text to test..."
          rows={4}
          style={{ marginBottom: '10px' }}
        />
        
        <Space wrap>
          <Button 
            type="primary" 
            onClick={testIndianMaleVoice}
            disabled={isPlaying}
            loading={isPlaying}
          >
            🎤 Test Indian Male Voice
          </Button>
          
          <Button 
            onClick={stopSpeech}
            disabled={!isPlaying}
            danger
          >
            🛑 Stop Speech
          </Button>
        </Space>
      </Card>

      <Card title="Voice Options" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Test Different Indian Voices:</Text>
          <Space wrap>
            <Button 
              onClick={() => testVoice('en-IN-Neural2-B', 'Indian Male Neural')}
              disabled={isPlaying}
            >
              🇮🇳 Male Neural
            </Button>
            <Button 
              onClick={() => testVoice('en-IN-Neural2-A', 'Indian Female Neural')}
              disabled={isPlaying}
            >
              🇮🇳 Female Neural
            </Button>
            <Button 
              onClick={() => testVoice('en-IN-Wavenet-B', 'Indian Male Wavenet')}
              disabled={isPlaying}
            >
              🇮🇳 Male Wavenet
            </Button>
            <Button 
              onClick={() => testVoice('en-IN-Standard-B', 'Indian Male Standard')}
              disabled={isPlaying}
            >
              🇮🇳 Male Standard
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="Status" type="inner">
        <Text>{status}</Text>
      </Card>

      <Card title="Quick Tests" style={{ marginTop: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            onClick={() => {
              setTestText('Hello! I can dance for you. Watch me move!');
              setTimeout(() => testIndianMaleVoice(), 100);
            }}
            disabled={isPlaying}
            block
          >
            🕺 Test Dance Response
          </Button>
          <Button 
            onClick={() => {
              setTestText('Bring it on! I am ready to fight!');
              setTimeout(() => testIndianMaleVoice(), 100);
            }}
            disabled={isPlaying}
            block
          >
            🥊 Test Fighting Response
          </Button>
          <Button 
            onClick={() => {
              setTestText('Let us exercise together! Time for a workout!');
              setTimeout(() => testIndianMaleVoice(), 100);
            }}
            disabled={isPlaying}
            block
          >
            💪 Test Exercise Response
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default GoogleTTSTestSimple; 