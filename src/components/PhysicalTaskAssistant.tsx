import { CheckCircle, Eye, HelpCircle, Lightbulb } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface PhysicalTaskAssistantProps {
  isActive: boolean;
  onTaskGuidance: (guidance: string) => void;
  currentVisionDescription?: string;
}

interface TaskStep {
  id: string;
  description: string;
  isCompleted: boolean;
  feedback?: string;
}

interface TaskGuidance {
  taskType: string;
  steps: TaskStep[];
  currentStep: number;
  tips: string[];
}

const PhysicalTaskAssistant: React.FC<PhysicalTaskAssistantProps> = ({
  isActive,
  onTaskGuidance,
  currentVisionDescription
}) => {
  const [currentTask, setCurrentTask] = useState<TaskGuidance | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Common physical tasks that can be assisted
  const taskTemplates = {
    cooking: {
      taskType: 'Cooking',
      steps: [
        { id: '1', description: 'Gather all ingredients', isCompleted: false },
        { id: '2', description: 'Prepare cooking surface', isCompleted: false },
        { id: '3', description: 'Follow recipe steps', isCompleted: false },
        { id: '4', description: 'Plate and serve', isCompleted: false }
      ],
      currentStep: 0,
      tips: [
        'Make sure to read the entire recipe first',
        'Prep all ingredients before cooking',
        'Keep workspace clean and organized',
        'Taste as you go and adjust seasoning'
      ]
    },
    exercise: {
      taskType: 'Exercise',
      steps: [
        { id: '1', description: 'Warm up properly', isCompleted: false },
        { id: '2', description: 'Check form and posture', isCompleted: false },
        { id: '3', description: 'Perform exercise routine', isCompleted: false },
        { id: '4', description: 'Cool down and stretch', isCompleted: false }
      ],
      currentStep: 0,
      tips: [
        'Start with proper warm-up to prevent injury',
        'Focus on form over speed or weight',
        'Listen to your body and rest when needed',
        'Stay hydrated throughout workout'
      ]
    },
    repair: {
      taskType: 'Repair/Fix',
      steps: [
        { id: '1', description: 'Identify the problem', isCompleted: false },
        { id: '2', description: 'Gather necessary tools', isCompleted: false },
        { id: '3', description: 'Follow repair steps', isCompleted: false },
        { id: '4', description: 'Test the fix', isCompleted: false }
      ],
      currentStep: 0,
      tips: [
        'Safety first - turn off power if electrical',
        'Take photos before disassembly',
        'Work in good lighting conditions',
        'Don\'t force parts that seem stuck'
      ]
    }
  };

  useEffect(() => {
    if (isActive && currentVisionDescription) {
      analyzeCurrentTask();
    }
  }, [isActive, currentVisionDescription]);

  const analyzeCurrentTask = () => {
    if (!currentVisionDescription) return;

    const description = currentVisionDescription.toLowerCase();
    
    // Simple task detection based on vision description
    let detectedTask = null;
    
    if (description.includes('kitchen') || description.includes('cooking') || 
        description.includes('recipe') || description.includes('ingredient')) {
      detectedTask = 'cooking';
    } else if (description.includes('exercise') || description.includes('workout') || 
               description.includes('gym') || description.includes('stretching')) {
      detectedTask = 'exercise';
    } else if (description.includes('tool') || description.includes('repair') || 
               description.includes('fix') || description.includes('broken')) {
      detectedTask = 'repair';
    }

    if (detectedTask && taskTemplates[detectedTask as keyof typeof taskTemplates]) {
      setCurrentTask({ ...taskTemplates[detectedTask as keyof typeof taskTemplates] });
      generateTaskSuggestions(detectedTask, description);
    }
  };

  const generateTaskSuggestions = (taskType: string, description: string) => {
    const newSuggestions: string[] = [];

    switch (taskType) {
      case 'cooking':
        newSuggestions.push(
          "I can see you're in the kitchen! I can help guide you through cooking steps.",
          "Make sure your workspace is clean and all ingredients are within reach.",
          "Let me know what you're cooking so I can provide specific guidance!"
        );
        break;
      case 'exercise':
        newSuggestions.push(
          "Great to see you exercising! I can help check your form and technique.",
          "Remember to maintain proper posture throughout your workout.",
          "Let me know if you need guidance on any specific exercises!"
        );
        break;
      case 'repair':
        newSuggestions.push(
          "I can see you're working on something! Safety should be your first priority.",
          "Make sure you have all the right tools before starting.",
          "Feel free to show me what you're working on for specific advice!"
        );
        break;
    }

    setSuggestions(newSuggestions);
    
    // Send first suggestion as guidance
    if (newSuggestions.length > 0) {
      onTaskGuidance(newSuggestions[0]);
    }
  };

  const completeStep = (stepId: string) => {
    if (!currentTask) return;

    const updatedTask = {
      ...currentTask,
      steps: currentTask.steps.map(step => 
        step.id === stepId ? { ...step, isCompleted: true } : step
      )
    };

    const currentStepIndex = currentTask.steps.findIndex(step => step.id === stepId);
    if (currentStepIndex >= 0) {
      updatedTask.currentStep = Math.min(currentStepIndex + 1, currentTask.steps.length - 1);
    }

    setCurrentTask(updatedTask);

    // Provide feedback on completion
    const feedback = `Great job completing: ${currentTask.steps.find(s => s.id === stepId)?.description}!`;
    onTaskGuidance(feedback);
  };

  const provideTip = () => {
    if (!currentTask || currentTask.tips.length === 0) return;

    const randomTip = currentTask.tips[Math.floor(Math.random() * currentTask.tips.length)];
    onTaskGuidance(`💡 Tip: ${randomTip}`);
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 max-w-md">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Physical Task Assistant</h3>
      </div>

      {currentTask ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">{currentTask.taskType}</span>
            <button
              onClick={() => setIsWatching(!isWatching)}
              className={`px-2 py-1 rounded text-xs font-medium ${
                isWatching 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isWatching ? '👁️ Watching' : '💤 Idle'}
            </button>
          </div>

          <div className="space-y-2">
            {currentTask.steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-2">
                <button
                  onClick={() => completeStep(step.id)}
                  disabled={step.isCompleted}
                  className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    step.isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : index === currentTask.currentStep
                        ? 'border-blue-500 hover:bg-blue-50'
                        : 'border-gray-300'
                  }`}
                >
                  {step.isCompleted && <CheckCircle className="w-3 h-3" />}
                </button>
                <div className="flex-1">
                  <div className={`text-sm ${
                    step.isCompleted 
                      ? 'text-green-700 line-through' 
                      : index === currentTask.currentStep
                        ? 'text-blue-700 font-medium'
                        : 'text-gray-600'
                  }`}>
                    {step.description}
                  </div>
                  {step.feedback && (
                    <div className="text-xs text-green-600 mt-1">
                      {step.feedback}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={provideTip}
              className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
            >
              <Lightbulb className="w-3 h-3" />
              Tip
            </button>
            <button
              onClick={() => setCurrentTask(null)}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            I'm ready to help with physical tasks!
          </p>
          <p className="text-xs text-gray-500">
            Show me what you're working on and I'll provide guidance
          </p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-2">Suggestions:</div>
          <div className="space-y-1">
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <div key={index} className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhysicalTaskAssistant; 