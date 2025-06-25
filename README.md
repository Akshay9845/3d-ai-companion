# 3D Avatar Animation System

A sophisticated 3D avatar animation system built with React, Three.js, and TypeScript. Features real-time speech synchronization, human-like animations, and an aggressive animation management system to prevent T-pose issues.

## 🎭 Features

- **3D Avatar Rendering**: High-quality 3D character with realistic animations
- **Speech Synchronization**: Real-time animation sync with TTS (Text-to-Speech)
- **Aggressive Animation Management**: Prevents T-pose by ensuring continuous animation flow
- **Human-like Animations**: Natural, responsive animations with smooth transitions
- **Voice Chat Integration**: Real-time voice recognition and response
- **Multiple Animation Types**: Idle, greeting, talking, and emotional animations
- **Responsive Design**: Works across different screen sizes and devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Modern web browser with WebGL support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/3d-avatar-animation-system.git
   cd 3d-avatar-animation-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5176` (or the port shown in the terminal)

## 🏗️ Project Structure

```
3dmama/
├── src/
│   ├── components/
│   │   ├── EchoModel.tsx              # 3D avatar component
│   │   ├── AvatarChatOverlay.tsx      # Chat interface
│   │   └── Chat/
│   │       └── ModernChatInputSimple.tsx
│   ├── lib/
│   │   ├── synchronizedSpeechAnimationController.ts  # Animation sync
│   │   ├── unifiedAnimationLoader.ts                 # Animation loading
│   │   ├── smoothAnimationController.ts              # Smooth transitions
│   │   └── geminiTTSService.ts                       # TTS service
│   ├── characters/
│   │   └── echo-robot-clean.config.ts                # Character config
│   └── App.tsx                                        # Main app component
├── public/
│   └── ECHO/
│       └── animations/                                # 3D animation files
└── package.json
```

## 🎮 Usage

### Basic Interaction

1. **Start the application** and wait for the 3D avatar to load
2. **Click the chat button** to open the conversation interface
3. **Type a message** or use voice input to interact with the avatar
4. **Watch the avatar respond** with synchronized animations and speech

### Animation System

The system uses an **aggressive animation management** approach:

- **Base Idle Animation**: Always running in the background
- **Greeting Animations**: Triggered when user interacts
- **Talking Animations**: Continuous cycle during speech
- **Smooth Transitions**: No gaps between animations

### Voice Chat

- **Click the microphone button** to start voice recognition
- **Speak naturally** and the system will transcribe your speech
- **Avatar responds** with synchronized animations and TTS

## 🔧 Configuration

### Character Settings

Edit `src/characters/echo-robot-clean.config.ts` to customize:
- Model appearance
- Animation preferences
- Position and scale
- Voice settings

### Animation Speed

Adjust animation speeds in:
- `src/lib/unifiedAnimationLoader.ts` - Animation timeScale
- `src/lib/smoothAnimationController.ts` - Transition timing
- `src/components/EchoModel.tsx` - Duration settings

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Key Technologies

- **React 18** - UI framework
- **Three.js** - 3D graphics
- **@react-three/fiber** - React Three.js renderer
- **@react-three/drei** - Three.js helpers
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Ant Design** - UI components

### Animation System Architecture

1. **UnifiedAnimationLoader**: Loads and manages all 3D animations
2. **SmoothAnimationController**: Handles smooth transitions between animations
3. **SynchronizedSpeechAnimationController**: Syncs animations with speech
4. **EchoModel**: Main 3D component with aggressive animation management

## 🎨 Customization

### Adding New Animations

1. Place new `.glb` files in `public/ECHO/animations/`
2. Add animation definitions in `src/lib/unifiedAnimationLoader.ts`
3. Update animation presets in `src/lib/smoothAnimationController.ts`

### Modifying Character Appearance

1. Replace the 3D model in `public/ECHO/`
2. Update character configuration in `src/characters/`
3. Adjust bone mapping if needed in `src/lib/boneMapping.ts`

## 🐛 Troubleshooting

### Common Issues

**T-pose appearing:**
- Check that animations are loading correctly
- Verify animation speeds are not too slow
- Ensure the aggressive animation system is active

**Animations not playing:**
- Check browser console for errors
- Verify 3D model files are accessible
- Ensure WebGL is supported and enabled

**Voice recognition not working:**
- Check microphone permissions
- Verify browser supports Web Speech API
- Ensure HTTPS is used (required for voice features)

### Performance Optimization

- Reduce animation file sizes
- Optimize 3D model geometry
- Use lower resolution textures
- Enable hardware acceleration

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/3d-avatar-animation-system/issues) page
2. Create a new issue with detailed information
3. Include browser console logs and error messages

## 🎯 Roadmap

- [ ] Add more character models
- [ ] Implement emotion detection
- [ ] Add gesture recognition
- [ ] Support for multiple languages
- [ ] Mobile optimization
- [ ] VR/AR support

---

**Built with ❤️ using React, Three.js, and TypeScript** 