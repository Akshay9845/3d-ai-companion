import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ModernChatInputSimple from '../components/Chat/ModernChatInputSimple';

// Mock all the AI services
vi.mock('../lib/faceVisionService', () => ({
  faceVisionService: {
    initialize: vi.fn().mockResolvedValue(true),
    startProcessing: vi.fn(),
    stopProcessing: vi.fn(),
    getFaceResults: vi.fn().mockReturnValue({
      faceDetected: true,
      dominantEmotion: 'happy',
      emotions: { happy: 0.8, neutral: 0.2 }
    })
  }
}));

vi.mock('../lib/mediaPipeService', () => ({
  mediaPipeService: {
    initialize: vi.fn().mockResolvedValue(true),
    startProcessing: vi.fn(),
    stopProcessing: vi.fn(),
    isInitialized: vi.fn().mockReturnValue(true),
    getHandResults: vi.fn().mockReturnValue({ landmarks: [] }),
    getGestureResults: vi.fn().mockReturnValue({ gestures: [] })
  }
}));

vi.mock('../lib/userRecognitionService', () => ({
  userRecognitionService: {
    initialize: vi.fn().mockResolvedValue(true),
    processVideoFrame: vi.fn().mockResolvedValue({
      id: 'user123',
      name: 'Test User',
      personalityTag: 'friendly'
    })
  }
}));

vi.mock('../lib/unifiedPerceptionService', () => ({
  unifiedPerceptionService: {
    analyzeImage: vi.fn().mockResolvedValue({
      person: {
        detected: true,
        faceDetails: { dominantEmotion: 'happy' },
        attention: 'looking',
        handGestures: ['waving']
      },
      scene: { objects: [], lighting: 'good' },
      summary: 'Person detected with happy expression'
    })
  }
}));

vi.mock('../lib/enhancedUnifiedBrainService', () => ({
  EnhancedUnifiedBrainService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(true),
    processAndRespond: vi.fn().mockResolvedValue({
      response: 'Hello! I can see you and you look happy!',
      emotion: 'cheerful',
      animations: ['wave_greeting']
    })
  }))
}));

// Mock media devices
const mockGetUserMedia = vi.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  },
  configurable: true
});

// Mock createImageBitmap
global.createImageBitmap = vi.fn().mockResolvedValue({
  width: 640,
  height: 480
});

describe('ModernChatInputSimple - Complete Backend Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    });
  });

  it('should initialize all AI services on mount', async () => {
    render(<ModernChatInputSimple />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type message/)).toBeInTheDocument();
    });

    // Verify services were initialized
    const { faceVisionService } = await import('../lib/faceVisionService');
    const { mediaPipeService } = await import('../lib/mediaPipeService');
    const { userRecognitionService } = await import('../lib/userRecognitionService');
    
    expect(faceVisionService.initialize).toHaveBeenCalled();
    expect(mediaPipeService.initialize).toHaveBeenCalled();
    expect(userRecognitionService.initialize).toHaveBeenCalledWith({
      useAzure: true,
      useMediaPipe: true
    });
  });

  it('should activate vision processing when camera is enabled', async () => {
    render(<ModernChatInputSimple />);
    
    const cameraButton = screen.getByTitle(/Start AI Vision/);
    fireEvent.click(cameraButton);
    
    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: { width: 640, height: 480 }
      });
    });

    // Should show vision status indicators
    await waitFor(() => {
      expect(screen.getByText('👤 Test User')).toBeInTheDocument();
      expect(screen.getByText(/Person detected/)).toBeInTheDocument();
    });
  });

  it('should process messages with full AI context', async () => {
    const { EnhancedUnifiedBrainService } = await import('../lib/enhancedUnifiedBrainService');
    const mockProcessAndRespond = vi.fn().mockResolvedValue({
      response: 'Context-aware response!',
      emotion: 'excited'
    });
    
    EnhancedUnifiedBrainService.mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(true),
      processAndRespond: mockProcessAndRespond
    }));

    render(<ModernChatInputSimple />);
    
    // Enable camera first
    const cameraButton = screen.getByTitle(/Start AI Vision/);
    fireEvent.click(cameraButton);
    
    await waitFor(() => {
      expect(screen.getByText('👤 Test User')).toBeInTheDocument();
    });

    // Send a message
    const textarea = screen.getByPlaceholderText(/Echo can see you/);
    fireEvent.change(textarea, { target: { value: 'Hello Echo!' } });
    
    const sendButton = screen.getByTitle('Send');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockProcessAndRespond).toHaveBeenCalledWith(
        'Hello Echo!',
        expect.objectContaining({
          user: expect.objectContaining({ name: 'Test User' }),
          visionContext: expect.objectContaining({
            person: expect.objectContaining({ detected: true })
          }),
          emotionalState: 'happy'
        })
      );
    });
  });

  it('should handle speech recognition integration', async () => {
    // Mock speech recognition
    const mockSpeechRecognition = {
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
      continuous: false,
      interimResults: false
    };

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: vi.fn(() => mockSpeechRecognition),
      configurable: true
    });

    render(<ModernChatInputSimple />);
    
    const micButton = screen.getByTitle(/Start Voice Input/);
    fireEvent.click(micButton);

    expect(mockSpeechRecognition.start).toHaveBeenCalled();
  });

  it('should display comprehensive status indicators', async () => {
    render(<ModernChatInputSimple />);
    
    // Enable camera
    const cameraButton = screen.getByTitle(/Start AI Vision/);
    fireEvent.click(cameraButton);
    
    await waitFor(() => {
      // Check for user recognition indicator
      expect(screen.getByText('👤 Test User')).toBeInTheDocument();
      
      // Check for vision analysis indicator
      expect(screen.getByText(/👁️ Person detected/)).toBeInTheDocument();
      
      // Check for hand gesture indicator
      expect(screen.getByText('👋 waving')).toBeInTheDocument();
    });
  });

  it('should handle errors gracefully', async () => {
    const { faceVisionService } = await import('../lib/faceVisionService');
    faceVisionService.initialize.mockRejectedValueOnce(new Error('Vision service failed'));

    render(<ModernChatInputSimple />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to initialize AI services/)).toBeInTheDocument();
    });
  });

  it('should clean up resources on unmount', () => {
    const { unmount } = render(<ModernChatInputSimple />);
    
    const { faceVisionService } = require('../lib/faceVisionService');
    const { mediaPipeService } = require('../lib/mediaPipeService');
    
    unmount();
    
    expect(faceVisionService.stopProcessing).toHaveBeenCalled();
    expect(mediaPipeService.stopProcessing).toHaveBeenCalled();
  });
});
