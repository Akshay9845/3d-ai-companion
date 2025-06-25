# 🎭 AI Avatar Modules

This directory contains the core modules for the Ultimate 3D AI Avatar system, implementing real-time facial expressions, lip sync, gesture generation, and emotion mapping.

## 📁 Module Structure

```
src/modules/
├── lipSync/           # Real-time lip sync and viseme generation
├── gestures/          # Body motion and gesture generation
├── emotions/          # Emotion detection and facial mapping
├── retargeting/       # Animation retargeting for BECKY model
├── llm/              # LLM integration and intent processing
├── audio/            # Audio processing and analysis
└── controllers/      # Main orchestration controllers
```

## 🔄 Data Flow Architecture

```
Speech Input → Audio Analysis → LLM Processing → Multi-Modal Output
                    ↓                ↓
               Emotion Detection   Intent Analysis
                    ↓                ↓
              Facial Expressions  Gesture Generation
                    ↓                ↓
                Lip Sync         Body Animation
                    ↓                ↓
              BECKY Model Animation System
```

## 🎯 Implementation Priority

1. **✅ DONE**: BECKY Model Integration
2. **🚧 CURRENT**: Lip Sync Controller (Resemble-based)
3. **⏳ NEXT**: Emotion Detection (openSMILE)
4. **⏳ FUTURE**: Gesture Generation (OpenGesture)
5. **⏳ FUTURE**: Advanced Retargeting

## 🛠️ Technology Stack

- **Lip Sync**: Resemble Lip Sync + Custom Viseme Mapping
- **Gestures**: DiffuseStyleGesture + OpenGesture
- **Emotions**: openSMILE + Custom Emotion Mapper
- **Animation**: Three.js + GLTF/GLB
- **AI**: LangChain + Groq LLM
- **Audio**: Web Audio API + TTS Services

## 📦 Required Dependencies

```bash
# Core animation libraries
npm install three @react-three/fiber @react-three/drei

# Audio processing
npm install web-audio-api tone.js

# AI and LLM integration
npm install langchain @langchain/community

# Utility libraries
npm install lodash mathjs
```

## 🚀 Getting Started

Each module is designed to be:
- **Modular**: Independent functionality
- **Extensible**: Easy to add new features
- **Performance-optimized**: Real-time processing
- **Type-safe**: Full TypeScript support

See individual module READMEs for specific implementation details. 