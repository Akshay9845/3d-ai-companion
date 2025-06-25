import { create } from 'zustand';
import {
  Conversation,
  Message,
  MessageRole,
  EmotionType,
  AvatarState,
  ConversationRow,
  CharacterType,
} from '../types';
import { supabase } from '../lib/supabase';
import { PerceptionResult } from '../lib/unifiedPerceptionService';

// Import RobotVoiceMode type
import { RobotVoiceMode } from '../lib/useRoboticVoice';
import { getPermissionPreference } from '../lib/usePermissions';

interface AppState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isRecording: boolean;
  isCameraActive: boolean;
  cameraPermissionGranted: boolean; // Track if camera permission has been granted
  isDarkMode: boolean;
  avatarState: AvatarState;
  modelCommand?: string;
  setModelCommand?: (command: string) => void;
  currentViseme: number | null;
  setCurrentViseme: (viseme: number | null) => void;

  // Robot Voice settings
  robotVoiceMode: RobotVoiceMode;
  setRobotVoiceMode: (mode: RobotVoiceMode) => void;

  // Teaching-related state
  teachingActive: boolean;
  currentActivity: any | null;
  teachingFeedback: any[];
  setTeachingActive: (active: boolean) => void;
  setCurrentActivity: (activity: any | null) => void;
  addTeachingFeedback: (feedback: any) => void;
  clearTeachingFeedback: () => void;

  // Vision and face detection data
  faceDetectionEnabled: boolean;
  detectedFace: {
    faceDetected: boolean;
    dominantEmotion: string | null;
    age: number | null;
    gender: string | null;
    lastDetectedAt: Date | null;
    landmarks: any | null;
  };
  detectedObjects: Array<{ label: string; confidence: number }>;
  detectedText: string | null;

  // Enhanced vision perception results
  visionResult: PerceptionResult | null;
  setVisionResult: (result: PerceptionResult | null) => void;

  // Enhanced model manager state
  modelLoaded: boolean;
  setModelLoaded: (loaded: boolean) => void;
  modelLoadProgress: number;
  setModelLoadProgress: (progress: number) => void;

  // Character system
  currentCharacterId: string;
  setCurrentCharacterId: (characterId: string) => void;
  characterType: CharacterType;

  // Echo character settings
  echoPersonality: {
    name: string;
    traits: string[];
    backstory: string;
    interests: string[];
    currentMood: string;
  };

  // Actions
  setDarkMode: (isDark: boolean) => void;
  toggleRecording: () => void;
  toggleCamera: () => void;
  setCameraPermission: (granted: boolean) => void;
  toggleFaceDetection: () => void;
  setAvatarEmotion: (emotion: EmotionType) => void;
  setAvatarSpeaking: (isSpeaking: boolean) => void;
  updateDetectedFace: (faceData: any) => void;
  updateDetectedObjects: (objects: any[]) => void;
  updateDetectedText: (text: string | null) => void;
  updateEchoMood: (mood: string) => void;
  addMessage: (content: string, role: MessageRole) => void;
  createNewConversation: () => void;
  setCurrentConversation: (id: string) => void;
  loadConversations: () => Promise<void>;
  removeMessageById: (messageId: string) => void;
}

// Initial state
// Check localStorage for stored permissions
const getInitialCameraPermission = () => {
  const storedPermission = getPermissionPreference('camera');
  return storedPermission === 'granted';
};

const initialState = {
  conversations: [],
  currentConversationId: null,
  isRecording: false,
  isCameraActive: false,
  cameraPermissionGranted: getInitialCameraPermission(),
  isDarkMode: true,
  avatarState: {
    isSpeaking: false,
    emotion: EmotionType.NEUTRAL,
    blinkRate: 0.5,
  },
  modelCommand: '',
  currentViseme: null,
  robotVoiceMode: 'natural' as RobotVoiceMode,

  // Teaching-related state
  teachingActive: false,
  currentActivity: null,
  teachingFeedback: [],

  // Vision and face detection data
  faceDetectionEnabled: false,
  detectedFace: {
    faceDetected: false,
    dominantEmotion: null,
    age: null,
    gender: null,
    lastDetectedAt: null,
    landmarks: null,
  },
  detectedObjects: [],
  detectedText: null,

  // Enhanced vision perception results
  visionResult: null,

  // Enhanced model manager state
  modelLoaded: false,
  modelLoadProgress: 0,

  // Character system
  currentCharacterId: 'robot_assistant',
  characterType: CharacterType.ROBOT,

  // Echo character settings
  echoPersonality: {
    name: 'Echo',
    traits: ['curious', 'empathetic', 'perceptive', 'witty', 'helpful'],
    backstory:
      'Echo was created as an advanced AI companion designed to understand human emotions and provide meaningful interactions. With enhanced perception abilities through vision and hearing, Echo aims to bridge the gap between technology and human connection.',
    interests: [
      'human behavior',
      'art',
      'literature',
      'science',
      'philosophy',
      'music',
    ],
    currentMood: 'curious',
  },
};

// Add a getter function for store state that can be used outside of components
export const getStore = () => useStore;
export const getMessages = () => {
  const state = useStore.getState();
  const currentId = state.currentConversationId;
  if (!currentId) return [];

  const conversation = state.conversations.find(conv => conv.id === currentId);
  return conversation?.messages || [];
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,
  setCurrentViseme: viseme => {
    console.log('[STORE] setCurrentViseme called with', viseme);
    set({ currentViseme: viseme });
  },
  setModelCommand: command => set({ modelCommand: command }),
  setRobotVoiceMode: mode => set({ robotVoiceMode: mode }),
  setDarkMode: isDark => set({ isDarkMode: isDark }),

  toggleRecording: () => set(state => ({ isRecording: !state.isRecording })),

  toggleCamera: () =>
    set(state => ({
      isCameraActive: !state.isCameraActive,
    })),

  setCameraPermission: (granted: boolean) =>
    set({
      cameraPermissionGranted: granted,
    }),

  toggleFaceDetection: () =>
    set(state => ({
      faceDetectionEnabled: !state.faceDetectionEnabled,
    })),

  setAvatarEmotion: emotion =>
    set(state => ({
      avatarState: { ...state.avatarState, emotion },
    })),

  setAvatarSpeaking: isSpeaking =>
    set(state => ({
      avatarState: { ...state.avatarState, isSpeaking },
    })),

  updateDetectedFace: faceData =>
    set({
      detectedFace: {
        faceDetected: faceData.faceDetected || false,
        dominantEmotion: faceData.dominantEmotion,
        age: faceData.age,
        gender: faceData.gender,
        // Store additional face data for Echo's perception
        lastDetectedAt: faceData.faceDetected ? new Date() : null,
        landmarks: faceData.landmarks || null,
      },
    }),

  updateDetectedObjects: objects =>
    set({
      detectedObjects: objects.map(obj => ({
        label: obj.label,
        confidence: obj.confidence,
      })),
    }),

  updateDetectedText: text => set({ detectedText: text }),

  updateEchoMood: mood =>
    set(state => ({
      echoPersonality: {
        ...state.echoPersonality,
        currentMood: mood,
      },
    })),

  setVisionResult: result => set({ visionResult: result }),

  setModelLoaded: loaded => set({ modelLoaded: loaded }),

  setModelLoadProgress: progress => set({ modelLoadProgress: progress }),

  // Teaching-related actions
  setTeachingActive: active => set({ teachingActive: active }),

  setCurrentActivity: activity => set({ currentActivity: activity }),

  addTeachingFeedback: feedback =>
    set(state => ({
      teachingFeedback: [...state.teachingFeedback, feedback],
    })),

  clearTeachingFeedback: () => set({ teachingFeedback: [] }),

  loadConversations: async () => {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id,created_at,title')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading conversations:', error);
        alert('Supabase error: ' + (error.message || JSON.stringify(error)));
        throw error;
      }

      set({
        conversations: (conversations || []).map(conv => ({
          ...conv,
          messages: [],
          lastUpdated: conv.created_at,
        })),
      });

      // Set current conversation to the first one if none selected
      const state = get();
      if (!state.currentConversationId && conversations?.length > 0) {
        set({ currentConversationId: conversations[0].id });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Initialize with empty state if there's an error
      set({ conversations: [], currentConversationId: null });
    }
  },

  addMessage: async (content, role) => {
    const state = get();
    let conversationId = state.currentConversationId;

    try {
      // Create new conversation if needed (local first approach)
      if (!conversationId) {
        conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConv: Conversation = {
          id: conversationId,
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          messages: [],
          lastUpdated: new Date(),
        };

        set(state => ({
          conversations: [newConv, ...state.conversations],
          currentConversationId: conversationId,
        }));
      }

      // Create message locally first
      const newMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role,
        content,
        timestamp: new Date(),
      };

      // Optimistically update UI with new message
      set(state => {
        const updatedConversations = state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: [...conv.messages, newMessage],
            };
          }
          return conv;
        });
        return { conversations: updatedConversations };
      }); // Try to sync with Supabase in the background (optional)
      try {
        const { error: msgError } = await supabase.from('messages').insert([
          {
            conversation_id: conversationId,
            role,
            content,
            timestamp: new Date().toISOString(),
          },
        ]);
        if (msgError) {
          console.warn('Failed to sync message to Supabase:', msgError);
          // Continue anyway since we have local storage
        }
      } catch (syncError) {
        console.warn('Background sync failed:', syncError);
        // Continue anyway since we have local storage
      }
    } catch (error) {
      console.error('Error adding message:', error);
      // Handle error gracefully - could add error state if needed
    }
  },

  createNewConversation: async () => {
    try {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert([{ title: 'New conversation' }])
        .select('id,created_at,title')
        .single();

      if (error) throw error;

      set({ currentConversationId: (newConv as ConversationRow)?.id });
      await get().loadConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  },

  setCurrentConversation: id => set({ currentConversationId: id }),

  // Remove a message by ID (useful for removing temporary messages like "Thinking...")
  removeMessageById: (messageId: string) =>
    set(state => {
      const conversationId = state.currentConversationId;
      if (!conversationId) return state;

      const updatedConversations = state.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: conv.messages.filter(msg => msg.id !== messageId),
          };
        }
        return conv;
      });

      return { conversations: updatedConversations };
    }),
}));
