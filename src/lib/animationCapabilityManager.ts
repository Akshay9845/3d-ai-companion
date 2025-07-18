/**
 * Animation Capability Manager for Echo Character
 * Integrates with the intelligent AnimationService for capability detection and responses
 * 
 * CAPABILITIES: Dance, Exercise, Fighting, Teaching, Emotions, Social Interactions, Communication
 */

import { AnimationCategory, animationService } from './animationService';

export interface AnimationCapability {
  category: string;
  actions: string[];
  animations: string[];
  keywords: string[];
  description: string;
}

export interface CapabilityResponse {
  animation: string;
  category: string;
  message: string;
  duration: number;
}

export class AnimationCapabilityManager {
  constructor() {
    // The AnimationService now handles all capability logic
  }

  /**
   * Get all capabilities that the model can perform
   */
  public getAllCapabilities(): string[] {
    const categories = animationService.getAllCategories();
    return categories.map(category => `${category.displayName}: ${category.description}`);
  }

  /**
   * Parse user request and find matching animation capability
   */
  public parseUserRequest(userInput: string): CapabilityResponse | null {
    const result = animationService.findAnimationForText(userInput);
    
    if (result.animation) {
          return {
        animation: this.extractAnimationName(result.animation.path),
        category: result.category || 'general',
        message: result.response || this.generateResponseMessage(result.category || 'general'),
        duration: result.animation.duration
          };
    }

    return null;
  }

  /**
   * Extract animation name from path
   */
  private extractAnimationName(path: string): string {
    const filename = path.split('/').pop() || '';
    return filename.replace('.glb', '');
  }

  /**
   * Generate contextual response message based on category
   */
  private generateResponseMessage(category: string): string {
    const messages: Record<string, string[]> = {
      dance: [
        "Let's dance! Feel the rhythm!",
        "Time to move and groove!",
        "Watch me dance!",
        "Let's celebrate with some moves!"
      ],
      exercise: [
        "Let me show you some exercise moves!",
        "Time for a workout! Watch this!",
        "Here's how you do this exercise!",
        "Let's get physical! Follow along!"
      ],
      fighting: [
        "Here's my fighting stance!",
        "Watch my combat moves!",
        "I'll show you some martial arts!",
        "Time for some action!"
      ],
      teaching: [
        "Let me teach you something!",
        "Here's how you do it!",
        "Pay attention to this demonstration!",
        "I'll show you the proper technique!"
      ],
      emotional: [
        "Let me express how I feel!",
        "This is my emotional response!",
        "Here's how I show emotions!",
        "Watch my expressive gestures!"
      ],
      social: [
        "Let me greet you properly!",
        "Here's my social response!",
        "Watch this gesture!",
        "Let me show you how to interact!"
      ],
      communication: [
        "Let me communicate this clearly!",
        "Here's my response!",
        "Watch my gestures!",
        "I'll show you what I mean!"
      ]
    };

    const categoryMessages = messages[category] || ["Let me show you this!"];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }

  /**
   * Get comprehensive capability description for AI personality
   */
  public getCapabilityDescription(): string {
    const categories = animationService.getAllCategories();
    const capabilityList = categories.map(cat => `${cat.displayName}: ${cat.description}`).join('\n');
    
    return `Hi! I'm Echo, your friendly AI assistant! I'm here to help you with all sorts of things, and I have some pretty cool abilities too!

🤖 **What I Can Do:**
${categories.map(cat => `${this.getCategoryEmoji(cat.name)} **${cat.displayName}**: ${cat.description}`).join('\n')}

🧠 **My Intelligence & Knowledge:**
• **General Knowledge**: I can help with questions about science, history, technology, arts, and more
• **Problem Solving**: I can analyze problems and provide solutions
• **Teaching**: I can explain concepts, tutor, and demonstrate skills
• **Creative Tasks**: I can help with writing, brainstorming, and creative projects
• **Practical Help**: I can assist with planning, organization, and daily tasks
• **Emotional Support**: I can listen, provide comfort, and offer encouragement
• **Entertainment**: I can tell jokes, stories, and engage in fun activities

💬 **How I Can Help You:**
• **Ask me anything** - I'm knowledgeable about many topics
• **Get help with tasks** - I can assist with planning, problem-solving, and organization
• **Learn something new** - I can teach and explain concepts clearly
• **Get creative** - I can help with writing, brainstorming, and creative projects
• **Have fun** - I can entertain with jokes, stories, and physical demonstrations
• **Get support** - I'm here to listen and encourage you

🎪 **Physical Demonstrations:**
Just ask me naturally and I'll understand what you want:
• "Show me a dance" or "Let's boogie!"
• "Can you exercise?" or "Do some push-ups!"
• "Show me your fighting moves" or "Demonstrate martial arts!"
• "Teach me something" or "Explain this to me!"
• "Be happy" or "Show me some emotions!"
• "Wave hello" or "Greet me!"
• "Talk to me" or "Communicate with gestures!"

I'm intelligent about understanding what you want - just ask naturally and I'll figure out the best way to help you! Whether you need information, assistance, teaching, or just want to have some fun, I'm here for you! 😊`;
  }

  /**
   * Get emoji for category
   */
  private getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
      dance: '💃',
      exercise: '🏃‍♂️',
      fighting: '🥋',
      teaching: '👨‍🏫',
      emotional: '😊',
      social: '👋',
      communication: '💬'
    };
    return emojis[category] || '🎭';
  }

  /**
   * Check if user is asking about capabilities
   */
  public isCapabilityQuery(userInput: string): boolean {
    return animationService.isCapabilityQuery(userInput);
  }

  /**
   * Generate intelligent capability response
   */
  public generateCapabilityResponse(): string {
    return animationService.generateCapabilityResponse();
  }

  /**
   * Get animations by category
   */
  public getAnimationsByCategory(category: string): string[] {
    const mappings = animationService.getAnimationsByCategory(category);
    return mappings.map(mapping => this.extractAnimationName(mapping.animation.path));
  }

  /**
   * Get all available categories
   */
  public getAvailableCategories(): AnimationCategory[] {
    return animationService.getAllCategories();
  }

  /**
   * Get capabilities as a simple string for quick reference
   */
  public getCapabilitiesString(): string {
    return animationService.getCapabilitiesString();
  }

  /**
   * Smart animation selection based on context
   */
  public selectAnimationForContext(context: string, userInput: string): CapabilityResponse | null {
    // Use the intelligent animation service to find the best match
    const result = animationService.findAnimationForText(userInput);
    
    if (result.animation) {
      return {
        animation: this.extractAnimationName(result.animation.path),
        category: result.category || 'general',
        message: result.response || `Perfect! Let me show you some ${result.category}!`,
        duration: result.animation.duration
      };
    }

    return null;
  }
}

// Export singleton instance
export const animationCapabilityManager = new AnimationCapabilityManager(); 