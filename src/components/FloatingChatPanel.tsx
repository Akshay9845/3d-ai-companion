// src/components/FloatingChatPanel.tsx
import { motion } from 'framer-motion';
import ChatWindow from './Chat/ChatWindow';
import ModernChatInput from './Chat/ModernChatInputFixed';

interface FloatingChatPanelProps {
  onClose?: () => void;
}

export default function FloatingChatPanel({ onClose }: FloatingChatPanelProps) {
  return (
    <motion.div
      className="fixed bottom-12 left-1/2 z-20"
      style={{
        transform: 'translateX(-50%)',
        width: 420,
        borderRadius: '2rem',
        background: 'rgba(255,255,255,0.75)',
        boxShadow: '0 8px 32px 0 rgba(255,106,0,0.15), 0 1.5px 8px 0 rgba(0,0,0,0.08)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,0.25)',
        pointerEvents: 'auto',
      }}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-white/40 backdrop-blur-lg rounded-full border border-white/30 flex items-center justify-center hover:bg-white/60 transition-all duration-300 z-30"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      <div className="flex-1 min-h-[180px] max-h-[40vh] overflow-y-auto">
        <ChatWindow />
      </div>
      <div className="pt-2">
        <ModernChatInput />
      </div>
    </motion.div>
  );
}
