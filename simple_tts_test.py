#!/usr/bin/env python3
"""
Simple Coqui TTS Test
Test if TTS is working with the simplest possible setup
"""

import sys
import tempfile
import os

def test_tts():
    """Test TTS with the simplest model"""
    print("🧪 Testing Coqui TTS...")
    
    try:
        from TTS.api import TTS
        print("✅ TTS library imported successfully")
        
        # Try the simplest English model
        print("🔄 Loading simple English model...")
        tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC_ph")
        print("✅ Model loaded successfully!")
        
        # Test synthesis
        print("🎵 Testing synthesis...")
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            temp_path = tmp_file.name
        
        text = "Hello, this is a test of Coqui TTS."
        tts.tts_to_file(text=text, file_path=temp_path)
        
        # Check if file was created
        if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
            print(f"✅ Audio generated successfully: {temp_path}")
            print(f"📁 File size: {os.path.getsize(temp_path)} bytes")
            return True
        else:
            print("❌ Audio file not created")
            return False
            
    except ImportError as e:
        print(f"❌ TTS library not found: {e}")
        return False
    except Exception as e:
        print(f"❌ TTS test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Simple Coqui TTS Test")
    print("=" * 30)
    
    success = test_tts()
    
    if success:
        print("\n🎉 Coqui TTS is working!")
        print("💡 Ready to use in server mode")
    else:
        print("\n❌ Coqui TTS test failed")
        print("💡 Check installation or try different model") 