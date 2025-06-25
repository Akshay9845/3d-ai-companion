# 🎤 Advanced Voice AI Pipeline

This document describes the advanced conversational AI features implemented for the 3D AI avatar system, providing ChatGPT/Gemini-like voice interaction capabilities.

## 🚀 Features Overview

### Core Features
- **Streaming Speech-to-Text (STT)**: Real-time transcription with partial results
- **Streaming Text-to-Speech (TTS)**: Real-time audio playback with emotion support
- **Voice Activity Detection (VAD)**: Auto-interruption when user starts speaking
- **Wake Word Detection**: "Hey Echo" activation (Enhanced version)
- **Emotion Detection**: Real-time emotion analysis from audio and text
- **Robust Error Handling**: Comprehensive error management and recovery

### State Management
The system uses a unified state machine:
- `idle`: Ready for interaction
- `wake-word-listening`: Listening for wake word (Enhanced only)
- `listening`: Actively transcribing user speech
- `processing`: LLM processing user input
- `speaking`: TTS playback in progress

## 📁 File Structure

```
src/
├── lib/
│   ├── useStreamingSTT.ts          # Streaming STT hook
│   ├── useStreamingTTS.ts          # Streaming TTS hook
│   ├── useWakeWord.ts              # Wake word detection hook
│   └── useEmotionDetection.ts      # Emotion detection hook
├── components/
│   ├── VoiceAgent.tsx              # Basic voice agent
│   ├── EnhancedVoiceAgent.tsx      # Full-featured voice agent
│   └── VoiceAgentDemo.tsx          # Demo page
```

## 🔧 Implementation Details

### 1. Streaming STT Hook (`useStreamingSTT`)

**Features:**
- WebSocket connection to STT service
- Real-time audio streaming (16-bit PCM)
- Partial and final transcriptions
- VAD integration (placeholder)
- Configurable language and sample rate

**Usage:**
```typescript
const stt = useStreamingSTT({
  endpoint: 'ws://localhost:8000/stt',
  language: 'en-US',
  vadTimeout: 1500
});

// Start listening
stt.startListening();

// Access state
console.log(stt.transcript);        // Final transcript
console.log(stt.partialTranscript); // Real-time partial
console.log(stt.isListening);       // Listening state
```

### 2. Streaming TTS Hook (`useStreamingTTS`)

**Features:**
- WebSocket connection to TTS service
- Real-time audio playback
- Emotion-aware synthesis
- Interruption support
- Audio queue management

**Usage:**
```typescript
const tts = useStreamingTTS({
  endpoint: 'ws://localhost:8000/tts',
  voice: 'default',
  language: 'en-US'
});

// Play text with emotion
await tts.play("Hello, how are you?", {
  emotion: 'happy',
  speed: 1.0,
  pitch: 1.0
});

// Stop playback
tts.stop();
```

### 3. Wake Word Detection (`useWakeWord`)

**Features:**
- Configurable wake word ("Hey Echo")
- Sensitivity adjustment
- Auto-start capability
- Porcupine/Snowboy integration ready

**Usage:**
```typescript
const wakeWord = useWakeWord({
  keyword: 'hey echo',
  sensitivity: 0.5,
  autoStart: true
});

// Check if wake word detected
if (wakeWord.isDetected) {
  console.log('Wake word detected!');
  wakeWord.reset();
}
```

### 4. Emotion Detection (`useEmotionDetection`)

**Features:**
- Real-time emotion analysis from audio
- Text-based emotion detection
- Multiple emotion categories
- Confidence scoring
- openSMILE/pyAudioAnalysis integration ready

**Usage:**
```typescript
const emotion = useEmotionDetection({
  endpoint: 'ws://localhost:8000/emotion',
  autoStart: false
});

// Get current emotion
console.log(emotion.currentEmotion); // 'happy', 'sad', 'angry', etc.

// Detect emotion from text
const textEmotion = emotion.detectEmotionFromText("I'm so happy today!");
console.log(textEmotion); // 'happy'
```

## 🎯 VoiceAgent Components

### Basic VoiceAgent
- Core STT/TTS functionality
- Manual control buttons
- Error handling
- Message history

### Enhanced VoiceAgent
- All basic features plus:
- Wake word activation
- Emotion detection and display
- Emotion-aware responses
- Advanced state management
- Comprehensive status monitoring

## 🌐 Backend Requirements

### WebSocket Endpoints

#### STT Endpoint (`ws://localhost:8000/stt`)
**Input:** Audio data (16-bit PCM)
**Output:** JSON messages
```json
{
  "type": "partial",
  "text": "Hello, how are"
}
{
  "type": "final", 
  "text": "Hello, how are you?"
}
```

#### TTS Endpoint (`ws://localhost:8000/tts`)
**Input:** JSON synthesis request
```json
{
  "type": "synthesize",
  "text": "Hello, how are you?",
  "voice": "default",
  "language": "en-US",
  "emotion": "happy",
  "speed": 1.0,
  "pitch": 1.0
}
```
**Output:** Audio data (Blob) + progress updates
```json
{
  "type": "progress",
  "progress": 50
}
{
  "type": "complete"
}
```

#### Emotion Endpoint (`ws://localhost:8000/emotion`)
**Input:** Audio data (16-bit PCM)
**Output:** JSON emotion results
```json
{
  "type": "emotion",
  "emotion": "happy",
  "confidence": 0.85,
  "emotions": [
    {"emotion": "happy", "score": 0.85, "confidence": 0.85},
    {"emotion": "neutral", "score": 0.10, "confidence": 0.10}
  ]
}
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access Demo
Navigate to the VoiceAgentDemo component to test the features.

### 4. Backend Setup (Optional)
For full functionality, implement the WebSocket endpoints described above.

## 🎨 Customization

### Adding New Wake Words
```typescript
const wakeWord = useWakeWord({
  keyword: 'your custom wake word',
  sensitivity: 0.7
});
```

### Supporting New Languages
```typescript
const stt = useStreamingSTT({
  language: 'te-IN', // Telugu
  endpoint: 'ws://localhost:8000/stt-telugu'
});
```

### Custom Emotion Detection
```typescript
const emotion = useEmotionDetection({
  endpoint: 'ws://localhost:8000/custom-emotion',
  // Add custom emotion categories
});
```

## 🔮 Future Enhancements

### Planned Features
- **Code-Switching**: Automatic Telugu/English language detection
- **Speaker Recognition**: Multi-user support
- **Context Awareness**: Conversation memory and context
- **Gesture Sync**: Emotion-driven 3D avatar animations
- **Offline Mode**: Local processing capabilities

### Integration Points
- **Porcupine**: Professional wake word detection
- **openSMILE**: Advanced emotion analysis
- **Coqui TTS**: High-quality text-to-speech
- **Whisper**: Local speech recognition

## 🐛 Troubleshooting

### Common Issues

**1. WebSocket Connection Failed**
- Check if backend services are running
- Verify endpoint URLs in configuration
- Check browser console for CORS issues

**2. Microphone Access Denied**
- Ensure HTTPS or localhost
- Check browser permissions
- Try refreshing the page

**3. Audio Playback Issues**
- Check browser audio settings
- Verify TTS service is responding
- Check for audio context suspension

### Debug Mode
Enable debug logging by setting:
```typescript
localStorage.setItem('voiceAI_debug', 'true');
```

## 📚 API Reference

### Hook Interfaces

```typescript
interface StreamingSTTConfig {
  endpoint?: string;
  sampleRate?: number;
  vadThreshold?: number;
  vadTimeout?: number;
  language?: string;
}

interface StreamingTTSConfig {
  endpoint?: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

interface WakeWordConfig {
  keyword?: string;
  sensitivity?: number;
  autoStart?: boolean;
}

interface EmotionDetectionConfig {
  endpoint?: string;
  sampleRate?: number;
  bufferSize?: number;
  autoStart?: boolean;
}
```

### Component Props

```typescript
interface VoiceAgentProps {
  onMessageAdd?: (message: { role: 'user' | 'assistant'; content: string }) => void;
  onStateChange?: (state: ChatState) => void;
  className?: string;
}

interface EnhancedVoiceAgentProps extends VoiceAgentProps {
  onEmotionChange?: (emotion: string) => void;
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note:** This implementation provides a solid foundation for advanced voice AI features. The placeholder endpoints and TODO comments indicate where backend integration is needed for full functionality. 