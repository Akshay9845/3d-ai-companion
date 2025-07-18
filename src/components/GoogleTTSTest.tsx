/**
 * Google TTS Test Component
 * Tests the Google Cloud Text-to-Speech API with the provided API key
 */

import { Alert, Button, Card, Input, Select, Space, Spin, Typography } from 'antd';
import React, { useState } from 'react';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TTSTestResult {
  success: boolean;
  message: string;
  details?: any;
  audioUrl?: string;
  timestamp: number;
}

export const GoogleTTSTest: React.FC = () => {
  const [testText, setTestText] = useState('Hello! This is a test of Google Text-to-Speech service. The system is working correctly.');
  const [selectedVoice, setSelectedVoice] = useState('en-US-Neural2-F');
  const [testResults, setTestResults] = useState<TTSTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('AIzaSyB-6aBzVSQo9pWXDKBKyxA1towrHqdYN2g');

  // Available voices for testing
  const testVoices = [
    // English voices
    { code: 'en-US-Neural2-F', name: 'English (US) - Female Neural' },
    { code: 'en-US-Neural2-C', name: 'English (US) - Male Neural' },
    { code: 'en-IN-Neural2-A', name: 'English (India) - Female Neural' },
    { code: 'en-IN-Neural2-B', name: 'English (India) - Male Neural' },
    { code: 'en-GB-Neural2-A', name: 'English (UK) - Female Neural' },
    { code: 'en-GB-Neural2-B', name: 'English (UK) - Male Neural' },
    
    // Telugu voices
    { code: 'te-IN-Standard-A', name: 'Telugu (India) - Female Standard' },
    { code: 'te-IN-Standard-B', name: 'Telugu (India) - Male Standard' },
    { code: 'te-IN-Wavenet-A', name: 'Telugu (India) - Female Wavenet' },
    { code: 'te-IN-Wavenet-B', name: 'Telugu (India) - Male Wavenet' },
    
    // Hindi voices
    { code: 'hi-IN-Standard-A', name: 'Hindi (India) - Female Standard' },
    { code: 'hi-IN-Standard-B', name: 'Hindi (India) - Male Standard' },
    { code: 'hi-IN-Wavenet-A', name: 'Hindi (India) - Female Wavenet' },
    { code: 'hi-IN-Wavenet-B', name: 'Hindi (India) - Male Wavenet' },
    { code: 'hi-IN-Neural2-A', name: 'Hindi (India) - Female Neural' },
    { code: 'hi-IN-Neural2-C', name: 'Hindi (India) - Male Neural' },
    
    // Tamil voices
    { code: 'ta-IN-Standard-A', name: 'Tamil (India) - Female Standard' },
    { code: 'ta-IN-Standard-B', name: 'Tamil (India) - Male Standard' },
    { code: 'ta-IN-Wavenet-A', name: 'Tamil (India) - Female Wavenet' },
    { code: 'ta-IN-Wavenet-B', name: 'Tamil (India) - Male Wavenet' },
    
    // Kannada voices
    { code: 'kn-IN-Standard-A', name: 'Kannada (India) - Female Standard' },
    { code: 'kn-IN-Standard-B', name: 'Kannada (India) - Male Standard' },
    { code: 'kn-IN-Wavenet-A', name: 'Kannada (India) - Female Wavenet' },
    { code: 'kn-IN-Wavenet-B', name: 'Kannada (India) - Male Wavenet' },
    
    // Bengali voices
    { code: 'bn-IN-Standard-A', name: 'Bengali (India) - Female Standard' },
    { code: 'bn-IN-Standard-B', name: 'Bengali (India) - Male Standard' },
    { code: 'bn-IN-Wavenet-A', name: 'Bengali (India) - Female Wavenet' },
    { code: 'bn-IN-Wavenet-B', name: 'Bengali (India) - Male Wavenet' },
  ];

  // Sample texts in different languages for testing
  const sampleTexts = [
    { language: 'English', text: 'Hello! This is a test of Google Text-to-Speech service. The system is working correctly.' },
    { language: 'Telugu', text: 'నమస్కారం! ఇది Google Text-to-Speech సేవ యొక్క పరీక్ష. సిస్టం సరిగ్గా పని చేస్తోంది.' },
    { language: 'Hindi', text: 'नमस्ते! यह Google Text-to-Speech सेवा का परीक्षण है। सिस्टम सही तरीके से काम कर रहा है।' },
    { language: 'Tamil', text: 'வணக்கம்! இது Google Text-to-Speech சேவையின் சோதனை. கணினி சரியாக வேலை செய்கிறது.' },
    { language: 'Kannada', text: 'ನಮಸ್ಕಾರ! ಇದು Google Text-to-Speech ಸೇವೆಯ ಪರೀಕ್ಷೆ. ಸಿಸ್ಟಮ್ ಸರಿಯಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತಿದೆ.' },
    { language: 'Bengali', text: 'হ্যালো! এটি Google Text-to-Speech পরিষেবার পরীক্ষা। সিস্টেম সঠিকভাবে কাজ করছে।' },
  ];

  const testGoogleTTS = async () => {
    if (!testText.trim()) return;
    if (!apiKey.trim()) {
      setTestResults(prev => [{
        success: false,
        message: 'API key is required',
        timestamp: Date.now()
      }, ...prev.slice(0, 4)]);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🧪 Testing Google TTS API...');
      console.log('📝 Text:', testText.substring(0, 50) + '...');
      console.log('🎤 Voice:', selectedVoice);
      console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');

      // Prepare the request
      const requestBody = {
        input: {
          text: testText.trim()
        },
        voice: {
          languageCode: selectedVoice.split('-').slice(0, 2).join('-'), // e.g., 'en-US'
          name: selectedVoice
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      };

      console.log('📤 Request body:', requestBody);

      // Make the API call
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success! Audio content length:', data.audioContent?.length);

        // Create audio URL from base64 data
        let audioUrl: string | undefined;
        if (data.audioContent) {
          try {
            const audioBytes = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });
            audioUrl = URL.createObjectURL(audioBlob);
            
            // Play the audio automatically
            const audio = new Audio(audioUrl);
            audio.play().catch(e => console.log('Auto-play blocked:', e));
          } catch (audioError) {
            console.error('Error creating audio:', audioError);
          }
        }

        setTestResults(prev => [{
          success: true,
          message: 'Google TTS API test successful!',
          details: {
            voice: selectedVoice,
            audioLength: data.audioContent?.length,
            textLength: testText.length
          },
          audioUrl,
          timestamp: Date.now()
        }, ...prev.slice(0, 4)]);

      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', response.status, errorData);

        let errorMessage = `API Error: ${response.status}`;
        if (errorData.error?.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }

        setTestResults(prev => [{
          success: false,
          message: errorMessage,
          details: {
            status: response.status,
            error: errorData.error || 'Unknown error'
          },
          timestamp: Date.now()
        }, ...prev.slice(0, 4)]);
      }

    } catch (error) {
      console.error('🔥 Test failed:', error);
      setTestResults(prev => [{
        success: false,
        message: `Test failed: ${error}`,
        details: { error: String(error) },
        timestamp: Date.now()
      }, ...prev.slice(0, 4)]);
    } finally {
      setIsLoading(false);
    }
  };

  const testAllLanguages = async () => {
    setIsLoading(true);
    const results: TTSTestResult[] = [];
    
    try {
      for (const sample of sampleTexts) {
        console.log(`🧪 Testing ${sample.language}...`);
        
        try {
          const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: sample.text },
              voice: { 
                languageCode: sample.language === 'English' ? 'en-US' : 
                           sample.language === 'Telugu' ? 'te-IN' :
                           sample.language === 'Hindi' ? 'hi-IN' :
                           sample.language === 'Tamil' ? 'ta-IN' :
                           sample.language === 'Kannada' ? 'kn-IN' :
                           sample.language === 'Bengali' ? 'bn-IN' : 'en-US',
                name: sample.language === 'English' ? 'en-US-Neural2-F' : 
                      sample.language === 'Telugu' ? 'te-IN-Standard-A' :
                      sample.language === 'Hindi' ? 'hi-IN-Neural2-A' :
                      sample.language === 'Tamil' ? 'ta-IN-Standard-A' :
                      sample.language === 'Kannada' ? 'kn-IN-Standard-A' :
                      sample.language === 'Bengali' ? 'bn-IN-Standard-A' : 'en-US-Neural2-F'
              },
              audioConfig: { audioEncoding: "MP3" }
            })
          });

          if (response.ok) {
            results.push({
              success: true,
              message: `✅ ${sample.language} TTS test successful!`,
              details: { language: sample.language },
              timestamp: Date.now()
            });
            console.log(`✅ ${sample.language} test passed`);
          } else {
            results.push({
              success: false,
              message: `❌ ${sample.language} TTS failed: ${response.status}`,
              details: { language: sample.language, status: response.status },
              timestamp: Date.now()
            });
            console.log(`❌ ${sample.language} test failed: ${response.status}`);
          }
        } catch (error) {
          results.push({
            success: false,
            message: `❌ ${sample.language} TTS error: ${error}`,
            details: { language: sample.language, error: String(error) },
            timestamp: Date.now()
          });
          console.log(`❌ ${sample.language} test error:`, error);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setTestResults(results);
      
    } catch (error) {
      console.error('❌ Multilingual test failed:', error);
      setTestResults([{
        success: false,
        message: `Multilingual test failed: ${error}`,
        details: { error: String(error) },
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedTests = [
    'Hello! This is a test of the Google Text-to-Speech service.',
    'I can dance, exercise, fight, teach, and express emotions!',
    'Show me a dance! Let me demonstrate some moves!',
    'Ready for a workout? Let\'s do some exercises together!',
    'Here are my martial arts skills! Watch this fighting stance!',
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🧪 Google TTS API Test</Title>
      
      <Paragraph>
        This tool tests the Google Cloud Text-to-Speech API with your API key to ensure it works correctly 
        before integrating it into the main system.
      </Paragraph>

      {/* API Key Input */}
      <Card title="API Configuration" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Google API Key:</Text>
            <Input.Password
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google API key"
              style={{ marginTop: '8px' }}
            />
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
          
          {/* Sample Texts */}
          <div>
            <Text strong>Sample Texts (Click to test):</Text>
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {sampleTexts.map((sample, index) => (
                <Button
                  key={index}
                  size="small"
                  onClick={() => setTestText(sample.text)}
                  style={{ fontSize: '12px' }}
                >
                  {sample.language}
                </Button>
              ))}
            </div>
          </div>
          
          <Button 
            type="primary" 
            onClick={testGoogleTTS} 
            loading={isLoading}
            disabled={!testText.trim()}
          >
            {isLoading ? 'Speaking...' : 'Test Google TTS'}
          </Button>
          
          <Button 
            type="default" 
            onClick={testAllLanguages} 
            loading={isLoading}
            disabled={!apiKey.trim()}
            style={{ marginTop: '8px' }}
          >
            {isLoading ? 'Testing All Languages...' : '🧪 Test All Languages'}
          </Button>
        </Space>
      </Card>

      {/* Predefined Tests */}
      <Card title="Quick Tests" style={{ marginBottom: '20px' }}>
        <Space wrap>
          {predefinedTests.map((text, index) => (
            <Button
              key={index}
              size="small"
              onClick={() => {
                setTestText(text);
                setTimeout(() => testGoogleTTS(), 100);
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
                  </div>
                </div>
              }
              description={
                <div>
                  {result.details && (
                    <div style={{ marginTop: '8px' }}>
                      <Text code style={{ fontSize: '11px' }}>
                        {JSON.stringify(result.details, null, 2)}
                      </Text>
                    </div>
                  )}
                  {result.audioUrl && (
                    <div style={{ marginTop: '8px' }}>
                      <audio controls style={{ width: '100%' }}>
                        <source src={result.audioUrl} type="audio/mp3" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              }
            />
          ))}
        </Card>
      )}

      {/* Instructions */}
      <Card title="Instructions">
        <Paragraph>
          <Text strong>1. API Key Setup:</Text> Make sure you have a valid Google Cloud API key with Text-to-Speech API enabled.
        </Paragraph>
        <Paragraph>
          <Text strong>2. Test Process:</Text> Enter your API key, select a voice, enter test text, and click "Test Google TTS".
        </Paragraph>
        <Paragraph>
          <Text strong>3. Expected Result:</Text> If successful, you'll hear the synthesized speech and see success details.
        </Paragraph>
        <Paragraph>
          <Text strong>4. Troubleshooting:</Text> Check the error details if the test fails. Common issues include:
          <ul>
            <li>Invalid API key</li>
            <li>API not enabled in Google Cloud Console</li>
            <li>Billing not set up</li>
            <li>Network connectivity issues</li>
          </ul>
        </Paragraph>
      </Card>

      {isLoading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '8px' }}>Testing Google TTS API...</div>
        </div>
      )}
    </div>
  );
};

export default GoogleTTSTest; 