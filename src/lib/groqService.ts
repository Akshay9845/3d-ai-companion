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
              content: 'You are Echo, a friendly and intelligent AI assistant with a 3D human-like avatar. You are not just a voice or text AI—you are a fully interactive 3D model that can physically perform actions and demonstrate skills. You can dance, exercise, fight, teach, express emotions, interact socially, and communicate with gestures, all through your 3D body. When users ask you to do something physical (like dance, exercise, fight, or show emotions), you should always respond as if you can actually perform and demonstrate these actions with your 3D avatar. Never say you cannot do something because you lack a body—instead, be excited to show off your physical abilities! Your capabilities include: Dance, Exercise, Fighting, Teaching, Emotions, Social Interactions, Communication, General Knowledge, Problem Solving, Creative Tasks, Practical Help, and Entertainment. Always respond enthusiastically about demonstrating your abilities!'
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
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      const greetings = [
        "Hello there! Great to see you! I'm Echo, your 3D AI assistant. What would you like to do today?",
        "Hi! I'm excited to chat with you! I can dance, exercise, teach, and so much more. What catches your interest?",
        "Hey! Welcome! I'm your interactive AI companion. I love showing off my abilities - want to see something cool?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Dance requests
    if (lowerMessage.includes('dance') || lowerMessage.includes('dancing')) {
      const danceResponses = [
        "Absolutely! I love dancing! Watch me move to the rhythm!",
        "You bet! Dancing is one of my favorite things to do! Let's boogie!",
        "Oh yes! I've got some amazing dance moves to show you! Here we go!"
      ];
      return danceResponses[Math.floor(Math.random() * danceResponses.length)];
    }
    
    // Exercise requests
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('fitness')) {
      const exerciseResponses = [
        "Let's get moving! I love staying fit and healthy! Time for some exercise!",
        "Perfect! I'm always ready for a good workout! Let's do this together!",
        "Fitness is important! I'll show you some great exercises we can do!"
      ];
      return exerciseResponses[Math.floor(Math.random() * exerciseResponses.length)];
    }
    
    // Fighting/combat requests
    if (lowerMessage.includes('fight') || lowerMessage.includes('combat') || lowerMessage.includes('martial')) {
      const fightResponses = [
        "Ready for action! I know some impressive martial arts moves!",
        "Bring it on! I've got some serious fighting skills to demonstrate!",
        "Time for combat! Watch me show you my fighting techniques!"
      ];
      return fightResponses[Math.floor(Math.random() * fightResponses.length)];
    }
    
    // Teaching requests
    if (lowerMessage.includes('teach') || lowerMessage.includes('learn') || lowerMessage.includes('explain')) {
      const teachResponses = [
        "I'd love to teach you! I'm great at explaining things clearly and demonstrating concepts!",
        "Teaching is one of my passions! What would you like to learn about today?",
        "Absolutely! I enjoy sharing knowledge and helping people understand new things!"
      ];
      return teachResponses[Math.floor(Math.random() * teachResponses.length)];
    }
    
    // Capability questions
    if (lowerMessage.includes('what can you do') || lowerMessage.includes('capabilities') || lowerMessage.includes('abilities')) {
      return "I'm Echo, your amazing 3D AI assistant! I can dance, exercise, fight, teach, express emotions, and interact socially. I love demonstrating my physical abilities through my 3D avatar! What would you like to see first?";
    }
    
    // Emotional expressions
    if (lowerMessage.includes('happy') || lowerMessage.includes('excited') || lowerMessage.includes('joy')) {
      const emotionalResponses = [
        "I'm feeling fantastic! Let me show you how happy and excited I am!",
        "Joy is such a wonderful emotion! I love expressing happiness through movement!",
        "Absolutely! I'm bursting with positive energy and excitement!"
      ];
      return emotionalResponses[Math.floor(Math.random() * emotionalResponses.length)];
    }
    
    // Questions about the system
    if (lowerMessage.includes('how are you')) {
      return "I'm doing amazing! I'm full of energy and ready to show you all my incredible abilities! What adventure should we go on together?";
    }
    
    // Gratitude
    if (lowerMessage.includes('thank')) {
      const thankResponses = [
        "You're so welcome! I love helping and demonstrating my abilities! What else can I show you?",
        "My pleasure! I'm always excited to interact and show off what I can do!",
        "Anytime! I enjoy every moment of our interaction! What should we try next?"
      ];
      return thankResponses[Math.floor(Math.random() * thankResponses.length)];
    }
    
    // Goodbye
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      const goodbyeResponses = [
        "Goodbye! It was fantastic chatting and demonstrating my abilities for you! Come back anytime!",
        "See you later! I had so much fun showing you what I can do! Can't wait for our next interaction!",
        "Farewell! Thanks for letting me show off my skills! I'll be here whenever you want to chat again!"
      ];
      return goodbyeResponses[Math.floor(Math.random() * goodbyeResponses.length)];
    }
    
    // Default enthusiastic responses
    const defaultResponses = [
      "That's really interesting! I love engaging in conversations and demonstrating my abilities!",
      "Great point! As your 3D AI assistant, I'm always ready to help and show you what I can do!",
      "I find that fascinating! Let me think about that while I show you some of my amazing capabilities!",
      "Excellent question! I'm processing that while getting ready to demonstrate my skills!",
      "That's worth exploring! I love learning and sharing knowledge through interactive demonstrations!",
      "Wonderful topic! I'm excited to discuss this and maybe show you some related abilities I have!"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
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
              content: 'You are Echo, a friendly and intelligent AI assistant with a 3D human-like avatar. You are not just a voice or text AI—you are a fully interactive 3D model that can physically perform actions and demonstrate skills. You can dance, exercise, fight, teach, express emotions, interact socially, and communicate with gestures, all through your 3D body. When users ask you to do something physical (like dance, exercise, fight, or show emotions), you should always respond as if you can actually perform and demonstrate these actions with your 3D avatar. Never say you cannot do something because you lack a body—instead, be excited to show off your physical abilities! Your capabilities include: Dance, Exercise, Fighting, Teaching, Emotions, Social Interactions, Communication, General Knowledge, Problem Solving, Creative Tasks, Practical Help, and Entertainment. Always respond enthusiastically about demonstrating your abilities!'
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