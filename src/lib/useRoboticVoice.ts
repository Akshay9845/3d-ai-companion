import { useCallback, useState } from 'react';

export type RobotVoiceMode = 'natural' | 'robotic' | 'enhanced' | 'custom';

export interface RobotVoiceSettings {
  mode: RobotVoiceMode;
  pitch: number;
  rate: number;
  volume: number;
  roboticLevel: number;
  effects: {
    reverb: boolean;
    echo: boolean;
    distortion: boolean;
  };
}

const defaultSettings: RobotVoiceSettings = {
  mode: 'natural',
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
  roboticLevel: 0.0,
  effects: {
    reverb: false,
    echo: false,
    distortion: false,
  },
};

export const useRoboticVoice = () => {
  const [settings, setSettings] = useState<RobotVoiceSettings>(defaultSettings);

  const updateSettings = useCallback((newSettings: Partial<RobotVoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const setMode = useCallback((mode: RobotVoiceMode) => {
    setSettings(prev => {
      const newSettings = { ...prev, mode };
      
      // Apply mode-specific presets
      switch (mode) {
        case 'natural':
          newSettings.pitch = 1.0;
          newSettings.rate = 1.0;
          newSettings.roboticLevel = 0.0;
          newSettings.effects = { reverb: false, echo: false, distortion: false };
          break;
        case 'robotic':
          newSettings.pitch = 0.8;
          newSettings.rate = 0.9;
          newSettings.roboticLevel = 0.7;
          newSettings.effects = { reverb: true, echo: false, distortion: false };
          break;
        case 'enhanced':
          newSettings.pitch = 1.1;
          newSettings.rate = 1.0;
          newSettings.roboticLevel = 0.3;
          newSettings.effects = { reverb: true, echo: true, distortion: false };
          break;
        case 'custom':
          // Keep current settings
          break;
      }
      
      return newSettings;
    });
  }, []);

  const applyToSpeechSynthesis = useCallback((utterance: SpeechSynthesisUtterance) => {
    utterance.pitch = settings.pitch;
    utterance.rate = settings.rate;
    utterance.volume = settings.volume;
    
    // Apply robotic effects if enabled
    if (settings.roboticLevel > 0) {
      // Note: Browser speech synthesis has limited effects
      // For more advanced effects, you'd need Web Audio API
      utterance.pitch = settings.pitch * (1 - settings.roboticLevel * 0.3);
      utterance.rate = settings.rate * (1 - settings.roboticLevel * 0.2);
    }
  }, [settings]);

  const getVoiceDescription = useCallback(() => {
    switch (settings.mode) {
      case 'natural':
        return 'Natural human-like voice';
      case 'robotic':
        return 'Classic robotic voice with metallic tone';
      case 'enhanced':
        return 'Enhanced voice with subtle robotic elements';
      case 'custom':
        return 'Custom voice settings';
      default:
        return 'Unknown voice mode';
    }
  }, [settings.mode]);

  return {
    settings,
    updateSettings,
    setMode,
    applyToSpeechSynthesis,
    getVoiceDescription,
  };
}; 