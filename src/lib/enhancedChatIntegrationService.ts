/**
 * Enhanced Chat Integration Service
 * Integrates LangChain-enhanced characters with the existing chat system
 */

import { characterManager } from './characterManager';
import { EnhancedBrainResponse, enhancedUnifiedBrainService } from './enhancedUnifiedBrainService';
import { langChainService } from './langchainService';
import { unifiedBrainService } from './unifiedBrainService';

export interface EnhancedChatResponse {
  message: string;
  animation?: {
    name: string;
    duration?: number;
    intensity?: number;
  };
  reasoning?: string;
  toolsUsed?: string[];
  enhancement: 'basic' | 'langchain' | 'hybrid';
  confidence: number;
  memoryUpdated: boolean;
}

export interface ChatContext {
  visionData?: any;
  emotionalContext?: any;
  environmentData?: any;
  conversationHistory?: any[];
}

class EnhancedChatIntegrationService {
  private isLangChainEnabled = false;
  private useHybridMode = true;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the service and check for enhanced capabilities
   */
  private async initializeService(): Promise<void> {
    try {
      // Check if current character supports LangChain
      this.isLangChainEnabled = characterManager.hasLangChainCapabilities();
      
      if (this.isLangChainEnabled) {
        console.log('🚀 Enhanced chat mode enabled with LangChain capabilities');
        await langChainService.initialize();
      } else {
        console.log('📝 Using standard chat mode');
      }
    } catch (error) {
      console.error('Error initializing enhanced chat service:', error);
      this.isLangChainEnabled = false;
    }
  }

  /**
   * Process a chat message with enhanced capabilities
   */
  public async processMessage(
    message: string,
    context: ChatContext = {}
  ): Promise<EnhancedChatResponse> {
    try {
      let response: EnhancedChatResponse;

      if (this.isLangChainEnabled && this.useHybridMode) {
        // Use enhanced brain service with LangChain integration
        response = await this.processWithEnhancedBrain(message, context);
      } else if (this.isLangChainEnabled) {
        // Use LangChain directly
        response = await this.processWithLangChain(message, context);
      } else {
        // Fallback to standard unified brain service
        response = await this.processWithStandardBrain(message, context);
      }

      // Add animation based on response context
      response.animation = this.selectAnimation(response);

      return response;
    } catch (error) {
      console.error('Error processing chat message:', error);
      
      // Fallback to basic response
      return {
        message: "I'm having some technical difficulties right now, but I'm still here to help!",
        enhancement: 'basic',
        confidence: 0.5,
        memoryUpdated: false,
      };
    }
  }

  /**
   * Process message using enhanced brain service (hybrid approach)
   */
  private async processWithEnhancedBrain(
    message: string,
    context: ChatContext
  ): Promise<EnhancedChatResponse> {
    const brainResponse: EnhancedBrainResponse = await enhancedUnifiedBrainService.processSpeechWithContext(
      message,
      {
        useLangChain: true,
        includeVisionContext: !!context.visionData,
        includeEmotionalContext: !!context.emotionalContext,
        enableTools: true,
        maxReasoningSteps: 3,
      }
    );

    return {
      message: brainResponse.speech,
      reasoning: brainResponse.reasoning,
      toolsUsed: brainResponse.toolsUsed,
      enhancement: brainResponse.enhancementLevel,
      confidence: brainResponse.confidence,
      memoryUpdated: brainResponse.memoryUpdated,
    };
  }

  /**
   * Process message using LangChain directly
   */
  private async processWithLangChain(
    message: string,
    context: ChatContext
  ): Promise<EnhancedChatResponse> {
    const conversationContext = {
      userMessage: message,
      visionContext: context.visionData,
      emotionalContext: context.emotionalContext,
      environmentContext: context.environmentData,
      conversationHistory: context.conversationHistory
    };
    
    const langchainResponse = await langChainService.processMessage(conversationContext);

    return {
      message: langchainResponse.response,
      reasoning: langchainResponse.reasoning,
      toolsUsed: langchainResponse.toolsUsed,
      enhancement: 'langchain',
      confidence: langchainResponse.confidence,
      memoryUpdated: langchainResponse.memoryUpdated,
    };
  }

  /**
   * Process message using standard brain service
   */
  private async processWithStandardBrain(
    message: string,
    _context: ChatContext
  ): Promise<EnhancedChatResponse> {
    const standardResponse = await unifiedBrainService.processSpeechWithContext(message);

    return {
      message: standardResponse.speech,
      enhancement: 'basic',
      confidence: 0.7,
      memoryUpdated: false,
    };
  }

  /**
   * Select appropriate animation based on response
   */
  private selectAnimation(response: EnhancedChatResponse) {
    const message = response.message.toLowerCase();
    
    // Determine emotion/intent from message content
    if (message.includes('hello') || message.includes('hi') || message.includes('greet')) {
      return { name: characterManager.getDefaultAnimation('greeting'), duration: 2000 };
    }
    
    if (message.includes('think') || response.reasoning) {
      return { name: characterManager.getDefaultAnimation('thinking'), duration: 1500 };
    }
    
    if (message.includes('happy') || message.includes('great') || message.includes('excellent')) {
      return { name: characterManager.getDefaultAnimation('happy'), duration: 1500 };
    }
    
    if (message.includes('excited') || message.includes('amazing') || message.includes('wow')) {
      return { name: characterManager.getDefaultAnimation('excited'), duration: 2000 };
    }
    
    if (message.includes('confused') || message.includes('understand') || message.includes('clarify')) {
      return { name: characterManager.getDefaultAnimation('confused'), duration: 1500 };
    }
    
    if (message.includes('goodbye') || message.includes('bye') || message.includes('farewell')) {
      return { name: characterManager.getDefaultAnimation('farewell'), duration: 2000 };
    }
    
    // Default to talking animation
    return { name: characterManager.getDefaultAnimation('talking'), duration: 1000 };
  }

  /**
   * Get character information for UI display
   */
  public getCharacterInfo() {
    const settings = characterManager.getCurrentCharacterSettings();
    const capabilities = characterManager.getCharacterCapabilities();
    const langchainConfig = characterManager.getLangChainConfig();
    
    return {
      name: settings.name,
      type: settings.type,
      capabilities,
      langchainEnabled: this.isLangChainEnabled,
      availableTools: langchainConfig?.tools || [],
      enhancementLevel: this.isLangChainEnabled ? 'enhanced' : 'standard',
    };
  }

  /**
   * Toggle between enhanced and standard mode
   */
  public toggleEnhancedMode(enabled: boolean): void {
    if (this.isLangChainEnabled) {
      this.useHybridMode = enabled;
      console.log(`Enhanced mode ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get available character voices for enhanced mode
   */
  public getVoiceProfiles() {
    const settings = characterManager.getCurrentCharacterSettings();
    return settings.metadata?.voiceProfiles || [];
  }

  /**
   * Reinitialize service (useful when character changes)
   */
  public async reinitialize(): Promise<void> {
    await this.initializeService();
  }
}

// Export singleton instance
export const enhancedChatIntegrationService = new EnhancedChatIntegrationService();
