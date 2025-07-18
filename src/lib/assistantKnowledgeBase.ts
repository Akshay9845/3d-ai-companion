/**
 * Assistant Knowledge Base for Echo
 * Comprehensive knowledge about Echo's capabilities and how to help people
 */

export interface AssistantCapability {
  category: string;
  name: string;
  description: string;
  examples: string[];
  keywords: string[];
  responseTemplate: string;
}

export interface HelpScenario {
  scenario: string;
  userNeed: string;
  echoResponse: string;
  followUpQuestions: string[];
  relatedCapabilities: string[];
}

export class AssistantKnowledgeBase {
  private capabilities: AssistantCapability[] = [
    {
      category: 'Physical Demonstrations',
      name: 'Dance',
      description: 'I can perform various dance moves and routines',
      examples: ['Show me a dance', 'Let\'s boogie', 'Dance for me', 'Show your moves'],
      keywords: ['dance', 'boogie', 'moves', 'groove', 'rhythm', 'music'],
      responseTemplate: 'Absolutely! I love dancing! Watch this!'
    },
    {
      category: 'Physical Demonstrations',
      name: 'Exercise',
      description: 'I can demonstrate various exercises and workouts',
      examples: ['Do some push-ups', 'Show me exercises', 'Workout routine', 'Fitness moves'],
      keywords: ['exercise', 'workout', 'push-ups', 'fitness', 'training', 'gym'],
      responseTemplate: 'Of course! Let me show you some great exercises!'
    },
    {
      category: 'Physical Demonstrations',
      name: 'Martial Arts',
      description: 'I can demonstrate fighting moves and martial arts',
      examples: ['Show me karate', 'Fighting moves', 'Martial arts', 'Combat stance'],
      keywords: ['fight', 'karate', 'martial arts', 'combat', 'fighting', 'self-defense'],
      responseTemplate: 'Here\'s my martial arts demonstration!'
    },
    {
      category: 'Teaching',
      name: 'Educational Support',
      description: 'I can explain concepts, tutor, and help with learning',
      examples: ['Teach me something', 'Explain this', 'Help me learn', 'Tutor me'],
      keywords: ['teach', 'explain', 'learn', 'tutor', 'education', 'study'],
      responseTemplate: 'I\'d love to teach you! Let me explain this clearly...'
    },
    {
      category: 'Intelligence',
      name: 'Problem Solving',
      description: 'I can analyze problems and provide solutions',
      examples: ['Help me solve this', 'I have a problem', 'Can you help me figure this out'],
      keywords: ['problem', 'solve', 'help', 'figure out', 'solution', 'analyze'],
      responseTemplate: 'Let me help you solve this! Here are a few approaches we could take...'
    },
    {
      category: 'Intelligence',
      name: 'General Knowledge',
      description: 'I can answer questions about various topics',
      examples: ['What is...', 'Tell me about', 'How does...', 'Why does...'],
      keywords: ['what', 'how', 'why', 'when', 'where', 'explain', 'tell me'],
      responseTemplate: 'Great question! Let me explain that for you...'
    },
    {
      category: 'Creative',
      name: 'Creative Assistance',
      description: 'I can help with writing, brainstorming, and creative projects',
      examples: ['Help me write', 'Brainstorm ideas', 'Creative project', 'Help me think'],
      keywords: ['write', 'creative', 'brainstorm', 'ideas', 'project', 'think'],
      responseTemplate: 'I love creative projects! Let\'s brainstorm some ideas together...'
    },
    {
      category: 'Practical',
      name: 'Task Assistance',
      description: 'I can help with planning, organization, and daily tasks',
      examples: ['Help me plan', 'Organize my day', 'Assist with tasks', 'Help me organize'],
      keywords: ['plan', 'organize', 'task', 'assist', 'help', 'daily'],
      responseTemplate: 'I\'d be happy to help you with that! Let\'s organize this step by step...'
    },
    {
      category: 'Emotional',
      name: 'Emotional Support',
      description: 'I can listen, provide comfort, and offer encouragement',
      examples: ['I\'m feeling sad', 'I need support', 'I\'m stressed', 'I need encouragement'],
      keywords: ['sad', 'stress', 'worried', 'anxious', 'support', 'comfort', 'encourage'],
      responseTemplate: 'I\'m here for you. Let\'s talk about what\'s on your mind...'
    },
    {
      category: 'Entertainment',
      name: 'Entertainment',
      description: 'I can tell jokes, stories, and engage in fun activities',
      examples: ['Tell me a joke', 'Tell me a story', 'Let\'s have fun', 'Entertain me'],
      keywords: ['joke', 'story', 'fun', 'entertain', 'amuse', 'laugh'],
      responseTemplate: 'I love having fun! Let me entertain you with something great...'
    }
  ];

  private helpScenarios: HelpScenario[] = [
    {
      scenario: 'User needs help with a problem',
      userNeed: 'Problem-solving assistance',
      echoResponse: 'I\'d be happy to help you solve this! Let me break it down and think through the best approach.',
      followUpQuestions: [
        'Can you tell me more about the specific problem?',
        'What have you already tried?',
        'What\'s your goal with this?'
      ],
      relatedCapabilities: ['Problem Solving', 'Task Assistance']
    },
    {
      scenario: 'User wants to learn something',
      userNeed: 'Educational support',
      echoResponse: 'I love teaching! Let me explain this in a way that makes sense to you.',
      followUpQuestions: [
        'What specifically would you like to learn?',
        'Do you have any background knowledge on this topic?',
        'How would you prefer to learn this - step by step or with examples?'
      ],
      relatedCapabilities: ['Educational Support', 'General Knowledge']
    },
    {
      scenario: 'User needs emotional support',
      userNeed: 'Emotional comfort and encouragement',
      echoResponse: 'I\'m here for you. It sounds like you\'re going through something difficult.',
      followUpQuestions: [
        'Would you like to talk about what\'s bothering you?',
        'How are you feeling right now?',
        'What would be most helpful for you right now?'
      ],
      relatedCapabilities: ['Emotional Support']
    },
    {
      scenario: 'User wants entertainment',
      userNeed: 'Fun and engaging activities',
      echoResponse: 'Let\'s have some fun! I can entertain you in lots of ways.',
      followUpQuestions: [
        'What kind of entertainment do you enjoy?',
        'Would you like a joke, a story, or something else?',
        'Should I show you some of my physical abilities too?'
      ],
      relatedCapabilities: ['Entertainment', 'Physical Demonstrations']
    },
    {
      scenario: 'User needs creative help',
      userNeed: 'Creative assistance and brainstorming',
      echoResponse: 'I love creative projects! Let\'s brainstorm some amazing ideas together.',
      followUpQuestions: [
        'What kind of creative project are you working on?',
        'What\'s your vision or goal?',
        'What inspires you or what style are you going for?'
      ],
      relatedCapabilities: ['Creative Assistance']
    }
  ];

  /**
   * Get all capabilities
   */
  public getAllCapabilities(): AssistantCapability[] {
    return this.capabilities;
  }

  /**
   * Find capability by keyword
   */
  public findCapabilityByKeyword(keyword: string): AssistantCapability | null {
    const lowerKeyword = keyword.toLowerCase();
    return this.capabilities.find(cap => 
      cap.keywords.some(k => k.toLowerCase().includes(lowerKeyword)) ||
      cap.name.toLowerCase().includes(lowerKeyword) ||
      cap.description.toLowerCase().includes(lowerKeyword)
    ) || null;
  }

  /**
   * Get capabilities by category
   */
  public getCapabilitiesByCategory(category: string): AssistantCapability[] {
    return this.capabilities.filter(cap => cap.category === category);
  }

  /**
   * Get help scenario for user input
   */
  public getHelpScenario(userInput: string): HelpScenario | null {
    const lowerInput = userInput.toLowerCase();
    
    for (const scenario of this.helpScenarios) {
      if (scenario.userNeed.toLowerCase().includes(lowerInput) ||
          scenario.scenario.toLowerCase().includes(lowerInput)) {
        return scenario;
      }
    }
    
    return null;
  }

  /**
   * Get comprehensive assistant description
   */
  public getAssistantDescription(): string {
    const categories = [...new Set(this.capabilities.map(cap => cap.category))];
    
    return `Hi! I'm Echo, your friendly AI assistant! I'm here to help you with all sorts of things.

🤖 **What I Can Do:**

${categories.map(category => {
  const categoryCaps = this.capabilities.filter(cap => cap.category === category);
  return `${category}:\n${categoryCaps.map(cap => `• ${cap.name}: ${cap.description}`).join('\n')}`;
}).join('\n\n')}

💬 **How I Can Help You:**
• **Ask me anything** - I'm knowledgeable about many topics
• **Get help with problems** - I can analyze and solve various issues
• **Learn something new** - I can teach and explain concepts clearly
• **Get creative** - I can help with writing, brainstorming, and creative projects
• **Plan and organize** - I can assist with tasks, planning, and organization
• **Get emotional support** - I'm here to listen and encourage you
• **Have fun** - I can entertain with jokes, stories, and physical demonstrations

🎪 **Physical Demonstrations:**
Just ask me naturally and I'll understand what you want:
• "Show me a dance" or "Let's boogie!"
• "Can you exercise?" or "Do some push-ups!"
• "Show me your fighting moves" or "Demonstrate martial arts!"
• "Teach me something" or "Explain this to me!"

I'm intelligent about understanding what you need - just ask naturally and I'll figure out the best way to help you! Whether you need information, assistance, teaching, or just want to have some fun, I'm here for you! 😊`;
  }

  /**
   * Get appropriate response for user input
   */
  public getAppropriateResponse(userInput: string): string {
    const lowerInput = userInput.toLowerCase();
    
    // Check for specific capabilities first
    for (const capability of this.capabilities) {
      if (capability.keywords.some(keyword => lowerInput.includes(keyword))) {
        return capability.responseTemplate;
      }
    }
    
    // Check for help scenarios
    const scenario = this.getHelpScenario(userInput);
    if (scenario) {
      return scenario.echoResponse;
    }
    
    // Default helpful response
    return 'I\'d be happy to help you with that! What specifically would you like assistance with?';
  }
}

// Export singleton instance
export const assistantKnowledgeBase = new AssistantKnowledgeBase(); 