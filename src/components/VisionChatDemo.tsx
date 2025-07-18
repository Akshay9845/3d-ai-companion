import { Camera, Eye, MessageSquare } from 'lucide-react';
import React, { useState } from 'react';

export const VisionChatDemo: React.FC = () => {
  const [demoQueries] = useState([
    {
      icon: '👤',
      query: "Can you see me?",
      description: "Basic face detection and presence"
    },
    {
      icon: '😊',
      query: "What's my expression?",
      description: "Emotion and facial expression analysis"
    },
    {
      icon: '👕',
      query: "What am I wearing?",
      description: "Clothing and accessory identification"
    },
    {
      icon: '🏠',
      query: "What's around me?",
      description: "Environment and object detection"
    },
    {
      icon: '📖',
      query: "What do you see?",
      description: "Complete scene description"
    },
    {
      icon: '🎭',
      query: "How do I look?",
      description: "Appearance analysis and feedback"
    }
  ]);

  const handleQueryClick = (query: string) => {
    // Simulate sending the query to the chat
    const chatInput = document.querySelector('.chat-input') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.value = query;
      chatInput.focus();
      
      // Trigger input event to update the component state
      const event = new Event('input', { bubbles: true });
      chatInput.dispatchEvent(event);
    }
  };

  return (
    <div className="vision-chat-demo">
      <div className="demo-header">
        <div className="demo-title">
          <Eye className="title-icon" />
          <h3>AI Vision Chat</h3>
          <span className="beta-tag">BETA</span>
        </div>
        <p className="demo-description">
          Ask me about what I can see through the camera! I can analyze faces, emotions, 
          clothing, objects, and describe your environment like a human assistant.
        </p>
      </div>

      <div className="demo-requirements">
        <div className="requirement-item">
          <Camera size={16} />
          <span>Camera must be active</span>
        </div>
        <div className="requirement-item">
          <MessageSquare size={16} />
          <span>Ask vision-related questions</span>
        </div>
      </div>

      <div className="demo-queries">
        <h4>Try these example questions:</h4>
        <div className="query-grid">
          {demoQueries.map((item, index) => (
            <button
              key={index}
              className="query-button"
              onClick={() => handleQueryClick(item.query)}
              title={item.description}
            >
              <span className="query-icon">{item.icon}</span>
              <span className="query-text">{item.query}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="demo-features">
        <h4>Vision Features:</h4>
        <ul>
          <li>🎯 <strong>Face Detection:</strong> Identifies faces and counts people</li>
          <li>😊 <strong>Emotion Analysis:</strong> Reads facial expressions (happy, sad, surprised, etc.)</li>
          <li>👕 <strong>Object Recognition:</strong> Identifies clothing, furniture, and objects</li>
          <li>📝 <strong>Text Reading:</strong> Can read visible text in the scene</li>
          <li>🏠 <strong>Scene Description:</strong> Describes the overall environment</li>
          <li>🧠 <strong>Contextual Responses:</strong> Responds naturally based on what it sees</li>
        </ul>
      </div>

      <style jsx>{`
        .vision-chat-demo {
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
          max-width: 400px;
        }

        .demo-header {
          margin-bottom: 16px;
        }

        .demo-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .title-icon {
          color: #10b981;
        }

        .demo-title h3 {
          color: #f1f5f9;
          margin: 0;
          font-size: 16px;
        }

        .beta-tag {
          background: #dc2626;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
        }

        .demo-description {
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.4;
          margin: 0;
        }

        .demo-requirements {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          padding: 8px 0;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 12px;
        }

        .demo-queries {
          margin-bottom: 16px;
        }

        .demo-queries h4 {
          color: #f1f5f9;
          font-size: 14px;
          margin: 0 0 8px 0;
        }

        .query-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .query-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 6px;
          color: #10b981;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .query-button:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
          transform: translateY(-1px);
        }

        .query-icon {
          font-size: 14px;
        }

        .query-text {
          font-weight: 500;
        }

        .demo-features {
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          padding-top: 16px;
        }

        .demo-features h4 {
          color: #f1f5f9;
          font-size: 14px;
          margin: 0 0 8px 0;
        }

        .demo-features ul {
          margin: 0;
          padding-left: 16px;
          color: #cbd5e1;
          font-size: 12px;
          line-height: 1.4;
        }

        .demo-features li {
          margin: 4px 0;
        }

        .demo-features strong {
          color: #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export default VisionChatDemo; 