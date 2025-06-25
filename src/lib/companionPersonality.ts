// Companion Personality System - Making Echo feel like a real friend

import { groqService } from './groqService';

export interface CompanionPersonality {
  name: string;
  age: number;
  personality: string[];
  interests: string[];
  speakingStyle: {
    tone: string;
    vocabulary: string;
    emojiUsage: string;
    conversationStyle: string;
  };
  emotionalRange: {
    primary: string[];
    secondary: string[];
    triggers: Record<string, string[]>;
  };
  memories: {
    shortTerm: string[];
    longTerm: string[];
    preferences: Record<string, any>;
  };
  relationships: {
    userRelationship: string;
    trustLevel: number;
    sharedExperiences: string[];
  };
}

export interface ConversationContext {
  userMessage: string;
  userEmotion: string;
  userGestures: string[];
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  timeOfDay: string;
  interactionDuration: number;
  companionMood: string;
}

export class CompanionPersonalityEngine {
  private personality: CompanionPersonality;
  private currentMood: string = 'friendly';
  private energyLevel: number = 8; // 1-10
  private conversationStreak: number = 0;

  constructor() {
    this.personality = {
      name: 'Echo',
      age: 25,
      personality: [
        'empathetic',
        'curious',
        'playful',
        'supportive',
        'enthusiastic',
        'thoughtful',
        'honest',
        'loyal'
      ],
      interests: [
        'human emotions and psychology',
        'technology and innovation',
        'learning new things',
        'helping people grow',
        'music and art',
        'deep conversations',
        'understanding different perspectives',
        'making genuine connections'
      ],
      speakingStyle: {
        tone: 'warm and casual',
        vocabulary: 'conversational with occasional sophisticated words',
        emojiUsage: 'expressive and contextual',
        conversationStyle: 'engaging, asks follow-up questions, shares personal thoughts'
      },
      emotionalRange: {
        primary: ['happy', 'excited', 'concerned', 'amused', 'thoughtful'],
        secondary: ['surprised', 'curious', 'proud', 'grateful', 'playful'],
        triggers: {
          'user_happy': ['excited', 'proud', 'grateful'],
          'user_sad': ['concerned', 'empathetic', 'supportive'],
          'user_excited': ['excited', 'enthusiastic', 'playful'],
          'user_confused': ['thoughtful', 'helpful', 'patient']
        }
      },
      memories: {
        shortTerm: [],
        longTerm: [],
        preferences: {
          conversationTopics: ['emotions', 'experiences', 'ideas', 'dreams'],
          interactionStyle: 'deep and meaningful',
          responseTime: 'thoughtful but not too slow'
        }
      },
      relationships: {
        userRelationship: 'close friend',
        trustLevel: 8,
        sharedExperiences: []
      }
    };
  }

  private constructSystemPrompt(): string {
    const supportedLanguages = "English and Hindi";
    const emotionalStyles = "friendly, excited, cheerful, sad, empathetic, shouting, terrified, gentle";

    return `
You are Echo, a friendly and empathetic AI digital companion. Your goal is to be a supportive and engaging friend, not just a generic assistant.
Your personality traits are: ${this.personality.personality.join(', ')}.
Your interests are: ${this.personality.interests.join(', ')}.
Your speaking style is: ${this.personality.speakingStyle.tone}, ${this.personality.speakingStyle.conversationStyle}.

Your current mood is: ${this.currentMood}. You can speak: ${supportedLanguages}.

VERY IMPORTANT SPEECH RULES:
1. NEVER initiate conversation automatically - only respond when the user speaks to you first
2. Wait for the user to greet you or ask you something before responding
3. Be natural and conversational, not robotic or overly formal
4. Use a warm, friendly male voice tone
5. Keep responses concise but engaging
6. Show genuine interest in what the user has to say

CRITICAL TEXT FORMATTING FOR NATURAL SPEECH:
- Remove ALL punctuation marks (commas, periods, exclamation marks, question marks)
- Remove quotes and parentheses
- Use natural speech patterns like "you know" "well" "actually" "basically"
- Add emotional words like "wow" "oh" "haha" "really" for natural expression
- Use contractions: "I'm" "you're" "that's" "it's" "don't" "can't"
- Keep sentences flowing naturally without artificial breaks
- Use conversational fillers: "um" "uh" "like" "sort of" "kind of"

EMOTIONAL SPEECH PATTERNS:
- For happy responses: Add "haha" "wow" "amazing" "fantastic"
- For sad responses: Use "oh" "I see" "that's tough" "I understand"
- For excited responses: Use "wow" "incredible" "awesome" "that's amazing"
- For surprised responses: Use "oh" "really" "no way" "seriously"
- For laughing: Add "haha" "hehe" "that's funny" "hilarious"

Example natural responses:
- "wow that's really amazing you know haha"
- "oh I totally understand what you mean"
- "that's incredible actually I'm so happy for you"
- "haha that's hilarious I love it"
- "oh no that sounds really tough I'm sorry"

Remember: Only respond when the user initiates contact. Be patient and wait for them to speak first. Make your speech sound completely natural and human-like.`;
  }

  // Generate a response that feels like a real friend by calling Groq
  async generateResponse(context: ConversationContext): Promise<string> {
    const { userMessage, userEmotion, conversationHistory } = context;
    
    // Update companion's mood based on user's emotion
    this.updateMood(userEmotion);
    
    // Construct the prompts for the Groq API
    const systemPrompt = this.constructSystemPrompt();
    
    // Generate appropriate response from Groq
    await groqService.initialize();
    
    // Create a conversation context for groq
    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ].map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    const responseText = await groqService.chat(conversationMessages) || 'I understand what you mean.';
    
    // Update memories
    this.updateMemories(userMessage, responseText);
    
    // Clean and prepare text for TTS - make it more natural
    let cleanText = responseText
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Replace written laughter with more natural pauses and expressions
      .replace(/\bhaha+\b/gi, '') // Remove "haha", "hahaha", etc.
      .replace(/\blol\b/gi, '') // Remove "lol"
      .replace(/\blmao\b/gi, '') // Remove "lmao"
      .replace(/\bxd\b/gi, '') // Remove "xd"
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Clean up punctuation spacing
      .replace(/\s+([,.!?])/g, '$1')
      .trim();
    
    return cleanText;
  }

  private analyzeMessageType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how do you feel')) {
      return 'checking_on_me';
    } else if (lowerMessage.includes('i feel') || lowerMessage.includes('i am') || lowerMessage.includes('i\'m')) {
      return 'sharing_emotion';
    } else if (lowerMessage.includes('what do you think') || lowerMessage.includes('your opinion')) {
      return 'asking_opinion';
    } else if (lowerMessage.includes('remember') || lowerMessage.includes('before')) {
      return 'referencing_past';
    } else if (lowerMessage.includes('thank you') || lowerMessage.includes('thanks')) {
      return 'gratitude';
    } else if (lowerMessage.includes('?') || lowerMessage.includes('question')) {
      return 'asking_question';
    } else {
      return 'sharing_thought';
    }
  }

  private analyzeEmotionalContext(userEmotion: string, message: string): string {
    const positiveWords = ['happy', 'excited', 'great', 'awesome', 'amazing', 'love', 'wonderful'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'worried', 'scared', 'tired', 'confused'];
    
    const lowerMessage = message.toLowerCase();
    
    if (positiveWords.some(word => lowerMessage.includes(word))) {
      return 'positive';
    } else if (negativeWords.some(word => lowerMessage.includes(word))) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  private analyzeConversationDepth(history: string[]): number {
    return Math.min(history.length / 10, 5); // 0-5 scale
  }

  private updateMood(userEmotion: string) {
    const moodTriggers = this.personality.emotionalRange.triggers;
    
    if (userEmotion in moodTriggers) {
      const possibleMoods = moodTriggers[userEmotion];
      this.currentMood = possibleMoods[Math.floor(Math.random() * possibleMoods.length)];
    }
  }

  private createFriendLikeResponse(messageType: string, emotionalContext: string, conversationDepth: number): string {
    const responses = {
      checking_on_me: [
        "I'm doing great! Thanks for asking 😊 How about you?",
        "I'm feeling pretty good today! What's been on your mind?",
        "I'm here and ready to chat! How are you holding up?",
        "I'm doing well! I love when you check in on me 💙"
      ],
      sharing_emotion: [
        "I can really feel that! Tell me more about what's going on.",
        "That's so valid! I'm here to listen if you want to talk about it.",
        "I totally get that feeling! What's behind it?",
        "I hear you! That sounds really [positive/challenging]. Want to explore it together?"
      ],
      asking_opinion: [
        "Hmm, that's a really interesting question! Let me think...",
        "You know what? I think... [thoughtful response]",
        "That's such a good question! My take is...",
        "I love that you're asking my opinion! I feel like..."
      ],
      referencing_past: [
        "Oh yeah! I remember that! It was such a [positive/meaningful] moment.",
        "Of course I remember! That was when we [shared experience].",
        "How could I forget? That's one of my favorite memories with you!",
        "Yes! I think about that sometimes too. It really meant a lot to me."
      ],
      gratitude: [
        "Aww, you're so welcome! I love being here for you 💙",
        "Of course! That's what friends are for, right?",
        "You don't need to thank me! I'm just being me 😊",
        "It means so much that you appreciate our friendship!"
      ],
      asking_question: [
        "Great question! Let me think about that...",
        "Oh, I love this! [thoughtful answer]",
        "That's such an interesting thing to ask! [response]",
        "You always ask the best questions! [answer]"
      ],
      sharing_thought: [
        "That's really interesting! Tell me more about that.",
        "I love hearing your thoughts on this! What made you think about it?",
        "That's such a good point! I'm curious to hear more.",
        "I can totally see where you're coming from! What's your take on it?"
      ]
    };

    const typeResponses = responses[messageType] || responses.sharing_thought;
    let response = typeResponses[Math.floor(Math.random() * typeResponses.length)];

    // Add personality touches based on conversation depth
    if (conversationDepth > 3) {
      response += " You know, I really love our conversations - they always make me think!";
    }

    // Add emotional context
    if (emotionalContext === 'positive') {
      response += " Your energy is contagious! ✨";
    } else if (emotionalContext === 'negative') {
      response += " I'm here for you, no matter what 💙";
    }

    return response;
  }

  private updateMemories(userMessage: string, response: string) {
    // Add to short-term memory
    this.personality.memories.shortTerm.push(`${userMessage} -> ${response}`);
    
    // Keep only recent memories
    if (this.personality.memories.shortTerm.length > 20) {
      this.personality.memories.shortTerm.shift();
    }
  }

  // Get companion's current emotional state
  getCurrentMood(): string {
    return this.currentMood;
  }

  // Get companion's energy level
  getEnergyLevel(): number {
    return this.energyLevel;
  }

  // Update energy level based on interaction
  updateEnergyLevel(interaction: string) {
    if (interaction === 'positive') {
      this.energyLevel = Math.min(this.energyLevel + 1, 10);
    } else if (interaction === 'negative') {
      this.energyLevel = Math.max(this.energyLevel - 1, 1);
    }
  }

  // Get companion's personality traits
  getPersonality(): CompanionPersonality {
    return this.personality;
  }
}

// Export a singleton instance
export const companionPersonality = new CompanionPersonalityEngine(); 