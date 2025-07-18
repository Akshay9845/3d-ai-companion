# 📹 Camera Vision Integration - Usage Guide

Your camera system is now fully integrated with speech interaction! The avatar can see and respond to what's in the camera when you ask.

## 🚀 How to Use

### 1. **Turn on the Camera**
- Click the camera button in the bottom right corner
- Allow camera permissions when prompted
- You'll see a small preview window appear

### 2. **Ask Vision Questions**
You can now ask the avatar about what it sees! Try these phrases:

**Face Detection Questions:**
- "What do you see?"
- "Can you see me?"
- "Are you looking at me?"
- "Describe what you see"
- "How do I look?"

**Object Recognition Questions:**
- "What's in the camera?"
- "What objects can you see?"
- "Identify what's in view"
- "Tell me about what you're looking at"

**Text Recognition Questions:**
- "Can you read any text?"
- "What text do you see?"
- "Read what's on screen"

### 3. **How It Works**

When you ask vision-related questions, the system:

1. **Detects Vision Keywords** - Recognizes when you're asking about vision
2. **Analyzes Camera Feed** - Uses AI to process the current video frame
3. **Face Detection** - Finds faces, emotions, age, gender
4. **Object Recognition** - Identifies objects and scenes (with Google Vision API)
5. **Text Recognition** - Reads any visible text
6. **Responds Naturally** - Avatar describes what it sees in conversation

## 🎯 Example Conversations

**Face Detection:**
```
You: "Can you see me?"
Avatar: "I can see you in the camera. You appear to be happy. You look around 25 years old."
```

**Object Recognition:**
```
You: "What do you see in the room?"
Avatar: "I can see: computer, desk, book. The scene appears to contain: furniture, technology, workspace."
```

**Text Recognition:**
```
You: "Can you read what's on my screen?"
Avatar: "I can read some text: 'Welcome', 'Dashboard', 'Settings'."
```

## ⚙️ Configuration

### Google Vision API (Optional)
For enhanced object and text recognition:

1. Get a Google Cloud Vision API key
2. Add it to your environment: `VITE_GOOGLE_API_KEY=your_key_here`
3. Or set it in the camera settings panel

### Face Detection Models
The system automatically uses local AI models from `/src/assets/models/`:
- ✅ Tiny Face Detector
- ✅ Face Landmarks (68 points)
- ✅ Face Expression Recognition
- ✅ Age & Gender Estimation

## 🔧 Technical Features

### Local AI Processing
- **Privacy-First**: Face detection runs locally on your device
- **No Data Upload**: Video never leaves your browser
- **Real-Time**: Instant analysis and response

### Multi-Modal Analysis
- **Face Detection**: Emotions, age, gender, confidence
- **Object Recognition**: Items, furniture, technology
- **Scene Understanding**: Context and environment
- **Text Recognition**: OCR for visible text

### Smart Integration
- **Keyword Detection**: Automatically recognizes vision queries
- **Context Aware**: Adds camera analysis to conversation context
- **Natural Responses**: Avatar speaks about what it sees
- **Fallback Handling**: Graceful degradation when camera unavailable

## 🎮 Testing Tips

### For Best Results:
1. **Good Lighting** - Ensure adequate lighting for face detection
2. **Clear View** - Position yourself clearly in frame
3. **Stable Camera** - Avoid excessive movement during analysis
4. **Multiple Objects** - Show different items for object recognition
5. **Text Visibility** - Hold text clearly for reading tests

### Voice Commands to Try:
- "What do you see right now?"
- "Can you tell me about my expression?"
- "What objects are visible?"
- "Are there multiple people?"
- "What's the mood in the room?"
- "Can you analyze what I'm showing you?"

## 🔍 Debugging

### If Vision Isn't Working:
1. **Check Camera Button** - Make sure it's green (active)
2. **Browser Console** - Look for "👁️ Vision query detected" messages
3. **API Keys** - Verify Google Vision API key if using advanced features
4. **Permissions** - Ensure camera permissions are granted

### Console Messages:
```
👁️ Vision query detected, analyzing camera...
📹 Intelligent camera service attached to video
👁️ Camera analysis result: I can see you in the camera...
```

## 🌟 Advanced Features

### Manual Analysis
- Click the "👁" eye icon in the camera preview for instant analysis
- Results appear in console and can trigger avatar speech

### Multiple Detection Backends
- **face-api.js**: Local face detection and emotion analysis
- **Google Vision API**: Cloud-based object and text recognition
- **MediaPipe**: Advanced face mesh and pose detection (planned)

### Real-Time Updates
- Face count and emotion detection updates in real-time
- Status indicators show when AI vision is active
- Live feed with mirrored display for natural interaction

## 🎯 Use Cases

### Video Calls
- "Can you see how many people are in the meeting?"
- "What's the overall mood of the participants?"

### Learning & Teaching
- "What objects can you identify for learning?"
- "Can you read the text on this educational material?"

### Accessibility
- "Describe what's in view for me"
- "What text is visible on screen?"

### Entertainment
- "React to my facial expressions"
- "Comment on what you see in my room"

---

**🎉 Enjoy your AI-powered vision conversations!** The avatar can now truly see and respond to your world through the camera. 