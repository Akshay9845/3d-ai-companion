import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

const speechKey = import.meta.env.VITE_SPEECH_API_KEY;
const speechRegion = import.meta.env.VITE_SPEECH_API_REGION || 'eastus';

if (!speechKey) {
  throw new Error('VITE_SPEECH_API_KEY is not defined in the environment variables');
}

let audioPlayer = new SpeechSDK.SpeakerAudioDestination();
let speechSynthesizer: SpeechSDK.SpeechSynthesizer | null = null;
let currentRegion = speechRegion;

// List of fallback regions to try if the primary region fails
const fallbackRegions = ['eastus', 'westus2', 'westeurope', 'eastasia'];

function getSynthesizer(region?: string): SpeechSDK.SpeechSynthesizer {
  const targetRegion = region || currentRegion;
  
  if (!speechSynthesizer || currentRegion !== targetRegion) {
    // Close existing synthesizer if switching regions
    if (speechSynthesizer) {
      speechSynthesizer.close();
    }
    
    console.log(`🔧 Initializing Azure Speech synthesizer with region: ${targetRegion}`);
    console.log(`🔑 Using API key: ${speechKey.substring(0, 10)}...${speechKey.substring(speechKey.length - 4)}`);
    
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, targetRegion);
    
    // Set the voice name for high-quality, expressive neural voice
    speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';
    
    // Add connection timeout and retry settings
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "1000");
    
    // Add debugging properties
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_LogFilename, "azure_speech_debug.log");
    speechConfig.setProperty(SpeechSDK.PropertyId.Speech_LogFilename, "azure_speech_debug.log");
    
    // Set user agent for better debugging
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_UserAgent, "3DMama-Echo-AI/1.0");
    
    // Add additional connection properties
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_RecoMode, "INTERACTIVE");
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_RecoLanguage, "en-US");
    
    // Set audio output format
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceResponse_RequestSentenceBoundary, "true");
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps, "true");
    
    // Add CORS and authentication headers
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_Headers, 
      "X-Requested-With: XMLHttpRequest");
    
    console.log(`🌐 Speech config created for region: ${targetRegion}`);
    
    // Create new audio player for this synthesizer
    audioPlayer = new SpeechSDK.SpeakerAudioDestination();
    speechSynthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioPlayer);
    currentRegion = targetRegion;
    
    console.log(`✅ Speech synthesizer initialized for region: ${targetRegion}`);
  }
  
  return speechSynthesizer;
}

// Test function to verify Azure Speech service connection
export async function testAzureSpeechConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing Azure Speech service connection...');
    console.log('Speech Key present:', !!speechKey);
    console.log('Speech Region:', speechRegion);
    
    // First, test if the SDK is properly loaded
    const sdkTest = await testSDKAvailability();
    if (!sdkTest) {
      console.log('❌ Azure Speech SDK not available');
      return false;
    }
    
    // Test all available regions to see which ones work
    const regionTest = await testAllRegions();
    if (!regionTest) {
      console.log('❌ No Azure Speech regions are working');
      return false;
    }
    
    // First, try a simple connection test without synthesis
    const testConnection = await testConnectionOnly();
    if (!testConnection) {
      console.log('❌ Basic connection test failed');
      return false;
    }
    
    // Try a simple synthesis test
    const testSSML = `<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0">
      <voice name="en-US-JennyNeural">
        Hello from Azure Speech!
      </voice>
    </speak>`;
    
    await synthesizeSpeech(testSSML, false); // Don't play, just test
    console.log('✅ Azure Speech service connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Azure Speech service connection failed:', error);
    return false;
  }
}

// Test if Azure Speech SDK is properly loaded
async function testSDKAvailability(): Promise<boolean> {
  try {
    console.log('🔧 Testing Azure Speech SDK availability...');
    
    // Check if SpeechSDK is available
    if (!SpeechSDK) {
      console.log('❌ SpeechSDK is not available');
      return false;
    }
    
    // Check if required classes are available
    if (!SpeechSDK.SpeechConfig) {
      console.log('❌ SpeechSDK.SpeechConfig is not available');
      return false;
    }
    
    if (!SpeechSDK.SpeechSynthesizer) {
      console.log('❌ SpeechSDK.SpeechSynthesizer is not available');
      return false;
    }
    
    if (!SpeechSDK.SpeakerAudioDestination) {
      console.log('❌ SpeechSDK.SpeakerAudioDestination is not available');
      return false;
    }
    
    if (!SpeechSDK.PropertyId) {
      console.log('❌ SpeechSDK.PropertyId is not available');
      return false;
    }
    
    if (!SpeechSDK.ResultReason) {
      console.log('❌ SpeechSDK.ResultReason is not available');
      return false;
    }
    
    // Test browser audio context
    const audioContextTest = testAudioContext();
    if (!audioContextTest) {
      console.log('❌ Browser audio context test failed');
      return false;
    }
    
    // Test browser WebSocket support and security
    const webSocketTest = await testWebSocketSupport();
    if (!webSocketTest) {
      console.log('❌ WebSocket support test failed');
      return false;
    }
    
    console.log('✅ Azure Speech SDK is properly loaded');
    return true;
  } catch (error) {
    console.error('❌ Error testing SDK availability:', error);
    return false;
  }
}

// Test browser audio context
function testAudioContext(): boolean {
  try {
    console.log('🎵 Testing browser audio context...');
    
    // Check if AudioContext is available
    if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
      console.log('❌ AudioContext not supported in this browser');
      return false;
    }
    
    // Try to create an audio context
    const AudioContextClass = AudioContext || webkitAudioContext;
    const audioContext = new AudioContextClass();
    
    if (audioContext.state === 'suspended') {
      console.log('⚠️ Audio context is suspended, attempting to resume...');
      audioContext.resume();
    }
    
    console.log(`✅ Audio context is working (state: ${audioContext.state})`);
    return true;
  } catch (error) {
    console.error('❌ Audio context test failed:', error);
    return false;
  }
}

// Test browser WebSocket support and security
async function testWebSocketSupport(): Promise<boolean> {
  try {
    console.log('🔌 Testing WebSocket support...');
    
    // Check if WebSocket is available
    if (typeof WebSocket === 'undefined') {
      console.log('❌ WebSocket not supported in this browser');
      return false;
    }
    
    // Check if we're on HTTPS (required for WebSocket secure connections)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.log('⚠️ Not on HTTPS - WebSocket secure connections may fail');
      console.log(`Current protocol: ${window.location.protocol}`);
      console.log(`Current hostname: ${window.location.hostname}`);
    }
    
    // Test WebSocket connection to a simple endpoint
    const testWebSocket = new WebSocket('wss://echo.websocket.org');
    
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ WebSocket test timed out');
        resolve(false);
      }, 5000);
      
      testWebSocket.onopen = () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection test successful');
        testWebSocket.close();
        resolve(true);
      };
      
      testWebSocket.onerror = (error) => {
        clearTimeout(timeout);
        console.log('❌ WebSocket connection test failed:', error);
        resolve(false);
      };
      
      testWebSocket.onclose = (event) => {
        clearTimeout(timeout);
        if (event.code === 1000) {
          console.log('✅ WebSocket connection closed normally');
          resolve(true);
        } else {
          console.log(`❌ WebSocket connection closed with code: ${event.code}`);
          resolve(false);
        }
      };
    });
  } catch (error) {
    console.error('❌ WebSocket support test failed:', error);
    return false;
  }
}

// Test network connectivity to Azure Speech endpoints
async function testNetworkConnectivity(): Promise<boolean> {
  try {
    console.log('🌐 Testing network connectivity to Azure Speech endpoints...');
    
    const endpoints = [
      `https://${currentRegion}.tts.speech.microsoft.com/`,
      `https://${currentRegion}.api.cognitive.microsoft.com/`,
      ...fallbackRegions.map(region => `https://${region}.tts.speech.microsoft.com/`)
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Testing endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'HEAD',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'User-Agent': '3DMama-Echo-AI/1.0'
          }
        });
        
        if (response.ok || response.status === 401 || response.status === 403) {
          console.log(`✅ Endpoint ${endpoint} is reachable (status: ${response.status})`);
          return true;
        } else {
          console.log(`⚠️ Endpoint ${endpoint} returned status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} failed:`, error);
      }
    }
    
    console.log('❌ No Azure Speech endpoints are reachable');
    return false;
  } catch (error) {
    console.error('❌ Network connectivity test failed:', error);
    return false;
  }
}

// Simple connection test without synthesis
async function testConnectionOnly(): Promise<boolean> {
  try {
    console.log('🔌 Testing basic Azure Speech connection...');
    
    // First, test network connectivity to Azure Speech endpoints
    const connectivityTest = await testNetworkConnectivity();
    if (!connectivityTest) {
      console.log('❌ Network connectivity test failed');
      return false;
    }
    
    // Try to get available voices first (this is a simpler test)
    const voicesTest = await testVoicesList();
    if (!voicesTest) {
      console.log('❌ Voices list test failed');
      return false;
    }
    
    // Create a minimal config to test connection
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, currentRegion);
    speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';
    
    // Set shorter timeouts for connection test
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "3000");
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "1000");
    
    const testPlayer = new SpeechSDK.SpeakerAudioDestination();
    const testSynthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, testPlayer);
    
    // Test with minimal SSML
    const result = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ Connection test timed out');
        resolve(false);
      }, 5000);
      
      testSynthesizer.speakSsmlAsync(
        '<speak version="1.0"><voice name="en-US-JennyNeural">Test</voice></speak>',
        result => {
          clearTimeout(timeout);
          testSynthesizer.close();
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log('✅ Basic connection test successful');
            resolve(true);
          } else {
            console.log('❌ Basic connection test failed:', result.errorDetails);
            resolve(false);
          }
        },
        err => {
          clearTimeout(timeout);
          testSynthesizer.close();
          console.log('❌ Basic connection test error:', err);
          resolve(false);
        }
      );
    });
    
    return result;
  } catch (error) {
    console.error('❌ Basic connection test exception:', error);
    return false;
  }
}

// Test getting available voices from Azure Speech service
async function testVoicesList(): Promise<boolean> {
  try {
    console.log('🎤 Testing Azure Speech voices list...');
    
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, currentRegion);
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    
    const result = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ Voices list test timed out');
        resolve(false);
      }, 10000);
      
      synthesizer.getVoicesAsync(
        "en-US",
        result => {
          clearTimeout(timeout);
          synthesizer.close();
          if (result.reason === SpeechSDK.ResultReason.VoicesListRetrieved) {
            console.log(`✅ Voices list retrieved successfully (${result.voices.length} voices available)`);
            resolve(true);
          } else {
            console.log('❌ Voices list test failed:', result.errorDetails);
            resolve(false);
          }
        },
        err => {
          clearTimeout(timeout);
          synthesizer.close();
          console.log('❌ Voices list test error:', err);
          resolve(false);
        }
      );
    });
    
    return result;
  } catch (error) {
    console.error('❌ Voices list test exception:', error);
    return false;
  }
}

// Test all available regions to find which ones work
async function testAllRegions(): Promise<boolean> {
  try {
    console.log('🌍 Testing all available Azure Speech regions...');
    
    const allRegions = [currentRegion, ...fallbackRegions];
    const workingRegions: string[] = [];
    
    for (const region of allRegions) {
      try {
        console.log(`🔍 Testing region: ${region}`);
        
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, region);
        const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
        
        const result = await new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => {
            console.log(`⏰ Region ${region} test timed out`);
            resolve(false);
          }, 5000);
          
          synthesizer.getVoicesAsync(
            "en-US",
            result => {
              clearTimeout(timeout);
              synthesizer.close();
              if (result.reason === SpeechSDK.ResultReason.VoicesListRetrieved) {
                console.log(`✅ Region ${region} is working (${result.voices.length} voices available)`);
                workingRegions.push(region);
                resolve(true);
              } else {
                console.log(`❌ Region ${region} failed:`, result.errorDetails);
                resolve(false);
              }
            },
            err => {
              clearTimeout(timeout);
              synthesizer.close();
              console.log(`❌ Region ${region} error:`, err);
              resolve(false);
            }
          );
        });
        
        if (result) {
          // Found a working region, update current region
          currentRegion = region;
          console.log(`🎯 Set working region to: ${region}`);
          return true;
        }
        
      } catch (error) {
        console.log(`❌ Region ${region} exception:`, error);
      }
    }
    
    if (workingRegions.length > 0) {
      console.log(`✅ Found ${workingRegions.length} working regions:`, workingRegions);
      return true;
    } else {
      console.log('❌ No working regions found');
      return false;
    }
  } catch (error) {
    console.error('❌ Region testing failed:', error);
    return false;
  }
}

/**
 * Synthesizes speech from SSML or text using Azure's Text-to-Speech service.
 * @param ssml The SSML or plain text to be synthesized.
 * @param play - If true, plays the audio immediately. If false, returns the audio data.
 * @returns A Promise that resolves with the audio data as an ArrayBuffer, or void if played directly.
 */
export async function synthesizeSpeech(ssml: string, play: boolean = true): Promise<ArrayBuffer | void> {
  let lastError: Error | null = null;
  
  // Try the current region first, then fallback regions
  const regionsToTry = [currentRegion, ...fallbackRegions.filter(r => r !== currentRegion)];
  
  for (const region of regionsToTry) {
    try {
      console.log(`🎤 Attempting Azure TTS synthesis with region: ${region}`);
      
      const result = await new Promise<{ audioData?: ArrayBuffer; error?: Error }>((resolve, reject) => {
        try {
          const synthesizer = getSynthesizer(region);
          
          // Add WebSocket connection error handling
          const connectionTimeout = setTimeout(() => {
            console.log(`⏰ WebSocket connection timeout for region: ${region}`);
            resolve({ error: new Error(`WebSocket connection timeout for region: ${region}`) });
          }, 10000);
          
          synthesizer.speakSsmlAsync(
            ssml,
            result => {
              clearTimeout(connectionTimeout);
              if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                console.log(`✅ Azure TTS synthesis finished successfully with region: ${region}`);
                resolve({ audioData: result.audioData });
              } else {
                const error = new Error(`Speech synthesis failed: ${result.errorDetails}`);
                console.error(`❌ Speech synthesis failed with region ${region}:`, result.errorDetails);
                
                // Log specific error details for debugging
                if (result.errorDetails.includes('WebSocket')) {
                  console.error(`🔌 WebSocket error detected for region ${region}`);
                }
                if (result.errorDetails.includes('1006')) {
                  console.error(`🔌 WebSocket connection closed (1006) for region ${region}`);
                }
                
                resolve({ error });
              }
            },
            err => {
              clearTimeout(connectionTimeout);
              console.error(`❌ Error synthesizing speech with region ${region}:`, err);
              
              // Log specific error types
              if (err.message && err.message.includes('WebSocket')) {
                console.error(`🔌 WebSocket error for region ${region}:`, err.message);
              }
              if (err.message && err.message.includes('1006')) {
                console.error(`🔌 WebSocket connection closed (1006) for region ${region}:`, err.message);
              }
              
              resolve({ error: err });
            }
          );
        } catch (error) {
          console.error(`❌ Failed to initialize speech synthesis with region ${region}:`, error);
          resolve({ error: error as Error });
        }
      });
      
      if (result.error) {
        lastError = result.error;
        continue; // Try next region
      }
      
      // Success! Return the result
      if (play) {
        return;
      } else {
        return result.audioData;
      }
      
    } catch (error) {
      console.error(`❌ Region ${region} failed:`, error);
      lastError = error as Error;
      continue; // Try next region
    }
  }
  
  // All regions failed
  console.error('❌ All Azure Speech regions failed. Last error:', lastError);
  throw lastError || new Error('Azure Speech synthesis failed for all regions');
}

/**
 * Stops any currently playing synthesized speech.
 */
export function stopSpeech(): void {
  if (speechSynthesizer) {
    try {
      speechSynthesizer.close();
      speechSynthesizer = null;
    } catch (error) {
      console.warn('Warning: Error closing speech synthesizer:', error);
    }
  }
  
  if (audioPlayer) {
    try {
      audioPlayer.pause();
      audioPlayer = new SpeechSDK.SpeakerAudioDestination();
    } catch (error) {
      console.warn('Warning: Error resetting audio player:', error);
    }
  }
} 