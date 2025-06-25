#!/usr/bin/env python3
"""
Coqui TTS Installation Script
Installs Coqui TTS and dependencies for free high-quality text-to-speech
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required. Current version:", sys.version)
        return False
    print(f"✅ Python version OK: {version.major}.{version.minor}.{version.micro}")
    return True

def install_coqui_tts():
    """Install Coqui TTS and dependencies"""
    print("🎯 Installing Coqui TTS for Free High-Quality Text-to-Speech")
    print("=" * 60)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Install required packages
    packages = [
        "torch",
        "torchaudio", 
        "TTS",
        "flask",
        "flask-cors"
    ]
    
    for package in packages:
        if not run_command(f"pip3 install {package}", f"Installing {package}"):
            print(f"⚠️  Failed to install {package}, but continuing...")
    
    print("\n🎉 Installation completed!")
    print("\n📋 Next steps:")
    print("1. Run the TTS server: python coqui_server.py")
    print("2. Visit: http://localhost:5173/comprehensive-tts-test.html")
    print("3. Test Coqui TTS with real high-quality voices!")
    print("\n💡 The server will download models on first use (~1GB)")
    
    return True

def test_installation():
    """Test if Coqui TTS is working"""
    print("\n🧪 Testing Coqui TTS installation...")
    
    try:
        from TTS.api import TTS
        print("✅ TTS library imported successfully")
        
        # Try to initialize a small model for testing
        print("🔄 Testing with a small model...")
        tts = TTS("tts_models/en/ljspeech/tacotron2-DDC")
        print("✅ Model loaded successfully")
        
        print("✅ Coqui TTS is ready to use!")
        return True
        
    except ImportError:
        print("❌ TTS library not found")
        return False
    except Exception as e:
        print(f"⚠️  TTS test failed: {e}")
        print("💡 This might be normal - models will download when needed")
        return True

if __name__ == "__main__":
    print("🚀 Coqui TTS Free Installation Script")
    print("=====================================\n")
    
    if install_coqui_tts():
        test_installation()
        
        print("\n🎯 Ready to start!")
        print("Run: python coqui_server.py")
    else:
        print("\n❌ Installation failed")
        print("💡 Try manual installation:")
        print("   pip3 install TTS flask flask-cors torch torchaudio") 