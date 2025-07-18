import { CameraAnalysisResult } from './intelligentCameraService';
import { RecognizedUser } from './userRecognitionService';

export interface VisionContext {
  hasVisionData: boolean;
  analysisResult: CameraAnalysisResult | null;
  detailedDescription: string;
  timestamp: number;
  recognizedUser?: RecognizedUser;
}

export class VisionIntegratedChatService {
  private currentVisionContext: VisionContext = {
    hasVisionData: false,
    analysisResult: null,
    detailedDescription: '',
    timestamp: 0
  };

  private visionKeywords = [
    'see', 'look', 'wearing', 'clothes', 'expression', 'face', 'emotion', 'feeling',
    'appearance', 'outfit', 'shirt', 'dress', 'hair', 'eyes', 'smile', 'frown',
    'behind', 'around', 'room', 'environment', 'background', 'what am i', 'how do i look',
    'what do you see', 'can you see', 'do i look', 'am i', 'describe', 'observe'
  ];

  updateVisionContext(analysisResult: CameraAnalysisResult, description: string): void {
    this.currentVisionContext = {
      ...this.currentVisionContext,
      hasVisionData: true,
      analysisResult: analysisResult,
      detailedDescription: description,
      timestamp: Date.now()
    };
  }

  updateUserContext(user: RecognizedUser): void {
    this.currentVisionContext = {
      ...this.currentVisionContext,
      recognizedUser: user
    };
  }

  // Initialize global exposure
  initialize(): void {
    // Expose user context globally for gesture service
    (window as any).getVisionContext = () => ({
      recognizedUser: this.currentVisionContext.recognizedUser
    });

    // Expose vision response handler for gesture and document analysis
    (window as any).handleVisionResponse = (message: string) => {
      this.triggerSpeechResponse(message);
    };
  }

  // New method to trigger speech response directly
  private triggerSpeechResponse(message: string): void {
    console.log('🔊 Triggering speech response:', message);
    
    // Clean the message for TTS
    const cleanMessage = this.cleanMessageForTTS(message);
    
    // Prioritize using the speech integration helper's enhanced handler
    if ((window as any).speakMessage && typeof (window as any).speakMessage === 'function') {
      console.log('🔊 Using enhanced speech integration');
      (window as any).speakMessage(cleanMessage);
      return;
    }

    // Try multiple TTS methods to ensure speech works
    const speechMethods = [
      () => (window as any).triggerTTS?.(cleanMessage),
      () => (window as any).ttsService?.speak?.(cleanMessage),
      () => (window as any).handleSpeech?.(cleanMessage)
    ];

    let speechTriggered = false;
    for (const method of speechMethods) {
      try {
        if (method && method()) {
          speechTriggered = true;
          break;
        }
      } catch (error) {
        console.warn('Speech method failed:', error);
      }
    }

    if (!speechTriggered) {
      console.warn('⚠️ No TTS service available, trying browser speech synthesis');
      this.fallbackTextToSpeech(cleanMessage);
    }
    
    // Also add to chat if possible
    if ((window as any).addChatMessage) {
      (window as any).addChatMessage('assistant', cleanMessage);
    }
  }

  // Fallback browser speech synthesis
  private fallbackTextToSpeech(message: string): void {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Try to use a natural voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Natural') || 
          voice.name.includes('Enhanced') ||
          voice.localService
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        speechSynthesis.speak(utterance);
        console.log('🔊 Using browser speech synthesis as fallback');
      }
    } catch (error) {
      console.error('Browser speech synthesis failed:', error);
    }
  }

  // Public method to trigger speech from anywhere
  public speak(message: string): void {
    this.triggerSpeechResponse(message);
  }

  private cleanMessageForTTS(message: string): string {
    return message
      .replace(/thinking face/gi, 'thoughtful')
      .replace(/biceps/gi, 'strong')
      .replace(/flexed biceps/gi, 'confident')
      .replace(/muscle/gi, 'determined')
      .replace(/[^\w\s\.\!\?\,\-]/g, '') // Remove special characters but keep basic punctuation
      .trim();
  }

  clearVisionContext(): void {
    this.currentVisionContext = {
      hasVisionData: false,
      analysisResult: null,
      detailedDescription: '',
      timestamp: 0
    };
  }

  detectVisionQuery(userInput: string): boolean {
    const lowerInput = userInput.toLowerCase();
    return this.visionKeywords.some(keyword => lowerInput.includes(keyword));
  }

  generateVisionEnhancedPrompt(userInput: string, originalResponse: string): string {
    if (!this.currentVisionContext.hasVisionData) {
      return originalResponse;
    }

    const isVisionQuery = this.detectVisionQuery(userInput);
    const analysis = this.currentVisionContext.analysisResult!;
    
    // Create comprehensive vision context
    const visionData = {
      timestamp: new Date(this.currentVisionContext.timestamp).toLocaleTimeString(),
      faces: {
        count: analysis.faces.count,
        emotions: analysis.faces.emotions,
        dominantEmotion: analysis.faces.dominantEmotion,
        ages: analysis.faces.ages,
        genders: analysis.faces.genders
      },
      scene: {
        objects: analysis.scene.objects,
        text: analysis.scene.text,
        description: analysis.scene.description
      },
      detailedDescription: this.currentVisionContext.detailedDescription
    };

    if (isVisionQuery) {
      // For vision-specific queries, provide detailed visual information
      return this.generateVisionResponse(userInput, visionData, originalResponse);
    } else {
      // For general queries, add subtle visual context
      return this.addSubtleVisionContext(originalResponse, visionData);
    }
  }

  private generateVisionResponse(userInput: string, visionData: any, fallbackResponse: string): string {
    const lowerInput = userInput.toLowerCase();
    
    // Specific query handlers
    if (lowerInput.includes('wearing') || lowerInput.includes('clothes') || lowerInput.includes('outfit')) {
      return this.generateClothingResponse(visionData);
    }
    
    if (lowerInput.includes('expression') || lowerInput.includes('emotion') || lowerInput.includes('feeling') || lowerInput.includes('look like')) {
      return this.generateEmotionResponse(visionData);
    }
    
    if (lowerInput.includes('what do you see') || lowerInput.includes('can you see') || lowerInput.includes('describe')) {
      return this.generateGeneralVisionResponse(visionData);
    }
    
    if (lowerInput.includes('behind') || lowerInput.includes('around') || lowerInput.includes('room') || lowerInput.includes('environment')) {
      return this.generateEnvironmentResponse(visionData);
    }

    // General vision response with original context
    return `${visionData.detailedDescription} ${fallbackResponse}`;
  }

  private generateClothingResponse(visionData: any): string {
    const clothing = visionData.scene.objects.filter((obj: any) => 
      ['shirt', 'clothing', 'dress', 'jacket', 'sweater', 'hoodie', 'top', 'blouse', 'tie', 'suit'].some((item: string) => 
        obj.name.toLowerCase().includes(item)
      )
    );

    if (clothing.length > 0) {
      const clothingItems = clothing.map((c: any) => c.name).join(', ');
      return `I can see you're wearing ${clothingItems}. Your outfit looks nice! Is there something specific about your clothing you'd like me to comment on?`;
    } else {
      if (visionData.faces.count > 0) {
        return `I can see you clearly, but I'm having trouble making out the specific details of what you're wearing from this angle. Could you move a bit or adjust the camera for a better view?`;
      } else {
        return `I can't see you in the camera right now, so I can't tell what you're wearing. Could you make sure you're in view of the camera?`;
      }
    }
  }

  private generateEmotionResponse(visionData: any): string {
    if (visionData.faces.count > 0) {
      if (visionData.faces.dominantEmotion && visionData.faces.dominantEmotion !== 'neutral') {
        // Clean emotion word - remove any emoji or special characters
        const cleanEmotion = this.cleanEmotionWord(visionData.faces.dominantEmotion);
        return `From your facial expression, you look ${cleanEmotion}! I can read emotions through your facial expressions, and right now you seem to be feeling ${cleanEmotion}. How are you feeling today?`;
      } else {
        return `You have a calm, neutral expression right now. Your face looks relaxed and composed. How are you feeling at the moment?`;
      }
    } else {
      return `I can't see your face right now to read your expression. Could you position yourself so I can see you better? I'd love to see how you're feeling!`;
    }
  }

  private cleanEmotionWord(emotion: string): string {
    // Remove emoji descriptions and clean up emotion words
    const cleanWord = emotion
      .replace(/thinking face/gi, 'thoughtful')
      .replace(/biceps/gi, 'strong')
      .replace(/flexed biceps/gi, 'confident')
      .replace(/muscle/gi, 'determined')
      .replace(/[^\w\s]/g, '') // Remove special characters
      .toLowerCase()
      .trim();
    
    // Map to standard emotion words
    const emotionMap: Record<string, string> = {
      'happy': 'happy',
      'joy': 'happy',
      'joyful': 'happy',
      'sad': 'sad',
      'sorrow': 'sad',
      'angry': 'angry',
      'anger': 'angry',
      'surprised': 'surprised',
      'surprise': 'surprised',
      'fearful': 'fearful',
      'fear': 'fearful',
      'disgusted': 'disgusted',
      'disgust': 'disgusted',
      'neutral': 'neutral',
      'thoughtful': 'thoughtful',
      'confident': 'confident',
      'determined': 'determined'
    };

    return emotionMap[cleanWord] || cleanWord || 'neutral';
  }

  private generateGeneralVisionResponse(visionData: any): string {
    const details: string[] = [];
    
    // Personalized response if user is recognized
    if (this.currentVisionContext.recognizedUser) {
      const user = this.currentVisionContext.recognizedUser;
      details.push(`I can see you, ${user.name}`);
      
      if (visionData.faces.dominantEmotion) {
        details.push(`you appear ${visionData.faces.dominantEmotion}`);
      }
    } else if (visionData.faces.count > 0) {
      details.push(`I can see you looking at me`);
      
      if (visionData.faces.dominantEmotion) {
        details.push(`you appear ${visionData.faces.dominantEmotion}`);
      }
    }

    if (visionData.scene.objects.length > 0) {
      const topObjects = visionData.scene.objects.slice(0, 4).map((obj: any) => obj.name);
      details.push(`I can see ${topObjects.join(', ')} in your environment`);
    }

    if (visionData.scene.description) {
      details.push(`the setting looks like ${visionData.scene.description}`);
    }

    if (details.length > 0) {
      return `Through my camera, ${details.join(', ')}. It's like I'm right there with you! What would you like to know about what I can see?`;
    } else {
      return `I can see the camera feed, but I'm having trouble making out specific details right now. The lighting or angle might need adjustment for me to see you better.`;
    }
  }

  private generateEnvironmentResponse(visionData: any): string {
    const environment: string[] = [];
    
    if (visionData.scene.objects.length > 0) {
      const furniture = visionData.scene.objects.filter((obj: any) => 
        ['chair', 'desk', 'table', 'sofa', 'bed', 'lamp', 'computer', 'monitor', 'laptop', 'shelf', 'wall'].some((item: string) => 
          obj.name.toLowerCase().includes(item)
        )
      );

      if (furniture.length > 0) {
        const furnitureItems = furniture.map((f: any) => f.name).join(', ');
        environment.push(`I can see ${furnitureItems}`);
      }
    }

    if (visionData.scene.description) {
      environment.push(`the overall environment appears to be ${visionData.scene.description}`);
    }

    if (visionData.scene.text.length > 0) {
      const text = visionData.scene.text.slice(0, 2);
      environment.push(`I can even read some text that says "${text.join('", "')}"`);
    }

    if (environment.length > 0) {
      return `Looking around your space, ${environment.join(', ')}. It seems like a nice environment! Is this where you usually spend your time?`;
    } else {
      return `I can see your environment through the camera, but I'm having trouble making out specific details about what's around you. Could you pan the camera around a bit so I can get a better look at your space?`;
    }
  }

  private addSubtleVisionContext(originalResponse: string, visionData: any): string {
    let response = originalResponse;
    
    // Add personalized context if user is recognized
    if (this.currentVisionContext.recognizedUser) {
      const user = this.currentVisionContext.recognizedUser;
      // Add subtle personalization without being too repetitive
      if (Math.random() > 0.7) { // Only sometimes add personal touch
        response = `${response} How are you doing today, ${user.name}?`;
      }
    }
    
    // Add subtle visual context to general responses
    if (visionData.faces.count > 0) {
      if (visionData.faces.dominantEmotion && visionData.faces.dominantEmotion === 'happy') {
        response = `${response} I can see you're smiling, which makes me happy too!`;
      } else if (visionData.faces.dominantEmotion && visionData.faces.dominantEmotion === 'sad') {
        response = `${response} I notice you seem a bit sad - I hope I can help brighten your day!`;
      }
    }
    
    return response;
  }

  isVisionDataFresh(maxAge: number = 30000): boolean {
    return this.currentVisionContext.hasVisionData && 
           (Date.now() - this.currentVisionContext.timestamp) < maxAge;
  }

  getCurrentVisionContext(): VisionContext {
    return { ...this.currentVisionContext };
  }
}

// Export singleton instance
export const visionIntegratedChatService = new VisionIntegratedChatService();

// Initialize the service on module load
visionIntegratedChatService.initialize(); 