import React, { useState } from 'react';
import { animationService } from '../lib/animationService';
import { assistantKnowledgeBase } from '../lib/assistantKnowledgeBase';

const EchoAssistantDemo: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [demoResponse, setDemoResponse] = useState<string>('');

  const capabilities = assistantKnowledgeBase.getAllCapabilities();
  const categories = [...new Set(capabilities.map(cap => cap.category))];
  const animationCategories = animationService.getAllCategories();

  const handleCapabilityClick = (capability: any) => {
    setDemoResponse(capability.responseTemplate);
  };

  const handleAnimationCategoryClick = (category: any) => {
    const examples = category.examples.join(', ');
    setDemoResponse(`I'd love to show you some ${category.displayName.toLowerCase()}! Try saying: "${examples}"`);
  };

  const handleAssistantDescription = () => {
    setDemoResponse(assistantKnowledgeBase.getAssistantDescription());
  };

  return (
    <div className="echo-assistant-demo p-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-6 text-center">
          🤖 Echo Assistant Demo
        </h1>
        
        <div className="text-center mb-8">
          <p className="text-xl mb-4">
            Experience Echo's enhanced human-like assistant capabilities
          </p>
          <button
            onClick={handleAssistantDescription}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            🎯 See What Echo Can Do
          </button>
        </div>

        {demoResponse && (
          <div className="bg-white/10 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-3">Echo's Response:</h3>
            <div className="bg-white/5 rounded p-4 text-lg">
              {demoResponse}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Assistant Capabilities */}
          <div className="bg-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">🧠 Assistant Capabilities</h2>
            <div className="space-y-4">
              {categories.map(category => (
                <div key={category} className="bg-white/5 rounded p-4">
                  <h3 className="text-lg font-semibold mb-2">{category}</h3>
                  <div className="space-y-2">
                    {capabilities
                      .filter(cap => cap.category === category)
                      .map(capability => (
                        <button
                          key={capability.name}
                          onClick={() => handleCapabilityClick(capability)}
                          className="block w-full text-left p-3 bg-white/10 rounded hover:bg-white/20 transition-colors"
                        >
                          <div className="font-medium">{capability.name}</div>
                          <div className="text-sm opacity-80">{capability.description}</div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Demonstrations */}
          <div className="bg-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">🎭 Physical Demonstrations</h2>
            <div className="space-y-4">
              {animationCategories.map(category => (
                <button
                  key={category.name}
                  onClick={() => handleAnimationCategoryClick(category)}
                  className="block w-full text-left p-4 bg-white/10 rounded hover:bg-white/20 transition-colors"
                >
                  <div className="font-semibold text-lg mb-2">
                    {getCategoryEmoji(category.name)} {category.displayName}
                  </div>
                  <div className="text-sm opacity-80 mb-2">{category.description}</div>
                  <div className="text-xs opacity-60">
                    Examples: {category.examples.slice(0, 3).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sample Conversations */}
        <div className="mt-8 bg-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">💬 Sample Conversations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded p-4">
              <h3 className="font-semibold mb-2">User: "What can you do?"</h3>
              <p className="text-sm opacity-80">
                Echo: "Hi! I'm Echo, your friendly AI assistant! I can help you with so many things! I can teach, entertain, solve problems, and even demonstrate physical activities like dance, exercise, fighting, teaching, emotional expression, social interaction, and communication! What would you like help with?"
              </p>
            </div>
            <div className="bg-white/5 rounded p-4">
              <h3 className="font-semibold mb-2">User: "Can you help me solve a problem?"</h3>
              <p className="text-sm opacity-80">
                Echo: "I'd be happy to help you solve this! Let me break it down and think through the best approach. Can you tell me more about the specific problem?"
              </p>
            </div>
            <div className="bg-white/5 rounded p-4">
              <h3 className="font-semibold mb-2">User: "Show me a dance"</h3>
              <p className="text-sm opacity-80">
                Echo: "Absolutely! I love dancing! Watch this!" [performs dance animation]
              </p>
            </div>
            <div className="bg-white/5 rounded p-4">
              <h3 className="font-semibold mb-2">User: "I'm feeling sad"</h3>
              <p className="text-sm opacity-80">
                Echo: "I'm here for you. It sounds like you're going through something difficult. Would you like to talk about what's bothering you?"
              </p>
            </div>
          </div>
        </div>

        {/* Personality Traits */}
        <div className="mt-8 bg-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">🌟 Echo's Personality</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Friendly', 'Helpful', 'Knowledgeable', 'Enthusiastic',
              'Patient', 'Encouraging', 'Adaptable', 'Proactive'
            ].map(trait => (
              <div key={trait} className="bg-white/5 rounded p-3 text-center">
                <div className="font-semibold">{trait}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function getCategoryEmoji(categoryName: string): string {
  const emojiMap: Record<string, string> = {
    'dance': '💃',
    'exercise': '💪',
    'fighting': '🥋',
    'social': '👋',
    'teaching': '📚',
    'emotional': '😊',
    'communication': '💬'
  };
  return emojiMap[categoryName] || '🎭';
}

export default EchoAssistantDemo; 