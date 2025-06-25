import { LoadingOutlined, RobotOutlined } from '@ant-design/icons';
import { Progress, Spin, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;

interface LoadingScreenProps {
  onComplete?: () => void;
  progress?: number;
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onComplete, 
  progress = 0, 
  message = "Initializing Echo AI..." 
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);
  const [isComplete, setIsComplete] = useState(false);

  const loadingMessages = [
    "Initializing Echo AI...",
    "Loading 3D models...",
    "Connecting to AI services...",
    "Preparing voice synthesis...",
    "Setting up conversation engine...",
    "Almost ready...",
    "Echo is ready to chat!"
  ];

  useEffect(() => {
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length - 1) {
        setCurrentMessage(loadingMessages[messageIndex]);
        messageIndex++;
      }
    }, 1000);

    const progressInterval = setInterval(() => {
      setCurrentProgress(prev => {
        const targetProgress = progress || (messageIndex / loadingMessages.length) * 100;
        const newProgress = Math.min(prev + 2, targetProgress);
        
        if (newProgress >= 100 && !isComplete) {
          setIsComplete(true);
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }
        
        return newProgress;
      });
    }, 50);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [progress, onComplete, isComplete]);

  if (isComplete) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center z-50">
      <div className="text-center text-white max-w-md mx-auto p-8">
        {/* Echo Logo/Icon */}
        <div className="mb-8">
          <RobotOutlined className="text-6xl text-blue-400 mb-4" />
          <Title level={1} className="text-white mb-2">
            Echo AI
          </Title>
          <Text className="text-gray-300">
            Your Digital Companion
          </Text>
        </div>

        {/* Loading Animation */}
        <div className="mb-8">
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} spin />} 
            size="large"
          />
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress 
            percent={currentProgress} 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            showInfo={false}
            size="small"
          />
          <Text className="text-sm text-gray-400 mt-2 block">
            {Math.round(currentProgress)}% Complete
          </Text>
        </div>

        {/* Status Message */}
        <div className="mb-4">
          <Text className="text-lg text-white">
            {currentMessage}
          </Text>
        </div>

        {/* Loading Tips */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 Tip: Say hello or start a conversation to begin chatting</div>
          <div>💡 Tip: Use voice input for natural conversation</div>
          <div>💡 Tip: Enable camera for Echo to see your expressions</div>
          <div>💡 Tip: Press Ctrl+Shift+P to view performance metrics</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 