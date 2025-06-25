/**
 * Advanced Lip Sync Controller
 * Real-time viseme generation from audio and text for BECKY model
 * Based on Resemble Lip Sync principles with custom optimizations
 */

export interface Viseme {
  phoneme: string;
  viseme: string;
  timing: number; // timestamp in seconds
  duration: number; // duration in seconds
  intensity: number; // 0-1 intensity
  blendShape?: string; // corresponding 3D blend shape
}

export interface LipSyncOptions {
  language: 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu';
  accuracy: 'fast' | 'balanced' | 'precise';
  smoothing: number; // 0-1, amount of smoothing between visemes
  intensity: number; // 0-1, overall lip movement intensity
  enableCoarticulation: boolean; // blend between adjacent phonemes
  realTimeMode: boolean; // optimize for real-time vs batch processing
}

export interface AudioAnalysis {
  phonemes: Array<{
    phoneme: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  pitch: number[];
  energy: number[];
  voicing: boolean[];
  sampleRate: number;
}

export class LipSyncController {
  private options: LipSyncOptions;
  private visemeMap: Map<string, string>;
  private teluguPhonemeMap: Map<string, string>;
  private blendShapeMap: Map<string, string>;
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private isProcessing: boolean = false;

  // Viseme mapping based on international standards
  private readonly VISEME_MAPPINGS = {
    // English phonemes to visemes
    'AA': 'aa',     // 'father' - wide open
    'AE': 'ae',     // 'cat' - wide
    'AH': 'ah',     // 'but' - medium open
    'AO': 'ao',     // 'caught' - rounded
    'AW': 'aw',     // 'cow' - rounded wide
    'AY': 'ay',     // 'hide' - wide to narrow
    'B': 'pp',      // 'big' - lips together
    'CH': 'ch',     // 'chin' - narrow
    'D': 'dd',      // 'dig' - tongue tip
    'DH': 'th',     // 'then' - tongue between teeth
    'EH': 'eh',     // 'bed' - medium
    'ER': 'er',     // 'bird' - r-colored
    'EY': 'ey',     // 'bait' - medium to narrow
    'F': 'ff',      // 'fork' - teeth on lip
    'G': 'kk',      // 'good' - back closure
    'HH': 'hh',     // 'house' - open
    'IH': 'ih',     // 'bit' - narrow
    'IY': 'iy',     // 'beat' - very narrow
    'JH': 'ch',     // 'judge' - narrow
    'K': 'kk',      // 'key' - back closure
    'L': 'll',      // 'lid' - tongue tip up
    'M': 'pp',      // 'mom' - lips together
    'N': 'nn',      // 'new' - tongue tip up
    'NG': 'nn',     // 'sing' - back closure
    'OW': 'ow',     // 'boat' - rounded
    'OY': 'oy',     // 'boy' - rounded to narrow
    'P': 'pp',      // 'put' - lips together
    'R': 'rr',      // 'red' - r-colored
    'S': 'ss',      // 'sit' - narrow with groove
    'SH': 'sh',     // 'she' - rounded narrow
    'T': 'dd',      // 'top' - tongue tip
    'TH': 'th',     // 'think' - tongue between teeth
    'UH': 'uh',     // 'book' - rounded narrow
    'UW': 'uw',     // 'boot' - very rounded
    'V': 'ff',      // 'very' - teeth on lip
    'W': 'ww',      // 'way' - rounded
    'Y': 'yy',      // 'yes' - narrow
    'Z': 'ss',      // 'zoo' - narrow with groove
    'ZH': 'sh',     // 'measure' - rounded narrow
  };

  // Telugu phoneme mappings
  private readonly TELUGU_PHONEME_MAPPINGS = {
    'అ': 'aa',      // a
    'ఆ': 'aa',      // aa
    'ఇ': 'ih',      // i
    'ఈ': 'iy',      // ii
    'ఉ': 'uh',      // u
    'ఊ': 'uw',      // uu
    'ఋ': 'er',      // ri
    'ఎ': 'eh',      // e
    'ఏ': 'ey',      // ee
    'ఐ': 'ay',      // ai
    'ఒ': 'ao',      // o
    'ఓ': 'ow',      // oo
    'ఔ': 'aw',      // au
    'క': 'kk',      // ka
    'ఖ': 'kk',      // kha
    'గ': 'kk',      // ga
    'ఘ': 'kk',      // gha
    'చ': 'ch',      // cha
    'ఛ': 'ch',      // chha
    'జ': 'ch',      // ja
    'ఝ': 'ch',      // jha
    'ట': 'dd',      // ta
    'ఠ': 'dd',      // tha
    'డ': 'dd',      // da
    'ఢ': 'dd',      // dha
    'ణ': 'nn',      // na
    'త': 'dd',      // ta
    'థ': 'th',      // tha
    'ద': 'dd',      // da
    'ధ': 'th',      // dha
    'న': 'nn',      // na
    'ప': 'pp',      // pa
    'ఫ': 'ff',      // pha
    'బ': 'pp',      // ba
    'భ': 'pp',      // bha
    'మ': 'pp',      // ma
    'య': 'yy',      // ya
    'ర': 'rr',      // ra
    'ల': 'll',      // la
    'వ': 'ww',      // va
    'శ': 'sh',      // sha
    'ష': 'sh',      // sha
    'స': 'ss',      // sa
    'హ': 'hh',      // ha
  };

  // BECKY model blend shape mappings
  private readonly BLEND_SHAPE_MAPPINGS = {
    'aa': 'mouth_open_wide',
    'ae': 'mouth_open_medium',
    'ah': 'mouth_open_small',
    'ao': 'mouth_rounded',
    'aw': 'mouth_rounded_wide',
    'ay': 'mouth_open_to_narrow',
    'pp': 'mouth_closed_lips_together',
    'ch': 'mouth_narrow',
    'dd': 'mouth_closed_tongue_tip',
    'th': 'mouth_closed_tongue_teeth',
    'eh': 'mouth_open_medium',
    'er': 'mouth_r_colored',
    'ey': 'mouth_medium_to_narrow',
    'ff': 'mouth_closed_lips_apart',
    'kk': 'mouth_closed_back',
    'hh': 'mouth_open',
    'ih': 'mouth_narrow',
    'iy': 'mouth_very_narrow',
    'll': 'mouth_closed_tongue_roof',
    'nn': 'mouth_closed_tongue_roof',
    'ow': 'mouth_rounded',
    'oy': 'mouth_rounded_to_narrow',
    'rr': 'mouth_r_colored',
    'ss': 'mouth_closed_teeth_together',
    'sh': 'mouth_rounded_narrow',
    'uh': 'mouth_rounded_narrow',
    'uw': 'mouth_very_rounded',
    'ww': 'mouth_rounded',
    'yy': 'mouth_narrow',
  };

  constructor(options: Partial<LipSyncOptions> = {}) {
    this.options = {
      language: 'en',
      accuracy: 'balanced',
      smoothing: 0.3,
      intensity: 0.8,
      enableCoarticulation: true,
      realTimeMode: true,
      ...options
    };

    this.initializeMappings();
    this.initializeAudioContext();
  }

  private initializeMappings(): void {
    this.visemeMap = new Map(Object.entries(this.VISEME_MAPPINGS));
    this.teluguPhonemeMap = new Map(Object.entries(this.TELUGU_PHONEME_MAPPINGS));
    this.blendShapeMap = new Map(Object.entries(this.BLEND_SHAPE_MAPPINGS));
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 2048;
      this.analyzer.smoothingTimeConstant = 0.8;
      
      console.log('🎤 LipSync AudioContext initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Generate visemes from text using phoneme analysis
   */
  public async generateVisemesFromText(text: string): Promise<Viseme[]> {
    console.log('🎭 Generating visemes from text:', text.substring(0, 50) + '...');
    
    try {
      const phonemes = await this.textToPhonemes(text);
      const visemes = this.phonemesToVisemes(phonemes);
      
      if (this.options.enableCoarticulation) {
        return this.applyCoarticulation(visemes);
      }
      
      return visemes;
    } catch (error) {
      console.error('❌ Error generating visemes from text:', error);
      return [];
    }
  }

  /**
   * Generate visemes from audio using real-time analysis
   */
  public async generateVisemesFromAudio(audioBuffer: ArrayBuffer): Promise<Viseme[]> {
    console.log('🎤 Generating visemes from audio buffer');
    
    try {
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      const analysis = await this.analyzeAudio(audioBuffer);
      const visemes = this.audioAnalysisToVisemes(analysis);
      
      return this.applySmoothing(visemes);
    } catch (error) {
      console.error('❌ Error generating visemes from audio:', error);
      return [];
    }
  }

  /**
   * Real-time viseme generation from live audio stream
   */
  public startRealTimeAnalysis(stream: MediaStream, callback: (viseme: Viseme) => void): void {
    if (!this.audioContext || !this.analyzer) {
      console.error('❌ AudioContext not initialized');
      return;
    }

    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyzer);

    this.isProcessing = true;
    this.processRealTimeAudio(callback);
  }

  public stopRealTimeAnalysis(): void {
    this.isProcessing = false;
  }

  private async processRealTimeAudio(callback: (viseme: Viseme) => void): Promise<void> {
    if (!this.analyzer || !this.isProcessing) return;

    const bufferLength = this.analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const analyze = () => {
      if (!this.isProcessing) return;

      this.analyzer!.getByteFrequencyData(dataArray);
      
      // Simple real-time viseme detection based on frequency analysis
      const viseme = this.frequencyToViseme(dataArray);
      if (viseme) {
        callback(viseme);
      }

      requestAnimationFrame(analyze);
    };

    analyze();
  }

  private frequencyToViseme(frequencyData: Uint8Array): Viseme | null {
    // Simplified real-time viseme detection
    // In production, this would use more sophisticated audio analysis
    
    const lowFreq = this.getAverageFrequency(frequencyData, 0, 300);
    const midFreq = this.getAverageFrequency(frequencyData, 300, 2000);
    const highFreq = this.getAverageFrequency(frequencyData, 2000, 8000);
    
    const energy = (lowFreq + midFreq + highFreq) / 3;
    
    if (energy < 10) {
      return {
        phoneme: 'SIL',
        viseme: 'neutral',
        timing: Date.now() / 1000,
        duration: 0.1,
        intensity: 0,
        blendShape: 'mouth_neutral'
      };
    }

    // Simple heuristic mapping - can be improved with ML
    let viseme = 'aa';
    if (highFreq > midFreq && highFreq > lowFreq) {
      viseme = 'iy'; // High frequency suggests narrow vowels
    } else if (lowFreq > midFreq && lowFreq > highFreq) {
      viseme = 'uw'; // Low frequency suggests rounded vowels
    } else if (midFreq > 50) {
      viseme = 'aa'; // Mid frequency suggests open vowels
    }

    return {
      phoneme: 'REAL_TIME',
      viseme,
      timing: Date.now() / 1000,
      duration: 0.1,
      intensity: Math.min(energy / 100, 1),
      blendShape: this.blendShapeMap.get(viseme) || 'mouth_neutral'
    };
  }

  private getAverageFrequency(data: Uint8Array, startFreq: number, endFreq: number): number {
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const fftSize = this.analyzer?.fftSize || 2048;
    
    const startBin = Math.floor(startFreq * fftSize / sampleRate);
    const endBin = Math.floor(endFreq * fftSize / sampleRate);
    
    let sum = 0;
    for (let i = startBin; i < endBin && i < data.length; i++) {
      sum += data[i];
    }
    
    return sum / (endBin - startBin);
  }

  private async textToPhonemes(text: string): Promise<Array<{phoneme: string, start: number, end: number, confidence: number}>> {
    // Simplified phoneme extraction - in production, use a proper G2P system
    const words = text.toLowerCase().split(/\s+/);
    const phonemes: Array<{phoneme: string, start: number, end: number, confidence: number}> = [];
    
    let currentTime = 0;
    const avgPhonemeLength = 0.08; // Average phoneme duration in seconds
    
    for (const word of words) {
      const wordPhonemes = this.wordToPhonemes(word);
      
      for (const phoneme of wordPhonemes) {
        phonemes.push({
          phoneme,
          start: currentTime,
          end: currentTime + avgPhonemeLength,
          confidence: 0.8
        });
        currentTime += avgPhonemeLength;
      }
      
      // Add pause between words
      currentTime += 0.1;
    }
    
    return phonemes;
  }

  private wordToPhonemes(word: string): string[] {
    // Simplified word-to-phoneme conversion
    // In production, use a proper pronunciation dictionary
    
    if (this.options.language === 'te') {
      return this.teluguWordToPhonemes(word);
    }
    
    // Basic English phoneme mapping
    const phonemes: string[] = [];
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const nextChar = word[i + 1];
      
      // Simple mapping - would be much more sophisticated in production
      switch (char) {
        case 'a':
          phonemes.push(nextChar === 'e' ? 'AE' : 'AH');
          break;
        case 'e':
          phonemes.push('EH');
          break;
        case 'i':
          phonemes.push('IH');
          break;
        case 'o':
          phonemes.push('AO');
          break;
        case 'u':
          phonemes.push('UH');
          break;
        case 'b':
          phonemes.push('B');
          break;
        case 'p':
          phonemes.push('P');
          break;
        case 'm':
          phonemes.push('M');
          break;
        case 't':
          phonemes.push('T');
          break;
        case 'd':
          phonemes.push('D');
          break;
        case 'n':
          phonemes.push('N');
          break;
        case 'k':
          phonemes.push('K');
          break;
        case 'g':
          phonemes.push('G');
          break;
        case 's':
          phonemes.push('S');
          break;
        case 'z':
          phonemes.push('Z');
          break;
        case 'f':
          phonemes.push('F');
          break;
        case 'v':
          phonemes.push('V');
          break;
        case 'l':
          phonemes.push('L');
          break;
        case 'r':
          phonemes.push('R');
          break;
        case 'w':
          phonemes.push('W');
          break;
        case 'y':
          phonemes.push('Y');
          break;
        case 'h':
          phonemes.push('HH');
          break;
        default:
          // Skip unknown characters
          break;
      }
    }
    
    return phonemes;
  }

  private teluguWordToPhonemes(word: string): string[] {
    const phonemes: string[] = [];
    
    for (const char of word) {
      const phoneme = this.teluguPhonemeMap.get(char);
      if (phoneme) {
        phonemes.push(phoneme);
      }
    }
    
    return phonemes;
  }

  private phonemesToVisemes(phonemes: Array<{phoneme: string, start: number, end: number, confidence: number}>): Viseme[] {
    return phonemes.map(p => {
      const viseme = this.visemeMap.get(p.phoneme) || 'aa';
      const blendShape = this.blendShapeMap.get(viseme) || 'mouth_neutral';
      
      return {
        phoneme: p.phoneme,
        viseme,
        timing: p.start,
        duration: p.end - p.start,
        intensity: this.options.intensity * p.confidence,
        blendShape
      };
    });
  }

  private async analyzeAudio(audioBuffer: ArrayBuffer): Promise<AudioAnalysis> {
    // Placeholder for advanced audio analysis
    // In production, this would use sophisticated signal processing
    
    return {
      phonemes: [],
      pitch: [],
      energy: [],
      voicing: [],
      sampleRate: 44100
    };
  }

  private audioAnalysisToVisemes(analysis: AudioAnalysis): Viseme[] {
    // Convert audio analysis to visemes
    // This would be much more sophisticated in production
    
    return [];
  }

  private applyCoarticulation(visemes: Viseme[]): Viseme[] {
    // Apply coarticulation effects (blending between adjacent phonemes)
    const processed = [...visemes];
    
    for (let i = 1; i < processed.length - 1; i++) {
      const prev = processed[i - 1];
      const current = processed[i];
      const next = processed[i + 1];
      
      // Blend intensity based on neighboring visemes
      const blendFactor = 0.2;
      current.intensity = current.intensity * (1 - blendFactor) + 
                         (prev.intensity + next.intensity) * blendFactor / 2;
    }
    
    return processed;
  }

  private applySmoothing(visemes: Viseme[]): Viseme[] {
    // Apply temporal smoothing to reduce jitter
    const smoothed = [...visemes];
    const smoothingFactor = this.options.smoothing;
    
    for (let i = 1; i < smoothed.length; i++) {
      const prev = smoothed[i - 1];
      const current = smoothed[i];
      
      // Smooth intensity transitions
      current.intensity = prev.intensity * smoothingFactor + 
                         current.intensity * (1 - smoothingFactor);
    }
    
    return smoothed;
  }

  /**
   * Get the current viseme for a given timestamp
   */
  public getCurrentViseme(visemes: Viseme[], timestamp: number): Viseme | null {
    for (const viseme of visemes) {
      if (timestamp >= viseme.timing && timestamp <= viseme.timing + viseme.duration) {
        return viseme;
      }
    }
    return null;
  }

  /**
   * Update options
   */
  public updateOptions(newOptions: Partial<LipSyncOptions>): void {
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