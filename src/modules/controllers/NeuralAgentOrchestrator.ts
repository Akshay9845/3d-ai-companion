// NeuralAgentOrchestrator.ts
// Central controller for LLM-driven avatar animation
import { animationService } from '../../lib/animationService';
import { triggerLipSync } from '../lipSync/AdvancedLipSyncController';

// Optionally import and parse FBX/JSON for mesh/part lookups
// import fbxJson from '../../../public/BECKY/BECKY/Woman_Brown_Skirt_01_Blender.json';

export type AvatarAction = 'wave' | 'smile' | 'blink' | 'nod' | 'shakeHead' | 'raiseHand' | 'point' | 'frown' | 'surprised';

class NeuralAgentOrchestrator {
  // Singleton pattern
  static instance: NeuralAgentOrchestrator;
  static getInstance() {
    if (!NeuralAgentOrchestrator.instance) {
      NeuralAgentOrchestrator.instance = new NeuralAgentOrchestrator();
    }
    return NeuralAgentOrchestrator.instance;
  }

  // Main entry: drive avatar from LLM output
  async driveFromLLM({ text, emotion, intent, actions, audioUrl }: {
    text: string,
    emotion?: string,
    intent?: string,
    actions?: AvatarAction[],
    audioUrl?: string
  }) {
    // 1. Trigger emotion/expression
    if (emotion) animationService.setEmotion(emotion);
    // 2. Trigger gestures/actions
    if (actions) for (const act of actions) await this.performAction(act);
    // 3. Trigger lip sync if audio
    if (audioUrl) triggerLipSync(audioUrl);
    // 4. Retarget if needed (for imported animations)
    // ...
  }

  // Expose methods for each test action
  async performAction(action: AvatarAction) {
    console.log('🧠 NeuralAgentOrchestrator performing action:', action);
    
    switch (action) {
      case 'wave':
        animationService.wave(1);
        break;
      case 'smile':
        animationService.smile(1);
        break;
      case 'blink':
        animationService.blink(1);
        break;
      case 'nod':
        animationService.nod(1);
        break;
      case 'shakeHead':
        animationService.shakeHead(1);
        break;
      case 'raiseHand':
        animationService.raiseHand(1);
        break;
      case 'point':
        animationService.point(1);
        break;
      case 'frown':
        animationService.frown(1);
        break;
      case 'surprised':
        animationService.surprised(1);
        break;
      default:
        console.warn('🧠 Unknown action:', action);
    }
  }
}

export const neuralAgentOrchestrator = NeuralAgentOrchestrator.getInstance(); 