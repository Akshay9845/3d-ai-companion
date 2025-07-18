# 📹 Advanced Camera & AI Vision Integration Guide

This guide explains how to integrate and use the advanced camera system with face detection, emotion analysis, MediaPipe, and Google Cloud Vision features.

## 🎯 Features Overview

### Core Features
- **Real-time Face Detection**: Using face-api.js with local AI models
- **Emotion Analysis**: 7 emotion categories (happy, sad, angry, surprised, fearful, disgusted, neutral)
- **Demographics**: Age estimation and gender classification
- **MediaPipe Integration**: Advanced face mesh, pose estimation, and hand tracking
- **Google Cloud Vision**: Cloud-based face detection and scene analysis
- **Camera Controls**: Photo capture, video recording, overlay management

### AI Backends
1. **face-api.js** (Primary) - Local processing, privacy-friendly
2. **MediaPipe** (Optional) - Advanced computer vision features
3. **Google Cloud Vision** (Optional) - Cloud-based enhanced accuracy

## 🚀 Quick Start

### 1. Basic Integration

```tsx
import CameraControls from './components/Camera/CameraControls';

function MyApp() {
  const handleEmotionChange = (emotion: string) => {
    console.log('Current emotion:', emotion);
    // Use emotion to drive avatar animations, lighting, etc.
  };

  const handleFaceCountChange = (count: number) => {
    console.log('Number of faces:', count);
    // Adjust UI based on number of people present
  };

  return (
    <div>
      <CameraControls
        onEmotionChange={handleEmotionChange}
        onFaceCountChange={handleFaceCountChange}
      />
    </div>
  );
}
```

### 2. Advanced Usage with Settings

```tsx
import { useFaceDetection } from './lib/useFaceDetection';

function AdvancedComponent() {
  const faceDetection = useFaceDetection({
    enableEmotions: true,
    enableAgeGender: true,
    enableMediaPipe: true,
    useGoogleVision: false,
    minConfidence: 0.7,
    processingInterval: 100,
    autoStart: true
  });

  useEffect(() => {
    if (faceDetection.dominantEmotion) {
      // Drive 3D avatar emotions
      avatarController.setEmotion(faceDetection.dominantEmotion);
    }
  }, [faceDetection.dominantEmotion]);

  return (
    <div>
      <p>Detected Emotion: {faceDetection.dominantEmotion}</p>
      <p>Face Count: {faceDetection.faceCount}</p>
      <p>Average Age: {faceDetection.averageAge}</p>
    </div>
  );
}
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install face-api.js
```

### 2. Setup Face Detection Models

The system automatically loads models from `/src/assets/models/`. Ensure these files are accessible:

- `tiny_face_detector_model-*`
- `face_landmark_68_model-*`
- `face_expression_model-*`
- `age_gender_model-*`
- `face_recognition_model-*`

### 3. Configure Environment Variables

For Google Cloud Vision (optional):

```env
VITE_GOOGLE_VISION_API_KEY=your_api_key_here
```

### 4. MediaPipe Setup (Optional)

MediaPipe loads automatically from CDN. No additional setup required.

## 🎮 Component Reference

### CameraControls

Main component for camera functionality with settings panel.

```tsx
interface CameraControlsProps {
  onEmotionChange?: (emotion: string) => void;
  onFaceCountChange?: (count: number) => void;
  onSceneAnalysis?: (scene: any) => void;
  className?: string;
}
```

### EnhancedCameraPreview

Advanced camera preview with face detection overlays.

```tsx
interface EnhancedCameraPreviewProps {
  isActive: boolean;
  onClose: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  enableFaceDetection?: boolean;
  enableEmotions?: boolean;
  enableAgeGender?: boolean;
  enableMediaPipe?: boolean;
  enableGoogleVision?: boolean;
  googleVisionApiKey?: string;
  onEmotionChange?: (emotion: string) => void;
  onFaceCountChange?: (count: number) => void;
}
```

### useFaceDetection Hook

React hook for face detection with multiple backends.

```tsx
const faceDetection = useFaceDetection({
  enableEmotions: true,
  enableAgeGender: true,
  enableLandmarks: true,
  enableMediaPipe: false,
  useGoogleVision: false,
  googleVisionApiKey: '',
  minConfidence: 0.6,
  processingInterval: 150,
  autoStart: false
});

// Available properties:
// - isInitialized: boolean
// - isProcessing: boolean
// - faces: FaceDetectionResult | null
// - dominantEmotion: string | null
// - faceCount: number
// - averageAge: number | null
// - hasActiveFaces: boolean
// - processingMode: string
```

## 🎨 Customization

### Emotion Colors

```tsx
const emotionColors = {
  happy: '#4ade80',
  sad: '#3b82f6',
  angry: '#ef4444',
  surprised: '#f59e0b',
  fearful: '#8b5cf6',
  disgusted: '#10b981',
  neutral: '#6b7280'
};
```

### Processing Intervals

```tsx
// Fast processing (high CPU usage)
processingInterval: 50

// Balanced processing
processingInterval: 150

// Power-saving mode
processingInterval: 500
```

### Camera Positions

```tsx
// Available positions
position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
```

## 🔗 Integration with 3D Avatar

### Emotion-Driven Animations

```tsx
useEffect(() => {
  if (faceDetection.dominantEmotion) {
    // Map emotions to animation states
    const animationMap = {
      happy: 'happy_idle',
      sad: 'sad_idle',
      angry: 'angry_gesture',
      surprised: 'surprised_reaction',
      fearful: 'fearful_step_back',
      neutral: 'neutral_idle'
    };
    
    const animation = animationMap[faceDetection.dominantEmotion];
    if (animation) {
      avatarController.playAnimation(animation);
    }
  }
}, [faceDetection.dominantEmotion]);
```

### Face Count Reactions

```tsx
useEffect(() => {
  if (faceDetection.faceCount === 0) {
    avatarController.setIdle();
  } else if (faceDetection.faceCount === 1) {
    avatarController.setEngaged();
  } else {
    avatarController.setGroupMode();
  }
}, [faceDetection.faceCount]);
```

### Age-Appropriate Responses

```tsx
useEffect(() => {
  if (faceDetection.averageAge) {
    const responseStyle = faceDetection.averageAge < 18 ? 'child-friendly' : 'adult';
    conversationController.setResponseStyle(responseStyle);
  }
}, [faceDetection.averageAge]);
```

## 🔒 Privacy & Security

### Local Processing
- Face detection runs locally using face-api.js
- No data sent to external servers by default
- Models loaded once and cached

### Optional Cloud Features
- Google Cloud Vision is opt-in only
- API key required and stored locally
- Can be disabled completely

### Data Handling
- No persistent storage of face data
- Real-time processing only
- User controls all settings

## 📊 Performance Optimization

### Model Loading
```tsx
// Preload models for faster initialization
import * as faceapi from 'face-api.js';

const preloadModels = async () => {
  const modelPath = '/src/assets/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
    faceapi.nets.faceExpressionNet.loadFromUri(modelPath),
  ]);
};
```

### Processing Optimization
```tsx
// Adjust processing based on device capabilities
const getOptimalSettings = () => {
  const isLowEnd = navigator.hardwareConcurrency < 4;
  return {
    processingInterval: isLowEnd ? 300 : 150,
    minConfidence: isLowEnd ? 0.7 : 0.5,
    maxFaces: isLowEnd ? 2 : 5
  };
};
```

## 🐛 Troubleshooting

### Camera Permission Issues
```tsx
// Check and request camera permission
const checkPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
};
```

### Model Loading Errors
```tsx
// Handle model loading failures
try {
  await faceDetectionService.initialize();
} catch (error) {
  console.error('Failed to load face detection models:', error);
  // Fallback to basic camera without AI features
}
```

### Performance Issues
```tsx
// Monitor performance and adjust settings
const monitorPerformance = () => {
  const startTime = performance.now();
  // ... processing
  const endTime = performance.now();
  const processingTime = endTime - startTime;
  
  if (processingTime > 100) {
    // Reduce processing frequency
    faceDetection.updateConfig({ processingInterval: 300 });
  }
};
```

## 📱 Mobile Considerations

### Responsive Design
- Camera preview automatically scales
- Touch-friendly controls
- Optimized for mobile performance

### Battery Optimization
- Reduced processing frequency on mobile
- Automatic feature scaling based on device capabilities
- Option to disable intensive features

## 🎯 Use Cases

### Virtual Meetings
- Emotion-aware video calls
- Automatic mood lighting
- Engagement tracking

### Interactive Learning
- Student attention monitoring
- Emotion-based content adaptation
- Multi-user classroom scenarios

### Entertainment
- Emotion-driven music selection
- Interactive gaming experiences
- Social media filters

### Accessibility
- Facial expression communication aids
- Emotion recognition for non-verbal users
- Multi-modal interaction systems

## 📈 Future Enhancements

### Planned Features
- Voice emotion correlation
- Advanced scene understanding
- Multi-language facial expression recognition
- Real-time avatar lip-sync from camera
- Gesture recognition integration

### Integration Opportunities
- Voice AI emotion matching
- 3D avatar real-time mirroring
- Biometric authentication
- Mental health monitoring
- Productivity tracking

## 🤝 Contributing

To extend the camera system:

1. Create new detection services in `src/lib/`
2. Add UI components in `src/components/Camera/`
3. Update the main hooks and services
4. Test with the CameraDemo component

## 📝 License

This camera system integrates with:
- face-api.js (MIT License)
- MediaPipe (Apache 2.0 License)
- Google Cloud Vision (Commercial License Required)

Make sure to comply with all relevant licenses when deploying. 