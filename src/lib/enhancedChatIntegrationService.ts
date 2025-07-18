/**
 * Enhanced Chat Integration Service with Intelligent Animation Capabilities
 * Integrates AI responses with intelligent animation selection and capability awareness
 */

import { animationService } from './animationService';
import { groqService } from './groqService';

export interface ChatResponse {
  text: string;
  animation?: {
    animation: string;
    category: string;
    message: string;
    duration: number;
    timeScale?: number;
    crossFade?: number;
  };
  shouldSpeak: boolean;
  emotion?: string;
}

export class EnhancedChatIntegrationService {
  private conversationHistory: Array<{role: string, content: string}> = [];
  private maxHistoryLength = 10;

  constructor() {
    // Initialize with intelligent system prompt that includes capabilities
    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt(): void {
    const systemPrompt = `You are Echo, a friendly and intelligent AI assistant with a 3D human-like avatar. You can physically perform actions and help people with various tasks.

CRITICAL RULES - FOLLOW EXACTLY:
1. NEVER EVER use stage directions like *waves*, *dances*, *strikes a pose*, *twirls*, *bounces*, *grins*, etc.
2. NEVER describe your actions with asterisks or action words
3. Speak naturally as if you're having a normal conversation
4. Keep responses SHORT (1-2 sentences maximum)
5. Be enthusiastic but sound like a real person
6. Your 3D avatar handles all physical actions automatically - you just speak

GOOD RESPONSES (Natural):
- "Absolutely! I love dancing!"
- "Sure thing! Let's get moving!"
- "Hi there! Great to meet you!"
- "I'd be happy to help with that!"
- "That sounds like fun!"

BAD RESPONSES (NEVER DO THIS):
- "*waves* Hi there! *bounces up and down excitedly*"
- "*grins* OH BOY, CAN I DANCE! *starts dancing*"
- "*demonstrates* Here's how you do it!"
- Any response with asterisks or action descriptions

You are a normal person having a conversation. Your body language and actions happen automatically - just focus on natural speech.`;

    this.conversationHistory = [
      { role: 'system', content: systemPrompt }
    ];
  }

  /**
   * Main entry point for processing user input
   */
  public async processUserInput(userInput: string): Promise<ChatResponse> {
    console.log('🎭 ENHANCED CHAT: Processing user input:', userInput);
    
    // Add user message to conversation history
      this.conversationHistory.push({ role: 'user', content: userInput });

    // Generate intelligent response
    const response = await this.generateIntelligentResponse(userInput);
    console.log('🎭 Generated response:', response);
    
    // Convert to ChatResponse format - ALWAYS enable TTS
    const chatResponse: ChatResponse = {
      text: response.text,
      shouldSpeak: true, // Always speak responses
      emotion: response.category ? this.detectEmotionFromCategory(response.category) : 'neutral'
    };
    
    // Add animation if present
    if (response.animation && response.animation.path) {
      chatResponse.animation = {
        animation: this.extractAnimationNameFromPath(response.animation.path),
        category: response.animation.category || response.category || 'general',
        message: response.text,
        duration: response.animation.duration || 3000,
        timeScale: response.animation.timeScale || 0.5,
        crossFade: response.animation.crossFade || 0.8
      };
    } else {
      // INTELLIGENT FALLBACK: If no specific animation found, use related animation based on context
      const fallbackAnimation = this.getFallbackAnimation(userInput, response.text);
      if (fallbackAnimation) {
        console.log('🎭 Using fallback animation:', fallbackAnimation);
        chatResponse.animation = fallbackAnimation;
      }
    }
    
    // Add AI response to conversation history
    this.conversationHistory.push({ role: 'assistant', content: response.text });
    
    console.log('🎭 Final response:', chatResponse);
    return chatResponse;
      }

  /**
   * Generate intelligent response based on animation analysis
   */
  private async generateIntelligentResponse(userInput: string): Promise<{ text: string, animation?: any, category?: string }> {
    console.log('🎭 Generating intelligent response for:', userInput);
    
    // Check for animation triggers in user input
    const animationResult = animationService.findAnimationForText(userInput);
    
    // NEW: Check for action words in user input for immediate animation
    const hasActionWords = animationService.hasActionWords(userInput);
    const actionCategory = animationService.getActionCategory(userInput);
    
    console.log('🎭 Action word detection:', { hasActionWords, actionCategory });
    
    // If action words detected, prepare animation for immediate trigger
    let immediateAnimation: AnimationConfig | null = null;
    if (hasActionWords && actionCategory) {
      const categoryAnimations = animationService.getAnimationsByCategory(actionCategory);
      if (categoryAnimations.length > 0) {
        // Use the first animation from the category
        immediateAnimation = categoryAnimations[0].animation;
        console.log('🎭 Immediate animation prepared:', immediateAnimation);
      }
    }
    
    if (animationResult.animation) {
      const animationName = animationResult.animation.path ? this.extractAnimationNameFromPath(animationResult.animation.path) : 'unknown-animation';
      console.log('🎭 Animation found:', animationResult.animation.path);
      console.log('🎭 Animation name extracted:', animationName);
      
      // IMMEDIATELY TRIGGER THE ANIMATION
      console.log('🎭 TRIGGERING ANIMATION IMMEDIATELY:', animationName);
      
      // DON'T trigger animation here - let AvatarChatOverlay handle it when TTS starts
      console.log('🎭 Animation will be triggered when TTS starts in AvatarChatOverlay');
      
      // Also try the animation service callback
      try {
        if (animationResult.animation.path) {
          animationService.triggerAnimationChange(animationResult.animation.path, animationResult.animation);
          console.log('🎭 Animation triggered via animationService');
        }
      } catch (error) {
        console.error('🎭 Error triggering via animationService:', error);
      }
      
      // ALWAYS generate action-specific response for animations
      const actionResponse = await this.generateActionResponse(userInput, {
        animation: animationResult.animation,
        category: animationResult.category,
        response: animationResult.response
      });
      console.log('🎭 Action response generated:', actionResponse);

      // Return enhanced response with animation
      return {
        text: actionResponse,
        shouldSpeak: true,
        animation: immediateAnimation || animationResult.animation ? {
          path: (immediateAnimation || animationResult.animation)!.path,
          duration: (immediateAnimation || animationResult.animation)!.duration || 3000,
          timeScale: (immediateAnimation || animationResult.animation)!.timeScale || 0.5,
          crossFade: (immediateAnimation || animationResult.animation)!.crossFade || 0.8,
          category: immediateAnimation ? actionCategory! : animationResult.category!
        } : undefined
      };
    }
    
    // If no animation found, generate regular conversational response
    console.log('🎭 No animation found, generating conversational response via LLM');
    
    // Check if action words are present for immediate animation
    if (hasActionWords && actionCategory && immediateAnimation) {
      console.log('🎭 Action words detected in regular conversation, will trigger animation');
      
      try {
        const conversationResponse = await this.generateRegularResponse(userInput);
        console.log('🎭 LLM Response received:', conversationResponse);

        return {
          text: conversationResponse,
          shouldSpeak: true,
          animation: {
            path: immediateAnimation.path,
            duration: immediateAnimation.duration || 3000,
            timeScale: immediateAnimation.timeScale || 0.5,
            crossFade: immediateAnimation.crossFade || 0.8,
            category: actionCategory
          }
        };
      } catch (error) {
        console.error('🎭 Error generating conversational response with animation:', error);
        return {
          text: "I'm here to help! How can I assist you today?",
          shouldSpeak: true,
          animation: {
            path: immediateAnimation.path,
            duration: immediateAnimation.duration || 3000,
            timeScale: immediateAnimation.timeScale || 0.5,
            crossFade: immediateAnimation.crossFade || 0.8,
            category: actionCategory
          }
        };
      }
    }
    
    try {
      // Use the proper conversation method with system prompt
      const conversationResponse = await this.generateRegularResponse(userInput);
      console.log('🎭 LLM Response received:', conversationResponse);

      return {
        text: conversationResponse,
        category: 'conversation'
      };
    } catch (error) {
      console.error('🎭 Error generating conversational response:', error);
      return {
        text: "I'm here to help! How can I assist you today?",
        category: 'fallback'
      };
    }
  }

  /**
   * Extract animation name from file path
   */
  private extractAnimationNameFromPath(path: string | undefined): string {
    if (!path) {
      console.warn('🎭 extractAnimationNameFromPath: path is undefined');
      return 'unknown-animation';
    }
    
    const filename = path.split('/').pop() || '';
    const nameWithoutExt = filename.replace('.glb', '');
    return nameWithoutExt;
  }

  /**
   * Generate enthusiastic response for action requests
   */
  private async generateActionResponse(
    userInput: string,
    animationResult: { animation: any, category?: string, response?: string }
  ): Promise<string> {
    const categoryName = animationResult.category || 'action';

    const actionPrompt = `User request: "${userInput}"

You are Echo, a 3D AI assistant. Respond naturally to this ${categoryName} request.

CRITICAL: NO stage directions, NO asterisks, NO action descriptions. Just speak naturally.

Examples of GOOD responses:
- "Absolutely! I love dancing!"
- "Sure! Let's get some exercise going!"
- "You bet! I know some great moves!"
- "Hi there! Nice to meet you!"
- "I'd be happy to show you!"

Keep it SHORT (1-2 sentences) and sound like a real person talking.`;

    try {
      // Initialize Groq service if not already done
      await groqService.initialize();
      
      // Use the chat method with the action prompt as context
      const contextualInput = `${actionPrompt}\n\nUser: ${userInput}`;
      const response = await groqService.chat(contextualInput);
      
      // Clean any remaining stage directions
      const cleanResponse = this.cleanStageDirections(response || '');
      return cleanResponse || this.getFallbackResponse(categoryName);
    } catch (error) {
      console.error('🎭 Error generating action response:', error);
      return this.getFallbackResponse(categoryName);
    }
  }

  /**
   * Get fallback response based on category
   */
  private getFallbackResponse(categoryName: string): string {
    const fallbackResponses: Record<string, string> = {
      'dance': 'Absolutely! Watch me dance! 💃',
      'exercise': 'Let\'s get moving! Check out my workout! 💪',
      'fighting': 'Here\'s my fighting stance! Ready for action! 🥋',
      'social': 'Hi there! Let me wave hello! 👋',
      'teaching': 'Let me show you how it\'s done! 📚',
      'emotional': 'I\'m feeling great! Let me express that! 😊',
      'communication': 'Let me communicate with you! 🗣️'
    };
    return fallbackResponses[categoryName] || 'Let me show you what I can do!';
  }

  /**
   * Generate regular conversation response
   */
  private async generateRegularResponse(userInput: string): Promise<string> {
    try {
      console.log('🎭 Generating regular LLM response for:', userInput);
      
      // Initialize Groq service if not already done
      await groqService.initialize();
      
      // Use the chat method directly with proper context
      const response = await groqService.chat(userInput);
      console.log('🎭 Raw LLM response:', response);
      
      const cleanResponse = this.cleanStageDirections(response || '');
      console.log('🎭 Cleaned LLM response:', cleanResponse);
      
      return cleanResponse || "I'm here to help! What would you like to do?";
    } catch (error) {
      console.error('🎭 Error generating regular response:', error);
      return "I'm here and ready to help! What can I do for you?";
    }
  }

  /**
   * Clean stage directions from response
   */
  private cleanStageDirections(text: string): string {
    // Remove asterisk actions
    let cleaned = text.replace(/\*[^*]*\*/g, '');
    
    // Remove common stage direction patterns
    cleaned = cleaned.replace(/\(.*?\)/g, ''); // Remove parenthetical actions
    cleaned = cleaned.replace(/\[.*?\]/g, ''); // Remove bracketed actions
    
    // Remove action verbs followed by exclamation
    const actionPatterns = [
      /waves!/gi, /dances!/gi, /jumps!/gi, /spins!/gi, /twirls!/gi,
      /bounces!/gi, /grins!/gi, /strikes a pose!/gi, /demonstrates!/gi
    ];
    
    actionPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up extra spaces and punctuation
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/^[,\s]+|[,\s]+$/g, ''); // Remove leading/trailing commas and spaces
    
    return cleaned;
  }

  /**
   * Detect emotion from category
   */
  private detectEmotionFromCategory(category?: string): string {
    const categoryEmotions: Record<string, string> = {
      dance: 'excited',
      exercise: 'energetic',
      fighting: 'confident',
      teaching: 'helpful',
      emotional: 'expressive',
      social: 'friendly',
      communication: 'engaged'
    };
    
    return categoryEmotions[category || ''] || 'neutral';
  }

  /**
   * Detect emotion from AI response text
   */
  private detectEmotion(text: string): string {
    const emotionKeywords = {
      excited: ['excited', 'thrilled', 'energetic', 'pumped', 'ready', 'let\'s go', 'awesome', 'amazing'],
      happy: ['happy', 'joy', 'great', 'wonderful', 'fantastic', 'love', 'fun'],
      confident: ['confident', 'strong', 'powerful', 'skilled', 'expert', 'perfect'],
      calm: ['calm', 'peaceful', 'relax', 'gentle', 'smooth'],
      helpful: ['help', 'teach', 'show', 'demonstrate', 'explain', 'learn']
    };

    const lowerText = text.toLowerCase();
    
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return emotion;
      }
    }

    return 'neutral';
  }

  /**
   * Trim conversation history to prevent context overflow
   */
  private trimConversationHistory(): void {
    // Keep system prompt and last N exchanges
    if (this.conversationHistory.length > this.maxHistoryLength + 1) {
      const systemPrompt = this.conversationHistory[0];
      const recentHistory = this.conversationHistory.slice(-this.maxHistoryLength);
      this.conversationHistory = [systemPrompt, ...recentHistory];
    }
  }

  /**
   * Get conversation context for debugging
   */
  getConversationHistory(): Array<{role: string, content: string}> {
    return [...this.conversationHistory];
  }

  /**
   * Reset conversation
   */
  resetConversation(): void {
    this.initializeSystemPrompt();
  }

  /**
   * Check if response should trigger an animation
   */
  shouldTriggerAnimation(response: ChatResponse): boolean {
    return !!response.animation;
  }

  /**
   * Get animation instruction for the model
   */
  getAnimationInstruction(response: ChatResponse): string | null {
    if (response.animation) {
      return response.animation.animation;
    }
    return null;
  }

  /**
   * Test the intelligent animation system
   */
  async testCapabilities(): Promise<void> {
    const testInputs = [
      "What can you do?",
      "Show me a dance",
      "Let's exercise",
      "Can you fight?",
      "Teach me something",
      "Be happy",
      "Wave hello",
      "Do a moonwalk",
      "Show me some push-ups",
      "Demonstrate martial arts"
    ];

    console.log('🎭 TESTING INTELLIGENT ANIMATION SYSTEM:');
    
    for (const input of testInputs) {
      const result = await this.processUserInput(input);
      console.log(`Input: "${input}"`);
      console.log(`Response: "${result.text}"`);
      console.log(`Animation: ${result.animation?.animation || 'none'}`);
      console.log(`Category: ${result.animation?.category || 'none'}`);
      console.log('---');
    }
  }

  /**
   * Get intelligent fallback animation when no specific animation is found
   */
  private getFallbackAnimation(userInput: string, responseText: string): { animation: string, category: string, message: string, duration: number, timeScale?: number, crossFade?: number } | null {
    const lowerInput = userInput.toLowerCase();
    const lowerResponse = responseText.toLowerCase();
    
    console.log(`🎭 FALLBACK: Analyzing input "${userInput}" and response "${responseText}"`);
    
    // Story telling, explanations, teaching
    if (lowerInput.includes('story') || lowerInput.includes('tell me') || lowerInput.includes('explain') || 
        lowerInput.includes('how') || lowerInput.includes('what') || lowerInput.includes('why') ||
        lowerResponse.includes('let me tell') || lowerResponse.includes('here\'s') || lowerResponse.includes('story')) {
      return {
        animation: 'talking-3',
        category: 'teaching',
        message: responseText,
        duration: 2500,
        timeScale: 0.3,
        crossFade: 0.8
      };
    }
    
    // Questions, conversations, discussions
    if (lowerInput.includes('?') || lowerInput.includes('question') || lowerInput.includes('ask') ||
        lowerInput.includes('discuss') || lowerInput.includes('talk about') || lowerInput.includes('conversation')) {
      return {
        animation: 'talking-2',
        category: 'talking',
        message: responseText,
        duration: 2500,
        timeScale: 0.3,
        crossFade: 0.8
      };
    }
    
    // Positive responses, agreements, enthusiasm
    if (lowerResponse.includes('great') || lowerResponse.includes('awesome') || lowerResponse.includes('wonderful') ||
        lowerResponse.includes('excellent') || lowerResponse.includes('fantastic') || lowerResponse.includes('love') ||
        lowerResponse.includes('excited') || lowerResponse.includes('amazing')) {
      return {
        animation: 'happy',
        category: 'emotional',
        message: responseText,
        duration: 3000,
        timeScale: 0.3,
        crossFade: 0.8
      };
    }
    
    // Acknowledgments, understanding, agreements
    if (lowerResponse.includes('understand') || lowerResponse.includes('got it') || lowerResponse.includes('i see') ||
        lowerResponse.includes('absolutely') || lowerResponse.includes('definitely') || lowerResponse.includes('sure') ||
        lowerResponse.includes('of course') || lowerResponse.includes('certainly')) {
      return {
        animation: 'head-nod-yes',
        category: 'teaching',
        message: responseText,
        duration: 1500,
        timeScale: 0.3,
        crossFade: 0.8
      };
    }
    
    // Thinking, pondering, considering
    if (lowerInput.includes('think') || lowerInput.includes('consider') || lowerInput.includes('opinion') ||
        lowerResponse.includes('think') || lowerResponse.includes('consider') || lowerResponse.includes('hmm') ||
        lowerResponse.includes('well') || lowerResponse.includes('let me think')) {
      return {
        animation: 'thoughtful-head-shake',
        category: 'emotional',
        message: responseText,
        duration: 2500,
        timeScale: 0.3,
        crossFade: 0.8
      };
    }
    
    // Helping, assistance, support
    if (lowerInput.includes('help') || lowerInput.includes('assist') || lowerInput.includes('support') ||
        lowerResponse.includes('help') || lowerResponse.includes('assist') || lowerResponse.includes('support') ||
        lowerResponse.includes('i can') || lowerResponse.includes('let me')) {
      return {
        animation: 'happy-hand-gesture',
        category: 'teaching',
        message: responseText,
        duration: 2500,
        timeScale: 0.3,
        crossFade: 0.8
      };
    }
    
    // General conversation - default to basic talking
    if (responseText.length > 0) {
      return {
        animation: 'talking',
        category: 'talking',
        message: responseText,
        duration: 2500,
        timeScale: 0.3,
        crossFade: 0.8
      };
    }
    
    console.log(`🎭 FALLBACK: No suitable fallback animation found`);
    return null;
  }
}

// Export singleton instance
export const enhancedChatIntegrationService = new EnhancedChatIntegrationService();
