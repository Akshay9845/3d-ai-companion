/**
 * Service Validation Script for Groq and Gemini
 * Tests the actual response functionality before deployment
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';

interface ServiceTestResult {
  service: string;
  success: boolean;
  response?: string;
  error?: string;
  responseTime?: number;
}

export class ServiceValidator {
  private groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
  private geminiApiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  /**
   * Test Groq service functionality
   */
  async testGroqService(): Promise<ServiceTestResult> {
    console.log('🔍 Testing Groq service...');
    const startTime = Date.now();

    try {
      if (!this.groqApiKey) {
        return {
          service: 'Groq',
          success: false,
          error: 'VITE_GROQ_API_KEY not found'
        };
      }

      const groq = new ChatGroq({
        apiKey: this.groqApiKey,
        model: 'llama3-70b-8192',
        temperature: 0.7,
        maxTokens: 500
      });

      const testMessage = "Hello! I'm Echo. Can you respond with a brief introduction about yourself as an AI assistant?";
      
      const response = await groq.invoke([
        { role: 'system', content: 'You are Echo, a friendly AI companion. Respond naturally and warmly.' },
        { role: 'human', content: testMessage }
      ]);

      const responseTime = Date.now() - startTime;
      
      if (response && response.content) {
        console.log('✅ Groq test successful');
        return {
          service: 'Groq',
          success: true,
          response: response.content.toString(),
          responseTime
        };
      } else {
        return {
          service: 'Groq',
          success: false,
          error: 'No response content received'
        };
      }

    } catch (error) {
      console.error('❌ Groq test failed:', error);
      return {
        service: 'Groq',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Gemini service functionality
   */
  async testGeminiService(): Promise<ServiceTestResult> {
    console.log('🔍 Testing Gemini service...');
    const startTime = Date.now();

    try {
      if (!this.geminiApiKey) {
        return {
          service: 'Gemini',
          success: false,
          error: 'VITE_GOOGLE_API_KEY not found'
        };
      }

      const gemini = new ChatGoogleGenerativeAI({
        apiKey: this.geminiApiKey,
        modelName: 'gemini-pro',
        temperature: 0.7,
        maxOutputTokens: 500
      });

      const testMessage = "Hello! I'm Echo. Can you respond with a brief introduction about yourself as an AI assistant?";
      
      const response = await gemini.invoke([
        { role: 'system', content: 'You are Echo, a friendly AI companion. Respond naturally and warmly.' },
        { role: 'human', content: testMessage }
      ]);

      const responseTime = Date.now() - startTime;
      
      if (response && response.content) {
        console.log('✅ Gemini test successful');
        return {
          service: 'Gemini',
          success: true,
          response: response.content.toString(),
          responseTime
        };
      } else {
        return {
          service: 'Gemini',
          success: false,
          error: 'No response content received'
        };
      }

    } catch (error) {
      console.error('❌ Gemini test failed:', error);
      return {
        service: 'Gemini',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test both services and provide comprehensive validation results
   */
  async validateAllServices(): Promise<{
    groq: ServiceTestResult;
    gemini: ServiceTestResult;
    summary: {
      totalPassed: number;
      totalFailed: number;
      readyForDeployment: boolean;
      recommendations: string[];
    };
  }> {
    console.log('🚀 Starting comprehensive service validation...');

    const groqResult = await this.testGroqService();
    const geminiResult = await this.testGeminiService();

    const passed = [groqResult, geminiResult].filter(r => r.success).length;
    const failed = [groqResult, geminiResult].filter(r => !r.success).length;

    const recommendations: string[] = [];
    
    if (!groqResult.success) {
      recommendations.push('❌ Groq service is not working. Check API key and network connectivity.');
    }
    
    if (!geminiResult.success) {
      recommendations.push('❌ Gemini service is not working. Check API key and network connectivity.');
    }

    if (passed > 0) {
      recommendations.push(`✅ ${passed} service(s) working correctly.`);
    }

    if (passed === 0) {
      recommendations.push('🔧 No services are working. Check all API keys and network connectivity before deployment.');
    } else if (passed === 1) {
      recommendations.push('⚠️ Only one service is working. Consider fixing the other service for redundancy.');
    } else {
      recommendations.push('🎉 All services are working! Ready for deployment.');
    }

    const readyForDeployment = passed > 0; // At least one service must work

    console.log('\n📊 Validation Summary:');
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Ready for deployment: ${readyForDeployment ? 'YES' : 'NO'}`);

    return {
      groq: groqResult,
      gemini: geminiResult,
      summary: {
        totalPassed: passed,
        totalFailed: failed,
        readyForDeployment,
        recommendations
      }
    };
  }

  /**
   * Test the response flow through the chat integration service
   */
  async testChatIntegrationFlow(): Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }> {
    try {
      // Import the enhanced chat integration service
      const { enhancedChatIntegrationService } = await import('../lib/enhancedChatIntegrationService');
      
      console.log('🔍 Testing chat integration flow...');
      
      const testMessage = "Hello Echo! Can you tell me what time it is?";
      const context = {
        visionData: null,
        emotionalContext: null,
        environmentData: null,
        conversationHistory: []
      };

      const response = await enhancedChatIntegrationService.processMessage(testMessage, context);
      
      if (response && response.message) {
        console.log('✅ Chat integration flow test successful');
        return {
          success: true,
          message: response.message
        };
      } else {
        return {
          success: false,
          error: 'No response message received from chat integration'
        };
      }

    } catch (error) {
      console.error('❌ Chat integration flow test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const serviceValidator = new ServiceValidator();
