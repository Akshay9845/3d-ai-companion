import React, { useEffect } from 'react';
import { enhancedGoogleTTSService } from '../lib/enhancedGoogleTTSService';
import { visionIntegratedChatService } from '../lib/visionIntegratedChat';

// Helper component to ensure speech integration is properly connected
const SpeechIntegrationHelper: React.FC = () => {
  useEffect(() => {
    // Initialize Google TTS service
    const initializeGoogleTTS = async () => {
      try {
        const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyB-6aBzVSQo9pWXDKBKyxA1towrHqdYN2g';
        console.log('🎤 Speech Integration: Initializing Google TTS...');
        
        await enhancedGoogleTTSService.initialize(googleApiKey);
        console.log('✅ Google TTS initialized for gesture responses');
      } catch (error) {
        console.warn('⚠️ Google TTS initialization failed, using fallback:', error);
      }
    };

    // Primary speech handler using Google TTS
    const googleTTSHandler = async (message: string) => {
      console.log('🎤 Using Google TTS for gesture response:', message);
      try {
        if (enhancedGoogleTTSService.isReady()) {
          await enhancedGoogleTTSService.speak(message, {
            language: 'en-US',
            voice: 'en-US-Neural2-J', // Natural male voice
            rate: 1.0,
            pitch: 0.0,
            volume: 0.0,
            emotion: 'friendly'
          });
          console.log('✅ Google TTS gesture response completed');
        } else {
          console.warn('⚠️ Google TTS not ready, using fallback');
          visionIntegratedChatService.speak(message);
        }
      } catch (error) {
        console.error('❌ Google TTS failed for gesture, using fallback:', error);
        visionIntegratedChatService.speak(message);
      }
    };

    // Fallback speech handler
    const fallbackSpeechHandler = (message: string) => {
      console.log('🎤 Fallback speech handler called:', message);
      visionIntegratedChatService.speak(message);
    };

    // Register multiple speech handler methods with Google TTS priority
    (window as any).speakMessage = googleTTSHandler;
    (window as any).triggerTTS = googleTTSHandler;
    (window as any).handleVisionResponse = googleTTSHandler;
    (window as any).handleSpeech = googleTTSHandler;

    // Expose the actual Google TTS service
    (window as any).ttsService = {
      speak: googleTTSHandler,
      isReady: () => enhancedGoogleTTSService.isReady(),
      stop: () => {
        enhancedGoogleTTSService.stopAudio();
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }
    };

    // Initialize Google TTS
    initializeGoogleTTS();

    // Test speech integration on component mount
    const testSpeech = () => {
      console.log('🎤 Testing enhanced speech integration...');
      
      // Test Google TTS service
      if (enhancedGoogleTTSService.isReady()) {
        console.log('✅ Google TTS service ready for gestures');
      } else {
        console.log('⚠️ Google TTS service not ready, will fallback');
      }

      // Test if existing TTS services are available
      const hasExistingTTS = !!(
        (window as any).triggerTTS ||
        (window as any).speakMessage ||
        (window as any).ttsService?.speak
      );

      if (hasExistingTTS) {
        console.log('✅ Existing TTS service detected');
      } else {
        console.log('ℹ️ Using fallback methods');
      }

      // Verify browser speech synthesis is available as final fallback
      if ('speechSynthesis' in window) {
        console.log('✅ Browser speech synthesis available as final fallback');
        
        // Load voices if not already loaded
        if (speechSynthesis.getVoices().length === 0) {
          speechSynthesis.addEventListener('voiceschanged', () => {
            console.log('✅ Speech voices loaded:', speechSynthesis.getVoices().length);
          });
        }
      } else {
        console.warn('⚠️ Browser speech synthesis not available');
      }
    };

    // Test after a brief delay to ensure everything is loaded
    setTimeout(testSpeech, 1000);

    // Welcome message when speech is ready
    setTimeout(() => {
      console.log('🎤 Enhanced Google TTS integration ready! Try waving at the camera!');
      console.log('🎤 Speech will now use Google TTS Neural voices for gesture responses');
    }, 3000);

    // Cleanup on unmount
    return () => {
      delete (window as any).speakMessage;
      delete (window as any).handleVisionResponse;
      delete (window as any).handleSpeech;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default SpeechIntegrationHelper; 