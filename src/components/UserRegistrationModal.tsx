import { Camera, CheckCircle, User, X } from 'lucide-react';
import React, { useState } from 'react';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (name: string) => Promise<boolean>;
  onSkip: () => void;
}

export const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  onSkip
}) => {
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      const success = await onRegister(name.trim());
      
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError('Failed to register. Please make sure your face is clearly visible and try again.');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    setIsSuccess(false);
    setIsRegistering(false);
    onClose();
  };

  const handleSkip = () => {
    handleClose();
    onSkip();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">New Face Detected!</h3>
              <p className="text-sm text-slate-400">I'd love to remember you</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-white mb-2">Welcome, {name}!</h4>
              <p className="text-slate-400">I'll remember you from now on. Great to meet you!</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-300 font-medium">Face Recognition Active</p>
                      <p className="text-xs text-blue-400/80 mt-1">
                        I can remember you for future visits and provide personalized experiences
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-slate-300 mb-4">
                  Hi there! I can see you're new here. What's your name? I'll remember you for next time and can provide a more personalized experience.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="userName" className="block text-sm font-medium text-slate-300 mb-2">
                    Your Name
                  </label>
                  <input
                    id="userName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isRegistering}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isRegistering || !name.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4" />
                        Remember Me
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={isRegistering}
                    className="px-6 py-3 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Skip
                  </button>
                </div>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-600">
                <p className="text-xs text-slate-400 text-center">
                  Your face data is stored locally and never shared. You can clear it anytime.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRegistrationModal; 