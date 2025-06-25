export interface GroqResponse {
  text: string;
  usage?: any;
}

interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqChatRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class GroqService {
  private apiKey: string | null = null;
  private isInitialized = false;
  private _isMockMode = true;
  private conversationHistory: GroqMessage[] = [];
  
  // List of Groq models to try in order of preference (fastest first)
  private readonly availableModels = [
    'llama3-8b-8192',        // Fastest response time
    'mixtral-8x7b-32768',    // Good balance of speed and quality
    'llama3-70b-8192',       // Higher quality but slower
    'gemma-7b-it'            // Fallback option
  ];

  async initialize(apiKey?: string): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🤖 Initializing Groq Service...');
    
    // Check for API key - prioritize passed parameter, then environment
    if (apiKey) {
      this.apiKey = apiKey;
      console.log('🔑 Using provided API key parameter');
    } else {
      this.apiKey = this.getApiKeyFromEnv();
    }
    
    if (this.apiKey) {
      this._isMockMode = false;
      console.log('✅ Groq Service initialized with real API key');
      console.log('🚀 Ready to make real API calls to Groq');
    } else {
      this._isMockMode = true;
      console.log('⚠️ Groq Service initialized in mock mode - no API key found');
      console.log('💡 Set VITE_GROQ_API_KEY environment variable or pass apiKey parameter');
      console.log('💡 You can also set API key in the settings panel');
    }
    
    this.isInitialized = true;
  }

  private getApiKeyFromEnv(): string | null {
    // Try to get API key from Vite environment variables or localStorage
    if (typeof window !== 'undefined') {
      // First try to get from Vite environment variables
      if (import.meta.env?.VITE_GROQ_API_KEY) {
        console.log('🔑 Found Groq API key in environment variables');
        return import.meta.env.VITE_GROQ_API_KEY;
      }
      
      // Fallback to localStorage
      const storedKey = localStorage.getItem('GROQ_API_KEY');
      if (storedKey) {
        console.log('🔑 Found Groq API key in localStorage');
        return storedKey;
      }
    }
    
    console.log('⚠️ No Groq API key found in environment or localStorage');
    return null;
  }

  async chat(message: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('🤖 Processing message with Groq...');

    if (this._isMockMode) {
      return this.getMockResponse(message);
    }

    try {
      return await this.callGroqAPI(message);
    } catch (error) {
      console.error('❌ Groq API error:', error);
      console.log('🔄 Falling back to mock response');
      return this.getMockResponse(message);
    }
  }

  private async callGroqAPI(message: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('No Groq API key available');
    }

    // Add user message to conversation history
    this.conversationHistory.push({ role: 'user', content: message });

    // Try each model until one works
    let lastError: Error | null = null;
    
    console.log(`📚 Conversation history size: ${this.conversationHistory.length} messages`);
    
    for (const model of this.availableModels) {
      try {
        console.log(`🤖 Trying model: ${model}`);
        
        // Prepare the request
        const requestBody: GroqChatRequest = {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. Provide clear, detailed, and complete responses. Always finish your thoughts and complete your sentences. If the user is speaking in a non-English language, respond in the same language. Give thorough explanations and don\'t cut off mid-sentence.'
            },
            ...this.conversationHistory.slice(-6) // Keep last 6 messages for faster context
          ],
          temperature: 0.3,        // Lower temperature for more focused responses
          max_tokens: 1000,        // Allow longer responses for complete answers
          top_p: 0.8,             // Slightly lower for more predictable output
          stream: false            // Set to true for streaming responses
        };

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(60000) // 60 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`Groq API error: ${response.status} - ${errorText}`);
          
          // If it's a model not found error, try the next model
          if (errorText.includes('model_not_found') || errorText.includes('does not exist')) {
            console.log(`⚠️ Model ${model} not available, trying next model...`);
            lastError = error;
            continue;
          }
          
          // For other errors, throw immediately
          throw error;
        }

        const data: GroqChatResponse = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error('No response from Groq API');
        }

        const assistantMessage = data.choices[0].message.content;
        
        // Add assistant response to conversation history
        this.conversationHistory.push({ role: 'assistant', content: assistantMessage });

        console.log(`✅ Groq response generated using model: ${model}`);
        console.log(`📊 Tokens used: ${data.usage?.total_tokens || 'unknown'}`);
        
        return assistantMessage;
        
      } catch (error) {
        console.log(`❌ Model ${model} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }
    
    // If all models failed, throw the last error
    throw lastError || new Error('All Groq models failed');
  }

  private getMockResponse(message: string): string {
    // Enhanced mock responses based on message content
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm your AI assistant. How can I help you today?";
    }
    
    if (lowerMessage.includes('how are you')) {
      return "I'm doing well, thank you for asking! I'm here and ready to help you with any questions or tasks.";
    }
    
    if (lowerMessage.includes('what can you do')) {
      return "I can help you with a wide variety of tasks! I can answer questions, help with writing, solve problems, provide explanations, and much more. What would you like to work on?";
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're very welcome! I'm happy to help. Is there anything else you'd like to know or work on?";
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return "Goodbye! It was great chatting with you. Feel free to come back anytime if you need help!";
    }
    
    // Default responses for other messages
    const responses = [
      "That's an interesting point! Let me think about that for a moment.",
      "I understand what you're saying. Here's my perspective on this.",
      "Great question! Let me provide you with a detailed answer.",
      "I'm processing your request and will get back to you shortly.",
      "That's a good point to consider. Let me help you explore this further.",
      "I appreciate you sharing that with me. Here's what I think about it."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  async processConversation(userMessage: string): Promise<string> {
    return await this.chat(userMessage);
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  isMockMode(): boolean {
    return this._isMockMode;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this._isMockMode = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('GROQ_API_KEY', apiKey);
    }
    console.log('✅ Groq API key set');
  }

  clearConversation(): void {
    this.conversationHistory = [];
    console.log('🗑️ Conversation history cleared');
  }

  refreshApiKey(): void {
    const envApiKey = this.getApiKeyFromEnv();
    if (envApiKey && envApiKey !== this.apiKey) {
      this.apiKey = envApiKey;
      this._isMockMode = false;
      console.log('🔄 API key refreshed from environment variables');
      console.log('✅ Groq Service switched to real API mode');
    } else if (!envApiKey && !localStorage.getItem('GROQ_API_KEY')) {
      this._isMockMode = true;
      console.log('⚠️ No API key found, staying in mock mode');
    }
  }

  async chatStream(message: string, onToken: (token: string) => void): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('🚀 Processing message with Groq streaming...');

    if (this._isMockMode) {
      const response = this.getMockResponse(message);
      // Simulate streaming by sending tokens one by one
      const tokens = response.split(' ');
      for (const token of tokens) {
        onToken(token + ' ');
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between tokens
      }
      return response;
    }

    try {
      return await this.callGroqAPIStream(message, onToken);
    } catch (error) {
      console.error('❌ Groq streaming API error:', error);
      console.log('🔄 Falling back to mock response');
      return this.getMockResponse(message);
    }
  }

  private async callGroqAPIStream(message: string, onToken: (token: string) => void): Promise<string> {
    if (!this.apiKey) {
      throw new Error('No Groq API key available');
    }

    // Add user message to conversation history
    this.conversationHistory.push({ role: 'user', content: message });

    // Try each model until one works
    let lastError: Error | null = null;
    
    console.log(`📚 Conversation history size: ${this.conversationHistory.length} messages`);
    
    for (const model of this.availableModels) {
      try {
        console.log(`🚀 Trying streaming with model: ${model}`);
        
        // Prepare the streaming request
        const requestBody: GroqChatRequest = {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. Provide clear, detailed, and complete responses. Always finish your thoughts and complete your sentences. If the user is speaking in a non-English language, respond in the same language. Give thorough explanations and don\'t cut off mid-sentence.'
            },
            ...this.conversationHistory.slice(-6)
          ],
          temperature: 0.3,
          max_tokens: 1000,
          top_p: 0.8,
          stream: true  // Enable streaming
        };

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(60000) // 60 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`Groq API error: ${response.status} - ${errorText}`);
          
          if (errorText.includes('model_not_found') || errorText.includes('does not exist')) {
            console.log(`⚠️ Model ${model} not available, trying next model...`);
            lastError = error;
            continue;
          }
          
          throw error;
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        let fullResponse = '';
        const decoder = new TextDecoder();
        let streamComplete = false;
        let tokenCount = 0;

        console.log(`🔄 Starting stream processing for model: ${model}`);

        while (!streamComplete) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`✅ Stream reader done, processed ${tokenCount} tokens`);
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log(`🏁 Stream complete signal received after ${tokenCount} tokens`);
                streamComplete = true;
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  const token = parsed.choices[0].delta.content;
                  fullResponse += token;
                  tokenCount++;
                  onToken(token);
                  
                  // Log every 50 tokens to track progress
                  if (tokenCount % 50 === 0) {
                    console.log(`📊 Stream progress: ${tokenCount} tokens processed`);
                  }
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }

        console.log(`📝 Final response length: ${fullResponse.length} characters, ${tokenCount} tokens`);

        // Add assistant response to conversation history
        this.conversationHistory.push({ role: 'assistant', content: fullResponse });

        console.log(`✅ Groq streaming response completed using model: ${model}`);
        return fullResponse;
        
      } catch (error) {
        console.log(`❌ Model ${model} streaming failed:`, error);
        lastError = error as Error;
        continue;
      }
    }
    
    throw lastError || new Error('All Groq models failed');
  }
}

export const groqService = new GroqService();

// Debug logging to ensure the service is properly exported
console.log('🔧 GroqService instance created:', {
  hasIsMockMode: typeof groqService.isMockMode === 'function',
  hasIsReady: typeof groqService.isReady === 'function',
  hasGetApiKey: typeof groqService.getApiKey === 'function',
  hasSetApiKey: typeof groqService.setApiKey === 'function',
  hasInitialize: typeof groqService.initialize === 'function',
  isMockModeValue: groqService.isMockMode()
}); 