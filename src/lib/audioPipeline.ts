import { coquiTTS, TTSOptions } from './coquiTTS';
import { groqService } from './groqService';
import { whisperSTT } from './whisperSTT';

export interface PipelineResult {
  transcription: string;
  aiResponse: string;
  success: boolean;
}

class AudioPipeline {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing Audio Pipeline...');
    
    try {
      // Initialize all services
      await Promise.all([
        whisperSTT.initialize(),
        coquiTTS.initialize(),
        groqService.initialize()
      ]);
      
      this.isInitialized = true;
      console.log('✅ Audio Pipeline initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Audio Pipeline:', error);
      throw error;
    }
  }

  async processConversation(userMessage: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('🔄 Processing conversation...');
    
    try {
      const response = await groqService.processConversation(userMessage);
      console.log('✅ Conversation processed');
      return response;
    } catch (error) {
      console.error('❌ Conversation processing failed:', error);
      throw error;
    }
  }

  async speechToText(audioBlob: Blob): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await whisperSTT.transcribe(audioBlob);
  }

  // Add transcribe method for compatibility (without audio blob parameter)
  async transcribe(): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Use Web Speech API for live transcription
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      let finalTranscript = '';

      recognition.onresult = (event) => {
        if (event.results.length > 0) {
          finalTranscript = event.results[0][0].transcript;
        }
      };

      recognition.onend = () => {
        resolve(finalTranscript);
      };

      recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.start();
    });
  }

  async textToSpeech(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await coquiTTS.speak(text, options);
  }

  async processAudioInput(audioBlob: Blob): Promise<PipelineResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('🎤 Processing audio input...');

    try {
      // Step 1: Speech to Text
      const transcription = await this.speechToText(audioBlob);
      console.log('📝 Transcription:', transcription);

      // Step 2: AI Processing
      const aiResponse = await this.processConversation(transcription);
      console.log('🤖 AI Response:', aiResponse);

      // Step 3: Text to Speech
      await this.textToSpeech(aiResponse);
      console.log('🎵 Audio response completed');

      return {
        transcription,
        aiResponse,
        success: true
      };

    } catch (error) {
      console.error('❌ Audio processing failed:', error);
      return {
        transcription: '',
        aiResponse: 'Sorry, I encountered an error processing your request.',
        success: false
      };
    }
  }

  isReady(): boolean {
    return this.isInitialized && 
           whisperSTT.isReady() && 
           coquiTTS.isReady() && 
           groqService.isReady();
  }

  cleanup(): void {
    if (coquiTTS.isReady()) {
      coquiTTS.stop();
    }
  }
}

export const audioPipeline = new AudioPipeline(); 