import React, { useState } from 'react';
import { AvatarAction, neuralAgentOrchestrator } from '../modules/controllers/NeuralAgentOrchestrator';
// Import your animation controller and TTS service as needed
// import { masterAnimationController } from '../modules/controllers/MasterAnimationController';
// import { ttsService } from '../lib/yourTTSService';

const SYSTEM_PROMPT = `You are a friendly, expressive human woman. When the user greets you or says something, respond naturally as a human would. In addition to your spoken response, always output a list of actions you would perform in square brackets, e.g. [wave] [smile] [blink]. Example: "Hi there! [wave] [smile] [blink]". Use only these actions: [wave], [smile], [blink], [nod], [shake_head], [shrug], [look_left], [look_right], [look_up], [look_down].`;

function parseActions(text: string): { response: string, actions: string[] } {
  const actionRegex = /\[(.*?)\]/g;
  const actions = Array.from(text.matchAll(actionRegex)).map(match => match[1]);
  const response = text.replace(actionRegex, '').trim();
  return { response, actions };
}

const TEST_ACTIONS: { label: string, action: AvatarAction }[] = [
  { label: 'Wave', action: 'wave' },
  { label: 'Smile', action: 'smile' },
  { label: 'Blink', action: 'blink' },
  { label: 'Nod', action: 'nod' },
  { label: 'Shake Head', action: 'shakeHead' },
  { label: 'Raise Hand', action: 'raiseHand' },
  { label: 'Point', action: 'point' },
  { label: 'Frown', action: 'frown' },
  { label: 'Surprised', action: 'surprised' },
];

const ModelDemoPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [parsedActions, setParsedActions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionStatus, setActionStatus] = useState('');

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    setActionStatus('Processing...');
    
    try {
      // Mock LLM response for demo
      const mockResponse = `Hi there! 👋 Nice to meet you! [wave] [smile] [blink]`;
      setLlmResponse(mockResponse);
      
      // Parse actions from response
      const actions = mockResponse.match(/\[(.*?)\]/g)?.map(a => a.slice(1, -1)) || [];
      setParsedActions(actions);
      
      // Trigger actions through orchestrator
      for (const action of actions) {
        setActionStatus(`Performing: ${action}`);
        await neuralAgentOrchestrator.performAction(action as AvatarAction);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between actions
      }
      
      setActionStatus('Actions completed!');
    } catch (error) {
      console.error('Error processing message:', error);
      setActionStatus('Error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestAction = async (action: AvatarAction) => {
    setActionStatus(`Testing: ${action}`);
    try {
      await neuralAgentOrchestrator.performAction(action);
      setActionStatus(`${action} completed!`);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      setActionStatus(`Error with ${action}`);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        🎭 3D Avatar Demo
      </h1>
      
      {/* Status Display */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '10px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '5px' }}>Status:</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{actionStatus || 'Ready'}</div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '20px' }}>
        {/* 3D Avatar Viewer */}
        <div style={{ flex: 2, background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>3D Avatar Viewer</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>Avatar model will be displayed here</div>
          </div>
        </div>

        {/* Control Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Text Input */}
          <div>
            <h3>💬 Send Message</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type 'hi' or any message..."
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px'
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={isProcessing}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isProcessing ? '#666' : '#4CAF50',
                  color: 'white',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {isProcessing ? '⏳' : 'Send'}
              </button>
            </div>
          </div>

          {/* Test Action Buttons */}
          <div>
            <h3>🎮 Test Actions</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TEST_ACTIONS.map(({ label, action }) => (
                <button
                  key={action}
                  onClick={() => handleTestAction(action)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s',
                    ':hover': {
                      background: 'rgba(255,255,255,0.3)',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Response Display */}
          <div style={{ flex: 1 }}>
            <h3>🤖 LLM Response</h3>
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: '15px',
              borderRadius: '8px',
              minHeight: '100px',
              fontSize: '14px'
            }}>
              {llmResponse || 'No response yet...'}
            </div>
          </div>

          {/* Parsed Actions */}
          <div>
            <h3>🎯 Parsed Actions</h3>
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: '15px',
              borderRadius: '8px',
              minHeight: '60px',
              fontSize: '14px'
            }}>
              {parsedActions.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {parsedActions.map((action, index) => (
                    <span
                      key={index}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              ) : (
                'No actions detected...'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelDemoPage; 