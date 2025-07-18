import { PlayCircleOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Row, Space, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;

interface AnimationInfo {
  name: string;
  category: string;
  duration: number;
  description: string;
  loaded: boolean;
}

const AnimationTestPanel: React.FC = () => {
  const [availableAnimations, setAvailableAnimations] = useState<AnimationInfo[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'failed' | 'testing'>>({});

  // All animations that should be available based on the animation loader
  const expectedAnimations: AnimationInfo[] = [
    // Base animations
    { name: 'happy-idle', category: 'idle', duration: 30000, description: 'Happy idle stance', loaded: false },
    { name: 'neutral-idle', category: 'idle', duration: 30000, description: 'Neutral standing pose', loaded: false },
    { name: 'sad-idle', category: 'idle', duration: 30000, description: 'Sad standing pose', loaded: false },
    
    // Greeting animations
    { name: 'waving-2', category: 'greeting', duration: 2500, description: 'Friendly greeting wave', loaded: false },
    { name: 'waving-3', category: 'greeting', duration: 2500, description: 'Goodbye wave', loaded: false },
    { name: 'waving-4', category: 'greeting', duration: 2500, description: 'Enthusiastic wave', loaded: false },
    { name: 'waving-gesture-3', category: 'greeting', duration: 2500, description: 'Casual waving gesture', loaded: false },
    { name: 'standing-greeting', category: 'greeting', duration: 3000, description: 'Formal standing greeting', loaded: false },
    { name: 'quick-formal-bow', category: 'greeting', duration: 1500, description: 'Respectful bow', loaded: false },
    { name: 'quick-informal-bow', category: 'greeting', duration: 1500, description: 'Casual bow', loaded: false },
    
    // Talking animations
    { name: 'talking', category: 'talking', duration: 2500, description: 'Basic talking gesture', loaded: false },
    { name: 'talking-2', category: 'talking', duration: 2500, description: 'Animated talking', loaded: false },
    { name: 'talking-3', category: 'talking', duration: 2500, description: 'Expressive talking', loaded: false },
    { name: 'talking-4', category: 'talking', duration: 2500, description: 'Detailed explanation', loaded: false },
    
    // Gesture animations
    { name: 'clapping', category: 'gesture', duration: 2500, description: 'Applause clapping', loaded: false },
    { name: 'reacting', category: 'gesture', duration: 1500, description: 'Surprised reaction', loaded: false },
    { name: 'weight-shift', category: 'gesture', duration: 3000, description: 'Weight shifting movement', loaded: false },
    { name: 'acknowledging', category: 'gesture', duration: 1500, description: 'Understanding nod', loaded: false },
    { name: 'happy-hand-gesture', category: 'gesture', duration: 2500, description: 'Happy hand gesture', loaded: false },
    { name: 'looking', category: 'gesture', duration: 2500, description: 'Looking around', loaded: false },
    { name: 'lengthy-head-nod', category: 'gesture', duration: 2500, description: 'Strong agreement', loaded: false },
    { name: 'hard-head-nod', category: 'gesture', duration: 1500, description: 'Emphatic nod', loaded: false },
    { name: 'head-nod-yes', category: 'gesture', duration: 1500, description: 'Yes nod', loaded: false },
    { name: 'shaking-head-no', category: 'gesture', duration: 1500, description: 'No shake', loaded: false },
    { name: 'no', category: 'gesture', duration: 2000, description: 'Strong no gesture', loaded: false },
    { name: 'look-away-gesture', category: 'gesture', duration: 2500, description: 'Look away', loaded: false },
    { name: 'sarcastic-head-nod', category: 'gesture', duration: 2500, description: 'Sarcastic nod', loaded: false },
    { name: 'annoyed-head-shake', category: 'gesture', duration: 2500, description: 'Annoyed shake', loaded: false },
    
    // Emotional animations
    { name: 'happy', category: 'emotional', duration: 3500, description: 'Happy celebration', loaded: false },
    { name: 'excited', category: 'emotional', duration: 4500, description: 'Excited movement', loaded: false },
    { name: 'relieved-sigh', category: 'emotional', duration: 2500, description: 'Relief sigh', loaded: false },
    { name: 'thoughtful-head-shake', category: 'emotional', duration: 2500, description: 'Thoughtful shake', loaded: false },
    { name: 'yawn', category: 'emotional', duration: 3000, description: 'Tired yawning', loaded: false },
    
    // Movement animations
    { name: 'happy-walk', category: 'movement', duration: 4000, description: 'Happy walking', loaded: false },
    
    // Sitting animations
    { name: 'sitting-idle', category: 'sitting', duration: 30000, description: 'Sitting idle position', loaded: false },
    { name: 'male-sitting-pose', category: 'sitting', duration: 30000, description: 'Male sitting pose', loaded: false },
    { name: 'male-sitting-pose-2', category: 'sitting', duration: 30000, description: 'Male sitting pose variation 2', loaded: false },
    
    // Dance animations
    { name: 'salsa-dancing', category: 'dance', duration: 8000, description: 'Salsa dance movement', loaded: false },
    { name: 'gangnam-style', category: 'dance', duration: 8000, description: 'Gangnam Style dance', loaded: false },
    { name: 'moonwalk', category: 'dance', duration: 4000, description: 'Moonwalk dance movement', loaded: false },
    { name: 'locking-hip-hop-dance', category: 'dance', duration: 10000, description: 'Hip hop locking dance', loaded: false },
    { name: 'jump', category: 'dance', duration: 2000, description: 'Jumping movement', loaded: false },
    
    // Exercise animations
    { name: 'warming-up', category: 'exercise', duration: 6000, description: 'Warm-up exercises', loaded: false },
    { name: 'push-up', category: 'exercise', duration: 4500, description: 'Push-up exercise', loaded: false },
    { name: 'plank', category: 'exercise', duration: 4000, description: 'Plank exercise', loaded: false },
    { name: 'end-plank', category: 'exercise', duration: 3000, description: 'End plank exercise', loaded: false },
    { name: 'air-squat', category: 'exercise', duration: 3000, description: 'Air squat exercise', loaded: false },
    { name: 'idle-to-push-up', category: 'exercise', duration: 3000, description: 'Transition to push-up', loaded: false },
    { name: 'idle-to-situp', category: 'exercise', duration: 3000, description: 'Transition to sit-up', loaded: false },
    
    // Fighting animations
    { name: 'fighting-idle', category: 'fighting', duration: 4000, description: 'Fighting stance', loaded: false },
    { name: 'fight-idle', category: 'fighting', duration: 3000, description: 'Combat ready stance', loaded: false },
    { name: 'fight-idle-1', category: 'fighting', duration: 3000, description: 'Combat stance variation 1', loaded: false },
    { name: 'fight-idle-2', category: 'fighting', duration: 3000, description: 'Combat stance variation 2', loaded: false },
    { name: 'fight-idle-3', category: 'fighting', duration: 3000, description: 'Combat stance variation 3', loaded: false },
    { name: 'angry-gesture', category: 'fighting', duration: 2500, description: 'Angry gesture', loaded: false },
    { name: 'being-cocky', category: 'fighting', duration: 3000, description: 'Confident stance', loaded: false },
    { name: 'dismissing-gesture', category: 'fighting', duration: 2500, description: 'Dismissive gesture', loaded: false },
    { name: 'defeat', category: 'fighting', duration: 4000, description: 'Defeated', loaded: false },
  ];

  useEffect(() => {
    checkAnimationAvailability();
  }, []);

  const checkAnimationAvailability = () => {
    console.log('🎭 TEST PANEL: Checking animation availability...');
    
    // Check if animation system is available
    const hasPlayFunction = typeof (window as any).playEchoAnimation === 'function';
    const hasGetAnimations = typeof (window as any).getEchoAnimationState === 'function';
    
    console.log('🎭 TEST PANEL: Animation system available:', hasPlayFunction);
    
    // For now, mark all as potentially available
    // In a real implementation, you'd query the actual loaded animations
    const updatedAnimations = expectedAnimations.map(anim => ({
      ...anim,
      loaded: hasPlayFunction // Assume loaded if play function exists
    }));
    
    setAvailableAnimations(updatedAnimations);
  };

  const testAnimation = (animationName: string) => {
    console.log(`🎭 TEST PANEL: Testing animation: ${animationName}`);
    
    setTestResults(prev => ({ ...prev, [animationName]: 'testing' }));
    setCurrentlyPlaying(animationName);
    
    try {
      if ((window as any).playEchoAnimation) {
        (window as any).playEchoAnimation(animationName, 0.8);
        
        // Mark as success after a short delay
        setTimeout(() => {
          setTestResults(prev => ({ ...prev, [animationName]: 'success' }));
          console.log(`✅ TEST PANEL: ${animationName} test completed`);
        }, 1000);
        
        // Clear current playing after animation duration
        const animation = expectedAnimations.find(a => a.name === animationName);
        const duration = animation?.duration || 3000;
        
        setTimeout(() => {
          setCurrentlyPlaying(null);
        }, duration);
        
      } else {
        console.error('❌ TEST PANEL: playEchoAnimation not available');
        setTestResults(prev => ({ ...prev, [animationName]: 'failed' }));
        setCurrentlyPlaying(null);
      }
    } catch (error) {
      console.error(`❌ TEST PANEL: Error testing ${animationName}:`, error);
      setTestResults(prev => ({ ...prev, [animationName]: 'failed' }));
      setCurrentlyPlaying(null);
    }
  };

  const stopAnimation = () => {
    console.log('🎭 TEST PANEL: Stopping animation, returning to idle');
    
    if ((window as any).playEchoAnimation) {
      (window as any).playEchoAnimation('happy-idle', 1.0);
    }
    
    setCurrentlyPlaying(null);
  };

  const testAllAnimations = async () => {
    console.log('🎭 TEST PANEL: Testing all animations sequentially...');
    
    for (const animation of availableAnimations) {
      if (animation.loaded) {
        testAnimation(animation.name);
        // Wait for animation to complete before testing next
        await new Promise(resolve => setTimeout(resolve, animation.duration + 1000));
      }
    }
    
    console.log('🎭 TEST PANEL: All animations tested');
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      idle: 'default',
      greeting: 'blue',
      talking: 'green',
      gesture: 'orange',
      emotional: 'red',
      movement: 'purple',
      sitting: 'geekblue',
      dance: 'magenta',
      exercise: 'cyan',
      fighting: 'volcano'
    };
    return colors[category] || 'default';
  };

  const getTestResultColor = (result: 'success' | 'failed' | 'testing' | undefined): string => {
    switch (result) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'testing': return 'processing';
      default: return 'default';
    }
  };

  const groupedAnimations = availableAnimations.reduce((groups, animation) => {
    const category = animation.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(animation);
    return groups;
  }, {} as Record<string, AnimationInfo[]>);

  return (
    <Card 
      title="🎭 Animation Test Panel" 
      style={{ margin: '20px', maxHeight: '80vh', overflow: 'auto' }}
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={checkAnimationAvailability}
            size="small"
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            onClick={testAllAnimations}
            disabled={currentlyPlaying !== null}
            size="small"
          >
            Test All
          </Button>
          <Button 
            icon={<StopOutlined />} 
            onClick={stopAnimation}
            disabled={currentlyPlaying === null}
            danger
            size="small"
          >
            Stop
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <Text strong>Animation System Status: </Text>
        <Tag color={typeof (window as any).playEchoAnimation === 'function' ? 'success' : 'error'}>
          {typeof (window as any).playEchoAnimation === 'function' ? 'Available' : 'Not Available'}
        </Tag>
        {currentlyPlaying && (
          <>
            <Text strong style={{ marginLeft: '16px' }}>Currently Playing: </Text>
            <Tag color="processing">{currentlyPlaying}</Tag>
          </>
        )}
      </div>

      {Object.entries(groupedAnimations).map(([category, animations]) => (
        <div key={category} style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ marginBottom: '12px', textTransform: 'capitalize' }}>
            {category} Animations ({animations.length})
          </Title>
          
          <Row gutter={[8, 8]}>
            {animations.map((animation) => (
              <Col xs={24} sm={12} md={8} lg={6} key={animation.name}>
                <Card 
                  size="small"
                  style={{ 
                    height: '120px',
                    opacity: animation.loaded ? 1 : 0.6,
                    border: currentlyPlaying === animation.name ? '2px solid #1890ff' : undefined
                  }}
                  bodyStyle={{ padding: '8px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: '12px' }}>{animation.name}</Text>
                      <br />
                      <Tag 
                        size="small" 
                        color={getCategoryColor(animation.category)}
                        style={{ fontSize: '10px', margin: '2px 0' }}
                      >
                        {animation.category}
                      </Tag>
                      <br />
                      <Text style={{ fontSize: '10px', color: '#666' }}>
                        {animation.description}
                      </Text>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <Button
                        size="small"
                        icon={<PlayCircleOutlined />}
                        onClick={() => testAnimation(animation.name)}
                        disabled={!animation.loaded || currentlyPlaying !== null}
                        style={{ fontSize: '10px', height: '24px' }}
                      >
                        Test
                      </Button>
                      
                      {testResults[animation.name] && (
                        <Tag 
                          size="small" 
                          color={getTestResultColor(testResults[animation.name])}
                          style={{ fontSize: '9px', margin: 0 }}
                        >
                          {testResults[animation.name]}
                        </Tag>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          
          <Divider style={{ margin: '16px 0' }} />
        </div>
      ))}
      
      <div style={{ marginTop: '20px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
        <Title level={5}>Test Results Summary</Title>
        <Space wrap>
          <Text>Total: {availableAnimations.length}</Text>
          <Text>Loaded: {availableAnimations.filter(a => a.loaded).length}</Text>
          <Text type="success">Passed: {Object.values(testResults).filter(r => r === 'success').length}</Text>
          <Text type="danger">Failed: {Object.values(testResults).filter(r => r === 'failed').length}</Text>
          <Text type="warning">Testing: {Object.values(testResults).filter(r => r === 'testing').length}</Text>
        </Space>
      </div>
    </Card>
  );
};

export default AnimationTestPanel; 