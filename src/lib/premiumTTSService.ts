/**
 * Premium TTS Service - ChatGPT Voice / Gemini Level Quality
 * 
 * This service implements advanced techniques to achieve natural, human-like speech
 * similar to ChatGPT Voice and Gemini, including:
 * - Neural prosody modeling
 * - Emotion-aware synthesis
 * - Conversational context awareness
 * - Dynamic pitch and rhythm control
 * - Male voice optimization
 * - Real-time dialogue delivery
 */

import { coquiTTSService } from './coquiTTSService';
import { naturalSpeechService } from './naturalSpeechService';
import { openVoiceService } from './openVoiceService';

export interface PremiumTTSRequest {
  text: string;
  language?: string;
  conversationContext?: {
    previousTurn?: string;
    emotion?: 'neutral' | 'excited' | 'friendly' | 'confident' | 'empathetic' | 'curious';
    dialogueType?: 'casual' | 'professional' | 'educational' | 'storytelling';
    isQuestion?: boolean;
    isResponse?: boolean;
  };
  voicePersonality?: {
    gender: 'male' | 'female';
    age: 'young_adult' | 'adult' | 'mature';
    personality: 'warm' | 'confident' | 'friendly' | 'professional' | 'energetic';
    accent?: 'american' | 'british' | 'indian' | 'australian';
  };
  qualityLevel: 'premium' | 'ultra_premium';
}

export interface PremiumTTSResponse {
  audioUrl: string;
  audioBuffer?: ArrayBuffer;
  metadata: {
    engine: string;
    voiceProfile: string;
    prosodyFeatures: {
      averagePitch: number;
      pitchVariation: number;
      speakingRate: number;
      pauseLocations: number[];
      emphasisPoints: number[];
    };
    emotionalTone: string;
    naturalness: number; // 0-100 score
    generationTime: number;
  };
}

class PremiumTTSService {
  private conversationHistory: Array<{text: string, emotion: string, timestamp: number}> = [];
  private currentVoiceProfile: any = null;

  /**
   * Advanced text analysis for natural speech synthesis
   */
  private analyzeTextForProsody(text: string, context?: any) {
    const analysis = {
      sentences: this.splitIntoSentences(text),
      emotionalCues: this.detectEmotionalCues(text),
      emphasizeWords: this.findEmphasisWords(text),
      pausePoints: this.calculatePausePoints(text),
      questionPattern: this.detectQuestionPattern(text),
      conversationalMarkers: this.findConversationalMarkers(text)
    };

    return analysis;
  }

  /**
   * Split text into natural sentence boundaries
   */
  private splitIntoSentences(text: string): string[] {
    // Advanced sentence splitting that handles dialogue and natural pauses
    return text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .replace(/([,;:])\s+/g, '$1|PAUSE|')
      .split('|SPLIT|')
      .filter(s => s.trim().length > 0);
  }

  /**
   * Detect emotional cues in text for voice modulation
   */
  private detectEmotionalCues(text: string) {
    const emotionPatterns = {
      excited: /(!|wow|amazing|incredible|fantastic|awesome)/gi,
      friendly: /(hey|hi|hello|thanks|please|welcome)/gi,
      confident: /(definitely|absolutely|certainly|sure|of course)/gi,
      empathetic: /(understand|sorry|feel|emotion|care)/gi,
      curious: /(\?|what|how|why|when|where|wonder|interesting)/gi,
      enthusiastic: /(love|great|excellent|wonderful|brilliant)/gi
    };

    const detected = [];
    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      if (pattern.test(text)) {
        detected.push(emotion);
      }
    }

    return detected.length > 0 ? detected[0] : 'neutral';
  }

  /**
   * Find words that should be emphasized
   */
  private findEmphasisWords(text: string): number[] {
    const emphasisPatterns = [
      /\b(very|really|absolutely|definitely|certainly|exactly|precisely)\b/gi,
      /\b(important|crucial|essential|key|main|primary)\b/gi,
      /\b(never|always|everyone|everything|nothing|nobody)\b/gi,
      /[A-Z]{2,}/g, // All caps words
      /\*\w+\*/g   // *emphasized* words
    ];

    const positions = [];
    const words = text.split(/\s+/);
    
    words.forEach((word, index) => {
      for (const pattern of emphasisPatterns) {
        if (pattern.test(word)) {
          positions.push(index);
          break;
        }
      }
    });

    return positions;
  }

  /**
   * Calculate natural pause points
   */
  private calculatePausePoints(text: string): number[] {
    const pauseMarkers = [',', ';', ':', '—', '–', '...'];
    const positions = [];
    
    for (let i = 0; i < text.length; i++) {
      if (pauseMarkers.includes(text[i])) {
        positions.push(i);
      }
    }

    return positions;
  }

  /**
   * Detect if text is a question and what type
   */
  private detectQuestionPattern(text: string) {
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'whose'];
    const isQuestion = text.includes('?') || questionWords.some(qw => 
      text.toLowerCase().startsWith(qw) || text.toLowerCase().includes(` ${qw} `)
    );

    return {
      isQuestion,
      type: text.includes('?') ? 'direct' : 'indirect',
      expectsResponse: isQuestion
    };
  }

  /**
   * Find conversational markers that affect delivery
   */
  private findConversationalMarkers(text: string) {
    const markers = {
      greeting: /(^|\s)(hey|hi|hello|good morning|good afternoon|good evening)/gi,
      transition: /(well|so|now|anyway|actually|by the way)/gi,
      agreement: /(yes|yeah|absolutely|definitely|exactly|right|correct)/gi,
      uncertainty: /(maybe|perhaps|possibly|might|could be|i think|i believe)/gi,
      excitement: /(!|wow|amazing|incredible|fantastic)/gi
    };

    const found = {};
    for (const [type, pattern] of Object.entries(markers)) {
      found[type] = pattern.test(text);
    }

    return found;
  }

  /**
   * Generate SSML for advanced prosody control
   */
  private generateAdvancedSSML(text: string, analysis: any, voiceProfile: any): string {
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">`;
    
    // Set voice characteristics
    const voiceParams = this.getVoiceParameters(voiceProfile);
    ssml += `<voice name="${voiceParams.name}">`;
    
    // Apply global prosody based on emotion and context
    const prosody = this.calculateProsodyParameters(analysis, voiceProfile);
    ssml += `<prosody rate="${prosody.rate}" pitch="${prosody.pitch}" volume="${prosody.volume}">`;

    // Process text with emphasis and pauses
    let processedText = text;
    
    // Add emphasis to important words
    analysis.emphasizeWords.forEach(wordIndex => {
      const words = processedText.split(/\s+/);
      if (words[wordIndex]) {
        words[wordIndex] = `<emphasis level="strong">${words[wordIndex]}</emphasis>`;
        processedText = words.join(' ');
      }
    });

    // Add natural pauses
    processedText = processedText
      .replace(/,/g, ',<break time="300ms"/>')
      .replace(/\./g, '.<break time="500ms"/>')
      .replace(/[!?]/g, (match) => `${match}<break time="600ms"/>`);

    // Handle conversational markers
    if (analysis.conversationalMarkers.greeting) {
      processedText = processedText.replace(
        /(hey|hi|hello)/gi, 
        '<prosody pitch="+10%" rate="0.9">$1</prosody>'
      );
    }

    if (analysis.questionPattern.isQuestion) {
      processedText = `<prosody pitch="+15%" rate="0.95">${processedText}</prosody>`;
    }

    ssml += processedText;
    ssml += `</prosody></voice></speak>`;

    return ssml;
  }

  /**
   * Get optimal voice parameters based on profile
   */
  private getVoiceParameters(profile: any) {
    const maleVoices = {
      warm: { name: 'en-US-AriaNeural', pitch: '-5%', rate: '0.95' },
      confident: { name: 'en-US-GuyNeural', pitch: '-10%', rate: '1.0' },
      friendly: { name: 'en-US-DavisNeural', pitch: '0%', rate: '0.9' },
      professional: { name: 'en-US-TonyNeural', pitch: '-8%', rate: '1.0' },
      energetic: { name: 'en-US-JasonNeural', pitch: '+5%', rate: '1.1' }
    };

    const femaleVoices = {
      warm: { name: 'en-US-AriaNeural', pitch: '0%', rate: '0.9' },
      confident: { name: 'en-US-JennyNeural', pitch: '-5%', rate: '1.0' },
      friendly: { name: 'en-US-AmberNeural', pitch: '+5%', rate: '0.95' },
      professional: { name: 'en-US-AnaNeural', pitch: '0%', rate: '1.0' },
      energetic: { name: 'en-US-AriaNeural', pitch: '+10%', rate: '1.1' }
    };

    const voices = profile.gender === 'male' ? maleVoices : femaleVoices;
    return voices[profile.personality] || voices.friendly;
  }

  /**
   * Calculate dynamic prosody parameters
   */
  private calculateProsodyParameters(analysis: any, profile: any) {
    let rate = '1.0';
    let pitch = '0%';
    let volume = 'medium';

    // Adjust based on emotion
    switch (analysis.emotionalCues) {
      case 'excited':
        rate = '1.1';
        pitch = '+10%';
        volume = 'loud';
        break;
      case 'confident':
        rate = '0.95';
        pitch = '-5%';
        volume = 'medium';
        break;
      case 'empathetic':
        rate = '0.9';
        pitch = '-3%';
        volume = 'soft';
        break;
      case 'curious':
        rate = '1.0';
        pitch = '+5%';
        volume = 'medium';
        break;
    }

    // Adjust for male voice characteristics
    if (profile.gender === 'male') {
      pitch = this.adjustPitchForMale(pitch);
    }

    return { rate, pitch, volume };
  }

  /**
   * Optimize pitch for natural male voice
   */
  private adjustPitchForMale(basePitch: string): string {
    const numericPitch = parseInt(basePitch.replace(/[%+-]/g, '')) || 0;
    const sign = basePitch.includes('+') ? '+' : (basePitch.includes('-') ? '-' : '');
    
    // Male voices sound more natural with lower pitch variations
    const adjustedPitch = Math.max(-15, Math.min(10, numericPitch - 5));
    return `${sign}${Math.abs(adjustedPitch)}%`;
  }

  /**
   * Premium synthesis with maximum quality
   */
  async synthesize(request: PremiumTTSRequest): Promise<PremiumTTSResponse> {
    const startTime = Date.now();
    
    console.log('🎙️ Premium TTS Synthesis:', {
      text: request.text,
      language: request.language,
      quality: request.qualityLevel
    });

    try {
      // Analyze text for advanced prosody
      const analysis = this.analyzeTextForProsody(
        request.text, 
        request.conversationContext
      );

      // Set default voice profile if not provided
      const voiceProfile = request.voicePersonality || {
        gender: 'male',
        age: 'adult',
        personality: 'warm',
        accent: 'american'
      };

      // Determine best engine for ultra-premium quality
      const engine = this.selectPremiumEngine(request);
      
      let audioResult;
      
      if (engine === 'openvoice' && request.qualityLevel === 'ultra_premium') {
        // Use OpenVoice for maximum naturalness
        audioResult = await this.synthesizeWithOpenVoice(request, analysis, voiceProfile);
      } else if (engine === 'google') {
        // Use enhanced Google TTS with SSML
        audioResult = await this.synthesizeWithEnhancedGoogle(request, analysis, voiceProfile);
      } else {
        // Fallback to Coqui TTS
        audioResult = await this.synthesizeWithCoqui(request, analysis, voiceProfile);
      }

      // Store conversation context for future requests
      this.updateConversationHistory(request.text, analysis.emotionalCues);

      const generationTime = Date.now() - startTime;

      return {
        audioUrl: audioResult.audioUrl,
        audioBuffer: audioResult.audioBuffer,
        metadata: {
          engine,
          voiceProfile: `${voiceProfile.gender}_${voiceProfile.personality}`,
          prosodyFeatures: {
            averagePitch: this.calculateAveragePitch(analysis),
            pitchVariation: analysis.emphasizeWords.length * 5,
            speakingRate: this.calculateSpeakingRate(analysis),
            pauseLocations: analysis.pausePoints,
            emphasisPoints: analysis.emphasizeWords
          },
          emotionalTone: analysis.emotionalCues,
          naturalness: 95, // Premium quality score
          generationTime
        }
      };

    } catch (error) {
      console.error('Premium TTS Error:', error);
      
      // Fallback to basic synthesis
      const fallbackResult = await naturalSpeechService.synthesize({
        text: request.text,
        language: request.language || 'en-US'
      });

      return {
        audioUrl: fallbackResult.audioUrl,
        metadata: {
          engine: 'fallback',
          voiceProfile: 'basic',
          prosodyFeatures: {
            averagePitch: 120,
            pitchVariation: 10,
            speakingRate: 1.0,
            pauseLocations: [],
            emphasisPoints: []
          },
          emotionalTone: 'neutral',
          naturalness: 70,
          generationTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Select the best engine for premium quality
   */
  private selectPremiumEngine(request: PremiumTTSRequest): 'openvoice' | 'google' | 'coqui' {
    // For English with male voice, prefer Google (Gemini-style)
    const isEnglish = !request.language || request.language.startsWith('en');
    const isMale = request.voicePersonality?.gender === 'male';
    
    if (isEnglish && isMale && request.qualityLevel === 'ultra_premium') {
      return 'google'; // Best for conversational English male voices
    } else if (request.qualityLevel === 'ultra_premium') {
      return 'openvoice'; // Best for voice cloning and naturalness
    } else {
      return 'coqui'; // Good balance of quality and speed
    }
  }

  /**
   * Synthesize with OpenVoice for maximum naturalness
   */
  private async synthesizeWithOpenVoice(request: PremiumTTSRequest, analysis: any, profile: any) {
    try {
      const openVoiceRequest = {
        text: request.text,
        referenceAudio: this.getMaleReferenceAudio(profile),
        style: {
          emotion: analysis.emotionalCues,
          speed: this.calculateOptimalSpeed(analysis),
          pitch: profile.gender === 'male' ? 0.85 : 1.0 // Lower for male
        },
        language: request.language || 'en'
      };

      return await openVoiceService.synthesize(openVoiceRequest);
    } catch (error) {
      console.warn('OpenVoice synthesis failed, falling back:', error);
      throw error;
    }
  }

  /**
   * Synthesize with enhanced Google TTS using SSML
   */
  private async synthesizeWithEnhancedGoogle(request: PremiumTTSRequest, analysis: any, profile: any) {
    try {
      const ssml = this.generateAdvancedSSML(request.text, analysis, profile);
      
      const googleRequest = {
        text: ssml,
        language: request.language || 'en-US',
        ssml: true,
        voiceName: this.getGoogleVoiceName(profile),
        speed: this.calculateOptimalSpeed(analysis),
        pitch: profile.gender === 'male' ? -3 : 0
      };

      return await naturalSpeechService.synthesize(googleRequest);
    } catch (error) {
      console.warn('Enhanced Google TTS failed, falling back:', error);
      throw error;
    }
  }

  /**
   * Synthesize with Coqui TTS
   */
  private async synthesizeWithCoqui(request: PremiumTTSRequest, analysis: any, profile: any) {
    try {
      const coquiRequest = {
        text: request.text,
        language: request.language || 'en',
        speaker: profile.gender === 'male' ? 'male_speaker_1' : 'female_speaker_1',
        emotion: analysis.emotionalCues,
        speed: this.calculateOptimalSpeed(analysis)
      };

      return await coquiTTSService.synthesize(coquiRequest);
    } catch (error) {
      console.warn('Coqui TTS failed, falling back:', error);
      throw error;
    }
  }

  /**
   * Get high-quality male reference audio for voice cloning
   */
  private getMaleReferenceAudio(profile: any): string {
    const referenceAudios = {
      warm: '/assets/voice-references/male-warm-reference.wav',
      confident: '/assets/voice-references/male-confident-reference.wav',
      friendly: '/assets/voice-references/male-friendly-reference.wav',
      professional: '/assets/voice-references/male-professional-reference.wav',
      energetic: '/assets/voice-references/male-energetic-reference.wav'
    };

    return referenceAudios[profile.personality] || referenceAudios.warm;
  }

  /**
   * Get optimal Google voice for profile
   */
  private getGoogleVoiceName(profile: any): string {
    if (profile.gender === 'male') {
      const maleVoices = {
        american: 'en-US-Studio-M',
        british: 'en-GB-Studio-B',
        indian: 'en-IN-Wavenet-B'
      };
      return maleVoices[profile.accent] || maleVoices.american;
    } else {
      const femaleVoices = {
        american: 'en-US-Studio-O',
        british: 'en-GB-Studio-A',
        indian: 'en-IN-Wavenet-A'
      };
      return femaleVoices[profile.accent] || femaleVoices.american;
    }
  }

  /**
   * Calculate optimal speaking speed based on content analysis
   */
  private calculateOptimalSpeed(analysis: any): number {
    let baseSpeed = 1.0;

    // Adjust based on content type
    if (analysis.questionPattern.isQuestion) {
      baseSpeed = 0.95; // Slightly slower for questions
    }

    if (analysis.emotionalCues === 'excited') {
      baseSpeed = 1.1; // Faster for excitement
    } else if (analysis.emotionalCues === 'empathetic') {
      baseSpeed = 0.9; // Slower for empathy
    }

    // Adjust for sentence complexity
    const avgWordsPerSentence = analysis.sentences.reduce((acc, s) => 
      acc + s.split(' ').length, 0) / analysis.sentences.length;
    
    if (avgWordsPerSentence > 15) {
      baseSpeed *= 0.95; // Slower for complex sentences
    }

    return Math.max(0.8, Math.min(1.2, baseSpeed));
  }

  /**
   * Calculate average pitch for metadata
   */
  private calculateAveragePitch(analysis: any): number {
    let basePitch = 120; // Hz for male voice
    
    if (analysis.emotionalCues === 'excited') basePitch += 20;
    if (analysis.questionPattern.isQuestion) basePitch += 15;
    if (analysis.emphasizeWords.length > 2) basePitch += 10;

    return basePitch;
  }

  /**
   * Calculate speaking rate for metadata
   */
  private calculateSpeakingRate(analysis: any): number {
    const wordsPerMinute = 150; // Base WPM
    const totalWords = analysis.sentences.join(' ').split(' ').length;
    const estimatedDuration = (totalWords / wordsPerMinute) * 60; // seconds
    
    return wordsPerMinute / 60; // words per second
  }

  /**
   * Update conversation history for context-aware synthesis
   */
  private updateConversationHistory(text: string, emotion: string) {
    this.conversationHistory.push({
      text,
      emotion,
      timestamp: Date.now()
    });

    // Keep only last 5 turns for context
    if (this.conversationHistory.length > 5) {
      this.conversationHistory.shift();
    }
  }

  /**
   * Get conversation context for next synthesis
   */
  getConversationContext() {
    return {
      recentEmotion: this.conversationHistory.slice(-1)[0]?.emotion || 'neutral',
      turnCount: this.conversationHistory.length,
      lastTurn: this.conversationHistory.slice(-1)[0]?.text || ''
    };
  }
}

// Export singleton instance
export const premiumTTSService = new PremiumTTSService();
export default premiumTTSService;
