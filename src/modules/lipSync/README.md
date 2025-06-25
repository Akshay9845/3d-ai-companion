# 🎤 Lip Sync Module

Real-time viseme generation from audio and text for BECKY model.

## Features
- Text-to-phoneme conversion
- Audio analysis and viseme extraction
- Real-time lip sync animation
- Multi-language support (English, Telugu, Hindi, etc.)
- Coarticulation and smoothing
- BECKY model blend shape mapping

## Usage
```typescript
import { LipSyncController } from './LipSyncController';

const lipSync = new LipSyncController({
  language: 'en',
  accuracy: 'balanced',
  smoothing: 0.3,
  intensity: 0.8
});

const visemes = await lipSync.generateVisemesFromText("Hello world");
```

## Status
✅ **IMPLEMENTED** - Basic functionality ready
🚧 **TODO** - Advanced audio analysis integration
