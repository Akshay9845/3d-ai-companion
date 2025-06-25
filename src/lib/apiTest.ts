// API Test Utility - Test all configured APIs

export interface APITestResult {
  service: string;
  status: 'working' | 'error' | 'not_configured';
  message: string;
  details?: any;
}

export class APITestService {
  
  // Test Supabase connection
  static async testSupabase(): Promise<APITestResult> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return {
          service: 'Supabase',
          status: 'not_configured',
          message: 'Supabase URL or key not configured'
        };
      }

      // Test basic connection
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (response.ok) {
        return {
          service: 'Supabase',
          status: 'working',
          message: 'Supabase connection successful'
        };
      } else {
        return {
          service: 'Supabase',
          status: 'error',
          message: `Supabase connection failed: ${response.status}`
        };
      }
    } catch (error) {
      return {
        service: 'Supabase',
        status: 'error',
        message: `Supabase test failed: ${error}`
      };
    }
  }

  // Test Azure Face API
  static async testFaceAPI(): Promise<APITestResult> {
    try {
      const faceApiKey = import.meta.env.VITE_FACE_API_KEY;
      const faceApiEndpoint = import.meta.env.VITE_FACE_API_ENDPOINT;
      
      if (!faceApiKey || !faceApiEndpoint) {
        return {
          service: 'Azure Face API',
          status: 'not_configured',
          message: 'Face API key or endpoint not configured'
        };
      }

      // Test with a simple image (1x1 pixel base64)
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const response = await fetch(`${faceApiEndpoint}face/v1.0/detect?returnFaceId=false&returnFaceLandmarks=false&returnFaceAttributes=age,gender,emotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': faceApiKey
        },
        body: Uint8Array.from(
          atob(testImage.replace(/^data:image\/\w+;base64,/, '')),
          c => c.charCodeAt(0)
        )
      });

      if (response.ok) {
        const data = await response.json();
        return {
          service: 'Azure Face API',
          status: 'working',
          message: 'Face API connection successful',
          details: { facesDetected: data.length }
        };
      } else {
        return {
          service: 'Azure Face API',
          status: 'error',
          message: `Face API test failed: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        service: 'Azure Face API',
        status: 'error',
        message: `Face API test failed: ${error}`
      };
    }
  }

  // Test Azure Speech API
  static async testSpeechAPI(): Promise<APITestResult> {
    try {
      const speechApiKey = import.meta.env.VITE_SPEECH_API_KEY;
      const speechApiRegion = import.meta.env.VITE_SPEECH_API_REGION;
      
      if (!speechApiKey || !speechApiRegion) {
        return {
          service: 'Azure Speech API',
          status: 'not_configured',
          message: 'Speech API key or region not configured'
        };
      }

      // Test speech-to-text endpoint
      const response = await fetch(`https://${speechApiRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': speechApiKey,
          'Content-Type': 'audio/wav'
        },
        body: new ArrayBuffer(0) // Empty audio for test
      });

      // Speech API returns 400 for empty audio, but that means the endpoint is reachable
      if (response.status === 400) {
        return {
          service: 'Azure Speech API',
          status: 'working',
          message: 'Speech API endpoint reachable (400 expected for empty audio)'
        };
      } else if (response.ok) {
        return {
          service: 'Azure Speech API',
          status: 'working',
          message: 'Speech API connection successful'
        };
      } else {
        return {
          service: 'Azure Speech API',
          status: 'error',
          message: `Speech API test failed: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        service: 'Azure Speech API',
        status: 'error',
        message: `Speech API test failed: ${error}`
      };
    }
  }

  // Test Google API
  static async testGoogleAPI(): Promise<APITestResult> {
    try {
      const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      
      if (!googleApiKey) {
        return {
          service: 'Google API',
          status: 'not_configured',
          message: 'Google API key not configured'
        };
      }

      // Test with a simple Google API call
      const response = await fetch(`https://www.googleapis.com/discovery/v1/apis?key=${googleApiKey}`);
      
      if (response.ok) {
        return {
          service: 'Google API',
          status: 'working',
          message: 'Google API connection successful'
        };
      } else {
        return {
          service: 'Google API',
          status: 'error',
          message: `Google API test failed: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        service: 'Google API',
        status: 'error',
        message: `Google API test failed: ${error}`
      };
    }
  }

  // Test Google TTS API
  static async testGoogleTTSAPI(): Promise<APITestResult> {
    try {
      const googleApiKey = import.meta.env.VITE_GOOGLE_TTS_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;
      
      if (!googleApiKey) {
        return {
          service: 'Google TTS API',
          status: 'not_configured',
          message: 'Google TTS API key not configured'
        };
      }

      // Test with a simple TTS request
      const requestBody = {
        input: {
          text: "Hello"
        },
        voice: {
          languageCode: "en-US",
          name: "en-US-Neural2-F"
        },
        audioConfig: {
          audioEncoding: "MP3"
        }
      };

      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          service: 'Google TTS API',
          status: 'working',
          message: 'Google TTS API connection successful',
          details: { audioContentLength: data.audioContent?.length || 0 }
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          service: 'Google TTS API',
          status: 'error',
          message: `Google TTS API test failed: ${response.status} ${errorData.error?.message || response.statusText}`
        };
      }
    } catch (error) {
      return {
        service: 'Google TTS API',
        status: 'error',
        message: `Google TTS API test failed: ${error}`
      };
    }
  }

  // Test Groq API
  static async testGroqAPI(): Promise<APITestResult> {
    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!groqApiKey) {
        return {
          service: 'Groq API',
          status: 'not_configured',
          message: 'Groq API key not configured'
        };
      }

      // Test with a simple completion request
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          service: 'Groq API',
          status: 'working',
          message: 'Groq API connection successful',
          details: { model: data.model }
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          service: 'Groq API',
          status: 'error',
          message: `Groq API test failed: ${response.status} ${errorData.error?.message || response.statusText}`
        };
      }
    } catch (error) {
      return {
        service: 'Groq API',
        status: 'error',
        message: `Groq API test failed: ${error}`
      };
    }
  }

  // Test all APIs
  static async testAllAPIs(): Promise<APITestResult[]> {
    console.log('🧪 Testing all configured APIs...');
    
    const results = await Promise.all([
      this.testSupabase(),
      this.testFaceAPI(),
      this.testSpeechAPI(),
      this.testGoogleAPI(),
      this.testGoogleTTSAPI(),
      this.testGroqAPI()
    ]);

    // Log results
    results.forEach(result => {
      const emoji = result.status === 'working' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
      console.log(`${emoji} ${result.service}: ${result.message}`);
    });

    return results;
  }

  // Get environment variables status
  static getEnvironmentStatus(): Record<string, boolean> {
    return {
      'VITE_SUPABASE_URL': !!import.meta.env.VITE_SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      'VITE_GROQ_API_KEY': !!import.meta.env.VITE_GROQ_API_KEY,
      'VITE_GOOGLE_API_KEY': !!import.meta.env.VITE_GOOGLE_API_KEY,
      'VITE_GOOGLE_TTS_API_KEY': !!import.meta.env.VITE_GOOGLE_TTS_API_KEY,
      'VITE_SPEECH_API_KEY': !!import.meta.env.VITE_SPEECH_API_KEY,
      'VITE_FACE_API_KEY': !!import.meta.env.VITE_FACE_API_KEY,
      'VITE_VISION_API_KEY': !!import.meta.env.VITE_VISION_API_KEY
    };
  }
} 