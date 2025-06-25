#!/usr/bin/env python3
"""
Real Coqui TTS Server for 3D Avatar AI
======================================

This server provides real TTS using Coqui TTS library.
Installation:
1. pip install flask flask-cors TTS
2. python coqui_server.py

Usage:
POST /api/tts
{
    "text": "Hello world",
    "language": "en",
    "speed": 1.0
}
"""

import os
import sys
import json
import logging
import tempfile
from pathlib import Path

try:
    from flask import Flask, request, jsonify, send_file
    from flask_cors import CORS
except ImportError as e:
    print(f"❌ Missing dependencies: {e}")
    print("📦 Please install required packages:")
    print("pip install flask flask-cors")
    sys.exit(1)

# Try to import TTS, fallback to mock if not available
try:
    from TTS.api import TTS
    TTS_AVAILABLE = True
    print("✅ Coqui TTS library found - using real TTS")
except ImportError as e:
    TTS_AVAILABLE = False
    print(f"⚠️ Coqui TTS library not available: {e}")
    print("📦 Install with: pip install TTS")
    print("🔄 Falling back to mock TTS server")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CoquiTTSServer:
    def __init__(self, port: int = 5002, host: str = '0.0.0.0'):
        self.app = Flask(__name__)
        CORS(self.app)  # Enable CORS for web apps
        
        self.port = port
        self.host = host
        self.temp_dir = tempfile.mkdtemp()
        
        # Initialize TTS model if available
        self.tts_model = None
        if TTS_AVAILABLE:
            try:
                # Use a simpler model that's more likely to work
                logger.info("🔄 Loading Coqui TTS model...")
                self.tts_model = TTS(model_name="tts_models/en/ljspeech/fast_pitch", progress_bar=False)
                logger.info("✅ Coqui TTS model loaded successfully")
            except Exception as e:
                logger.error(f"❌ Failed to load TTS model: {e}")
                try:
                    # Try an even simpler model
                    logger.info("🔄 Trying alternative model...")
                    self.tts_model = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
                    logger.info("✅ Alternative TTS model loaded successfully")
                except Exception as e2:
                    logger.error(f"❌ Failed to load alternative model: {e2}")
                    self.tts_model = None
        
        self.setup_routes()
        
    def setup_routes(self):
        """Setup Flask routes"""
        
        @self.app.route('/health', methods=['GET'])
        def health_check():
            """Health check endpoint"""
            return jsonify({
                'status': 'healthy',
                'model_loaded': self.tts_model is not None,
                'cuda_available': False,
                'version': '1.0.0-real' if self.tts_model else '1.0.0-mock'
            })

        @self.app.route('/api/tts', methods=['POST'])
        def synthesize_speech():
            """Real TTS endpoint using Coqui TTS"""
            try:
                data = request.get_json()
                
                if not data or 'text' not in data:
                    return jsonify({'error': 'Missing text parameter'}), 400
                
                text = data['text'].strip()
                if not text:
                    return jsonify({'error': 'Empty text'}), 400
        
                language = data.get('language', 'en')
                speed = float(data.get('speed', 1.0))
        
                logger.info(f"🎵 TTS request: {text[:50]}... (lang: {language})")
        
                if self.tts_model:
                    # Use real Coqui TTS
                    audio_path = self.generate_real_audio(text, speed)
                else:
                    # Fallback to mock audio
                audio_path = self.generate_mock_audio(text)
        
                if not audio_path or not os.path.exists(audio_path):
                    return jsonify({'error': 'Failed to generate speech'}), 500
        
                return send_file(
                    audio_path,
                    mimetype='audio/wav',
                    as_attachment=False,
                    download_name='speech.wav'
                )
        
            except Exception as e:
                logger.error(f"❌ TTS error: {e}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/api/voices', methods=['GET'])
        def list_voices():
            """List available voices"""
            return jsonify({
                'model': 'coqui-tts-real' if self.tts_model else 'mock-tts-server',
                'loaded': self.tts_model is not None,
                'supported_languages': ['en']
            })
    
    def generate_real_audio(self, text: str, speed: float = 1.0) -> str:
        """Generate real audio using Coqui TTS"""
        try:
            # Create output file path
            output_path = os.path.join(self.temp_dir, f"coqui_tts_{hash(text)}.wav")
            
            # Generate speech using Coqui TTS
            self.tts_model.tts_to_file(
                text=text,
                file_path=output_path,
                speed=speed
            )
            
            logger.info(f"✅ Real Coqui TTS audio generated: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Real TTS generation failed: {e}")
            # Fallback to mock audio
            return self.generate_mock_audio(text)
    
    def generate_mock_audio(self, text: str) -> str:
        """Generate mock audio file (silence) as fallback"""
        try:
            import wave
            import struct
            
            # Create output file path
            output_path = os.path.join(self.temp_dir, f"mock_tts_{hash(text)}.wav")
            
            # Create a simple WAV file with silence
            sample_rate = 22050
            duration = 1.0  # 1 second of silence
            num_samples = int(sample_rate * duration)
            
            with wave.open(output_path, 'w') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                
                # Write silence (zeros)
                for _ in range(num_samples):
                    wav_file.writeframes(struct.pack('<h', 0))
            
            logger.info(f"✅ Mock audio generated (fallback): {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Mock audio generation failed: {e}")
            raise
    
    def run(self):
        """Start the server"""
        server_type = "Real Coqui TTS" if self.tts_model else "Mock TTS"
        logger.info(f"🚀 Starting {server_type} Server on {self.host}:{self.port}")
        logger.info("📖 Available endpoints:")
        logger.info("  GET  /health - Health check")
        logger.info("  POST /api/tts - Text-to-speech")
        logger.info("  GET  /api/voices - List voices")
        
        if self.tts_model:
            logger.info("✅ Using real Coqui TTS with high-quality speech synthesis")
        else:
            logger.info("⚠️ Using mock TTS - install TTS library for real speech")
            logger.info("📦 Install with: pip install TTS")
        
        try:
            self.app.run(host=self.host, port=self.port, debug=False)
        except KeyboardInterrupt:
            logger.info("🛑 Server stopped by user")
        except Exception as e:
            logger.error(f"❌ Server error: {e}")

def main():
    """Main function"""
    server = CoquiTTSServer()
    server.run()

if __name__ == "__main__":
    main() 