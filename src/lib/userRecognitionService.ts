import { faceDetectionService } from './faceDetectionService';

export interface RecognizedUser {
  id: string;
  name: string;
  faceDescriptor: Float32Array;
  confidence: number;
  firstSeen: number;
  lastSeen: number;
  sessionCount: number;
  preferences?: {
    preferredGreeting?: string;
    language?: string;
    topics?: string[];
  };
}

export interface UserRecognitionResult {
  isRecognized: boolean;
  user?: RecognizedUser;
  confidence: number;
  isNewFace: boolean;
}

export class UserRecognitionService {
  private users: Map<string, RecognizedUser> = new Map();
  private readonly STORAGE_KEY = 'ai_vision_users';
  private readonly RECOGNITION_THRESHOLD = 0.6; // Similarity threshold for face matching
  private readonly MIN_DESCRIPTOR_DISTANCE = 0.4; // Minimum distance for face matching
  
  constructor() {
    this.loadUsersFromStorage();
  }

  private loadUsersFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        Object.entries(userData).forEach(([id, user]: [string, any]) => {
          // Convert descriptor array back to Float32Array
          user.faceDescriptor = new Float32Array(user.faceDescriptor);
          this.users.set(id, user as RecognizedUser);
        });
        console.log('✅ Loaded', this.users.size, 'recognized users from storage');
      }
    } catch (error) {
      console.error('Failed to load users from storage:', error);
    }
  }

  private saveUsersToStorage(): void {
    try {
      const userData: any = {};
      this.users.forEach((user, id) => {
        // Convert Float32Array to regular array for JSON storage
        userData[id] = {
          ...user,
          faceDescriptor: Array.from(user.faceDescriptor)
        };
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
      console.log('💾 Saved', this.users.size, 'users to storage');
    } catch (error) {
      console.error('Failed to save users to storage:', error);
    }
  }

  async recognizeUser(videoElement: HTMLVideoElement): Promise<UserRecognitionResult> {
    try {
      // First detect faces
      const detection = await faceDetectionService.detectFaces(videoElement);
      
      if (!detection || detection.faces.length === 0) {
        return {
          isRecognized: false,
          confidence: 0,
          isNewFace: false
        };
      }

      // Get face descriptor for recognition (using face-api.js)
      const faceDescriptor = await this.getFaceDescriptor(videoElement);
      
      if (!faceDescriptor) {
        return {
          isRecognized: false,
          confidence: 0,
          isNewFace: true
        };
      }

      // Try to match with existing users
      const matchResult = this.findBestMatch(faceDescriptor);
      
      if (matchResult.user && matchResult.confidence > this.RECOGNITION_THRESHOLD) {
        // Update last seen time
        matchResult.user.lastSeen = Date.now();
        matchResult.user.sessionCount++;
        this.saveUsersToStorage();
        
        console.log('👤 User recognized:', matchResult.user.name, 'confidence:', matchResult.confidence);
        
        return {
          isRecognized: true,
          user: matchResult.user,
          confidence: matchResult.confidence,
          isNewFace: false
        };
      } else {
        return {
          isRecognized: false,
          confidence: matchResult.confidence,
          isNewFace: true
        };
      }
    } catch (error) {
      console.error('User recognition error:', error);
      return {
        isRecognized: false,
        confidence: 0,
        isNewFace: false
      };
    }
  }

  private async getFaceDescriptor(videoElement: HTMLVideoElement): Promise<Float32Array | null> {
    try {
      // Use face-api.js to get face descriptor
      const faceapi = await import('face-api.js');
      
      const detection = await faceapi.default
        .detectSingleFace(videoElement, new faceapi.default.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection?.descriptor || null;
    } catch (error) {
      console.error('Failed to get face descriptor:', error);
      return null;
    }
  }

  private findBestMatch(faceDescriptor: Float32Array): { user: RecognizedUser | null; confidence: number } {
    let bestMatch: RecognizedUser | null = null;
    let bestDistance = Infinity;

    this.users.forEach((user) => {
      const distance = this.euclideanDistance(faceDescriptor, user.faceDescriptor);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = user;
      }
    });

    // Convert distance to confidence (lower distance = higher confidence)
    const confidence = bestDistance < this.MIN_DESCRIPTOR_DISTANCE 
      ? Math.max(0, 1 - (bestDistance / this.MIN_DESCRIPTOR_DISTANCE))
      : 0;

    return { user: bestMatch, confidence };
  }

  private euclideanDistance(descriptor1: Float32Array, descriptor2: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      const diff = descriptor1[i] - descriptor2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  async registerUser(name: string, videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      const faceDescriptor = await this.getFaceDescriptor(videoElement);
      
      if (!faceDescriptor) {
        console.error('Could not get face descriptor for user registration');
        return false;
      }

      const userId = this.generateUserId();
      const user: RecognizedUser = {
        id: userId,
        name: name.trim(),
        faceDescriptor,
        confidence: 1.0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        sessionCount: 1,
        preferences: {}
      };

      this.users.set(userId, user);
      this.saveUsersToStorage();
      
      console.log('✅ User registered:', name, 'with ID:', userId);
      return true;
    } catch (error) {
      console.error('User registration error:', error);
      return false;
    }
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getUserById(userId: string): RecognizedUser | undefined {
    return this.users.get(userId);
  }

  getUserByName(name: string): RecognizedUser | undefined {
    for (const user of this.users.values()) {
      if (user.name.toLowerCase() === name.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  getAllUsers(): RecognizedUser[] {
    return Array.from(this.users.values());
  }

  removeUser(userId: string): boolean {
    const deleted = this.users.delete(userId);
    if (deleted) {
      this.saveUsersToStorage();
      console.log('🗑️ User removed:', userId);
    }
    return deleted;
  }

  updateUserPreferences(userId: string, preferences: Partial<RecognizedUser['preferences']>): boolean {
    const user = this.users.get(userId);
    if (user) {
      user.preferences = { ...user.preferences, ...preferences };
      this.saveUsersToStorage();
      return true;
    }
    return false;
  }

  clearAllUsers(): void {
    this.users.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🧹 All users cleared');
  }

  getStats(): { totalUsers: number; lastSeenToday: number; newThisWeek: number } {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;

    const stats = {
      totalUsers: this.users.size,
      lastSeenToday: 0,
      newThisWeek: 0
    };

    this.users.forEach(user => {
      if (now - user.lastSeen < oneDayMs) {
        stats.lastSeenToday++;
      }
      if (now - user.firstSeen < oneWeekMs) {
        stats.newThisWeek++;
      }
    });

    return stats;
  }

  generatePersonalizedGreeting(user: RecognizedUser): string {
    const greetings = [
      `Hello ${user.name}! Welcome back!`,
      `Hi ${user.name}! Great to see you again!`,
      `Welcome back, ${user.name}! How have you been?`,
      `${user.name}! So good to see you return!`,
      `Hey ${user.name}! I remember you!`
    ];

    // Special greeting for frequent users
    if (user.sessionCount > 5) {
      greetings.push(
        `${user.name}! Always a pleasure to see my favorite person!`,
        `My dear friend ${user.name}! Welcome back once again!`
      );
    }

    // Special greeting for new users (first few visits)
    if (user.sessionCount <= 2) {
      greetings.push(`${user.name}! Nice to see you again so soon!`);
    }

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    // Add context about their visits
    if (user.sessionCount > 1) {
      const timeSinceLastSeen = Date.now() - user.lastSeen;
      const daysSince = Math.floor(timeSinceLastSeen / (24 * 60 * 60 * 1000));
      
      if (daysSince > 1) {
        return `${randomGreeting} It's been ${daysSince} days since I last saw you. This is visit number ${user.sessionCount}!`;
      } else {
        return `${randomGreeting} This is your ${user.sessionCount}${this.getOrdinalSuffix(user.sessionCount)} time here!`;
      }
    }

    return randomGreeting;
  }

  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }
}

// Export singleton instance
export const userRecognitionService = new UserRecognitionService(); 