/**
 * Advanced Audio Processing Controller
 * Real-time audio analysis, feature extraction, and processing
 * Integrates with pyAudioAnalysis for advanced audio analysis
 */

export interface AudioFeatures {
  // Time-domain features
  zeroCrossingRate: number[];
  energy: number[];
  entropyOfEnergy: number[];
  
  // Spectral features
  spectralCentroid: number[];
  spectralSpread: number[];
  spectralEntropy: number[];
  spectralFlux: number[];
  spectralRolloff: number[];
  
  // MFCCs
  mfcc: number[][];
  
  // Chroma features
  chroma: number[][];
  
  // Harmonic features
  harmonicRatio: number[];
  pitch: number[];
  
  // Rhythm features
  tempo: number;
  beatPositions: number[];
  
  // Quality metrics
  snr: number; // Signal-to-noise ratio
  quality: number; // Overall audio quality (0-1)
}

export interface AudioProcessingOptions {
  sampleRate: number;
  frameSize: number;
  hopSize: number;
  enableRealTime: boolean;
  enableFeatureExtraction: boolean;
  enableNoiseReduction: boolean;
  enableVoiceActivityDetection: boolean;
  qualityThreshold: number; // Minimum quality for processing
}

export interface VoiceActivityResult {
  isVoiceActive: boolean;
  confidence: number;
  energyLevel: number;
  timestamp: number;
}

export interface AudioQualityMetrics {
  snr: number;
  clarity: number;
  stability: number;
  overallQuality: number;
  recommendations: string[];
}

export class AudioProcessingController {
  private options: AudioProcessingOptions;
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private isProcessing: boolean = false;
  private featureBuffer: AudioFeatures[] = [];
  private vadHistory: VoiceActivityResult[] = [];

  // Audio processing constants
  private readonly FRAME_SIZE = 1024;
  private readonly HOP_SIZE = 512;
  private readonly SAMPLE_RATE = 44100;
  private readonly QUALITY_THRESHOLD = 0.5;

  // VAD thresholds
  private readonly VAD_ENERGY_THRESHOLD = 0.01;
  private readonly VAD_ZCR_THRESHOLD = 0.3;
  private readonly VAD_SPECTRAL_THRESHOLD = 1000;

  constructor(options: Partial<AudioProcessingOptions> = {}) {
    this.options = {
      sampleRate: this.SAMPLE_RATE,
      frameSize: this.FRAME_SIZE,
      hopSize: this.HOP_SIZE,
      enableRealTime: true,
      enableFeatureExtraction: true,
      enableNoiseReduction: true,
      enableVoiceActivityDetection: true,
      qualityThreshold: this.QUALITY_THRESHOLD,
      ...options
    };

    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.options.sampleRate
      });
      
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = this.options.frameSize * 2;
      this.analyzer.smoothingTimeConstant = 0.8;
      this.analyzer.minDecibels = -90;
      this.analyzer.maxDecibels = -10;
      
      console.log('🎵 Audio Processing Controller initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Start real-time audio processing
   */
  public async startRealTimeProcessing(
    stream: MediaStream,
    callbacks: {
      onFeatures?: (features: AudioFeatures) => void;
      onVAD?: (result: VoiceActivityResult) => void;
      onQuality?: (metrics: AudioQualityMetrics) => void;
    }
  ): Promise<void> {
    if (!this.audioContext || !this.analyzer) {
      console.error('❌ AudioContext not initialized');
      return;
    }

    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyzer);

    this.isProcessing = true;
    this.processRealTimeAudio(callbacks);
  }

  public stopRealTimeProcessing(): void {
    this.isProcessing = false;
  }

  private async processRealTimeAudio(callbacks: {
    onFeatures?: (features: AudioFeatures) => void;
    onVAD?: (result: VoiceActivityResult) => void;
    onQuality?: (metrics: AudioQualityMetrics) => void;
  }): Promise<void> {
    if (!this.analyzer || !this.isProcessing) return;

    const bufferLength = this.analyzer.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);
    
    const process = async () => {
      if (!this.isProcessing) return;

      this.analyzer!.getByteFrequencyData(frequencyData);
      this.analyzer!.getByteTimeDomainData(timeData);

      // Convert to float arrays for processing
      const floatFreqData = new Float32Array(frequencyData.length);
      const floatTimeData = new Float32Array(timeData.length);
      
      for (let i = 0; i < frequencyData.length; i++) {
        floatFreqData[i] = frequencyData[i] / 255.0;
        floatTimeData[i] = (timeData[i] - 128) / 128.0;
      }

      // Voice Activity Detection
      if (this.options.enableVoiceActivityDetection && callbacks.onVAD) {
        const vadResult = this.performVoiceActivityDetection(floatTimeData, floatFreqData);
        this.vadHistory.push(vadResult);
        callbacks.onVAD(vadResult);
      }

      // Feature Extraction
      if (this.options.enableFeatureExtraction && callbacks.onFeatures) {
        const features = await this.extractAudioFeatures(floatTimeData, floatFreqData);
        this.featureBuffer.push(features);
        callbacks.onFeatures(features);
      }

      // Audio Quality Assessment
      if (callbacks.onQuality) {
        const qualityMetrics = this.assessAudioQuality(floatTimeData, floatFreqData);
        callbacks.onQuality(qualityMetrics);
      }

      // Cleanup old data
      this.cleanupBuffers();

      requestAnimationFrame(process);
    };

    process();
  }

  /**
   * Extract comprehensive audio features
   */
  public async extractAudioFeatures(timeData: Float32Array, freqData: Float32Array): Promise<AudioFeatures> {
    const features: AudioFeatures = {
      // Time-domain features
      zeroCrossingRate: [this.calculateZeroCrossingRate(timeData)],
      energy: [this.calculateEnergy(timeData)],
      entropyOfEnergy: [this.calculateEntropyOfEnergy(timeData)],
      
      // Spectral features
      spectralCentroid: [this.calculateSpectralCentroid(freqData)],
      spectralSpread: [this.calculateSpectralSpread(freqData)],
      spectralEntropy: [this.calculateSpectralEntropy(freqData)],
      spectralFlux: [this.calculateSpectralFlux(freqData)],
      spectralRolloff: [this.calculateSpectralRolloff(freqData)],
      
      // MFCCs
      mfcc: [this.calculateMFCC(freqData)],
      
      // Chroma features
      chroma: [this.calculateChroma(freqData)],
      
      // Harmonic features
      harmonicRatio: [this.calculateHarmonicRatio(freqData)],
      pitch: [this.estimatePitch(freqData)],
      
      // Rhythm features
      tempo: this.estimateTempo(timeData),
      beatPositions: this.detectBeats(timeData),
      
      // Quality metrics
      snr: this.calculateSNR(timeData),
      quality: this.calculateOverallQuality(timeData, freqData)
    };

    return features;
  }

  /**
   * Perform Voice Activity Detection
   */
  public performVoiceActivityDetection(timeData: Float32Array, freqData: Float32Array): VoiceActivityResult {
    const energy = this.calculateEnergy(timeData);
    const zcr = this.calculateZeroCrossingRate(timeData);
    const spectralCentroid = this.calculateSpectralCentroid(freqData);
    
    // Simple VAD using energy, ZCR, and spectral centroid
    let score = 0;
    
    if (energy > this.VAD_ENERGY_THRESHOLD) score += 0.4;
    if (zcr < this.VAD_ZCR_THRESHOLD) score += 0.3;
    if (spectralCentroid > this.VAD_SPECTRAL_THRESHOLD) score += 0.3;
    
    const isVoiceActive = score > 0.5;
    
    return {
      isVoiceActive,
      confidence: score,
      energyLevel: energy,
      timestamp: Date.now() / 1000
    };
  }

  /**
   * Assess audio quality
   */
  public assessAudioQuality(timeData: Float32Array, freqData: Float32Array): AudioQualityMetrics {
    const snr = this.calculateSNR(timeData);
    const clarity = this.calculateClarity(freqData);
    const stability = this.calculateStability(timeData);
    const overallQuality = (snr + clarity + stability) / 3;
    
    const recommendations: string[] = [];
    
    if (snr < 0.3) recommendations.push('Reduce background noise');
    if (clarity < 0.4) recommendations.push('Improve microphone positioning');
    if (stability < 0.3) recommendations.push('Ensure stable audio input');
    if (overallQuality < this.options.qualityThreshold) recommendations.push('Consider improving recording environment');
    
    return {
      snr,
      clarity,
      stability,
      overallQuality,
      recommendations
    };
  }

  // Time-domain feature calculations
  private calculateZeroCrossingRate(timeData: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] >= 0) !== (timeData[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (timeData.length - 1);
  }

  private calculateEnergy(timeData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      sum += timeData[i] * timeData[i];
    }
    return Math.sqrt(sum / timeData.length);
  }

  private calculateEntropyOfEnergy(timeData: Float32Array): number {
    const frameSize = 256;
    const energies: number[] = [];
    
    for (let i = 0; i < timeData.length - frameSize; i += frameSize) {
      let frameEnergy = 0;
      for (let j = 0; j < frameSize; j++) {
        frameEnergy += timeData[i + j] * timeData[i + j];
      }
      energies.push(frameEnergy);
    }
    
    // Calculate entropy
    const totalEnergy = energies.reduce((sum, e) => sum + e, 0);
    if (totalEnergy === 0) return 0;
    
    let entropy = 0;
    for (const energy of energies) {
      if (energy > 0) {
        const prob = energy / totalEnergy;
        entropy -= prob * Math.log2(prob);
      }
    }
    
    return entropy;
  }

  // Spectral feature calculations
  private calculateSpectralCentroid(freqData: Float32Array): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < freqData.length; i++) {
      weightedSum += i * freqData[i];
      magnitudeSum += freqData[i];
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private calculateSpectralSpread(freqData: Float32Array): number {
    const centroid = this.calculateSpectralCentroid(freqData);
    let weightedVariance = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < freqData.length; i++) {
      weightedVariance += Math.pow(i - centroid, 2) * freqData[i];
      magnitudeSum += freqData[i];
    }
    
    return magnitudeSum > 0 ? Math.sqrt(weightedVariance / magnitudeSum) : 0;
  }

  private calculateSpectralEntropy(freqData: Float32Array): number {
    const totalMagnitude = freqData.reduce((sum, mag) => sum + mag, 0);
    if (totalMagnitude === 0) return 0;
    
    let entropy = 0;
    for (const magnitude of freqData) {
      if (magnitude > 0) {
        const prob = magnitude / totalMagnitude;
        entropy -= prob * Math.log2(prob);
      }
    }
    
    return entropy;
  }

  private calculateSpectralFlux(freqData: Float32Array): number {
    // Simplified spectral flux calculation
    if (this.featureBuffer.length === 0) return 0;
    
    const prevSpectrum = this.featureBuffer[this.featureBuffer.length - 1]?.spectralCentroid || [0];
    const currentSpectrum = freqData;
    
    let flux = 0;
    const minLength = Math.min(prevSpectrum.length, currentSpectrum.length);
    
    for (let i = 0; i < minLength; i++) {
      const diff = currentSpectrum[i] - (prevSpectrum[0] || 0);
      flux += diff > 0 ? diff : 0;
    }
    
    return flux / minLength;
  }

  private calculateSpectralRolloff(freqData: Float32Array, threshold: number = 0.85): number {
    const totalMagnitude = freqData.reduce((sum, mag) => sum + mag, 0);
    const targetMagnitude = totalMagnitude * threshold;
    
    let cumulativeMagnitude = 0;
    for (let i = 0; i < freqData.length; i++) {
      cumulativeMagnitude += freqData[i];
      if (cumulativeMagnitude >= targetMagnitude) {
        return i / freqData.length;
      }
    }
    
    return 1.0;
  }

  // Advanced feature calculations
  private calculateMFCC(freqData: Float32Array): number[] {
    // Simplified MFCC calculation (in production, use proper mel-scale filtering)
    const numCoeffs = 13;
    const mfcc: number[] = [];
    
    for (let i = 0; i < numCoeffs; i++) {
      let coeff = 0;
      for (let j = 0; j < freqData.length; j++) {
        coeff += freqData[j] * Math.cos(Math.PI * i * (j + 0.5) / freqData.length);
      }
      mfcc.push(coeff);
    }
    
    return mfcc;
  }

  private calculateChroma(freqData: Float32Array): number[] {
    // Simplified chroma calculation
    const chroma = new Array(12).fill(0);
    
    for (let i = 0; i < freqData.length; i++) {
      const chromaIndex = i % 12;
      chroma[chromaIndex] += freqData[i];
    }
    
    // Normalize
    const sum = chroma.reduce((a, b) => a + b, 0);
    return sum > 0 ? chroma.map(c => c / sum) : chroma;
  }

  private calculateHarmonicRatio(freqData: Float32Array): number {
    // Simplified harmonic ratio calculation
    const fundamentalIndex = this.findFundamentalFrequency(freqData);
    if (fundamentalIndex === 0) return 0;
    
    let harmonicEnergy = 0;
    let totalEnergy = 0;
    
    for (let i = 0; i < freqData.length; i++) {
      totalEnergy += freqData[i] * freqData[i];
      
      // Check if this is a harmonic
      if (i % fundamentalIndex === 0) {
        harmonicEnergy += freqData[i] * freqData[i];
      }
    }
    
    return totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0;
  }

  private estimatePitch(freqData: Float32Array): number {
    const fundamentalIndex = this.findFundamentalFrequency(freqData);
    const sampleRate = this.options.sampleRate;
    const fftSize = freqData.length * 2;
    
    return (fundamentalIndex * sampleRate) / fftSize;
  }

  private findFundamentalFrequency(freqData: Float32Array): number {
    let maxIndex = 0;
    let maxValue = 0;
    
    // Look for the strongest frequency component in the typical voice range
    const minIndex = Math.floor(80 * freqData.length * 2 / this.options.sampleRate);
    const maxIndex_limit = Math.floor(400 * freqData.length * 2 / this.options.sampleRate);
    
    for (let i = minIndex; i < Math.min(maxIndex_limit, freqData.length); i++) {
      if (freqData[i] > maxValue) {
        maxValue = freqData[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
  }

  private estimateTempo(timeData: Float32Array): number {
    // Simplified tempo estimation using onset detection
    const onsets = this.detectOnsets(timeData);
    if (onsets.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const sampleRate = this.options.sampleRate;
    
    return avgInterval > 0 ? (60 * sampleRate) / avgInterval : 0;
  }

  private detectOnsets(timeData: Float32Array): number[] {
    const onsets: number[] = [];
    const windowSize = 512;
    const threshold = 0.1;
    
    for (let i = windowSize; i < timeData.length - windowSize; i++) {
      let energy = 0;
      for (let j = -windowSize / 2; j < windowSize / 2; j++) {
        energy += timeData[i + j] * timeData[i + j];
      }
      
      if (energy > threshold) {
        onsets.push(i);
        i += windowSize; // Skip ahead to avoid multiple detections
      }
    }
    
    return onsets;
  }

  private detectBeats(timeData: Float32Array): number[] {
    // Simplified beat detection
    return this.detectOnsets(timeData);
  }

  // Quality assessment methods
  private calculateSNR(timeData: Float32Array): number {
    const signalPower = this.calculateEnergy(timeData);
    const noisePower = this.estimateNoise(timeData);
    
    return noisePower > 0 ? Math.min(signalPower / noisePower, 1.0) : 1.0;
  }

  private estimateNoise(timeData: Float32Array): number {
    // Simple noise estimation using minimum energy segments
    const segmentSize = 256;
    const energies: number[] = [];
    
    for (let i = 0; i < timeData.length - segmentSize; i += segmentSize) {
      let segmentEnergy = 0;
      for (let j = 0; j < segmentSize; j++) {
        segmentEnergy += timeData[i + j] * timeData[i + j];
      }
      energies.push(segmentEnergy);
    }
    
    energies.sort((a, b) => a - b);
    return energies[Math.floor(energies.length * 0.1)] || 0; // 10th percentile
  }

  private calculateClarity(freqData: Float32Array): number {
    const spectralCentroid = this.calculateSpectralCentroid(freqData);
    const spectralSpread = this.calculateSpectralSpread(freqData);
    
    // Higher centroid and lower spread indicate better clarity
    const normalizedCentroid = Math.min(spectralCentroid / freqData.length, 1.0);
    const normalizedSpread = Math.max(1.0 - spectralSpread / freqData.length, 0.0);
    
    return (normalizedCentroid + normalizedSpread) / 2;
  }

  private calculateStability(timeData: Float32Array): number {
    const segmentSize = 512;
    const energies: number[] = [];
    
    for (let i = 0; i < timeData.length - segmentSize; i += segmentSize) {
      let segmentEnergy = 0;
      for (let j = 0; j < segmentSize; j++) {
        segmentEnergy += timeData[i + j] * timeData[i + j];
      }
      energies.push(segmentEnergy);
    }
    
    if (energies.length < 2) return 1.0;
    
    const mean = energies.reduce((sum, e) => sum + e, 0) / energies.length;
    const variance = energies.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / energies.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? Math.max(1.0 - stdDev / mean, 0.0) : 0.0;
  }

  private calculateOverallQuality(timeData: Float32Array, freqData: Float32Array): number {
    const snr = this.calculateSNR(timeData);
    const clarity = this.calculateClarity(freqData);
    const stability = this.calculateStability(timeData);
    
    return (snr + clarity + stability) / 3;
  }

  private cleanupBuffers(): void {
    const maxBufferSize = 100;
    
    if (this.featureBuffer.length > maxBufferSize) {
      this.featureBuffer = this.featureBuffer.slice(-maxBufferSize);
    }
    
    if (this.vadHistory.length > maxBufferSize) {
      this.vadHistory = this.vadHistory.slice(-maxBufferSize);
    }
  }

  /**
   * Get current voice activity status
   */
  public getCurrentVAD(): VoiceActivityResult | null {
    return this.vadHistory.length > 0 ? this.vadHistory[this.vadHistory.length - 1] : null;
  }

  /**
   * Get recent audio features
   */
  public getRecentFeatures(count: number = 10): AudioFeatures[] {
    return this.featureBuffer.slice(-count);
  }

  /**
   * Update processing options
   */
  public updateOptions(newOptions: Partial<AudioProcessingOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Check if processing is active
   */
  public isProcessingActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.stopRealTimeProcessing();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.featureBuffer = [];
    this.vadHistory = [];
  }
} 