import React from 'react';
import {
  Plus,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  LayoutGrid,
  FileText,
  VolumeX,
  Volume2,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const Sidebar: React.FC = () => {
  const {
    conversations,
    currentConversationId,
    isDarkMode,
    createNewConversation,
    setCurrentConversation,
    setDarkMode,
  } = useStore();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 p-2">
      <div className="flex items-center justify-between p-2 mb-4">
        <h1 className="text-xl font-semibold">AI Companion</h1>
        <button
          onClick={() => setDarkMode(!isDarkMode)}
          className="p-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <button
        onClick={createNewConversation}
        className="flex items-center gap-2 p-3 mb-4 bg-indigo-600 hover:bg-indigo-700 
                  rounded-md transition-colors"
      >
        <Plus size={18} />
        <span>New chat</span>
      </button>

      <div className="flex-1 overflow-y-auto">
        <div className="mb-2 px-2 text-xs uppercase text-gray-400">
          Recent conversations
        </div>
        {conversations.map(conversation => (
          <button
            key={conversation.id}
            onClick={() => setCurrentConversation(conversation.id)}
            className={`flex items-center gap-2 p-2 w-full text-left rounded-md mb-1 
                        transition-colors truncate
                        ${
                          currentConversationId === conversation.id
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
          >
            <MessageSquare size={16} />
            <span className="truncate">{conversation.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-800">
        <button className="flex items-center gap-2 p-2 w-full text-left rounded-md mb-1 text-gray-300 hover:bg-gray-800 transition-colors">
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
