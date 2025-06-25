import React from 'react';
import { Menu, X, Mic, MicOff, Camera, CameraOff } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { isRecording, isCameraActive, toggleRecording, toggleCamera } =
    useStore();

  return (
    <header className="bg-gray-900 text-white p-3 flex items-center justify-between border-b border-gray-800">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md lg:hidden hover:bg-gray-800 transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="text-xl font-semibold ml-2">AI Companion</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleRecording}
          className={`p-2 rounded-md transition-colors ${
            isRecording ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-gray-800'
          }`}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-2 rounded-md transition-colors ${
            isCameraActive
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'hover:bg-gray-800'
          }`}
          title={isCameraActive ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraActive ? <CameraOff size={20} /> : <Camera size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
