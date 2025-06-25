// src/components/AgentStatusRing.tsx
// Clean, minimalist status ring for the agent with Atlas-inspired design

import { motion } from 'framer-motion';

export default function AgentStatusRing() {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80">
          {/* Outer rotating ring */}
          <motion.circle
            cx="40"
            cy="40"
            r="35"
            stroke="url(#gradient1)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255,140,0,0.4))',
            }}
          />
          
          {/* Middle counter-rotating ring */}
          <motion.circle
            cx="40"
            cy="40"
            r="28"
            stroke="url(#gradient2)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.6))',
            }}
          />
          
          {/* Inner pulse ring */}
          <motion.circle
            cx="40"
            cy="40"
            r="18"
            stroke="url(#gradient3)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Center core */}
          <motion.circle
            cx="40"
            cy="40"
            r="8"
            fill="url(#coreGradient)"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))',
            }}
          />
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,140,0,0.7)" />
              <stop offset="50%" stopColor="rgba(255,165,0,0.9)" />
              <stop offset="100%" stopColor="rgba(255,69,0,0.8)" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,215,0,0.8)" />
              <stop offset="50%" stopColor="rgba(255,140,0,0.9)" />
              <stop offset="100%" stopColor="rgba(255,99,71,0.7)" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,165,0,0.6)" />
              <stop offset="100%" stopColor="rgba(255,140,0,0.8)" />
            </linearGradient>
            <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="30%" stopColor="rgba(255,215,0,0.8)" />
              <stop offset="70%" stopColor="rgba(255,140,0,0.7)" />
              <stop offset="100%" stopColor="rgba(255,69,0,0.6)" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>
      
      {/* Status text with Atlas-inspired styling */}
      <motion.div 
        className="mt-3 font-bold text-xs tracking-widest text-center"
        style={{
          background: 'linear-gradient(45deg, #fff 0%, #ffd700 50%, #ff8c00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 8px rgba(255,140,0,0.8), 0 0 20px rgba(255,255,255,0.4)',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        ECHO ACTIVE
      </motion.div>
    </div>
  );
}
