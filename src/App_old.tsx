




import { motion } from 'framer-motion';
import React from 'react';
import Agent3DScene from './components/Agent3DScene';
import AgentStatusRing from './components/AgentStatusRing';
import BackgroundFX from './components/BackgroundFX';
import FloatingChatPanel from './components/FloatingChatPanel';
import SettingsDrawer from './components/SettingsDrawer';

// 3D Glossy Title Component
function GlossyTitle() {
  return (
    <motion.div
      className="absolute top-8 left-8 z-20"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <motion.h1
        className="relative"
        style={{
          fontSize: '4rem',
          fontWeight: 900,
          fontFamily: '"Orbitron", "Exo 2", "Inter", sans-serif',
          background: 'linear-gradient(45deg, #fff 0%, #ffd700 25%, #ff8c00 50%, #ff4500 75%, #fff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 8px 32px rgba(255, 140, 0, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
        }}
        animate={{
          textShadow: [
            '0 8px 32px rgba(255, 140, 0, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
            '0 8px 32px rgba(255, 69, 0, 1), 0 0 80px rgba(255, 215, 0, 0.6)',
            '0 8px 32px rgba(255, 140, 0, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        AI AGENT
      </motion.h1>
      
      {/* Glossy overlay effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
          borderRadius: '8px',
          filter: 'blur(1px)',
        }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

// Floating UI Navigation
function FloatingNav() {
  return (
    <motion.div
      className="absolute top-8 right-8 z-20 flex gap-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      {['Settings', 'Help', 'About'].map((item, i) => (
        <motion.button
          key={item}
          className="px-6 py-3 rounded-full font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,140,0,0.2) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 12px 48px rgba(255,140,0,0.4)',
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 + i * 0.1 }}
        >
          {item}
        </motion.button>
      ))}
    </motion.div>
  );
}

// Minimal error overlay for critical errors
function ErrorOverlay({ error }: { error: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        textAlign: 'center',
        padding: 32,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 32, color: '#f87171', marginBottom: 16 }}>Something went wrong</div>
      <div style={{ marginBottom: 24 }}>{error}</div>
      <button
        style={{
          background: '#06b6d4',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 32px',
          fontSize: 18,
          cursor: 'pointer',
        }}
        onClick={() => window.location.reload()}
      >
        Reload
      </button>
    </div>
  );
}

const App: React.FC = () => {
  // Main next-gen UI shell
  return (
    <div className="relative w-full h-screen overflow-hidden bg-transparent">
      <BackgroundFX />
      <Agent3DScene />
      <GlossyTitle />
      <FloatingNav />
      <AgentStatusRing />
      <FloatingChatPanel />
      <SettingsDrawer />
    </div>
  );
};

export default App;
