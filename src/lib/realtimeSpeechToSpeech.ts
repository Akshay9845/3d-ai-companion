/**
 * Realtime Speech-to-Speech Service
 * 
 * Implements OpenAI's Realtime API for true speech-to-speech voice agents
 * - Direct audio processing without transcription
 * - Ultra-low latency real-time conversations
 * - Natural conversational flow
 * - Emotion and intent understanding
 */

export interface RealtimeConfig {
  model: 'gpt-4o-realtime-preview';
  transport: 'webrtc' | 'websocket';
  voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer';
  instructions: string;
  tools?: any[];
  temperature?: number;
  maxTokens?: number;
}

export interface RealtimeSession {
  id: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export class RealtimeSpeechToSpeech {
  private apiKey: string;
  private config: RealtimeConfig;
  private session: RealtimeSession | null = null;
  private connection: any = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private isConnected = false;

  constructor(apiKey: string, config: Partial<RealtimeConfig> = {}) {
    this.apiKey = apiKey;
    this.config = {
      model: 'gpt-4o-realtime-preview',
      transport: 'webrtc',
      voice: 'coral',
      instructions: 'You are a helpful AI assistant. Respond naturally and conversationally.',
      temperature: 0.7,
      maxTokens: 1000,
      ...config
    };
  }

  /**
   * Initialize realtime speech-to-speech session
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Realtime Speech-to-Speech...');
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Initialize WebRTC connection
      await this.initializeWebRTC();
      
      console.log('✅ Realtime Speech-to-Speech initialized');
    } catch (error) {
      console.error('❌ Realtime S2S initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize WebRTC connection for realtime audio
   */
  private async initializeWebRTC(): Promise<void> {
    try {
      // Create WebRTC peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      // Add local audio track
      this.mediaStream?.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.mediaStream!);
      });

      // Handle incoming audio
      peerConnection.ontrack = (event) => {
        this.handleIncomingAudio(event.streams[0]);
      };

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Connect to OpenAI Realtime API
      await this.connectToOpenAI(offer);

      this.connection = peerConnection;
      this.isConnected = true;
      
      console.log('✅ WebRTC connection established');
    } catch (error) {
      console.error('❌ WebRTC initialization failed:', error);
      throw error;
    }
  }

  /**
   * Connect to OpenAI Realtime API
   */
  private async connectToOpenAI(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/realtime', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          voice: this.config.voice,
          instructions: this.config.instructions,
          tools: this.config.tools,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          transport: this.config.transport,
          offer: offer
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI Realtime API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Set remote description
      await this.connection.setRemoteDescription(new RTCSessionDescription(data.answer));
      
      this.session = {
        id: data.session_id,
        status: 'connected',
        startTime: new Date()
      };

      console.log('✅ Connected to OpenAI Realtime API');
    } catch (error) {
      console.error('❌ OpenAI Realtime API connection failed:', error);
      throw error;
    }
  }

  /**
   * Handle incoming audio from OpenAI
   */
  private handleIncomingAudio(stream: MediaStream): void {
    try {
      const audioElement = new Audio();
      audioElement.srcObject = stream;
      audioElement.play();
      
      console.log('🎵 Playing AI response audio');
    } catch (error) {
      console.error('❌ Failed to play incoming audio:', error);
    }
  }

  /**
   * Start realtime conversation
   */
  async startConversation(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Realtime S2S not initialized');
    }

    console.log('🎤 Starting realtime conversation...');
    
    // Resume audio context if suspended
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Stop realtime conversation
   */
  async stopConversation(): Promise<void> {
    try {
      console.log('🛑 Stopping realtime conversation...');
      
      // Close WebRTC connection
      if (this.connection) {
        this.connection.close();
        this.connection = null;
      }

      // Stop media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      // Close audio context
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      this.isConnected = false;
      
      if (this.session) {
        this.session.status = 'disconnected';
        this.session.endTime = new Date();
        this.session.duration = this.session.endTime.getTime() - this.session.startTime.getTime();
      }

      console.log('✅ Realtime conversation stopped');
    } catch (error) {
      console.error('❌ Failed to stop conversation:', error);
    }
  }

  /**
   * Send text message to realtime session
   */
  async sendMessage(text: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Realtime S2S not connected');
    }

    try {
      // Send text message through WebRTC data channel
      const dataChannel = this.connection.createDataChannel('messages');
      dataChannel.send(JSON.stringify({
        type: 'message',
        text: text
      }));
      
      console.log('📤 Sent text message:', text);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  }

  /**
   * Update session configuration
   */
  async updateConfig(newConfig: Partial<RealtimeConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isConnected) {
      // Reconnect with new configuration
      await this.stopConversation();
      await this.initialize();
    }
  }

  /**
   * Get current session info
   */
  getSessionInfo(): RealtimeSession | null {
    return this.session;
  }

  /**
   * Check if connected
   */
  isSessionConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    if (!this.connection) return 'disconnected';
    return this.connection.connectionState;
  }

  /**
   * Test realtime capabilities
   */
  async test(): Promise<boolean> {
    try {
      await this.initialize();
      await this.startConversation();
      await this.sendMessage('Hello, this is a test message.');
      await this.stopConversation();
      return true;
    } catch (error) {
      console.error('❌ Realtime S2S test failed:', error);
      return false;
    }
  }
}

// Example usage:
export const createVoiceAgent = (apiKey: string, instructions: string) => {
  return new RealtimeSpeechToSpeech(apiKey, {
    instructions: instructions,
    voice: 'coral',
    temperature: 0.7
  });
};

// Example voice agent configurations
export const voiceAgentConfigs = {
  customerService: {
    instructions: `You are a helpful customer service representative. 
    Be polite, patient, and professional. 
    Always confirm customer details before proceeding.`,
    voice: 'coral' as const,
    temperature: 0.7
  },
  
  languageTutor: {
    instructions: `You are a friendly language tutor. 
    Help students practice conversation naturally. 
    Correct mistakes gently and encourage learning.`,
    voice: 'sage' as const,
    temperature: 0.8
  },
  
  virtualAssistant: {
    instructions: `You are a helpful virtual assistant. 
    Respond naturally and conversationally. 
    Be concise but friendly in your responses.`,
    voice: 'nova' as const,
    temperature: 0.6
  }
}; 