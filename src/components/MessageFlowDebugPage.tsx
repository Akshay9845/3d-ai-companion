import React, { useState } from 'react';
import { enhancedChatIntegrationService } from '../lib/enhancedChatIntegrationService';
import { useStore, getMessages } from '../store/useStore';
import { MessageRole } from '../types';

/**
 * Debug Test Page for Echo Message Flow
 * This page helps debug why responses aren't appearing in the UI
 */
const MessageFlowDebugPage: React.FC = () => {
  const { addMessage, conversations, currentConversationId } = useStore();
  const [testMessage, setTestMessage] = useState('Hello Echo!');
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addToLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const getCurrentConversation = () => {
    return currentConversationId
      ? conversations.find(c => c.id === currentConversationId)
      : conversations[0];
  };

  const testMessageFlow = async () => {
    setIsProcessing(true);
    setDebugLog([]);
    
    try {
      addToLog('Starting message flow test...');
      
      // 1. Add user message
      addToLog('Adding user message...');
      await addMessage(testMessage, MessageRole.USER);
      
      // 2. Add thinking message
      addToLog('Adding thinking message...');
      await addMessage('Thinking...', MessageRole.ASSISTANT);
      
      // 3. Check current state
      const messagesBeforeResponse = getMessages();
      addToLog(`Messages before response: ${messagesBeforeResponse.length}`);
      messagesBeforeResponse.forEach((msg, index) => {
        addToLog(`  Message ${index}: ${msg.role} - ${msg.content.substring(0, 30)}...`);
      });
      
      // 4. Get enhanced response
      addToLog('Calling enhanced chat integration service...');
      const enhancedResponse = await enhancedChatIntegrationService.processMessage(testMessage, {});
      
      addToLog(`Enhanced response received: ${enhancedResponse.message.substring(0, 50)}...`);
      addToLog(`Enhancement level: ${enhancedResponse.enhancement}`);
      addToLog(`Confidence: ${enhancedResponse.confidence}`);
      
      // 5. Remove thinking message
      const store = useStore.getState();
      const currentMessages = getMessages();
      const thinkingMessages = currentMessages.filter(msg => 
        msg.content === 'Thinking...' && msg.role === MessageRole.ASSISTANT
      );
      
      addToLog(`Found ${thinkingMessages.length} thinking messages to remove`);
      
      if (thinkingMessages.length > 0 && store.removeMessageById) {
        thinkingMessages.forEach(msg => {
          addToLog(`Removing thinking message: ${msg.id}`);
          store.removeMessageById(msg.id);
        });
      }
      
      // 6. Add enhanced response
      addToLog('Adding enhanced response...');
      await addMessage(enhancedResponse.message, MessageRole.ASSISTANT);
      
      // 7. Check final state
      const finalMessages = getMessages();
      addToLog(`Final messages count: ${finalMessages.length}`);
      finalMessages.forEach((msg, index) => {
        addToLog(`  Final Message ${index}: ${msg.role} - ${msg.content.substring(0, 30)}...`);
      });
      
      addToLog('Message flow test completed successfully!');
      
    } catch (error) {
      addToLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Message flow test error:', error);
    }
    
    setIsProcessing(false);
  };

  const clearMessages = () => {
    // Note: This is for testing only, normally you wouldn't clear all conversations
    const store = useStore.getState();
    const conversation = getCurrentConversation();
    if (conversation && store.removeMessageById) {
      conversation.messages.forEach(msg => {
        store.removeMessageById(msg.id);
      });
    }
    setDebugLog([]);
  };

  const conversation = getCurrentConversation();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-300 mb-6">
          Echo Message Flow Debug Test
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-cyan-300 mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Message:
                </label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="Enter a test message..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={testMessageFlow}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-md font-medium transition-colors"
                >
                  {isProcessing ? 'Testing...' : 'Test Message Flow'}
                </button>
                
                <button
                  onClick={clearMessages}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-medium transition-colors"
                >
                  Clear Messages
                </button>
              </div>
            </div>
            
            {/* Current Messages Display */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-cyan-300 mb-3">
                Current Messages ({conversation?.messages?.length || 0})
              </h3>
              <div className="bg-gray-700 rounded-md p-3 max-h-60 overflow-y-auto">
                {conversation?.messages?.length ? (
                  conversation.messages.map((msg) => (
                    <div key={msg.id} className="mb-2 text-sm">
                      <span className={msg.role === MessageRole.USER ? 'text-blue-400' : 'text-green-400'}>
                        {msg.role}:
                      </span>
                      <span className="ml-2 text-gray-200">
                        {msg.content.substring(0, 80)}...
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">No messages</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Debug Log */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-cyan-300 mb-4">Debug Log</h2>
            <div className="bg-gray-700 rounded-md p-3 max-h-96 overflow-y-auto font-mono text-sm">
              {debugLog.length ? (
                debugLog.map((log, index) => (
                  <div key={index} className="mb-1 text-gray-200">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">Click "Test Message Flow" to start debugging...</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Service Status */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-cyan-300 mb-4">Service Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Conversations:</div>
              <div className="text-white">{conversations.length}</div>
            </div>
            <div>
              <div className="text-gray-400">Current Conversation:</div>
              <div className="text-white">{currentConversationId ? 'Set' : 'None'}</div>
            </div>
            <div>
              <div className="text-gray-400">Messages in Current:</div>
              <div className="text-white">{conversation?.messages?.length || 0}</div>
            </div>
            <div>
              <div className="text-gray-400">Processing:</div>
              <div className={isProcessing ? 'text-yellow-400' : 'text-green-400'}>
                {isProcessing ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageFlowDebugPage;
