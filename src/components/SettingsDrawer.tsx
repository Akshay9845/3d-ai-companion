// src/components/SettingsDrawer.tsx
import { GlobalOutlined, KeyOutlined, SettingOutlined, SoundOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Drawer, Input, Radio, Select, Slider, Space, Switch, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { GeminiTTSService } from '../lib/geminiTTSService';
import { groqService } from '../lib/groqService';

// Debug logging to check groqService import
console.log('🔧 SettingsDrawer - groqService import check:', {
  groqService: typeof groqService,
  hasIsMockMode: groqService ? typeof groqService.isMockMode : 'no service',
  hasIsReady: groqService ? typeof groqService.isReady : 'no service',
  hasGetApiKey: groqService ? typeof groqService.getApiKey : 'no service'
});

const { Title, Text } = Typography;
const { Option } = Select;
const { Password } = Input;

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface GeminiTTSConfig {
  language: string;
  gender: 'male' | 'female';
  style: 'professional' | 'news' | 'storytelling' | 'conversational' | 'friendly' | 'robot';
  emotion: 'happy' | 'sad' | 'excited' | 'calm' | 'confident' | 'empathetic' | 'neutral';
  speed: number;
  pitch: number;
  volume: number;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  const [geminiTTS] = useState(() => new GeminiTTSService());
  const [ttsConfig, setTtsConfig] = useState<GeminiTTSConfig>({
    language: 'en',
    gender: 'female',
    style: 'conversational',
    emotion: 'neutral',
    speed: 1.0,
    pitch: 0,
    volume: 0
  });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState('');
  const [groqServiceReady, setGroqServiceReady] = useState(false);

  // Initialize groqService on component mount
  useEffect(() => {
    const initializeGroqService = async () => {
      try {
        console.log('🔧 Initializing groqService in SettingsDrawer...');
        
        // Check if groqService exists and has required methods
        if (!groqService) {
          console.error('❌ groqService is not available');
          return;
        }

        if (typeof groqService.initialize !== 'function') {
          console.error('❌ groqService.initialize is not a function');
          return;
        }

        // Initialize the service
        await groqService.initialize();
        setGroqServiceReady(true);
        
        // Get the API key if available
        if (typeof groqService.getApiKey === 'function') {
          const key = groqService.getApiKey();
          setGroqApiKey(key || '');
        }
        
        console.log('✅ groqService initialized successfully in SettingsDrawer');
      } catch (error) {
        console.error('❌ Error initializing groqService:', error);
      }
    };

    initializeGroqService();
  }, []);

  // Available languages with their display names
  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
    { code: 'ur', name: 'Urdu', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' }
  ];

  const handleConfigChange = (key: keyof GeminiTTSConfig, value: any) => {
    setTtsConfig(prev => ({ ...prev, [key]: value }));
  };

  const testVoice = async () => {
    if (isTesting) return;
    
    setIsTesting(true);
    try {
      const testText = `Hello! This is a test of the ${ttsConfig.language} voice with ${ttsConfig.style} style and ${ttsConfig.emotion} emotion.`;
      
      await geminiTTS.generateSpeech({
        text: testText,
        language: ttsConfig.language,
        gender: ttsConfig.gender,
        style: ttsConfig.style,
        emotion: ttsConfig.emotion,
        speed: ttsConfig.speed,
        pitch: ttsConfig.pitch,
        volume: ttsConfig.volume
      });
      
      console.log('✅ Voice test completed');
    } catch (error) {
      console.error('❌ Voice test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  // Helper function to safely check if Groq is in mock mode
  const isGroqMockMode = (): boolean => {
    try {
      if (!groqServiceReady || !groqService) {
        console.warn('Groq service not ready yet');
        return true; // Default to mock mode if service is not ready
      }
      
      if (typeof groqService.isMockMode !== 'function') {
        console.error('groqService.isMockMode is not a function');
        return true;
      }
      
      return groqService.isMockMode();
    } catch (error) {
      console.error('Error checking Groq mock mode:', error);
      return true; // Default to mock mode on error
    }
  };

  // Helper function to safely set Groq API key
  const handleSetGroqApiKey = () => {
    try {
      if (!groqServiceReady || !groqService) {
        console.error('Groq service not ready yet');
        return;
      }
      
      if (typeof groqService.setApiKey !== 'function') {
        console.error('groqService.setApiKey is not a function');
        return;
      }
      
      groqService.setApiKey(groqApiKey);
      console.log('✅ Groq API key saved');
    } catch (error) {
      console.error('Error setting Groq API key:', error);
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <SettingOutlined />
          <span>Enhanced Gemini TTS Settings</span>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={450}
      styles={{
        body: {
          padding: '24px',
          backgroundColor: 'rgba(15, 15, 15, 0.95)',
          color: 'white',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        },
        header: {
          backgroundColor: 'rgba(20, 20, 20, 0.98)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white'
        }
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Language Selection */}
        <div>
          <Title level={4} style={{ color: 'white', marginBottom: 16 }}>
            <GlobalOutlined style={{ marginRight: 8 }} />
            Language & Voice
          </Title>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', marginBottom: 8 }}>
                Language
              </Text>
              <Select
                style={{ width: '100%' }}
                value={ttsConfig.language}
                onChange={(value) => handleConfigChange('language', value)}
                placeholder="Select language"
                className="voice-select"
              >
                {availableLanguages.map(lang => (
                  <Option key={lang.code} value={lang.code}>
                    <span style={{ marginRight: 8 }}>{lang.flag}</span>
                    {lang.name}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', marginBottom: 8 }}>
                Gender
              </Text>
              <Radio.Group 
                value={ttsConfig.gender} 
                onChange={(e) => handleConfigChange('gender', e.target.value)}
                style={{ width: '100%' }}
              >
                <Radio.Button value="female" style={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                  Female
                </Radio.Button>
                <Radio.Button value="male" style={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                  Male
                </Radio.Button>
              </Radio.Group>
            </div>
          </Space>
        </div>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Voice Style & Emotion */}
        <div>
          <Title level={4} style={{ color: 'white', marginBottom: 16 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Voice Personality
          </Title>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', marginBottom: 8 }}>
                Speaking Style
              </Text>
              <Select
                style={{ width: '100%' }}
                value={ttsConfig.style}
                onChange={(value) => handleConfigChange('style', value)}
                placeholder="Select style"
              >
                <Option value="professional">Professional</Option>
                <Option value="news">News Anchor</Option>
                <Option value="storytelling">Storytelling</Option>
                <Option value="conversational">Conversational</Option>
                <Option value="friendly">Friendly</Option>
                <Option value="robot">Robot</Option>
              </Select>
            </div>

            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', marginBottom: 8 }}>
                Emotion
              </Text>
              <Select
                style={{ width: '100%' }}
                value={ttsConfig.emotion}
                onChange={(value) => handleConfigChange('emotion', value)}
                placeholder="Select emotion"
              >
                <Option value="neutral">Neutral</Option>
                <Option value="happy">Happy</Option>
                <Option value="sad">Sad</Option>
                <Option value="excited">Excited</Option>
                <Option value="calm">Calm</Option>
                <Option value="confident">Confident</Option>
                <Option value="empathetic">Empathetic</Option>
              </Select>
            </div>
          </Space>
        </div>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Voice Parameters */}
        <div>
          <Title level={4} style={{ color: 'white', marginBottom: 16 }}>
            <SoundOutlined style={{ marginRight: 8 }} />
            Voice Parameters
          </Title>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', marginBottom: 8 }}>
                Speed: {ttsConfig.speed.toFixed(1)}x
              </Text>
              <Slider
                min={0.5}
                max={2.0}
                step={0.1}
                value={ttsConfig.speed}
                onChange={(value) => handleConfigChange('speed', value)}
                styles={{
                  track: { backgroundColor: '#1890ff' },
                  rail: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  handle: { borderColor: '#1890ff' }
                }}
              />
            </div>

            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', marginBottom: 8 }}>
                Pitch: {ttsConfig.pitch > 0 ? '+' : ''}{ttsConfig.pitch}
              </Text>
              <Slider
                min={-20}
                max={20}
                step={1}
                value={ttsConfig.pitch}
                onChange={(value) => handleConfigChange('pitch', value)}
                styles={{
                  track: { backgroundColor: '#1890ff' },
                  rail: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  handle: { borderColor: '#1890ff' }
                }}
              />
            </div>

            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', marginBottom: 8 }}>
                Volume: {ttsConfig.volume > 0 ? '+' : ''}{ttsConfig.volume}dB
              </Text>
              <Slider
                min={-20}
                max={20}
                step={1}
                value={ttsConfig.volume}
                onChange={(value) => handleConfigChange('volume', value)}
                styles={{
                  track: { backgroundColor: '#1890ff' },
                  rail: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  handle: { borderColor: '#1890ff' }
                }}
              />
            </div>
          </Space>
        </div>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Test Voice */}
        <div>
          <Button 
            type="primary"
            size="large"
            onClick={testVoice}
            loading={isTesting}
            style={{ 
              width: '100%',
              backgroundColor: 'rgba(70, 130, 180, 0.8)',
              borderColor: 'rgba(70, 130, 180, 1)',
              color: 'white'
            }}
          >
            {isTesting ? 'Testing Voice...' : 'Test Current Voice Settings'}
          </Button>
        </div>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Audio Settings */}
        <div>
          <Title level={4} style={{ color: 'white', marginBottom: 16 }}>
            Audio Settings
          </Title>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                Enable Audio
              </Text>
              <Switch 
                checked={audioEnabled} 
                onChange={setAudioEnabled}
                style={{ backgroundColor: audioEnabled ? '#1890ff' : 'rgba(255, 255, 255, 0.25)' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                Auto-speak responses
              </Text>
              <Switch 
                checked={autoSpeak} 
                onChange={setAutoSpeak}
                style={{ backgroundColor: autoSpeak ? '#1890ff' : 'rgba(255, 255, 255, 0.25)' }}
              />
            </div>
          </Space>
        </div>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Groq LLM Configuration */}
        <div>
          <Title level={4} style={{ color: 'white', marginBottom: 16 }}>
            <KeyOutlined style={{ marginRight: 8 }} />
            Groq LLM Configuration
          </Title>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', marginBottom: 8 }}>
                Groq API Key
              </Text>
              <Password
                placeholder="Enter your Groq API key"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              />
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginTop: 4, display: 'block' }}>
                Get your API key from <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>Groq Console</a>
              </Text>
            </div>

            <Button 
              type="primary"
              onClick={handleSetGroqApiKey}
              style={{ 
                backgroundColor: 'rgba(70, 130, 180, 0.8)',
                borderColor: 'rgba(70, 130, 180, 1)',
                color: 'white'
              }}
            >
              Save API Key
            </Button>

            {isGroqMockMode() && (
              <Alert
                message="Mock Mode Active"
                description="Groq is currently running in mock mode. Enter your API key above to enable real LLM responses."
                type="warning"
                showIcon
                style={{ 
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.3)'
                }}
              />
            )}

            {!isGroqMockMode() && (
              <Alert
                message="Real LLM Active"
                description="Groq is connected and ready to provide real AI responses!"
                type="success"
                showIcon
                style={{ 
                  backgroundColor: 'rgba(40, 167, 69, 0.1)',
                  border: '1px solid rgba(40, 167, 69, 0.3)'
                }}
              />
            )}
          </Space>
        </div>

        {/* Info */}
        <div style={{ 
          padding: '12px', 
          backgroundColor: 'rgba(24, 144, 255, 0.1)', 
          border: '1px solid rgba(24, 144, 255, 0.3)',
          borderRadius: '8px'
        }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
            🎯 <strong>Enhanced Gemini TTS</strong> uses Google's professional Chirp3-HD voice models 
            with advanced prosody control for natural, high-quality speech synthesis.
          </Text>
        </div>
      </Space>
    </Drawer>
  );
};

export default SettingsDrawer;
