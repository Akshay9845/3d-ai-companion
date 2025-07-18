import { intelligentCameraService } from './intelligentCameraService';

export interface DocumentAnalysisResult {
  type: 'phone' | 'document' | 'book' | 'screen' | 'handwriting' | 'unknown';
  confidence: number;
  extractedText: string[];
  detectedObjects: string[];
  isQuestion: boolean;
  questionType?: 'math' | 'text' | 'multiple_choice' | 'diagram' | 'code' | 'unknown';
  suggestedAction: string;
  analysisDetails: {
    hasText: boolean;
    hasNumbers: boolean;
    hasEquations: boolean;
    hasCharts: boolean;
    textLanguage?: string;
  };
}

export interface AssistanceResponse {
  canHelp: boolean;
  responseType: 'solve' | 'explain' | 'identify' | 'guide' | 'translate';
  solution?: string;
  explanation?: string;
  stepByStep?: string[];
  confidence: number;
}

export class DocumentAnalysisService {
  private readonly mathPatterns = [
    /[\+\-\*\/\=\(\)]/g,
    /\d+[\+\-\*\/]\d+/g,
    /\b(sin|cos|tan|log|ln|sqrt|integral|derivative)\b/gi,
    /[x-z]\s*[\+\-\*\/\=]\s*\d+/g,
    /\b\d+\s*[x²³⁴⁵⁶⁷⁸⁹⁰]\b/g
  ];

  private readonly questionWords = [
    'what', 'how', 'why', 'when', 'where', 'which', 'who',
    'solve', 'calculate', 'find', 'determine', 'explain',
    'define', 'describe', 'compare', 'analyze', 'evaluate'
  ];

  async analyzeDocument(videoElement: HTMLVideoElement): Promise<DocumentAnalysisResult | null> {
    try {
      console.log('📄 Analyzing document/screen content...');

      // Use intelligent camera service for comprehensive analysis
      const analysisResult = await intelligentCameraService.analyzeCurrentView({
        includeFaceDetection: false, // Focus on objects and text
        includeObjectDetection: true,
        includeTextDetection: true,
        includeSceneDescription: true,
        googleVisionApiKey: import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem('googleVisionApiKey') || undefined
      });

      if (!analysisResult) {
        return null;
      }

      // Analyze the content
      const documentType = this.classifyDocumentType(analysisResult.scene.objects, analysisResult.scene.text);
      const isQuestion = this.detectQuestion(analysisResult.scene.text);
      const questionType = isQuestion ? this.classifyQuestionType(analysisResult.scene.text) : undefined;

      const result: DocumentAnalysisResult = {
        type: documentType.type,
        confidence: documentType.confidence,
        extractedText: analysisResult.scene.text,
        detectedObjects: analysisResult.scene.objects.map(obj => obj.name),
        isQuestion,
        questionType,
        suggestedAction: this.generateSuggestedAction(documentType.type, isQuestion, analysisResult.scene.text),
        analysisDetails: {
          hasText: analysisResult.scene.text.length > 0,
          hasNumbers: this.hasNumbers(analysisResult.scene.text),
          hasEquations: this.hasMathContent(analysisResult.scene.text),
          hasCharts: this.hasCharts(analysisResult.scene.objects),
          textLanguage: this.detectLanguage(analysisResult.scene.text)
        }
      };

      console.log('📄 Document analysis result:', result);
      return result;

    } catch (error) {
      console.error('📄 Document analysis error:', error);
      return null;
    }
  }

  private classifyDocumentType(objects: any[], texts: string[]): { type: DocumentAnalysisResult['type'], confidence: number } {
    const objectNames = objects.map(obj => obj.name.toLowerCase()).join(' ');
    const allText = texts.join(' ').toLowerCase();

    // Phone detection
    if (objectNames.includes('phone') || objectNames.includes('mobile') || objectNames.includes('smartphone')) {
      return { type: 'phone', confidence: 0.9 };
    }

    // Screen detection
    if (objectNames.includes('screen') || objectNames.includes('monitor') || objectNames.includes('display') || 
        objectNames.includes('laptop') || objectNames.includes('computer')) {
      return { type: 'screen', confidence: 0.8 };
    }

    // Book detection
    if (objectNames.includes('book') || objectNames.includes('textbook') || objectNames.includes('magazine')) {
      return { type: 'book', confidence: 0.8 };
    }

    // Document detection based on text content
    if (texts.length > 0) {
      const hasStructuredText = texts.some(text => text.length > 20);
      if (hasStructuredText) {
        // Check if it's handwriting vs printed
        const hasHandwritingMarkers = objectNames.includes('handwriting') || 
                                     allText.includes('hand') || 
                                     texts.some(text => text.length < 50 && this.hasMathContent([text]));
        
        if (hasHandwritingMarkers) {
          return { type: 'handwriting', confidence: 0.7 };
        } else {
          return { type: 'document', confidence: 0.8 };
        }
      }
    }

    return { type: 'unknown', confidence: 0.3 };
  }

  private detectQuestion(texts: string[]): boolean {
    const allText = texts.join(' ').toLowerCase();
    
    // Check for question marks
    if (allText.includes('?')) {
      return true;
    }

    // Check for question words
    const hasQuestionWords = this.questionWords.some(word => 
      allText.includes(word.toLowerCase())
    );

    // Check for mathematical problem indicators
    const hasMathProblem = allText.includes('solve') || 
                          allText.includes('calculate') || 
                          allText.includes('find') ||
                          this.hasMathContent(texts);

    return hasQuestionWords || hasMathProblem;
  }

  private classifyQuestionType(texts: string[]): DocumentAnalysisResult['questionType'] {
    const allText = texts.join(' ').toLowerCase();

    // Math question detection
    if (this.hasMathContent(texts) || 
        allText.includes('solve') || 
        allText.includes('calculate') || 
        allText.includes('equation')) {
      return 'math';
    }

    // Multiple choice detection
    if (allText.includes('a)') || allText.includes('b)') || allText.includes('c)') || 
        allText.includes('(a)') || allText.includes('(b)') || allText.includes('(c)')) {
      return 'multiple_choice';
    }

    // Code detection
    if (allText.includes('function') || allText.includes('class') || allText.includes('def ') || 
        allText.includes('var ') || allText.includes('const ') || allText.includes('let ')) {
      return 'code';
    }

    // Diagram detection (based on minimal text and spatial elements)
    if (texts.length < 5 && texts.some(text => text.length < 10)) {
      return 'diagram';
    }

    return 'text';
  }

  private hasMathContent(texts: string[]): boolean {
    const allText = texts.join(' ');
    return this.mathPatterns.some(pattern => pattern.test(allText));
  }

  private hasNumbers(texts: string[]): boolean {
    const allText = texts.join(' ');
    return /\d/.test(allText);
  }

  private hasCharts(objects: any[]): boolean {
    const objectNames = objects.map(obj => obj.name.toLowerCase()).join(' ');
    return objectNames.includes('chart') || 
           objectNames.includes('graph') || 
           objectNames.includes('plot') ||
           objectNames.includes('diagram');
  }

  private detectLanguage(texts: string[]): string {
    const allText = texts.join(' ').toLowerCase();
    
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const englishCount = englishWords.filter(word => allText.includes(word)).length;
    
    if (englishCount > 2) {
      return 'en';
    }
    
    return 'unknown';
  }

  private generateSuggestedAction(
    type: DocumentAnalysisResult['type'], 
    isQuestion: boolean, 
    texts: string[]
  ): string {
    if (isQuestion) {
      switch (type) {
        case 'phone':
          return "I can help solve this question on your phone! Let me analyze it and provide an answer.";
        case 'book':
        case 'document':
          return "I see a question in this document. I can help explain and solve it step by step.";
        case 'handwriting':
          return "I can read your handwritten question and help you solve it!";
        case 'screen':
          return "I can see a question on the screen. Let me help you understand and solve it.";
        default:
          return "I can see there's a question here. Let me help you with it!";
      }
    } else {
      switch (type) {
        case 'phone':
          return "I can help you with whatever you're showing on your phone. What do you need help with?";
        case 'document':
          return "I can read and analyze this document. What would you like me to help you understand?";
        case 'book':
          return "I can help explain the content in this book. Point to any section you'd like me to discuss.";
        case 'screen':
          return "I can see your screen content. How can I assist you with what's displayed?";
        case 'handwriting':
          return "I can read your handwriting. What would you like me to help you with?";
        default:
          return "I can see some content here. How can I help you with it?";
      }
    }
  }

  async generateAssistanceResponse(analysis: DocumentAnalysisResult): Promise<AssistanceResponse> {
    try {
      console.log('🤔 Generating assistance response for:', analysis.type);

      if (!analysis.isQuestion && analysis.extractedText.length === 0) {
        return {
          canHelp: false,
          responseType: 'identify',
          explanation: "I can see something in the image, but I need clearer text or a specific question to help you effectively.",
          confidence: 0.3
        };
      }

      if (analysis.isQuestion) {
        return this.generateQuestionResponse(analysis);
      } else {
        return this.generateGeneralAssistanceResponse(analysis);
      }

    } catch (error) {
      console.error('🤔 Error generating assistance response:', error);
      return {
        canHelp: false,
        responseType: 'explain',
        explanation: "I encountered an error while analyzing the content. Please try again or ask me to help in a different way.",
        confidence: 0.1
      };
    }
  }

  private async generateQuestionResponse(analysis: DocumentAnalysisResult): Promise<AssistanceResponse> {
    const allText = analysis.extractedText.join(' ');

    switch (analysis.questionType) {
      case 'math':
        return {
          canHelp: true,
          responseType: 'solve',
          solution: await this.solveMathProblem(allText),
          explanation: "I can solve mathematical problems step by step. Let me work through this for you.",
          stepByStep: await this.generateMathSteps(allText),
          confidence: 0.8
        };

      case 'multiple_choice':
        return {
          canHelp: true,
          responseType: 'explain',
          explanation: await this.analyzeMultipleChoice(allText),
          confidence: 0.7
        };

      case 'code':
        return {
          canHelp: true,
          responseType: 'explain',
          explanation: await this.analyzeCode(allText),
          confidence: 0.8
        };

      default:
        return {
          canHelp: true,
          responseType: 'explain',
          explanation: await this.answerGeneralQuestion(allText),
          confidence: 0.6
        };
    }
  }

  private async generateGeneralAssistanceResponse(analysis: DocumentAnalysisResult): Promise<AssistanceResponse> {
    const allText = analysis.extractedText.join(' ');

    return {
      canHelp: true,
      responseType: 'explain',
      explanation: `I can see ${analysis.type} content with: ${allText.substring(0, 100)}${allText.length > 100 ? '...' : ''}. What specifically would you like me to help you understand or explain about this content?`,
      confidence: 0.7
    };
  }

  private async solveMathProblem(text: string): Promise<string> {
    // Simple math problem solver - could be enhanced with external APIs
    try {
      // Extract mathematical expressions
      const mathExpressions = text.match(/[\d\+\-\*\/\(\)\=\s]+/g);
      if (mathExpressions) {
        // This is a simplified example - in reality, you'd use a proper math parser
        return `I can see mathematical content: "${text}". For complex math problems, I recommend using specialized tools like Wolfram Alpha, or I can help break down the problem step by step.`;
      }
      return "I can see this is a math problem. Let me help you solve it step by step.";
    } catch (error) {
      return "I can help you with this math problem. Please ask me to explain any specific part you're struggling with.";
    }
  }

  private async generateMathSteps(text: string): Promise<string[]> {
    return [
      "1. First, let me identify what type of math problem this is",
      "2. Then I'll break down the given information",
      "3. Next, I'll determine what we need to find",
      "4. Finally, I'll solve it step by step",
      "Ask me to explain any step in detail!"
    ];
  }

  private async analyzeMultipleChoice(text: string): Promise<string> {
    return `I can see this is a multiple choice question. Based on the options and question content, I can help you analyze each choice and determine the best answer. Would you like me to explain why each option might be correct or incorrect?`;
  }

  private async analyzeCode(text: string): Promise<string> {
    return `I can see this is code-related content. I can help explain what this code does, identify any potential issues, or suggest improvements. What specific aspect of this code would you like me to explain?`;
  }

  private async answerGeneralQuestion(text: string): Promise<string> {
    return `I can see the question: "${text}". Let me help you understand this. Based on the content, I can provide explanations, context, or break down complex concepts into simpler terms. What specific part would you like me to focus on?`;
  }
}

// Export singleton instance
export const documentAnalysisService = new DocumentAnalysisService(); 