import { SettingOutlined } from '@ant-design/icons';
import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Button } from 'antd';
import { Suspense, useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { echoRobotCharacter } from './characters';
import { AvatarChatOverlay } from './components/AvatarChatOverlay';
import { EchoModel } from './components/EchoModel';
import ErrorBoundary from './components/ErrorBoundary';
import ModelDemoPage from './components/ModelDemoPage';
import PerformanceMonitor from './components/PerformanceMonitor';
import SettingsDrawer from './components/SettingsDrawer';
import { SimpleBrowserTTSService } from './lib/geminiTTSService';
import { synchronizedSpeechAnimationController } from './lib/synchronizedSpeechAnimationController';

// Add a soft ground plane with shadow
function StudioGround() {
  return (
    <mesh receiveShadow position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[4, 64]} />
      <shadowMaterial opacity={0.25} />
    </mesh>
  );
}

// Simple fallback component
function FallbackBox() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

function MainApp() {
  const [showSettings, setShowSettings] = useState(false);
  const [avatarState, setAvatarState] = useState({
    isSpeaking: false,
    isListening: false,
    emotion: 'neutral',
    currentText: '',
  });

  // Initialize TTS service and synchronized speech controller
  const [ttsService] = useState(() => new SimpleBrowserTTSService());

  // Initialize synchronized speech animation controller
  useEffect(() => {
    console.log('🎭 AGGRESSIVE: Initializing synchronized speech animation controller');
    
    // Initialize TTS service
    ttsService.initialize().then(() => {
      console.log('🎭 AGGRESSIVE: TTS service initialized');
    }).catch(error => {
      console.error('❌ Failed to initialize TTS service:', error);
    });
  }, [ttsService]);

  // Handle animation changes from EchoModel
  const handleAnimationChange = (animationName: string) => {
    console.log('🎭 AGGRESSIVE: Animation changed to:', animationName);
  };

  // Handle user input - trigger greeting animation immediately
  const handleUserInput = (input: string) => {
    console.log('🎭 AGGRESSIVE: Processing user input for animation:', input);
    
    // Trigger greeting animation immediately when user speaks
    if ((window as any).playEchoAnimation) {
      const greetings = ['waving-2', 'standing-greeting', 'quick-informal-bow'];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      console.log(`🎭 AGGRESSIVE: User input detected - triggering greeting: ${randomGreeting}`);
      (window as any).playEchoAnimation(randomGreeting, 4.0);
    }
  };

  // Handle LLM response - trigger aggressive synchronized speech animation
  const handleLLMResponse = async (response: string) => {
    console.log('🎭🎭🎭 AGGRESSIVE: Processing LLM response for synchronized speech animation:', response);
    console.log('🎭 AGGRESSIVE: This will trigger talking animations immediately one after another');
    
    try {
      // Use the aggressive synchronized speech animation controller
      await synchronizedSpeechAnimationController.startSynchronizedSpeech(response, ttsService);
      console.log('🎭 AGGRESSIVE: Synchronized speech animation started successfully');
    } catch (error) {
      console.error('❌ Error starting synchronized speech animation:', error);
      // Emergency fallback to happy-idle
      if ((window as any).returnEchoToIdle) {
        (window as any).returnEchoToIdle(4.0);
      }
    }
  };

  // Handle speaking state changes
  const handleSpeakingStateChange = (isSpeaking: boolean) => {
    console.log('🎭 AGGRESSIVE: Speaking state changed:', isSpeaking);
    
    if (isSpeaking) {
      // Speaking started - talking animations should already be active from synchronized controller
      console.log('🎭 AGGRESSIVE: Speaking started - talking animations should be active');
    } else {
      // Speaking ended - return to happy-idle immediately
      console.log('🎭 AGGRESSIVE: Speaking ended - returning to happy-idle immediately');
      if ((window as any).returnEchoToIdle) {
        (window as any).returnEchoToIdle(4.0);
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="app-container" style={{ position: 'relative', height: '100vh' }}>
        {/* 3D Scene Container */}
        <div className="scene-container" style={{ height: '100%', width: '100%' }}>
          <Canvas
            camera={{ position: [0, 1.2, 5.5], fov: 48 }}
            style={{ background: 'transparent' }}
            shadows
            onCreated={(state) => {
              console.log('🎨 Canvas created:', state);
            }}
          >
            {/* Enhanced Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <pointLight position={[-10, -10, -10]} intensity={0.8} />
            <spotLight position={[0, 10, 0]} intensity={0.6} />
            
            {/* HDR Environment - no blur, studio look */}
            <Environment 
              files="/HDR/AdobeStock_1094234398.hdr"
              background={true}
              blur={0}
            />
            <Suspense fallback={<FallbackBox />}>
              <StudioGround />
              <EchoModel onAnimationChange={handleAnimationChange} />
            </Suspense>
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={3}
              maxDistance={15}
              maxPolarAngle={Math.PI / 1.8}
            />
          </Canvas>
        </div>

        {/* Avatar Chat Overlay - positioned below avatar knees */}
        <AvatarChatOverlay 
          onStateChange={updateAvatarState}
          characterConfig={echoRobotCharacter}
          onUserInput={handleUserInput}
          onLLMResponse={handleLLMResponse}
        />

        {/* Settings Icon Button - top right corner */}
        <Button
          type="text"
          icon={<SettingOutlined style={{ fontSize: 28 }} />}
          onClick={() => setShowSettings(true)}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1002,
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        />

        {/* Settings Drawer */}
        <SettingsDrawer 
          open={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
        
        <PerformanceMonitor />
      </div>
    </ErrorBoundary>
  );

  // Update avatar's state based on chat overlay
  function updateAvatarState(newState: Partial<typeof avatarState>) {
    setAvatarState(prev => ({ ...prev, ...newState }));
    
    // Handle speaking state changes
    if (newState.isSpeaking !== undefined) {
      handleSpeakingStateChange(newState.isSpeaking);
    }
  }
}

function ModelDemoWrapper() {
  const navigate = useNavigate();
  return (
    <div>
      <button
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 2000, padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#333', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        ← Back to Main
      </button>
      <ModelDemoPage />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/model-demo" element={<ModelDemoWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;
