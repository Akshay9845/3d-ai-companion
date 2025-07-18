/**
 * Animation Demo Component
 * Demonstrates the intelligent animation categorization and capability system
 */

import { Button, Card, Divider, Input, Space, Tag, Typography } from 'antd';
import React, { useState } from 'react';
import { animationService } from '../lib/animationService';
import { enhancedChatIntegrationService } from '../lib/enhancedChatIntegrationService';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface TestResult {
  input: string;
  response: string;
  animation?: string;
  category?: string;
  timestamp: number;
}

export const AnimationDemo: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Predefined test examples showcasing the intelligent system
  const testExamples = [
    // Capability queries
    { text: "What can you do?", category: "Capability Query" },
    { text: "Show me what you're capable of", category: "Capability Query" },
    { text: "What are your skills?", category: "Capability Query" },
    
    // Dance requests (natural language)
    { text: "Show me a dance", category: "Dance" },
    { text: "Let's boogie!", category: "Dance" },
    { text: "Do a moonwalk", category: "Dance" },
    { text: "Can you move to the music?", category: "Dance" },
    
    // Exercise requests
    { text: "Let's exercise", category: "Exercise" },
    { text: "Do some push-ups", category: "Exercise" },
    { text: "Time for a workout!", category: "Exercise" },
    { text: "Show me how to warm up", category: "Exercise" },
    
    // Fighting/Combat
    { text: "Show me your fighting moves", category: "Fighting" },
    { text: "Demonstrate martial arts", category: "Fighting" },
    { text: "Can you fight?", category: "Fighting" },
    { text: "Show me some combat", category: "Fighting" },
    
    // Teaching
    { text: "Teach me something", category: "Teaching" },
    { text: "Can you explain this?", category: "Teaching" },
    { text: "Show me how to do it", category: "Teaching" },
    { text: "Demonstrate the technique", category: "Teaching" },
    
    // Emotional expressions
    { text: "Be happy!", category: "Emotional" },
    { text: "Show me excitement", category: "Emotional" },
    { text: "Express joy", category: "Emotional" },
    { text: "I'm tired", category: "Emotional" },
    
    // Social interactions
    { text: "Wave hello", category: "Social" },
    { text: "Greet me properly", category: "Social" },
    { text: "Say goodbye", category: "Social" },
    { text: "Give me applause", category: "Social" },
    
    // Communication
    { text: "Talk to me", category: "Communication" },
    { text: "Communicate with gestures", category: "Communication" },
    { text: "Say yes", category: "Communication" },
    { text: "Shake your head no", category: "Communication" }
  ];

  const testInput = async () => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    try {
      // Test the enhanced chat integration service
      const result = await enhancedChatIntegrationService.processUserInput(userInput.trim());
      
      // Also test the raw animation service for comparison
      const rawResult = animationService.findAnimationForText(userInput.trim());
      
      const testResult: TestResult = {
        input: userInput.trim(),
        response: result.text,
        animation: result.animation?.animation,
        category: result.animation?.category || (rawResult.category ? rawResult.category : undefined),
        timestamp: Date.now()
      };

      setTestResults(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 results
      
      // Trigger animation if available
      if (result.animation && (window as any).playEchoAnimation) {
        console.log('🎭 DEMO: Triggering animation:', result.animation.animation);
        (window as any).playEchoAnimation(result.animation.animation, 2.0);
      }

    } catch (error) {
      console.error('Demo test error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const runExample = async (example: { text: string; category: string }) => {
    setUserInput(example.text);
    
    // Auto-run the test
    setTimeout(async () => {
      setIsProcessing(true);
      try {
        const result = await enhancedChatIntegrationService.processUserInput(example.text);
        
        const testResult: TestResult = {
          input: example.text,
          response: result.text,
          animation: result.animation?.animation,
          category: result.animation?.category,
          timestamp: Date.now()
        };

        setTestResults(prev => [testResult, ...prev.slice(0, 9)]);
        
        if (result.animation && (window as any).playEchoAnimation) {
          console.log('🎭 DEMO: Triggering animation:', result.animation.animation);
          (window as any).playEchoAnimation(result.animation.animation, 2.0);
        }

      } catch (error) {
        console.error('Demo example error:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

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

  // Test action word detection
  const testActionWords = () => {
    const testInputs = [
      "I love to dance!",
      "Let's exercise together",
      "Show me your fighting moves",
      "Hello there!",
      "Can you teach me something?",
      "I'm feeling happy today"
    ];
    
    testInputs.forEach((input, index) => {
      setTimeout(() => {
        console.log(`🧪 Testing action words: "${input}"`);
        const hasActionWords = animationService.hasActionWords(input);
        const actionCategory = animationService.getActionCategory(input);
        console.log(`🧪 Result: hasActionWords=${hasActionWords}, category=${actionCategory}`);
        
        if (hasActionWords && actionCategory) {
          const categoryAnimations = animationService.getAnimationsByCategory(actionCategory);
          console.log(`🧪 Found ${categoryAnimations.length} animations for category: ${actionCategory}`);
        }
      }, index * 1000);
    });
  };

  // Test new real animations
  const testNewAnimations = () => {
    const newAnimationTests = [
      // Dance animations
      { text: "Show me salsa dancing!", category: "dance" },
      { text: "Do the Gangnam Style dance!", category: "dance" },
      { text: "Can you moonwalk?", category: "dance" },
      { text: "Jump for joy!", category: "dance" },
      
      // Exercise animations  
      { text: "Let's do some push-ups!", category: "exercise" },
      { text: "Show me a plank exercise", category: "exercise" },
      { text: "Do some air squats", category: "exercise" },
      { text: "Warm up with me", category: "exercise" },
      
      // Fighting animations
      { text: "Show me your fighting stance", category: "fighting" },
      { text: "Get into combat mode", category: "fighting" },
      { text: "Be confident and cocky", category: "fighting" },
      
      // New gestures
      { text: "Give me an enthusiastic wave", category: "gestures" },
      { text: "Do a formal greeting", category: "gestures" },
      { text: "Shift your weight around", category: "gestures" }
    ];
    
    newAnimationTests.forEach((test, index) => {
      setTimeout(() => {
        console.log(`🎭 Testing new animation: "${test.text}" (${test.category})`);
        const hasActionWords = animationService.hasActionWords(test.text);
        const actionCategory = animationService.getActionCategory(test.text);
        const animationResult = animationService.findAnimationForText(test.text);
        
        console.log(`🎭 Result:`, {
          hasActionWords,
          actionCategory,
          animationFound: !!animationResult.animation,
          animationPath: animationResult.animation?.path
        });
      }, index * 1500);
    });
  };

  // Test hello greeting specifically
  const testHelloGreeting = () => {
    const helloTests = [
      "hello",
      "hi there",
      "hey",
      "good morning",
      "greetings"
    ];
    
    helloTests.forEach((greeting, index) => {
      setTimeout(() => {
        console.log(`👋 Testing greeting: "${greeting}"`);
        
        // Test action word detection
        const hasActionWords = animationService.hasActionWords(greeting);
        const actionCategory = animationService.getActionCategory(greeting);
        
        // Test animation finding
        const animationResult = animationService.findAnimationForText(greeting);
        
        console.log(`👋 Result for "${greeting}":`, {
          hasActionWords,
          actionCategory,
          animationFound: !!animationResult.animation,
          animationPath: animationResult.animation?.path
        });
        
        if (animationResult.animation) {
          console.log(`✅ SUCCESS: "${greeting}" → ${animationResult.animation.path}`);
        } else {
          console.log(`❌ FAILED: "${greeting}" → No animation found`);
        }
      }, index * 1000);
    });
  };

  // Test LLM responses
  const testLLMResponses = () => {
    const testMessages = [
      "hello",
      "how are you?", 
      "can you dance?",
      "let's exercise",
      "show me fighting moves",
      "what can you do?"
    ];
    
    testMessages.forEach((message, index) => {
      setTimeout(async () => {
        console.log(`🤖 Testing LLM with: "${message}"`);
        try {
          const { enhancedChatIntegrationService } = await import('../lib/enhancedChatIntegrationService');
          const response = await enhancedChatIntegrationService.processUserInput(message);
          console.log(`🤖 LLM Response: "${response.text}"`);
          console.log(`🎭 Animation: ${response.animation?.animation || 'none'}`);
        } catch (error) {
          console.error(`🤖 LLM Error:`, error);
        }
      }, index * 2000);
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🎭 Intelligent Animation System Demo</Title>
      
      <Paragraph>
        This demo showcases Echo's intelligent animation system. The AI can understand natural language requests 
        and automatically categorize them to trigger appropriate animations. Try the examples below or type your own!
      </Paragraph>

      {/* Categories Overview */}
      <Card title="Available Animation Categories" style={{ marginBottom: '20px' }}>
        <Space wrap>
          {animationService.getAllCategories().map(category => (
            <Tag key={category.name} color={getCategoryColor(category.name)} style={{ marginBottom: '8px' }}>
              {category.displayName}: {category.description}
            </Tag>
          ))}
        </Space>
      </Card>

      {/* Test Input */}
      <Card title="Test the Intelligent System" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type anything like 'show me a dance', 'let's exercise', 'what can you do?', etc."
            rows={3}
          />
          <Button 
            type="primary" 
            onClick={testInput} 
            disabled={!userInput.trim() || isProcessing}
            loading={isProcessing}
          >
            Test Intelligence
          </Button>
        </Space>
      </Card>

      {/* Example Categories */}
      <Card title="Try These Examples" style={{ marginBottom: '20px' }}>
        {[
          { title: "Capability Queries", examples: testExamples.filter(e => e.category === "Capability Query") },
          { title: "Dance Requests", examples: testExamples.filter(e => e.category === "Dance") },
          { title: "Exercise Requests", examples: testExamples.filter(e => e.category === "Exercise") },
          { title: "Fighting/Combat", examples: testExamples.filter(e => e.category === "Fighting") },
          { title: "Teaching", examples: testExamples.filter(e => e.category === "Teaching") },
          { title: "Emotional", examples: testExamples.filter(e => e.category === "Emotional") },
          { title: "Social", examples: testExamples.filter(e => e.category === "Social") },
          { title: "Communication", examples: testExamples.filter(e => e.category === "Communication") }
        ].map(section => (
          <div key={section.title} style={{ marginBottom: '16px' }}>
            <Text strong>{section.title}:</Text>
            <div style={{ marginTop: '8px' }}>
              <Space wrap>
                {section.examples.map((example, index) => (
                  <Button
                    key={index}
                    size="small"
                    onClick={() => runExample(example)}
                    disabled={isProcessing}
                  >
                    "{example.text}"
                  </Button>
                ))}
              </Space>
            </div>
            {section !== testExamples.slice(-1)[0] && <Divider />}
          </div>
        ))}
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card title="Test Results" style={{ marginBottom: '20px' }}>
          {testResults.map((result, index) => (
            <Card 
              key={result.timestamp} 
              type="inner" 
              title={`Test ${testResults.length - index}`}
              extra={new Date(result.timestamp).toLocaleTimeString()}
              style={{ marginBottom: '12px' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Input:</Text> "{result.input}"
                </div>
                <div>
                  <Text strong>AI Response:</Text> {result.response}
                </div>
                <div>
                  <Text strong>Animation:</Text> {result.animation || 'None'}
                  {result.category && (
                    <Tag color={getCategoryColor(result.category)} style={{ marginLeft: '8px' }}>
                      {result.category}
                    </Tag>
                  )}
                </div>
              </Space>
            </Card>
          ))}
        </Card>
      )}

      {/* Instructions */}
      <Card title="How It Works">
        <Paragraph>
          <Text strong>🧠 Intelligent Processing:</Text> The system analyzes your natural language input 
          and intelligently categorizes it into one of the available animation types.
        </Paragraph>
        <Paragraph>
          <Text strong>🎭 Smart Animation Selection:</Text> Based on the category, it automatically 
          selects the most appropriate animation from the available repertoire.
        </Paragraph>
        <Paragraph>
          <Text strong>💬 Contextual Responses:</Text> The AI generates enthusiastic responses 
          that match the requested activity and mentions the physical demonstration.
        </Paragraph>
        <Paragraph>
          <Text strong>🎯 Natural Understanding:</Text> You can use natural language - 
          "moonwalk" is understood as dance, "workout" as exercise, "martial arts" as fighting, etc.
        </Paragraph>
      </Card>

      <button onClick={testAnimationService} className="test-btn">
        Test Animation Service
      </button>
      <button onClick={testActionWords} className="test-btn">
        Test Action Word Detection
      </button>
      <button onClick={testNewAnimations} className="test-btn">
        Test New Animations
      </button>
      <button onClick={testHelloGreeting} className="test-btn">
        Test Hello Greeting Fix
      </button>
      <button onClick={testLLMResponses} className="test-btn">
        Test LLM Responses
      </button>
    </div>
  );
};

export default AnimationDemo; 