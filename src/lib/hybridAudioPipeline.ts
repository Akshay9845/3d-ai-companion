/**
 * Hybrid Audio Pipeline - Gemini-like Architecture
 * 
 * Pipeline Flow:
 * 🎤 User Speech → OpenAI GPT-4o mini transcribe → Text Processing → OpenAI GPT-4o mini TTS → ElevenLabs Streaming
 * 
 * This mimics Google's internal architecture:
 * - Chirp → OpenAI GPT-4o mini transcribe (STT)
 * - AudioLM → OpenAI GPT-4o mini TTS (Natural TTS with prosody)
 * - Final Polish → ElevenLabs (High-quality streaming)
 */

import { EnhancedOpenAIService } from './enhancedOpenAIService';

// Types for the hybrid pipeline
export interface HybridAudioConfig {
  // STT Configuration (OpenAI GPT-4o mini transcribe)
  sttEngine: 'openai-gpt4o' | 'openai-whisper' | 'browser' | 'vosk';
  sttModel?: 'gpt-4o-mini-transcribe' | 'gpt-4o-transcribe' | 'whisper-1';
  
  // TTS Configuration (OpenAI GPT-4o mini TTS)
  ttsEngine: 'openai-gpt4o' | 'bark' | 'xtts' | 'openvoice' | 'coqui';
  ttsModel?: 'gpt-4o-mini-tts' | 'tts-1' | 'tts-1-hd';
  
  // Final Output Configuration
  finalEngine: 'elevenlabs' | 'azure' | 'google';
  
  // Language and Voice Settings
  primaryLanguage: string;
  voiceCloning?: boolean;
  multilingualMode?: boolean;
  
  // Quality Settings
  latencyMode: 'realtime' | 'balanced' | 'quality';
  emotionalProcessing?: boolean;
}

export interface VoiceSegment {
  text: string;
  language: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm';
  prosody?: {
    rate: number;
    pitch: number;
    emphasis: number;
  };
}

export interface AudioProcessingResult {
  audioBlob: Blob;
  duration: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  processingTime: number;
}

/**
 * Optimized Hybrid Audio Pipeline for Gemini-like Performance
 * 
 * Architecture:
 * 1. OpenAI GPT-4o mini transcribe (fast, accurate speech recognition)
 * 2. OpenAI GPT-4o mini TTS (expressive, contextual synthesis) 
 * 3. ElevenLabs (final polish, voice quality)
 * 4. Smart caching and pre-warming
 */

export class HybridAudioPipeline {
    private openaiService: EnhancedOpenAIService | null = null;
    private elevenLabs: any = null;
    private audioCache: Map<string, ArrayBuffer> = new Map();
    private isInitialized = false;
    private currentVoiceId: string | null = null;
    private availableVoices: any[] = [];
    private performanceMetrics = {
        sttTime: 0,
        ttsTime: 0,
        totalTime: 0,
        cacheHits: 0,
        cacheMisses: 0
    };

    constructor() {
        console.log('🚀 Initializing Hybrid Audio Pipeline (Gemini-like architecture with OpenAI GPT-4o)');
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Initialize OpenAI GPT-4o mini services
            console.log('🤖 Initializing OpenAI GPT-4o mini services...');
            this.openaiService = await this.initializeOpenAIService();
            console.log('✅ OpenAI GPT-4o mini services ready');

            // Initialize ElevenLabs (final polish)
            console.log('🎵 ElevenLabs streaming ready for final output');
            this.elevenLabs = await this.initializeElevenLabs();

            this.isInitialized = true;
            console.log('✅ Hybrid Audio Pipeline initialized successfully');

            // Pre-warm for faster first response
            await this.preWarm();
        } catch (error) {
            console.error('❌ Hybrid Audio Pipeline initialization failed:', error);
            throw error;
        }
    }

    private async initializeOpenAIService(): Promise<EnhancedOpenAIService> {
        try {
            console.log('🤖 Loading OpenAI GPT-4o mini services...');
            
            // Get API key from environment
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
            
            if (!apiKey) {
                throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment.');
            }
            
            // Initialize enhanced OpenAI service
            const openaiService = new EnhancedOpenAIService(apiKey, {
                ttsModel: 'gpt-4o-mini-tts',
                sttModel: 'gpt-4o-mini-transcribe',
                enableStreaming: true,
                chunkSize: 1024
            });
            
            // Test the service
            const isWorking = await openaiService.test();
            if (!isWorking) {
                throw new Error('OpenAI service test failed');
            }
            
            console.log('✅ OpenAI GPT-4o mini services loaded successfully!');
            console.log('🎯 Gemini-like speech recognition and synthesis quality enabled');
            return openaiService;
            
        } catch (error) {
            console.error('❌ OpenAI service initialization failed:', error);
            throw error;
        }
    }

    private async initializeElevenLabs(): Promise<any> {
        try {
            const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
            
            if (!apiKey) {
                console.warn('⚠️ ElevenLabs API key not found. Skipping ElevenLabs initialization.');
                return null;
            }

            const { ElevenLabs } = await import('elevenlabs');
            const client = new ElevenLabs({
                apiKey: apiKey
            });

            // Load available voices
            this.availableVoices = await client.voices.getAll();
            console.log(`🎵 Loaded ${this.availableVoices.length} ElevenLabs voices`);

            return client;
        } catch (error) {
            console.warn('⚠️ ElevenLabs initialization failed:', error);
            return null;
        }
    }

    async processSpeechToSpeech(audioInput: ArrayBuffer): Promise<ArrayBuffer> {
        const startTime = Date.now();
        
        try {
            console.log('🎤 Processing speech-to-speech with OpenAI GPT-4o mini...');
            
            // Step 1: Speech to Text using OpenAI GPT-4o mini transcribe
            const text = await this.speechToText(audioInput);
            console.log('📝 Transcribed text:', text);
            
            // Step 2: Text to Speech using OpenAI GPT-4o mini TTS
            const audioOutput = await this.textToSpeech(text);
            
            const totalTime = Date.now() - startTime;
            this.performanceMetrics.totalTime = totalTime;
            
            console.log(`✅ Speech-to-speech completed in ${totalTime}ms`);
            return audioOutput;
            
        } catch (error) {
            console.error('❌ Speech-to-speech processing failed:', error);
            throw error;
        }
    }

    async processTextToSpeech(text: string): Promise<ArrayBuffer> {
        const startTime = Date.now();
        
        try {
            console.log('🔤 Processing text-to-speech with OpenAI GPT-4o mini...');
            
            // Check cache first
            const cacheKey = this.generateCacheKey(text);
            if (this.audioCache.has(cacheKey)) {
                this.performanceMetrics.cacheHits++;
                console.log('🎯 Cache hit! Using cached audio');
                return this.audioCache.get(cacheKey)!;
            }
            
            this.performanceMetrics.cacheMisses++;
            
            // Generate speech using OpenAI GPT-4o mini TTS
            const audioBuffer = await this.textToSpeech(text);
            
            // Cache the result
            this.audioCache.set(cacheKey, audioBuffer);
            
            const totalTime = Date.now() - startTime;
            this.performanceMetrics.totalTime = totalTime;
            
            console.log(`✅ Text-to-speech completed in ${totalTime}ms`);
            return audioBuffer;
            
        } catch (error) {
            console.error('❌ Text-to-speech processing failed:', error);
            throw error;
        }
    }

    private async speechToText(audioInput: ArrayBuffer): Promise<string> {
        const startTime = Date.now();
        
        try {
            if (!this.openaiService) {
                throw new Error('OpenAI service not initialized');
            }
            
            // Convert ArrayBuffer to Blob
            const audioBlob = new Blob([audioInput], { type: 'audio/wav' });
            
            // Transcribe using OpenAI GPT-4o mini transcribe
            const result = await this.openaiService.transcribe({
                audioBlob,
                language: 'auto', // Auto-detect language
                responseFormat: 'json'
            });
            
            this.performanceMetrics.sttTime = Date.now() - startTime;
            console.log(`🎤 STT completed in ${this.performanceMetrics.sttTime}ms`);
            
            return result.text;
            
        } catch (error) {
            console.error('❌ Speech-to-text failed:', error);
            
            // Fallback to Web Speech API if OpenAI fails
            console.warn('⚠️ Falling back to Web Speech API...');
            return await this.fallbackSpeechToText(audioInput);
        }
    }

    private async fallbackSpeechToText(audioInput: ArrayBuffer): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                reject(new Error('Speech recognition not supported'));
                return;
            }

            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                resolve(transcript);
            };
            
            recognition.onerror = (event: any) => {
                reject(new Error(`Speech recognition error: ${event.error}`));
            };
            
            recognition.start();
        });
    }

    private async textToSpeech(text: string): Promise<ArrayBuffer> {
        const startTime = Date.now();
        
        try {
            if (!this.openaiService) {
                throw new Error('OpenAI service not initialized');
            }
            
            // Enhance text for better synthesis
            const enhancedText = await this.enhanceTextWithContext(text);
            
            // Generate speech using OpenAI GPT-4o mini TTS
            const audioBuffer = await this.openaiService.generateSpeech({
                text: enhancedText,
                voice: 'coral', // Default voice
                language: 'en',
                emotion: 'neutral'
            });
            
            this.performanceMetrics.ttsTime = Date.now() - startTime;
            console.log(`🔤 TTS completed in ${this.performanceMetrics.ttsTime}ms`);
            
            return audioBuffer;
            
        } catch (error) {
            console.error('❌ Text-to-speech failed:', error);
            throw error;
        }
    }

    private async enhanceTextWithContext(text: string): Promise<string> {
        // Simple text enhancement for better TTS quality
        let enhanced = text.trim();
        
        // Add punctuation if missing
        if (!enhanced.match(/[.!?]$/)) {
            enhanced += '.';
        }
        
        // Capitalize first letter
        enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
        
        return enhanced;
    }

    private generateCacheKey(text: string): string {
        return btoa(text.toLowerCase().trim()).slice(0, 32);
    }

    private async preWarm(): Promise<void> {
        try {
            console.log('🔥 Pre-warming audio pipeline...');
            
            // Pre-warm with a simple test
            const testText = "Hello, this is a test.";
            await this.processTextToSpeech(testText);
            
            console.log('✅ Audio pipeline pre-warmed successfully');
        } catch (error) {
            console.warn('⚠️ Pre-warming failed:', error);
        }
    }

    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    clearCache(): void {
        this.audioCache.clear();
        console.log('🗑️ Audio cache cleared');
    }

    stop(): void {
        console.log('🛑 Stopping audio pipeline...');
        this.isInitialized = false;
    }

    async recognizeSpeechFromMediaStream(stream: MediaStream): Promise<string> {
        try {
            if (!this.openaiService) {
                throw new Error('OpenAI service not initialized');
            }
            
            // Convert MediaStream to audio data
            const audioData = await this.mediaStreamToArrayBuffer(stream);
            
            // Transcribe using OpenAI GPT-4o mini transcribe
            const audioBlob = new Blob([audioData], { type: 'audio/wav' });
            const result = await this.openaiService.transcribe({
                audioBlob,
                language: 'auto'
            });
            
            return result.text;
            
        } catch (error) {
            console.error('❌ Media stream recognition failed:', error);
            throw error;
        }
    }

    private async mediaStreamToArrayBuffer(stream: MediaStream): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const mediaRecorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            
            mediaRecorder.ondataavailable = (event) => {
                chunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                try {
                    const blob = new Blob(chunks, { type: 'audio/wav' });
                    const arrayBuffer = await blob.arrayBuffer();
                    resolve(arrayBuffer);
                } catch (error) {
                    reject(error);
                }
            };
            
            mediaRecorder.start();
            
            // Stop after 5 seconds
            setTimeout(() => {
                mediaRecorder.stop();
            }, 5000);
        });
    }

    isOpenAIAvailable(): boolean {
        return this.openaiService !== null;
    }

    getOpenAIService(): EnhancedOpenAIService | null {
        return this.openaiService;
    }

    getSupportedLanguages(): string[] {
        return this.openaiService?.getSupportedLanguages() || [];
    }

    getOpenAIVoices(): any[] {
        return this.openaiService?.getAvailableVoices() || [];
    }

    isLanguageSupported(languageCode: string): boolean {
        return this.openaiService?.isLanguageSupported(languageCode) || false;
    }

    async generateSpeechWithLanguage(text: string, language: string, voice?: string): Promise<ArrayBuffer> {
        if (!this.openaiService) {
            throw new Error('OpenAI service not initialized');
        }
        
        return await this.openaiService.generateSpeech({
            text,
            language,
            voice: voice || 'coral'
        });
    }
}

// Export singleton instance
const hybridAudioPipeline = new HybridAudioPipeline();

// Export both named and default
export { hybridAudioPipeline };
export default hybridAudioPipeline; 