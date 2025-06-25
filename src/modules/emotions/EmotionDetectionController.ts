/**
 * Advanced Emotion Detection Controller
 * Real-time emotion analysis from audio and text for BECKY model
 * Integrates with openSMILE and custom emotion classifiers
 */

export interface EmotionResult {
  emotion: string;
  confidence: number;
  intensity: number; // 0-1
  timestamp: number;
  features?: {
    valence: number; // positive/negative (-1 to 1)
    arousal: number; // calm/excited (-1 to 1)
    dominance: number; // submissive/dominant (-1 to 1)
  };
}

export interface EmotionOptions {
  language: 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu';
  sensitivity: number; // 0-1, how sensitive to emotion changes
  smoothing: number; // 0-1, temporal smoothing
  enableTextAnalysis: boolean;
  enableAudioAnalysis: boolean;
  realTimeMode: boolean;
}

export interface AudioFeatures {
  mfcc: number[]; // Mel-frequency cepstral coefficients
  pitch: number[];
  energy: number[];
  spectralCentroid: number[];
  spectralRolloff: number[];
  zeroCrossingRate: number[];
  chroma: number[];
  tonnetz: number[];
}

export class EmotionDetectionController {
  private options: EmotionOptions;
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private isProcessing: boolean = false;
  private emotionHistory: EmotionResult[] = [];
  private currentEmotion: EmotionResult | null = null;

  // Emotion mapping for different languages
  private readonly EMOTION_MAPPINGS = {
    'en': {
      'happy': ['joy', 'excited', 'cheerful', 'delighted', 'pleased'],
      'sad': ['sorrow', 'melancholy', 'dejected', 'downcast', 'gloomy'],
      'angry': ['furious', 'irritated', 'annoyed', 'rage', 'frustrated'],
      'surprised': ['astonished', 'amazed', 'startled', 'shocked', 'stunned'],
      'fear': ['afraid', 'scared', 'terrified', 'anxious', 'worried'],
      'disgust': ['repulsed', 'revolted', 'sickened', 'appalled'],
      'neutral': ['calm', 'composed', 'peaceful', 'balanced', 'stable'],
      'confident': ['assured', 'certain', 'bold', 'self-assured'],
      'empathetic': ['understanding', 'compassionate', 'caring', 'sympathetic']
    },
    'te': {
      'happy': ['సంతోషం', 'ఆనందం', 'హర్షం', 'ఉల్లాసం'],
      'sad': ['దుఃఖం', 'విషాదం', 'శోకం', 'వేదన'],
      'angry': ['కోపం', 'రోషం', 'క్రోధం', 'చిరాకు'],
      'surprised': ['ఆశ్చర్యం', 'విస్మయం', 'అబ్బురం'],
      'fear': ['భయం', 'భీతి', 'భయభీతులు', 'చింత'],
      'neutral': ['సాధారణ', 'శాంతం', 'సమతుల్యత'],
      'confident': ['ఆత్మవిశ్వాసం', 'నమ్మకం', 'ధైర్యం'],
      'empathetic': ['సానుభూతి', 'కరుణ', 'దయ']
    }
  };

  // Audio feature thresholds for emotion detection
  private readonly EMOTION_THRESHOLDS = {
    'happy': {
      pitch: { min: 150, max: 300 },
      energy: { min: 0.6, max: 1.0 },
      spectralCentroid: { min: 2000, max: 4000 },
      tempo: { min: 1.1, max: 1.4 }
    },
    'sad': {
      pitch: { min: 80, max: 150 },
      energy: { min: 0.2, max: 0.5 },
      spectralCentroid: { min: 1000, max: 2000 },
      tempo: { min: 0.7, max: 0.9 }
    },
    'angry': {
      pitch: { min: 120, max: 250 },
      energy: { min: 0.7, max: 1.0 },
      spectralCentroid: { min: 2500, max: 5000 },
      tempo: { min: 1.2, max: 1.6 }
    },
    'surprised': {
      pitch: { min: 200, max: 400 },
      energy: { min: 0.5, max: 0.8 },
      spectralCentroid: { min: 3000, max: 6000 },
      tempo: { min: 1.0, max: 1.3 }
    },
    'fear': {
      pitch: { min: 180, max: 350 },
      energy: { min: 0.4, max: 0.7 },
      spectralCentroid: { min: 2800, max: 5500 },
      tempo: { min: 1.1, max: 1.5 }
    },
    'confident': {
      pitch: { min: 100, max: 180 },
      energy: { min: 0.6, max: 0.9 },
      spectralCentroid: { min: 1800, max: 3000 },
      tempo: { min: 0.9, max: 1.1 }
    },
    'neutral': {
      pitch: { min: 120, max: 200 },
      energy: { min: 0.4, max: 0.6 },
      spectralCentroid: { min: 1500, max: 2500 },
      tempo: { min: 0.9, max: 1.1 }
    }
  };

  // BECKY facial expression mappings
  private readonly FACIAL_EXPRESSION_MAPPINGS = {
    'happy': {
      mouth: 'smile_genuine',
      eyes: 'eyes_happy',
      eyebrows: 'eyebrows_relaxed',
      cheeks: 'cheeks_rosy',
      intensity: 0.8
    },
    'excited': {
      mouth: 'smile_broad',
      eyes: 'eyes_wide_excited',
      eyebrows: 'eyebrows_raised',
      cheeks: 'cheeks_rosy',
      intensity: 1.0
    },
    'sad': {
      mouth: 'mouth_slightly_down',
      eyes: 'eyes_sad',
      eyebrows: 'eyebrows_lowered',
      cheeks: 'cheeks_neutral',
      intensity: 0.7
    },
    'angry': {
      mouth: 'mouth_tight',
      eyes: 'eyes_narrow',
      eyebrows: 'eyebrows_angry',
      cheeks: 'cheeks_tight',
      intensity: 0.9
    },
    'surprised': {
      mouth: 'mouth_slightly_open',
      eyes: 'eyes_wide_surprised',
      eyebrows: 'eyebrows_high',
      cheeks: 'cheeks_neutral',
      intensity: 0.8
    },
    'fear': {
      mouth: 'mouth_slightly_open',
      eyes: 'eyes_wide_surprised',
      eyebrows: 'eyebrows_raised',
      cheeks: 'cheeks_neutral',
      intensity: 0.7
    },
    'confident': {
      mouth: 'mouth_relaxed',
      eyes: 'eyes_calm',
      eyebrows: 'eyebrows_relaxed',
      cheeks: 'cheeks_neutral',
      intensity: 0.6
    },
    'empathetic': {
      mouth: 'mouth_relaxed',
      eyes: 'eyes_concerned',
      eyebrows: 'eyebrows_furrowed',
      cheeks: 'cheeks_neutral',
      intensity: 0.5
    },
    'neutral': {
      mouth: 'neutral',
      eyes: 'neutral',
      eyebrows: 'neutral',
      cheeks: 'neutral',
      intensity: 0.3
    }
  };

  constructor(options: Partial<EmotionOptions> = {}) {
    this.options = {
      language: 'en',
      sensitivity: 0.7,
      smoothing: 0.3,
      enableTextAnalysis: true,
      enableAudioAnalysis: true,
      realTimeMode: true,
      ...options
    };

    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 2048;
      this.analyzer.smoothingTimeConstant = 0.8;
      
      console.log('😊 Emotion Detection AudioContext initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AudioContext for emotion detection:', error);
    }
  }

  /**
   * Analyze emotion from text using sentiment analysis
   */
  public async analyzeTextEmotion(text: string): Promise<EmotionResult> {
    console.log('📝 Analyzing text emotion:', text.substring(0, 50) + '...');

    try {
      const emotion = await this.performTextSentimentAnalysis(text);
      const result: EmotionResult = {
        emotion: emotion.emotion,
        confidence: emotion.confidence,
        intensity: emotion.intensity,
        timestamp: Date.now() / 1000,
        features: {
          valence: emotion.valence,
          arousal: emotion.arousal,
          dominance: emotion.dominance
        }
      };

      this.updateEmotionHistory(result);
      return result;
    } catch (error) {
      console.error('❌ Error analyzing text emotion:', error);
      return this.getNeutralEmotion();
    }
  }

  /**
   * Analyze emotion from audio in real-time
   */
  public async analyzeAudioEmotion(audioBuffer: ArrayBuffer): Promise<EmotionResult> {
    console.log('🎤 Analyzing audio emotion');

    try {
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      const features = await this.extractAudioFeatures(audioBuffer);
      const emotion = this.classifyAudioEmotion(features);
      
      const result: EmotionResult = {
        emotion: emotion.emotion,
        confidence: emotion.confidence,
        intensity: emotion.intensity,
        timestamp: Date.now() / 1000,
        features: {
          valence: emotion.valence,
          arousal: emotion.arousal,
          dominance: emotion.dominance
        }
      };

      this.updateEmotionHistory(result);
      return result;
    } catch (error) {
      console.error('❌ Error analyzing audio emotion:', error);
      return this.getNeutralEmotion();
    }
  }

  /**
   * Start real-time emotion analysis from audio stream
   */
  public startRealTimeAnalysis(stream: MediaStream, callback: (emotion: EmotionResult) => void): void {
    if (!this.audioContext || !this.analyzer) {
      console.error('❌ AudioContext not initialized for emotion detection');
      return;
    }

    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyzer);

    this.isProcessing = true;
    this.processRealTimeEmotion(callback);
  }

  public stopRealTimeAnalysis(): void {
    this.isProcessing = false;
  }

  private async processRealTimeEmotion(callback: (emotion: EmotionResult) => void): Promise<void> {
    if (!this.analyzer || !this.isProcessing) return;

    const bufferLength = this.analyzer.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);
    
    const analyze = () => {
      if (!this.isProcessing) return;

      this.analyzer!.getByteFrequencyData(frequencyData);
      this.analyzer!.getByteTimeDomainData(timeData);
      
      const emotion = this.analyzeRealTimeFeatures(frequencyData, timeData);
      if (emotion) {
        this.updateEmotionHistory(emotion);
        callback(emotion);
      }

      requestAnimationFrame(analyze);
    };

    analyze();
  }

  private analyzeRealTimeFeatures(frequencyData: Uint8Array, timeData: Uint8Array): EmotionResult | null {
    // Extract basic audio features for real-time emotion detection
    const energy = this.calculateEnergy(timeData);
    const pitch = this.estimatePitch(frequencyData);
    const spectralCentroid = this.calculateSpectralCentroid(frequencyData);
    
    if (energy < 10) {
      return null; // Too quiet to analyze
    }

    // Simple emotion classification based on audio features
    const emotion = this.classifyBasicEmotion(pitch, energy, spectralCentroid);
    
    return {
      emotion: emotion.emotion,
      confidence: emotion.confidence,
      intensity: Math.min(energy / 100, 1),
      timestamp: Date.now() / 1000,
      features: {
        valence: emotion.valence,
        arousal: emotion.arousal,
        dominance: emotion.dominance
      }
    };
  }

  private calculateEnergy(timeData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / timeData.length) * 100;
  }

  private estimatePitch(frequencyData: Uint8Array): number {
    // Simple pitch estimation using frequency domain
    let maxIndex = 0;
    let maxValue = 0;
    
    for (let i = 0; i < frequencyData.length / 4; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }
    
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const fftSize = this.analyzer?.fftSize || 2048;
    return (maxIndex * sampleRate) / fftSize;
  }

  private calculateSpectralCentroid(frequencyData: Uint8Array): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      weightedSum += i * frequencyData[i];
      magnitudeSum += frequencyData[i];
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private classifyBasicEmotion(pitch: number, energy: number, spectralCentroid: number): {
    emotion: string;
    confidence: number;
    valence: number;
    arousal: number;
    dominance: number;
  } {
    const emotions = Object.keys(this.EMOTION_THRESHOLDS);
    let bestMatch = 'neutral';
    let bestScore = 0;

    for (const emotion of emotions) {
      const thresholds = this.EMOTION_THRESHOLDS[emotion as keyof typeof this.EMOTION_THRESHOLDS];
      let score = 0;

      // Check pitch match
      if (pitch >= thresholds.pitch.min && pitch <= thresholds.pitch.max) {
        score += 0.3;
      }

      // Check energy match
      const normalizedEnergy = energy / 100;
      if (normalizedEnergy >= thresholds.energy.min && normalizedEnergy <= thresholds.energy.max) {
        score += 0.4;
      }

      // Check spectral centroid match
      if (spectralCentroid >= thresholds.spectralCentroid.min && spectralCentroid <= thresholds.spectralCentroid.max) {
        score += 0.3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = emotion;
      }
    }

    // Map emotion to valence/arousal/dominance
    const emotionMapping = this.getEmotionDimensions(bestMatch);

    return {
      emotion: bestMatch,
      confidence: bestScore,
      valence: emotionMapping.valence,
      arousal: emotionMapping.arousal,
      dominance: emotionMapping.dominance
    };
  }

  private getEmotionDimensions(emotion: string): { valence: number; arousal: number; dominance: number } {
    const dimensions = {
      'happy': { valence: 0.8, arousal: 0.6, dominance: 0.5 },
      'excited': { valence: 0.9, arousal: 0.9, dominance: 0.7 },
      'sad': { valence: -0.7, arousal: -0.5, dominance: -0.3 },
      'angry': { valence: -0.6, arousal: 0.8, dominance: 0.8 },
      'surprised': { valence: 0.3, arousal: 0.8, dominance: 0.2 },
      'fear': { valence: -0.5, arousal: 0.7, dominance: -0.5 },
      'confident': { valence: 0.5, arousal: 0.3, dominance: 0.8 },
      'empathetic': { valence: 0.3, arousal: 0.2, dominance: 0.4 },
      'neutral': { valence: 0, arousal: 0, dominance: 0 }
    };

    return dimensions[emotion as keyof typeof dimensions] || dimensions.neutral;
  }

  private async performTextSentimentAnalysis(text: string): Promise<{
    emotion: string;
    confidence: number;
    intensity: number;
    valence: number;
    arousal: number;
    dominance: number;
  }> {
    // Simple sentiment analysis - in production, use more sophisticated NLP
    const words = text.toLowerCase().split(/\s+/);
    const emotionScores = {
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      fear: 0,
      confident: 0,
      empathetic: 0,
      neutral: 0
    };

    const emotionKeywords = this.EMOTION_MAPPINGS[this.options.language] || this.EMOTION_MAPPINGS.en;

    // Score based on keyword matching
    for (const word of words) {
      for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        if (keywords.some(keyword => word.includes(keyword.toLowerCase()))) {
          emotionScores[emotion as keyof typeof emotionScores] += 1;
        }
      }
    }

    // Simple heuristics for common patterns
    if (text.includes('!')) emotionScores.excited += 0.5;
    if (text.includes('?')) emotionScores.surprised += 0.3;
    if (text.match(/[A-Z]{2,}/)) emotionScores.angry += 0.4; // ALL CAPS
    
    // Find dominant emotion
    let dominantEmotion = 'neutral';
    let maxScore = 0;
    
    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    }

    const confidence = Math.min(maxScore / words.length, 1);
    const intensity = Math.min(maxScore * 0.5, 1);
    const dimensions = this.getEmotionDimensions(dominantEmotion);

    return {
      emotion: dominantEmotion,
      confidence,
      intensity,
      valence: dimensions.valence,
      arousal: dimensions.arousal,
      dominance: dimensions.dominance
    };
  }

  private async extractAudioFeatures(audioBuffer: ArrayBuffer): Promise<AudioFeatures> {
    // Placeholder for advanced audio feature extraction
    // In production, this would use openSMILE or similar
    return {
      mfcc: [],
      pitch: [],
      energy: [],
      spectralCentroid: [],
      spectralRolloff: [],
      zeroCrossingRate: [],
      chroma: [],
      tonnetz: []
    };
  }

  private classifyAudioEmotion(features: AudioFeatures): {
    emotion: string;
    confidence: number;
    intensity: number;
    valence: number;
    arousal: number;
    dominance: number;
  } {
    // Placeholder for ML-based emotion classification
    // In production, this would use trained models
    return {
      emotion: 'neutral',
      confidence: 0.5,
      intensity: 0.5,
      valence: 0,
      arousal: 0,
      dominance: 0
    };
  }

  private updateEmotionHistory(emotion: EmotionResult): void {
    this.emotionHistory.push(emotion);
    
    // Keep only recent emotions (last 10 seconds)
    const cutoff = Date.now() / 1000 - 10;
    this.emotionHistory = this.emotionHistory.filter(e => e.timestamp > cutoff);
    
    // Apply smoothing
    if (this.options.smoothing > 0 && this.currentEmotion) {
      emotion.confidence = this.currentEmotion.confidence * this.options.smoothing + 
                          emotion.confidence * (1 - this.options.smoothing);
      emotion.intensity = this.currentEmotion.intensity * this.options.smoothing + 
                         emotion.intensity * (1 - this.options.smoothing);
    }
    
    this.currentEmotion = emotion;
  }

  private getNeutralEmotion(): EmotionResult {
    return {
      emotion: 'neutral',
      confidence: 1.0,
      intensity: 0.3,
      timestamp: Date.now() / 1000,
      features: {
        valence: 0,
        arousal: 0,
        dominance: 0
      }
    };
  }

  /**
   * Get the current dominant emotion
   */
  public getCurrentEmotion(): EmotionResult | null {
    return this.currentEmotion;
  }

  /**
   * Get facial expression mapping for current emotion
   */
  public getFacialExpressionForEmotion(emotion: string): any {
    return this.FACIAL_EXPRESSION_MAPPINGS[emotion as keyof typeof this.FACIAL_EXPRESSION_MAPPINGS] || 
           this.FACIAL_EXPRESSION_MAPPINGS.neutral;
  }

  /**
   * Get emotion history
   */
  public getEmotionHistory(): EmotionResult[] {
    return [...this.emotionHistory];
  }

  /**
   * Update options
   */
  public updateOptions(newOptions: Partial<EmotionOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.stopRealTimeAnalysis();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

const emotionControllerInstance = new EmotionDetectionController();

export function setEmotion(emotion: string) {
  // Set the current emotion and trigger facial expression
  emotionControllerInstance.currentEmotion = {
    emotion,
    confidence: 1,
    intensity: 1,
    timestamp: Date.now(),
  };
  // Optionally, trigger facial expression update here
  // e.g., updateFacialExpression(emotionControllerInstance.getFacialExpressionForEmotion(emotion));
}

export { emotionControllerInstance };
