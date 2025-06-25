import React, { useState } from 'react';
import { EnhancedVoiceAgent } from './EnhancedVoiceAgent';
import { VoiceAgent } from './VoiceAgent';

export const VoiceAgentDemo: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<'basic' | 'enhanced'>('enhanced');
  const [chatState, setChatState] = useState<string>('idle');
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');

  const handleMessageAdd = (message: { role: 'user' | 'assistant'; content: string }) => {
    console.log('New message:', message);
  };

  const handleStateChange = (state: string) => {
    console.log('State changed:', state);
    setChatState(state);
  };

  const handleEmotionChange = (emotion: string) => {
    console.log('Emotion changed:', emotion);
    setCurrentEmotion(emotion);
  };

  return (
    <div className="voice-agent-demo">
      <div className="demo-header">
        <h1>🎤 Advanced Voice AI Demo</h1>
        <p>Testing the next-generation conversational AI pipeline</p>
        
        <div className="agent-selector">
          <button
            className={`selector-btn ${selectedAgent === 'basic' ? 'active' : ''}`}
            onClick={() => setSelectedAgent('basic')}
          >
            Basic VoiceAgent
          </button>
          <button
            className={`selector-btn ${selectedAgent === 'enhanced' ? 'active' : ''}`}
            onClick={() => setSelectedAgent('enhanced')}
          >
            Enhanced VoiceAgent
          </button>
        </div>

        <div className="status-info">
          <div className="status-item">
            <span className="status-label">Current State:</span>
            <span className="status-value">{chatState}</span>
          </div>
          {selectedAgent === 'enhanced' && (
            <div className="status-item">
              <span className="status-label">Current Emotion:</span>
              <span className="status-value">{currentEmotion}</span>
            </div>
          )}
        </div>
      </div>

      <div className="demo-content">
        {selectedAgent === 'basic' ? (
          <VoiceAgent
            onMessageAdd={handleMessageAdd}
            onStateChange={handleStateChange}
            className="demo-agent"
          />
        ) : (
          <EnhancedVoiceAgent
            onMessageAdd={handleMessageAdd}
            onStateChange={handleStateChange}
            onEmotionChange={handleEmotionChange}
            className="demo-agent"
          />
        )}
      </div>

      <div className="demo-info">
        <div className="info-section">
          <h3>🚀 Features</h3>
          <ul>
            <li><strong>Streaming STT:</strong> Real-time speech-to-text with partial transcripts</li>
            <li><strong>Streaming TTS:</strong> Real-time text-to-speech with emotion support</li>
            <li><strong>VAD Interruption:</strong> Auto-stop TTS when user starts speaking</li>
            <li><strong>Wake Word:</strong> "Hey Echo" activation (Enhanced only)</li>
            <li><strong>Emotion Detection:</strong> Real-time emotion analysis (Enhanced only)</li>
            <li><strong>Error Handling:</strong> Robust error management and recovery</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>🔧 Backend Requirements</h3>
          <p>The demo uses placeholder WebSocket endpoints. For full functionality, you'll need:</p>
          <ul>
            <li><code>ws://localhost:8000/stt</code> - Streaming speech-to-text</li>
            <li><code>ws://localhost:8000/tts</code> - Streaming text-to-speech</li>
            <li><code>ws://localhost:8000/emotion</code> - Emotion detection (Enhanced only)</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>📝 Usage</h3>
          <ol>
            <li>Click "Start Listening" to begin voice interaction</li>
            <li>Speak naturally - the system will transcribe in real-time</li>
            <li>Wait for AI response and TTS playback</li>
            <li>Interrupt anytime by speaking or clicking "Interrupt"</li>
            <li>Use "Reset" to clear conversation and start fresh</li>
          </ol>
        </div>
      </div>

      <style jsx>{`
        .voice-agent-demo {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 30px;
          color: white;
        }

        .demo-header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .demo-header p {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 30px;
        }

        .agent-selector {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 30px;
        }

        .selector-btn {
          padding: 12px 24px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .selector-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .selector-btn.active {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .status-info {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 20px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .status-label {
          font-weight: 600;
          opacity: 0.8;
        }

        .status-value {
          font-weight: 700;
          color: #ffd700;
        }

        .demo-content {
          display: flex;
          justify-content: center;
          margin-bottom: 40px;
        }

        .demo-agent {
          height: 600px;
          width: 100%;
          max-width: 800px;
        }

        .demo-info {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
        }

        .info-section {
          background: rgba(255, 255, 255, 0.1);
          padding: 25px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
        }

        .info-section h3 {
          margin-bottom: 15px;
          font-size: 1.3rem;
          color: #ffd700;
        }

        .info-section ul, .info-section ol {
          margin-left: 20px;
        }

        .info-section li {
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .info-section code {
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .demo-header h1 {
            font-size: 2rem;
          }

          .agent-selector {
            flex-direction: column;
            align-items: center;
          }

          .status-info {
            flex-direction: column;
            align-items: center;
          }

          .demo-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}; 