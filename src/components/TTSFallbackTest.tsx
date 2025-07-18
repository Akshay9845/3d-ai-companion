/**
 * TTS Fallback Test Component
 * Tests browser TTS while Google Cloud is being set up
 */

import { Alert, Button, Card, Input, Select, Space, Typography } from 'antd';
import React, { useState } from 'react';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TTSTestResult {
  success: boolean;
  message: string;
  voice?: string;
  timestamp: number;
}

export const TTSFallbackTest: React.FC = () => {
  const [testText, setTestText] = useState('Hello! This is a test using browser TTS. I can dance, exercise, fight, teach, and express emotions!');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [testResults, setTestResults] = useState<TTSTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available voices
  React.useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Auto-select a good English voice
      const goodVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.toLowerCase().includes('neural') || 
         v.name.toLowerCase().includes('google') ||
         v.name.toLowerCase().includes('premium'))
      ) || voices.find(v => v.lang.startsWith('en-US')) || voices[0];
      
      if (goodVoice && !selectedVoice) {
        setSelectedVoice(goodVoice.name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [selectedVoice]);

  const testBrowserTTS = async () => {
    if (!testText.trim()) return;

    setIsLoading(true);
    
    try {
      console.log('🧪 Testing Browser TTS...');
      console.log('📝 Text:', testText.substring(0, 50) + '...');
      console.log('🎤 Voice:', selectedVoice);

      // Find selected voice
      const voice = availableVoices.find(v => v.name === selectedVoice);
      
      const utterance = new SpeechSynthesisUtterance(testText.trim());
      
      if (voice) {
        utterance.voice = voice;
        console.log('🎤 Using voice:', voice.name, voice.lang);
      }

      // Enhanced settings for better quality
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 0.9; // Slightly lower for warmth
      utterance.volume = 0.9;

      // Create promise wrapper
      const speakPromise = new Promise<void>((resolve, reject) => {
        utterance.onstart = () => {
          console.log('🎵 Browser TTS started');
        };

        utterance.onend = () => {
          console.log('✅ Browser TTS completed');
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('❌ Browser TTS error:', event.error);
          reject(new Error(`Browser TTS failed: ${event.error}`));
        };

        speechSynthesis.speak(utterance);
      });

      await speakPromise;

      setTestResults(prev => [{
        success: true,
        message: 'Browser TTS test successful! 🎉',
        voice: voice ? `${voice.name} (${voice.lang})` : 'Default voice',
        timestamp: Date.now()
      }, ...prev.slice(0, 4)]);

    } catch (error) {
      console.error('🔥 Browser TTS test failed:', error);
      setTestResults(prev => [{
        success: false,
        message: `Browser TTS failed: ${error}`,
        timestamp: Date.now()
      }, ...prev.slice(0, 4)]);
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedTests = [
    'Hello! I can dance, exercise, fight, teach, and express emotions!',
    'Show me a dance! Let me demonstrate some moves!',
    'Ready for a workout? Let\'s do some exercises together!',
    'Here are my martial arts skills! Watch this fighting stance!',
    'I\'d love to teach you something! Let me demonstrate clearly.',
    'I\'m so excited and happy to show you what I can do!'
  ];

  const getVoiceQuality = (voice: SpeechSynthesisVoice): string => {
    const name = voice.name.toLowerCase();
    if (name.includes('neural') || name.includes('premium')) return '⭐⭐⭐ High Quality';
    if (name.includes('google') || name.includes('enhanced')) return '⭐⭐ Good Quality';
    return '⭐ Standard';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🎵 Browser TTS Test (Fallback)</Title>
      
      <Alert
        type="info"
        style={{ marginBottom: '20px' }}
        message="Using Browser TTS"
        description="This uses your browser's built-in text-to-speech while you set up Google Cloud TTS. It works immediately and provides good quality speech for testing the intelligent animation system."
      />

      {/* Voice Selection */}
      <Card title="Voice Configuration" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Select Voice ({availableVoices.length} available):</Text>
            <Select
              value={selectedVoice}
              onChange={setSelectedVoice}
              style={{ width: '100%', marginTop: '8px' }}
              placeholder="Select a voice"
            >
              {availableVoices
                .filter(voice => voice.lang.startsWith('en')) // Show English voices first
                .map(voice => (
                  <Option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang}) - {getVoiceQuality(voice)}
                  </Option>
                ))}
            </Select>
          </div>
        </Space>
      </Card>

      {/* Test Configuration */}
      <Card title="Test Configuration" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Test Text:</Text>
            <TextArea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={3}
              style={{ marginTop: '8px' }}
            />
          </div>
          <Button 
            type="primary" 
            onClick={testBrowserTTS} 
            loading={isLoading}
            disabled={!testText.trim()}
          >
            {isLoading ? 'Speaking...' : 'Test Browser TTS'}
          </Button>
        </Space>
      </Card>

      {/* Predefined Tests */}
      <Card title="Quick Tests - Intelligence Animation Phrases" style={{ marginBottom: '20px' }}>
        <Space wrap>
          {predefinedTests.map((text, index) => (
            <Button
              key={index}
              size="small"
              onClick={() => {
                setTestText(text);
                setTimeout(() => testBrowserTTS(), 100);
              }}
              disabled={isLoading}
            >
              Test {index + 1}
            </Button>
          ))}
        </Space>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card title="Test Results">
          {testResults.map((result, index) => (
            <Alert
              key={result.timestamp}
              type={result.success ? 'success' : 'error'}
              style={{ marginBottom: '12px' }}
              message={
                <div>
                  <Text strong>{result.message}</Text>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {new Date(result.timestamp).toLocaleTimeString()}
                    {result.voice && ` - ${result.voice}`}
                  </div>
                </div>
              }
            />
          ))}
        </Card>
      )}

      {/* Next Steps */}
      <Card title="While Setting Up Google Cloud TTS">
        <Paragraph>
          <Text strong>✅ Current Status:</Text> Browser TTS is working and ready for the intelligent animation system.
        </Paragraph>
        <Paragraph>
          <Text strong>🎭 Ready for Integration:</Text> The browser TTS can immediately work with your:
          <ul>
            <li>Intelligent animation responses</li>
            <li>Capability demonstrations</li>
            <li>Natural language understanding</li>
            <li>Dance, exercise, fighting, teaching animations</li>
          </ul>
        </Paragraph>
        <Paragraph>
          <Text strong>⭐ Future Enhancement:</Text> Once Google Cloud TTS is configured, you'll get:
          <ul>
            <li>Neural voice quality (much clearer)</li>
            <li>Better emotion control</li>
            <li>More natural speech rhythm</li>
            <li>Consistent high quality across devices</li>
          </ul>
        </Paragraph>
      </Card>
    </div>
  );
};

export default TTSFallbackTest; 