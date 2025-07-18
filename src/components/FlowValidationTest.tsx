import React, { useEffect, useState } from 'react';
import { animationService } from '../lib/animationService';
import { enhancedChatIntegrationService } from '../lib/enhancedChatIntegrationService';

interface FlowTest {
  id: string;
  input: string;
  expectedCategory: string;
  expectedAnimation: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: {
    response: string;
    animation?: string;
    category?: string;
    animationTriggered: boolean;
    timestamp: number;
  };
  error?: string;
}

const FlowValidationTest: React.FC = () => {
  const [tests, setTests] = useState<FlowTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    playEchoAnimation: false,
    animationService: false,
    enhancedChatService: false,
    unifiedAnimationLoader: false
  });

  const testCases: Omit<FlowTest, 'id' | 'status'>[] = [
    {
      input: 'hello',
      expectedCategory: 'social',
      expectedAnimation: 'waving-2'
    },
    {
      input: 'can you dance',
      expectedCategory: 'dance',
      expectedAnimation: 'excited'
    },
    {
      input: 'do some exercise',
      expectedCategory: 'exercise',
      expectedAnimation: 'warming-up'
    },
    {
      input: 'show me fighting',
      expectedCategory: 'fighting',
      expectedAnimation: 'angry-gesture'
    },
    {
      input: 'teach me something',
      expectedCategory: 'teaching',
      expectedAnimation: 'talking-3'
    },
    {
      input: 'wave goodbye',
      expectedCategory: 'social',
      expectedAnimation: 'waving-3'
    },
    {
      input: 'bow respectfully',
      expectedCategory: 'social',
      expectedAnimation: 'quick-formal-bow'
    },
    {
      input: 'clap for me',
      expectedCategory: 'social',
      expectedAnimation: 'clapping'
    }
  ];

  useEffect(() => {
    // Initialize tests
    const initialTests: FlowTest[] = testCases.map((testCase, index) => ({
      ...testCase,
      id: `test-${index}`,
      status: 'pending'
    }));
    setTests(initialTests);

    // Check system status
    checkSystemStatus();
  }, []);

  const checkSystemStatus = () => {
    const status = {
      playEchoAnimation: typeof (window as any).playEchoAnimation === 'function',
      animationService: !!animationService,
      enhancedChatService: !!enhancedChatIntegrationService,
      unifiedAnimationLoader: typeof (window as any).getEchoAnimationState === 'function'
    };
    setSystemStatus(status);
    console.log('🔍 System Status Check:', status);
  };

  const runSingleTest = async (testId: string): Promise<void> => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    // Update test status to running
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'running' as const } : t
    ));

    try {
      console.log(`🧪 Running test: ${test.input}`);
      
      // Step 1: Test animation service detection
      const animationResult = animationService.findAnimationForText(test.input);
      console.log('🎭 Animation service result:', animationResult);

      // Step 2: Test enhanced chat integration
      const chatResponse = await enhancedChatIntegrationService.processUserInput(test.input);
      console.log('💬 Chat response:', chatResponse);

      // Step 3: Test animation triggering
      let animationTriggered = false;
      if (chatResponse.animation && (window as any).playEchoAnimation) {
        try {
          (window as any).playEchoAnimation(chatResponse.animation.animation, 0.8);
          animationTriggered = true;
          console.log('✅ Animation triggered successfully');
        } catch (error) {
          console.error('❌ Animation trigger failed:', error);
        }
      }

      // Validate results
      const result = {
        response: chatResponse.text,
        animation: chatResponse.animation?.animation,
        category: chatResponse.animation?.category,
        animationTriggered,
        timestamp: Date.now()
      };

      const success = 
        result.category === test.expectedCategory &&
        result.animation === test.expectedAnimation &&
        result.animationTriggered;

      setTests(prev => prev.map(t => 
        t.id === testId ? { 
          ...t, 
          status: success ? 'success' : 'error',
          result,
          error: success ? undefined : `Expected: ${test.expectedAnimation}, Got: ${result.animation}`
        } : t
      ));

    } catch (error) {
      console.error(`❌ Test ${testId} failed:`, error);
      setTests(prev => prev.map(t => 
        t.id === testId ? { 
          ...t, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } : t
      ));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    console.log('🧪 Starting comprehensive flow validation...');

    for (const test of tests) {
      await runSingleTest(test.id);
      // Wait 2 seconds between tests to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setIsRunning(false);
    console.log('🧪 All tests completed');
    
    // Auto-export results after completion
    exportTestResults();
  };

  const exportTestResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      systemStatus,
      overallHealth: overallHealth.toFixed(1) + '%',
      summary: {
        total: tests.length,
        passed: successCount,
        failed: errorCount,
        pending: tests.length - successCount - errorCount
      },
      testResults: tests.map(test => ({
        id: test.id,
        input: test.input,
        expectedCategory: test.expectedCategory,
        expectedAnimation: test.expectedAnimation,
        status: test.status,
        result: test.result,
        error: test.error
      })),
      uncategorizedInputs: (window as any).animationService?.getUncategorizedInputs?.() || []
    };

    // Download as JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echo-flow-test-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📊 Test results exported:', exportData);
  };

  const clearUncategorizedLogs = () => {
    localStorage.removeItem('echo_uncategorized_inputs');
    console.log('🧹 Cleared uncategorized input logs');
  };

  const getStatusColor = (status: FlowTest['status']) => {
    switch (status) {
      case 'pending': return '#888';
      case 'running': return '#007bff';
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
    }
  };

  const getStatusIcon = (status: FlowTest['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const overallHealth = tests.length > 0 ? (successCount / tests.length) * 100 : 0;

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      <h1>🧪 Echo Flow Validation Test</h1>
      
      {/* System Status */}
      <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#2a2a2a', borderRadius: 8 }}>
        <h3>🔍 System Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div>playEchoAnimation: {systemStatus.playEchoAnimation ? '✅' : '❌'}</div>
          <div>animationService: {systemStatus.animationService ? '✅' : '❌'}</div>
          <div>enhancedChatService: {systemStatus.enhancedChatService ? '✅' : '❌'}</div>
          <div>unifiedAnimationLoader: {systemStatus.unifiedAnimationLoader ? '✅' : '❌'}</div>
        </div>
      </div>

      {/* Overall Health */}
      <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#2a2a2a', borderRadius: 8 }}>
        <h3>📊 Overall Health: {overallHealth.toFixed(1)}%</h3>
        <div>✅ Passed: {successCount} | ❌ Failed: {errorCount} | ⏳ Pending: {tests.length - successCount - errorCount}</div>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: 20 }}>
        <button 
          onClick={runAllTests} 
          disabled={isRunning}
          style={{ 
            padding: '10px 20px', 
            marginRight: 10, 
            backgroundColor: isRunning ? '#666' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
        </button>
        <button 
          onClick={checkSystemStatus}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          🔍 Check System Status
        </button>
      </div>

      {/* Test Results */}
      <div>
        <h3>🧪 Test Results</h3>
        {tests.map(test => (
          <div 
            key={test.id}
            style={{ 
              marginBottom: 15, 
              padding: 15, 
              backgroundColor: '#2a2a2a', 
              borderRadius: 8,
              borderLeft: `4px solid ${getStatusColor(test.status)}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <strong>{getStatusIcon(test.status)} {test.input}</strong>
                <div style={{ fontSize: '0.9em', color: '#ccc', marginTop: 5 }}>
                  Expected: {test.expectedCategory} → {test.expectedAnimation}
                </div>
              </div>
              <button 
                onClick={() => runSingleTest(test.id)}
                disabled={test.status === 'running'}
                style={{ 
                  padding: '5px 10px', 
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                {test.status === 'running' ? '🔄' : '▶️'}
              </button>
            </div>
            
            {test.result && (
              <div style={{ fontSize: '0.9em', color: '#ccc' }}>
                <div>Response: {test.result.response.substring(0, 100)}...</div>
                <div>Animation: {test.result.animation || 'none'}</div>
                <div>Category: {test.result.category || 'none'}</div>
                <div>Triggered: {test.result.animationTriggered ? '✅' : '❌'}</div>
              </div>
            )}
            
            {test.error && (
              <div style={{ fontSize: '0.9em', color: '#ff6b6b', marginTop: 10 }}>
                Error: {test.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlowValidationTest; 