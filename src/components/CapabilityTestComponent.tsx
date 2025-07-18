/**
 * Capability Test Component
 * Demonstrates the intelligent animation capability system
 */

import { Button, Card, Input, Space, Tag, Typography } from 'antd';
import React, { useState } from 'react';
import { animationService } from '../lib/animationService';
import { enhancedChatIntegrationService } from '../lib/enhancedChatIntegrationService';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export const CapabilityTestComponent: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Load categories on component mount
  React.useEffect(() => {
    const allCategories = animationService.getAllCategories();
    setCategories(allCategories.map(cat => `${cat.displayName}: ${cat.description}`));
  }, []);

  const testCapability = async () => {
    if (!userInput.trim()) return;

    try {
      // Test the intelligent animation system
      const chatResult = await enhancedChatIntegrationService.processUserInput(userInput);
      const animationResult = animationService.findAnimationForText(userInput);

      setResult({
        input: userInput,
        aiResponse: chatResult.text,
        hasAnimation: !!chatResult.animation,
        animationName: chatResult.animation?.animation,
        category: chatResult.animation?.category || animationResult.category,
        isCapabilityQuery: animationService.isCapabilityQuery(userInput),
        intelligentResponse: animationResult.response,
        timestamp: new Date().toLocaleTimeString()
      });

      // Trigger animation if found
      if (chatResult.animation && (window as any).playEchoAnimation) {
        console.log('🎭 CAPABILITY TEST: Triggering animation:', chatResult.animation.animation);
        (window as any).playEchoAnimation(chatResult.animation.animation, 2.0);
      }
    } catch (error) {
      console.error('Capability test error:', error);
      setResult({
        input: userInput,
        error: 'Failed to process request',
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  const testExamples = [
    // Capability queries
    "What can you do?",
    "Show me your abilities",
    "What are your skills?",
    
    // Natural language requests
    "Show me a dance",
    "Let's boogie!",
    "Do a moonwalk",
    "Let's exercise",
    "Do some push-ups",
    "Time for a workout",
    "Show me your fighting moves",
    "Demonstrate martial arts",
    "Can you fight?",
    "Teach me something",
    "Explain this to me",
    "Show me how",
    "Be happy",
    "Express excitement",
    "I'm tired",
    "Wave hello",
    "Say goodbye",
    "Give applause",
    "Talk to me",
    "Say yes",
    "Shake your head no"
  ];

  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      dance: 'magenta',
      exercise: 'green',
      fighting: 'red',
      teaching: 'blue',
      emotional: 'orange',
      social: 'cyan',
      communication: 'purple'
    };
    return colors[category?.toLowerCase() || ''] || 'default';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🎭 Intelligent Animation Capability Test</Title>
      
      <Card title="Available Capabilities" style={{ marginBottom: '20px' }}>
        {categories.map((capability, index) => (
          <Paragraph key={index}>
            <Text strong>{capability}</Text>
          </Paragraph>
        ))}
      </Card>

      <Card title="Test Input" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type natural language like 'show me a dance', 'let's exercise', 'what can you do?', etc."
            rows={3}
          />
          <Button type="primary" onClick={testCapability} disabled={!userInput.trim()}>
            Test Intelligent Capability Detection
          </Button>
        </Space>
      </Card>

      <Card title="Quick Test Examples" style={{ marginBottom: '20px' }}>
        <Space wrap>
          {testExamples.map((example, index) => (
            <Button
              key={index}
              size="small"
              onClick={() => {
                setUserInput(example);
                // Auto-test after setting input
                setTimeout(async () => {
                  try {
                    const chatResult = await enhancedChatIntegrationService.processUserInput(example);
                    const animationResult = animationService.findAnimationForText(example);
                    
                    setResult({
                      input: example,
                      aiResponse: chatResult.text,
                      hasAnimation: !!chatResult.animation,
                      animationName: chatResult.animation?.animation,
                      category: chatResult.animation?.category || animationResult.category,
                      isCapabilityQuery: animationService.isCapabilityQuery(example),
                      intelligentResponse: animationResult.response,
                      timestamp: new Date().toLocaleTimeString()
                    });
                    
                    if (chatResult.animation && (window as any).playEchoAnimation) {
                      console.log('🎭 CAPABILITY TEST: Triggering animation:', chatResult.animation.animation);
                      (window as any).playEchoAnimation(chatResult.animation.animation, 2.0);
                    }
                  } catch (error) {
                    console.error('Example test error:', error);
                  }
                }, 100);
              }}
            >
              {example}
            </Button>
          ))}
        </Space>
      </Card>

      {result && (
        <Card title={`Test Result (${result.timestamp})`} style={{ marginBottom: '20px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>
              <Text strong>Input:</Text> "{result.input}"
            </Paragraph>
            
            {result.error ? (
              <Paragraph>
                <Text type="danger" strong>Error:</Text> {result.error}
              </Paragraph>
            ) : (
              <>
                <Paragraph>
                  <Text strong>Is Capability Query:</Text> {result.isCapabilityQuery ? 'Yes' : 'No'}
                </Paragraph>
                
                <Paragraph>
                  <Text strong>AI Response:</Text> {result.aiResponse}
                </Paragraph>
                
                {result.intelligentResponse && (
                  <Paragraph>
                    <Text strong>Intelligent System Response:</Text> {result.intelligentResponse}
                  </Paragraph>
                )}
                
                <Paragraph>
                  <Text strong>Animation Detected:</Text> {result.hasAnimation ? 'Yes' : 'No'}
                </Paragraph>
                
                {result.hasAnimation && (
                  <>
                    <Paragraph>
                      <Text strong>Animation Name:</Text> {result.animationName}
                    </Paragraph>
                    <Paragraph>
                      <Text strong>Category:</Text> 
                      <Tag color={getCategoryColor(result.category)} style={{ marginLeft: '8px' }}>
                        {result.category}
                      </Tag>
                    </Paragraph>
                  </>
                )}
              </>
            )}
          </Space>
        </Card>
      )}

      <Card title="How the Intelligent System Works">
        <Paragraph>
          <Text strong>🧠 Natural Language Understanding:</Text> The system can understand natural language requests like "show me your moves", "let's boogie", "do some push-ups", etc.
        </Paragraph>
        <Paragraph>
          <Text strong>🎭 Smart Categorization:</Text> It automatically categorizes requests into appropriate animation types (dance, exercise, fighting, teaching, emotional, social, communication).
        </Paragraph>
        <Paragraph>
          <Text strong>💬 Contextual AI Responses:</Text> The AI generates enthusiastic, contextual responses that match the requested activity.
        </Paragraph>
        <Paragraph>
          <Text strong>🎯 Intelligent Animation Selection:</Text> Based on the category and context, it selects the most appropriate animation to demonstrate.
        </Paragraph>
        <Paragraph>
          <Text strong>🤖 Capability Awareness:</Text> When asked "What can you do?", it intelligently lists all available capabilities and offers demonstrations.
        </Paragraph>
      </Card>
    </div>
  );
};

export default CapabilityTestComponent; 