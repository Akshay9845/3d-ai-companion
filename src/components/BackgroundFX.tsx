// src/components/BackgroundFX.tsx
// Vibrant orange-red gradient background with animated effects

import { motion } from 'framer-motion';

export default function BackgroundFX() {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Light Orange-to-White Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-orange-50 to-white opacity-100" />
      
      {/* Subtle Animated Gradient Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-orange-200/20 via-orange-100/30 to-white/20"
        animate={{
          background: [
            'linear-gradient(45deg, rgba(254, 215, 170, 0.2), rgba(253, 186, 116, 0.3), rgba(255, 255, 255, 0.2))',
            'linear-gradient(135deg, rgba(253, 186, 116, 0.3), rgba(255, 255, 255, 0.2), rgba(254, 215, 170, 0.2))',
            'linear-gradient(225deg, rgba(255, 255, 255, 0.2), rgba(254, 215, 170, 0.2), rgba(253, 186, 116, 0.3))',
            'linear-gradient(315deg, rgba(254, 215, 170, 0.2), rgba(253, 186, 116, 0.3), rgba(255, 255, 255, 0.2))'
          ]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Subtle Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-300/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-10, -50],
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Light Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20" />
    </div>
  );
}
