import { SettingOutlined } from '@ant-design/icons';
import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Button, Drawer } from 'antd';
import { Suspense, useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { echoRobotCharacter } from './characters';
import AnimationDemo from './components/AnimationDemo';
import AnimationTestPanel from './components/AnimationTestPanel';
import { AvatarChatOverlay } from './components/AvatarChatOverlay';
import CameraStatus from './components/CameraStatus';
import CapabilityTestComponent from './components/CapabilityTestComponent';
import EchoAssistantDemo from './components/EchoAssistantDemo';
import { EchoModel } from './components/EchoModel';
import ErrorBoundary from './components/ErrorBoundary';
import FlowValidationTest from './components/FlowValidationTest';
import GoogleTTSTest from './components/GoogleTTSTest';
import GoogleTTSTestSimple from './components/GoogleTTSTestSimple';
import ModelDemoPage from './components/ModelDemoPage';
import { ModelStateMonitor } from './components/ModelStateMonitor';
import PerformanceMonitor from './components/PerformanceMonitor';
import SettingsDrawer from './components/SettingsDrawer';
import SimpleCameraToggle from './components/SimpleCameraToggle';
import SpeechIntegrationHelper from './components/SpeechIntegrationHelper';
import TTSFallbackTest from './components/TTSFallbackTest';
import VisionDebugTest from './components/VisionDebugTest';
import VisionDiagnostics from './components/VisionDiagnostics';
import VoiceDrivenConversationSystem from './components/VoiceDrivenConversationSystem';
import { enhancedGoogleTTSService } from './lib/enhancedGoogleTTSService';

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
  const [showModelMonitor, setShowModelMonitor] = useState(false);
  const [showAnimationTest, setShowAnimationTest] = useState(false);
  const [showVoiceConversation, setShowVoiceConversation] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [avatarState, setAvatarState] = useState({
    currentAnimation: 'idle',
    isSpeaking: false,
    emotion: 'neutral'
  });

  // Initialize Google TTS service and synchronized speech controller
  const [ttsService] = useState(() => enhancedGoogleTTSService);

  // Initialize synchronized speech animation controller
  useEffect(() => {
    console.log('🎭 AGGRESSIVE: Initializing synchronized speech animation controller with Google TTS');
    
    // Initialize Google TTS service with environment API key
    const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyB-6aBzVSQo9pWXDKBKyxA1towrHqdYN2g';
    console.log('🔑 App.tsx using Google API Key:', googleApiKey.substring(0, 10) + '...');
    ttsService.initialize(googleApiKey).then(() => {
      console.log('🎭 AGGRESSIVE: Google TTS service initialized successfully');
    }).catch(error => {
      console.error('❌ Failed to initialize Google TTS service:', error);
      console.log('🔄 Will fallback to browser TTS');
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

  // Handle LLM response - NO TTS HERE, just return the response
  const handleLLMResponse = async (response: string) => {
    console.log('🎭 MAIN APP: LLM response received, delegating to AvatarChatOverlay for TTS and animation');
    console.log('🎭 MAIN APP: Response:', response.substring(0, 100) + '...');
    
    // NO TTS or animation here - AvatarChatOverlay handles everything
    // Just return the response so AvatarChatOverlay can process it
    return response;
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

        {/* Echo Assistant Demo Button - top left corner */}
        <Button
          type="text"
          onClick={() => window.location.href = '/echo-assistant-demo'}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 1002,
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          🤖 Echo Demo
        </Button>

        {/* Google TTS Test Button - top left, below demo button */}
        <Button
          type="text"
          onClick={async () => {
            console.log('🎤 Testing Google TTS directly...');
            try {
              await ttsService.speak('Hello! This is a test of Google TTS with Indian male voice using the correct API key!', {
                language: 'en-IN',
                voice: 'en-IN-Neural2-B',
                rate: 1.0,
                pitch: 0.0,
                volume: 0.0,
                emotion: 'neutral'
              });
              console.log('✅ Google TTS test completed successfully!');
            } catch (error) {
              console.error('❌ Google TTS test failed:', error);
            }
          }}
          style={{
            position: 'absolute',
            top: 70,
            left: 20,
            zIndex: 1002,
            background: 'rgba(0,255,0,0.7)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🎤 Test Google TTS
        </Button>

        {/* Animation Test Button */}
        <Button
          type="text"
          onClick={() => {
            console.log('🎭 Testing animation directly...');
            if ((window as any).playEchoAnimation) {
              console.log('🎭 Triggering dance animation...');
              (window as any).playEchoAnimation('excited', 0.8);
            } else {
              console.error('🎭 playEchoAnimation not available!');
              console.log('🎭 Available window properties:', Object.keys(window).filter(k => k.includes('echo') || k.includes('Echo') || k.includes('animation')));
            }
          }}
          style={{
            position: 'absolute',
            top: 120,
            left: 20,
            zIndex: 1002,
            background: 'rgba(255,0,255,0.7)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🎭 Test Animation
        </Button>

        {/* Animation Test Panel Button */}
        <Button
          type="text"
          onClick={() => setShowAnimationTest(true)}
          style={{
            position: 'absolute',
            top: 160,
            left: 20,
            zIndex: 1002,
            background: 'rgba(0,255,255,0.7)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🎭 Animation Panel
        </Button>

        {/* Voice Conversation Button */}
        <Button
          type="text"
          onClick={() => setShowVoiceConversation(true)}
          style={{
            position: 'absolute',
            top: 200,
            left: 20,
            zIndex: 1002,
            background: 'rgba(255,165,0,0.9)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            border: '2px solid #ff6b35'
          }}
        >
          🎤 Voice Chat
        </Button>

        {/* Settings Drawer */}
        <SettingsDrawer 
          open={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
        
        {/* Animation Test Panel Drawer */}
        <Drawer
          title="🎭 Animation Test Panel"
          placement="right"
          size="large"
          open={showAnimationTest}
          onClose={() => setShowAnimationTest(false)}
          styles={{ body: { padding: 0 } }}
        >
          <AnimationTestPanel />
        </Drawer>

        {/* Voice Conversation Drawer */}
        <Drawer
          title="🎤 Voice-Driven AI Assistant"
          placement="left"
          size="large"
          open={showVoiceConversation}
          onClose={() => setShowVoiceConversation(false)}
          styles={{ body: { padding: 16 } }}
        >
          <VoiceDrivenConversationSystem />
        </Drawer>
        
        <PerformanceMonitor />
        
        {/* Model State Monitor */}
        <ModelStateMonitor 
          isVisible={showModelMonitor}
          onToggleVisibility={() => setShowModelMonitor(!showModelMonitor)}
        />

        {/* Vision System Diagnostics - Top Right */}
        <div className="fixed top-16 right-20 z-[1001] space-y-2">
          <details className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
            <summary className="p-3 cursor-pointer bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
              🔍 Vision Diagnostics
            </summary>
            <div className="w-[500px] max-h-[600px] overflow-auto">
              <VisionDiagnostics />
            </div>
          </details>
          
          <details className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
            <summary className="p-3 cursor-pointer bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
              🔬 Debug Test
            </summary>
            <div className="w-[500px] max-h-[400px] overflow-auto">
              <VisionDebugTest />
            </div>
          </details>
        </div>

        {/* Camera Status Indicator - Top Left */}
        <CameraStatus 
          isActive={cameraActive}
          className="fixed top-16 left-20 z-[1001] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3"
        />

        {/* Speech Integration Helper */}
        <SpeechIntegrationHelper />
        
        {/* Simple Camera Toggle - Below Animation Panel */}
        <SimpleCameraToggle onCameraStateChange={setCameraActive} />

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
        <Route path="/capabilities" element={<CapabilityTestComponent />} />
        <Route path="/animation-demo" element={<AnimationDemo />} />
        <Route path="/google-tts-test" element={<GoogleTTSTest />} />
        <Route path="/google-tts-simple" element={<GoogleTTSTestSimple />} />
        <Route path="/tts-fallback-test" element={<TTSFallbackTest />} />
        <Route path="/echo-assistant-demo" element={<EchoAssistantDemo />} />
        <Route path="/flow-test" element={<FlowValidationTest />} />
      </Routes>
    </Router>
  );
}

export default App;
