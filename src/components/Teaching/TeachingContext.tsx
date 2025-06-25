/**
 * TeachingContext Component
 * Manages the UI and user interaction for the teaching capabilities
 */

import {
    Award,
    Check,
    ChevronLeft,
    // Camera, // Unused for now
    ChevronRight,
    Repeat,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
    activityDataService,
    ActivityDefinition,
    ActivityStep,
    SessionFeedback,
} from '../../lib/activityDataService';
import {
    AnimationTeacher,
    TeachingActivity,
    TeachingDifficulty,
} from '../../lib/animationTeacher';
import { geminiVoice } from '../../lib/geminiVoiceService';
import {
    userRecognitionService,
} from '../../lib/userRecognitionService';
import { useStore } from '../../store/useStore';

// Activity card component
interface ActivityCardProps {
  activity: ActivityDefinition;
  onClick: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onClick }) => {
  const getBadgeColor = (type: TeachingActivity) => {
    switch (type) {
      case 'dance':
        return 'bg-purple-500';
      case 'exercise':
        return 'bg-green-500';
      case 'fighting':
        return 'bg-red-500';
      case 'cooking':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getDifficultyColor = (difficulty: TeachingDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-700';
      case 'intermediate':
        return 'bg-yellow-700';
      case 'advanced':
        return 'bg-red-700';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <div
      className="bg-gray-700/80 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="h-32 bg-gray-600 flex items-center justify-center">
        {/* Placeholder for activity image */}
        <div className="text-4xl text-white">
          {activity.type === 'dance' && '💃'}
          {activity.type === 'exercise' && '🏋️'}
          {activity.type === 'fighting' && '🥊'}
          {activity.type === 'cooking' && '👨‍🍳'}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-white">{activity.name}</h3>
          <span
            className={`text-xs px-2 py-1 rounded-full text-white ${getBadgeColor(activity.type)}`}
          >
            {activity.type}
          </span>
        </div>

        <p className="text-sm text-gray-300 line-clamp-2 mb-4">
          {activity.description}
        </p>

        <div className="flex justify-between items-center">
          <span
            className={`text-xs px-2 py-1 rounded-full text-white ${getDifficultyColor(activity.difficulty)}`}
          >
            {activity.difficulty}
          </span>

          <span className="text-xs text-gray-400">
            {Math.round(activity.estimatedDuration / 60)} min •{' '}
            {activity.steps.length}
            steps
          </span>
        </div>
      </div>
    </div>
  );
};

interface TeachingContextProps {
  userId?: string;
}

const TeachingContext: React.FC<TeachingContextProps> = ({
  userId = 'default-user',
}) => {
  // State
  const [isTeachingActive, setIsTeachingActive] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityDefinition | null>(null);
  const [currentStep, setCurrentStep] = useState<ActivityStep | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isVideoActive, setIsVideoActive] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<SessionFeedback[]>([]);
  const [latestFeedback, setLatestFeedback] = useState<SessionFeedback | null>(
    null
  );
  const [sessionSummary, setSessionSummary] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ActivityDefinition[]>([]);
  const [recommendedActivities, setRecommendedActivities] = useState<
    ActivityDefinition[]
  >([]);

  // User recognition state
  const [recognizedUser, setRecognizedUser] = useState<any | null>(null);
  const [userPersona, setUserPersona] = useState<any | null>(null);
  const [askingForName, setAskingForName] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const teacherRef = useRef<AnimationTeacher | null>(null);

  // Store state
  const {
    setCameraPermission,
    setModelCommand,
    setTeachingActive,
    setCurrentActivity,
    addTeachingFeedback,
    clearTeachingFeedback,
  } = useStore();

  // Initialize teaching system
  useEffect(() => {
    // Create animation teacher instance
    teacherRef.current = new AnimationTeacher(handleFeedback);

    // Load recommended activities
    loadRecommendedActivities();

    // Initialize camera to start user recognition
    initializeCamera();

    return () => {
      // Clean up
      if (isVideoActive && videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      if (teacherRef.current) {
        teacherRef.current.stopCamera();
      }
    };
  }, []);

  // Handle feedback from teacher
  const handleFeedback = async (feedbackItem: SessionFeedback) => {
    // Update local state
    setFeedback(prev => [...prev, feedbackItem]);
    setLatestFeedback(feedbackItem);

    // Update global state
    addTeachingFeedback(feedbackItem);

    // Speak feedback using Gemini Voice
    try {
      await geminiVoice.speak(feedbackItem.message, {
        voice: feedbackItem.type === 'positive' ? 'nova' : 'echo',
        enhanceText: true,
        enhancementType: 'teaching',
        language: 'en',
        emotionalTone: feedbackItem.type === 'positive' ? 'happy' : 
                       feedbackItem.type === 'correction' ? 'serious' : 'neutral'
      });
    } catch (error) {
      console.error('Failed to speak feedback with Gemini Voice:', error);
      // Fallback to Web Speech API
      const utterance = new SpeechSynthesisUtterance(feedbackItem.message);
      utterance.rate = 1.1;
      utterance.pitch = feedbackItem.type === 'positive' ? 1.2 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Initialize camera for activity
  const initializeCamera = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      // Set camera permission
      setCameraPermission(true);

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsVideoActive(true);

        // Initialize teacher with video element
        if (teacherRef.current) {
          await teacherRef.current.initialize(videoRef.current);
        }

        // Initialize user recognition
        await initializeUserRecognition(videoRef.current);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermission(false);
    }
  };

  // Initialize user recognition
  const initializeUserRecognition = async (videoElement: HTMLVideoElement) => {
    try {
      // Initialize the user recognition service
      await userRecognitionService.initialize({
        useAzure: true,
        useMediaPipe: true,
        recognitionThreshold: 0.6,
        memoryCacheEnabled: true,
      });

      // Set up callbacks
      userRecognitionService.setCallbacks(
        // New user detected
        user => {
          console.log('New user detected:', user);
          setAskingForName(true);
          userRecognitionService.askForUserName();
        },
        // Known user detected
        (user, memory) => {
          console.log('Known user detected:', user, memory);
          setRecognizedUser(user);
          // Get personalized approach for this user
          userRecognitionService.getUserPersona(user.id).then(persona => {
            if (persona) {
              console.log('User persona:', persona);
              setUserPersona(persona);
              // Greet the user
              userRecognitionService.processUserGreeting(user);
            }
          });
        }
      );

      // Start face processing
      const faceCheckInterval = setInterval(async () => {
        if (videoElement && !recognizedUser && !askingForName) {
          await userRecognitionService.processVideoFrame(videoElement);
          // User recognition happens via callbacks
        }
      }, 3000); // Check every 3 seconds

      // Clean up interval
      return () => clearInterval(faceCheckInterval);
    } catch (error) {
      console.error('Error initializing user recognition:', error);
    }
  };

  // Load recommended activities
  const loadRecommendedActivities = async () => {
    const activities =
      await activityDataService.getRecommendedActivities(userId);
    setRecommendedActivities(activities);
  };

  // Search for activities
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = await activityDataService.searchActivities(searchQuery);
    setSearchResults(results);
  };

  // Start a teaching session
  const startTeachingSession = async (activity: ActivityDefinition) => {
    try {
      // Make sure camera is initialized
      if (!isVideoActive) {
        await initializeCamera();
      }

      // Personalize activity if we have user data
      const personalizedActivity = userPersona
        ? personalizeTeaching(activity)
        : activity;

      // Set selected activity (both local and global state)
      setSelectedActivity(personalizedActivity);
      setCurrentActivity(personalizedActivity);

      // If we have a recognized user, update their preferences
      if (recognizedUser) {
        // Add activity type to user likes
        userRecognitionService.updateUserPreferences(recognizedUser.id, [
          activity.type,
          activity.difficulty,
        ]);

        // Log this interaction
        userRecognitionService.addConversationEntry(
          recognizedUser.id,
          `Started ${activity.name} lesson`,
          [activity.type, activity.difficulty, 'teaching'],
          'positive'
        );
      }

      // Start the session in the database
      const newSessionId = await activityDataService.startSession(
        userId,
        activity.id
      );
      setSessionId(newSessionId);

      // Set first step
      setCurrentStep(personalizedActivity.steps[0]);
      setCurrentStepIndex(0);

      // Start teacher
      if (teacherRef.current) {
        const steps = personalizedActivity.steps.map(step => ({
          id: step.id,
          description: step.description,
          animationPath: step.animationPath,
          duration: step.duration,
          checkPoints: step.checkPoints,
        }));

        await teacherRef.current.startTeachingSession(
          personalizedActivity.type,
          personalizedActivity.difficulty,
          steps
        );
      }

      // Set teaching active (both local and global state)
      setIsTeachingActive(true);
      setTeachingActive(true);

      // Reset feedback
      setFeedback([]);
      setLatestFeedback(null);
      clearTeachingFeedback();

      // Send command to 3D model
      if (setModelCommand) {
        setModelCommand(
          JSON.stringify({
            type: 'teaching_start',
            activity: personalizedActivity.type,
            difficulty: personalizedActivity.difficulty,
          })
        );
      }

      // Speak introduction with personalized style using Gemini Voice
      let introMessage = `Let's learn ${personalizedActivity.name}! I'll guide you through each step. Try to follow along with my movements.`;
      let emotionalTone: any = 'happy';
      let speed = 1.0;

      // Personalize introduction if we have user data
      if (userPersona) {
        // Adapt message based on personality
        if (userPersona.personality === 'fun') {
          introMessage = `Let's rock this ${personalizedActivity.name} lesson, ${userPersona.name}! Ready to have some fun?`;
          emotionalTone = 'excited';
          speed = 1.1;
        } else if (userPersona.personality === 'serious') {
          introMessage = `Welcome to your ${personalizedActivity.name} lesson, ${userPersona.name}. I'll provide detailed instructions for each step.`;
          emotionalTone = 'serious';
          speed = 0.95;
        } else if (userPersona.personality === 'calm') {
          introMessage = `Let's begin your ${personalizedActivity.name} practice, ${userPersona.name}. We'll take it one step at a time.`;
          emotionalTone = 'neutral';
          speed = 0.9;
        }
      }

      try {
        await geminiVoice.speak(introMessage, {
          voice: 'nova',
          enhanceText: true,
          enhancementType: 'teaching',
          language: 'en',
          emotionalTone,
          speed
        });
      } catch (error) {
        console.error('Failed to speak introduction with Gemini Voice:', error);
        // Fallback to Web Speech API
        const utterance = new SpeechSynthesisUtterance(introMessage);
        utterance.rate = userPersona?.personality === 'calm' ? 0.9 : 1.1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error starting teaching session:', error);
    }
  };

  // Go to next step
  const goToNextStep = async () => {
    if (
      !selectedActivity ||
      currentStepIndex >= selectedActivity.steps.length - 1
    ) {
      // End of activity
      endTeachingSession(true);
      return;
    }

    // Move to next step
    const nextIndex = currentStepIndex + 1;
    const nextStep = selectedActivity.steps[nextIndex];
    setCurrentStep(nextStep);
    setCurrentStepIndex(nextIndex);

    // Update teacher
    if (teacherRef.current) {
      teacherRef.current.nextStep();
    }

    // Send command to 3D model
    if (setModelCommand) {
      setModelCommand(
        JSON.stringify({
          type: 'teaching_step',
          step: nextIndex,
          action: nextStep.animationPath.split('/').pop()?.split('.')[0],
        })
      );
    }

    // Speak step instructions using Gemini Voice
    if (nextStep.voiceInstruction) {
      try {
        await geminiVoice.speak(nextStep.voiceInstruction, {
          voice: 'nova',
          enhanceText: true,
          enhancementType: 'teaching',
          language: 'en',
          speed: 1.0
        });
      } catch (error) {
        console.error('Failed to speak step instruction with Gemini Voice:', error);
        // Fallback to Web Speech API
        const utterance = new SpeechSynthesisUtterance(nextStep.voiceInstruction);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Repeat current step
  const repeatCurrentStep = async () => {
    if (!selectedActivity || !currentStep) return;

    // Update teacher
    if (teacherRef.current) {
      teacherRef.current.repeatStep();
    }

    // Send command to 3D model
    if (setModelCommand) {
      setModelCommand(
        JSON.stringify({
          type: 'teaching_repeat',
          step: currentStepIndex,
          action: currentStep.animationPath.split('/').pop()?.split('.')[0],
        })
      );
    }

    // Speak step instructions again using Gemini Voice
    if (currentStep.voiceInstruction) {
      try {
        await geminiVoice.speak(`Let's try again. ${currentStep.voiceInstruction}`, {
          voice: 'nova',
          enhanceText: true,
          enhancementType: 'teaching',
          language: 'en',
          emotionalTone: 'serious',
          speed: 1.0
        });
      } catch (error) {
        console.error('Failed to speak repeat instruction with Gemini Voice:', error);
        // Fallback to Web Speech API
        const utterance = new SpeechSynthesisUtterance(`Let's try again. ${currentStep.voiceInstruction}`);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Go to previous step
  const goToPreviousStep = async () => {
    if (!selectedActivity || currentStepIndex <= 0) return;

    // Move to previous step
    const prevIndex = currentStepIndex - 1;
    const prevStep = selectedActivity.steps[prevIndex];
    setCurrentStep(prevStep);
    setCurrentStepIndex(prevIndex);

    // There's no direct "previous step" in the teacher, so we'll need to restart
    // at the previous step (this is a limitation of the current implementation)
    if (teacherRef.current) {
      const steps = selectedActivity.steps.map(step => ({
        id: step.id,
        description: step.description,
        animationPath: step.animationPath,
        duration: step.duration,
        checkPoints: step.checkPoints,
      }));

      teacherRef.current
        .startTeachingSession(
          selectedActivity.type,
          selectedActivity.difficulty,
          steps
        )
        .then(() => {
          // Fast-forward to the previous step
          for (let i = 0; i < prevIndex; i++) {
            teacherRef.current?.nextStep();
          }
        });
    }

    // Send command to 3D model
    if (setModelCommand) {
      setModelCommand(
        JSON.stringify({
          type: 'teaching_step',
          step: prevIndex,
          action: prevStep.animationPath.split('/').pop()?.split('.')[0],
        })
      );
    }

    // Speak step instructions using Gemini Voice
    if (prevStep.voiceInstruction) {
      try {
        await geminiVoice.speak(`Let's go back to ${prevStep.name}. ${prevStep.voiceInstruction}`, {
          voice: 'nova',
          enhanceText: true,
          enhancementType: 'teaching',
          language: 'en',
          speed: 1.0
        });
      } catch (error) {
        console.error('Failed to speak previous step instruction with Gemini Voice:', error);
        // Fallback to Web Speech API
        const utterance = new SpeechSynthesisUtterance(`Let's go back to ${prevStep.name}. ${prevStep.voiceInstruction}`);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // End teaching session
  const endTeachingSession = async (completed: boolean = false) => {
    if (!selectedActivity || !sessionId) return;

    try {
      // Get session summary from teacher
      const summary = teacherRef.current?.getSessionSummary();
      setSessionSummary(summary);

      // Complete the session in the database
      await activityDataService.completeSession(
        sessionId,
        completed,
        currentStepIndex + 1,
        calculateSessionScore(),
        feedback
      );

      // Reset local state
      setIsTeachingActive(false);
      setSelectedActivity(null);
      setCurrentStep(null);
      setCurrentStepIndex(0);
      setSessionId(null);

      // Reset global state
      setTeachingActive(false);
      setCurrentActivity(null);
      clearTeachingFeedback();

      // End teacher session
      if (teacherRef.current) {
        teacherRef.current.endSession();
      }

      // Send command to 3D model
      if (setModelCommand) {
        setModelCommand(
          JSON.stringify({
            type: 'teaching_end',
            completed,
          })
        );
      }

      // Speak conclusion using Gemini Voice
      try {
        const message = completed
          ? `Great job! You've completed the ${selectedActivity.name} activity.`
          : `We've ended the ${selectedActivity.name} activity. You can try again anytime.`;

        await geminiVoice.speak(message, {
          voice: 'nova',
          enhanceText: true,
          enhancementType: 'conversational',
          language: 'en',
          emotionalTone: completed ? 'happy' : 'neutral',
          speed: 1.1
        });
      } catch (error) {
        console.error('Failed to speak conclusion with Gemini Voice:', error);
        // Fallback to Web Speech API
        const message = completed
          ? `Great job! You've completed the ${selectedActivity.name} activity.`
          : `We've ended the ${selectedActivity.name} activity. You can try again anytime.`;
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.1;
        utterance.pitch = completed ? 1.2 : 1.0;
        window.speechSynthesis.speak(utterance);
      }

      // Refresh recommended activities
      loadRecommendedActivities();
    } catch (error) {
      console.error('Error ending teaching session:', error);
    }
  };

  // Calculate session score based on feedback
  const calculateSessionScore = (): number => {
    if (!feedback.length) return 0;

    // Count positive and correction feedback
    const positive = feedback.filter(f => f.type === 'positive').length;
    const corrections = feedback.filter(f => f.type === 'correction').length;

    // Calculate score as percentage of positive feedback
    const total = positive + corrections;
    if (total === 0) return 50; // Default score

    return Math.round((positive / total) * 100);
  };

  // Handle submitting new user name
  const handleNameSubmit = async () => {
    if (!newUserName.trim()) return;

    try {
      // Capture current face descriptor
      if (videoRef.current && teacherRef.current) {
        // This is a simplified implementation - in a real app,
        // you would use face-api.js to get the face descriptor

        // Using placeholder for face descriptor (normally would get from face detection)
        const placeholderDescriptor = Array(128)
          .fill(0)
          .map(() => Math.random() - 0.5);

        // Register new user
        const user = await userRecognitionService.registerNewUser(
          newUserName,
          placeholderDescriptor,
          'friendly' // default personality
        );

        if (user) {
          setRecognizedUser(user);
          setAskingForName(false);

          // Welcome the new user using Gemini Voice
          try {
            await geminiVoice.speak(
              `Nice to meet you, ${newUserName}! In Bunker 17, I learned that remembering names and faces was essential for building trust. I'll remember you next time.`,
              {
                voice: 'nova',
                enhanceText: true,
                enhancementType: 'conversational',
                language: 'en',
                emotionalTone: 'happy',
                speed: 1.0
              }
            );
          } catch (error) {
            console.error('Failed to speak welcome message with Gemini Voice:', error);
            // Fallback to Web Speech API
            const utterance = new SpeechSynthesisUtterance(
              `Nice to meet you, ${newUserName}! In Bunker 17, I learned that remembering names and faces was essential for building trust. I'll remember you next time.`
            );
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
          }

          // Get persona for this new user
          const persona = await userRecognitionService.getUserPersona(user.id);
          setUserPersona(persona);
        }
      }
    } catch (error) {
      console.error('Error registering new user:', error);
    }
  };

  // Personalize teaching based on user
  const personalizeTeaching = (activity: ActivityDefinition) => {
    if (!userPersona) return activity;

    // Create a copy to modify
    const personalizedActivity = { ...activity };

    // Adjust step instructions based on user preferences
    if (personalizedActivity.steps) {
      personalizedActivity.steps = personalizedActivity.steps.map(step => {
        const newStep = { ...step };

        // Adjust voice instructions based on user persona
        if (userPersona.teachingStyle === 'enthusiastic') {
          newStep.voiceInstruction = `${newStep.voiceInstruction} Let's get this!`;
        } else if (userPersona.teachingStyle === 'step-by-step') {
          newStep.voiceInstruction = `Step ${newStep.order}: ${newStep.voiceInstruction}`;
        } else if (userPersona.teachingStyle === 'detailed') {
          newStep.voiceInstruction = `${newStep.voiceInstruction} Make sure to pay attention to your form.`;
        }

        return newStep;
      });
    }

    return personalizedActivity;
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* New User Registration Dialog */}
      {askingForName && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">
              Nice to meet you!
            </h2>
            <p className="text-white mb-6">
              I don't think we've met before. In Bunker 17, I learned to
              remember everyone's face and name - it was essential for building
              community. What's your name?
            </p>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="Enter your name"
                className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white w-full"
                autoFocus
              />
              <button
                onClick={handleNameSubmit}
                disabled={!newUserName.trim()}
                className={`p-3 rounded-lg text-white w-full ${
                  newUserName.trim()
                    ? 'bg-cyan-600 hover:bg-cyan-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Nice to meet you!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teaching UI */}
      {isTeachingActive ? (
        <div className="flex flex-col flex-1 relative">
          {/* Top bar with activity info */}
          <div className="bg-gray-800/80 backdrop-blur-md p-4 rounded-lg mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedActivity?.name}
              </h2>
              <p className="text-gray-300">
                {currentStepIndex + 1} of {selectedActivity?.steps.length} steps
              </p>
            </div>

            <button
              onClick={() => endTeachingSession(false)}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main content area */}
          <div className="flex flex-1 gap-4">
            {/* Left side - Camera view */}
            <div className="w-1/2 relative bg-black/30 backdrop-blur-md rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Pose guidance overlay */}
              <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                {/* Pose guides would be drawn here */}
              </div>
            </div>

            {/* Right side - Instructions and feedback */}
            <div className="w-1/2 flex flex-col">
              {/* Current step card */}
              <div className="bg-gray-800/80 backdrop-blur-md p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-cyan-400">
                  {currentStep?.name}
                </h3>
                <p className="text-gray-200 mt-2">{currentStep?.description}</p>

                {/* Tips */}
                {currentStep?.tips && currentStep.tips.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-yellow-400">
                      Tips:
                    </h4>
                    <ul className="list-disc list-inside text-gray-300 text-sm mt-1">
                      {currentStep.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Latest feedback */}
              {latestFeedback && (
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    latestFeedback.type === 'positive'
                      ? 'bg-green-800/60'
                      : latestFeedback.type === 'correction'
                        ? 'bg-amber-800/60'
                        : 'bg-blue-800/60'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold ${
                      latestFeedback.type === 'positive'
                        ? 'text-green-300'
                        : latestFeedback.type === 'correction'
                          ? 'text-amber-300'
                          : 'text-blue-300'
                    }`}
                  >
                    {latestFeedback.type === 'positive'
                      ? 'Good job!'
                      : latestFeedback.type === 'correction'
                        ? 'Try this adjustment:'
                        : 'Keep going!'}
                  </h4>
                  <p className="text-white mt-1">{latestFeedback.message}</p>
                </div>
              )}

              {/* Step controls */}
              <div className="mt-auto flex justify-between items-center bg-gray-800/80 backdrop-blur-md p-4 rounded-lg">
                <button
                  onClick={goToPreviousStep}
                  disabled={currentStepIndex === 0}
                  className={`p-3 rounded-full ${
                    currentStepIndex === 0
                      ? 'bg-gray-700 text-gray-500'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  onClick={repeatCurrentStep}
                  className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full text-white"
                >
                  <Repeat size={24} />
                </button>

                <button
                  onClick={goToNextStep}
                  className="p-3 bg-green-600 hover:bg-green-700 rounded-full text-white"
                >
                  {currentStepIndex ===
                  (selectedActivity?.steps.length || 0) - 1 ? (
                    <Check size={24} />
                  ) : (
                    <ChevronRight size={24} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Activity selection UI
        <div className="flex flex-col h-full">
          {/* Session summary if available */}
          {sessionSummary && (
            <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-lg mb-6 text-center">
              <h2 className="text-2xl font-bold text-cyan-400 mb-2">
                Session Complete!
              </h2>
              <div className="flex justify-center mb-4">
                <Award size={48} className="text-yellow-500" />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-700/80 p-3 rounded-lg">
                  <p className="text-sm text-gray-400">Steps Completed</p>
                  <p className="text-xl font-bold text-white">
                    {sessionSummary.completedSteps}/{sessionSummary.totalSteps}
                  </p>
                </div>

                <div className="bg-gray-700/80 p-3 rounded-lg">
                  <p className="text-sm text-gray-400">Performance</p>
                  <p
                    className={`text-xl font-bold ${
                      sessionSummary.feedbackStats.positive >
                      sessionSummary.feedbackStats.corrections
                        ? 'text-green-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {sessionSummary.performance === 'good'
                      ? 'Great!'
                      : 'Keep Practicing'}
                  </p>
                </div>

                <div className="bg-gray-700/80 p-3 rounded-lg">
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="text-xl font-bold text-white">
                    {Math.round(sessionSummary.duration / 1000 / 60)} min
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSessionSummary(null)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Continue
              </button>
            </div>
          )}

          {/* Activity search */}
          <div className="bg-gray-800/80 backdrop-blur-md p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Find an Activity
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for dance, exercise, cooking..."
                className="flex-1 p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Search
              </button>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  Results
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {searchResults.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onClick={() => startTeachingSession(activity)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommended activities */}
          <div className="bg-gray-800/80 backdrop-blur-md p-4 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">
              Recommended for You
            </h2>
            {recommendedActivities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedActivities.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onClick={() => startTeachingSession(activity)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Loading recommendations...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachingContext;
