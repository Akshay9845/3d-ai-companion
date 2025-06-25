# Free TTS Setup Guide for 3D Avatar AI

## 🎯 Overview

This guide helps you set up free, high-quality text-to-speech alternatives to replace Google TTS API. The system now supports multiple TTS providers in priority order:

1. **Coqui TTS (XTTS)** - Free, high-quality, multilingual
2. **Browser Speech Synthesis** - Free, built-in, basic quality
3. **Google TTS** - Paid, premium quality (fallback only)

## 🚀 Quick Start

### Option 1: Coqui TTS (Recommended)

Coqui TTS provides the best free alternative with excellent Telugu and multilingual support.

#### Installation

```bash
# Install Python dependencies
pip install TTS flask flask-cors torch

# Start the Coqui TTS server
python coqui_server.py
```

#### Features
- ✅ Free and open source
- ✅ High-quality neural voices
- ✅ Excellent Telugu support
- ✅ Multilingual (Hindi, Tamil, Kannada, etc.)
- ✅ Emotion-aware synthesis
- ✅ Fast inference with GPU support
- ✅ No API limits or costs

### Option 2: Browser Speech Synthesis (Built-in)

The browser's built-in TTS works automatically as a fallback - no setup required!

#### Features
- ✅ No installation needed
- ✅ Works offline
- ✅ Basic Telugu support (varies by browser/OS)
- ⚠️ Quality varies by system
- ⚠️ Limited voice options

## 📋 Detailed Setup Instructions

### Setting up Coqui TTS Server

#### Prerequisites

```bash
# Check Python version (3.8+ required)
python --version

# Install system dependencies (Ubuntu/Debian)
sudo apt update
sudo apt install python3-pip python3-dev build-essential

# Install system dependencies (macOS)
brew install python

# Install system dependencies (Windows)
# Download Python from python.org
```

#### Step 1: Install Python Dependencies

```bash
# Create virtual environment (recommended)
python -m venv coqui-tts-env
source coqui-tts-env/bin/activate  # Linux/macOS
# or
coqui-tts-env\Scripts\activate     # Windows

# Install required packages
pip install --upgrade pip
pip install TTS flask flask-cors torch torchaudio

# For GPU acceleration (optional but recommended)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### Step 2: Start the Server

```bash
# Basic usage
python coqui_server.py

# Custom port and host
python coqui_server.py --port 5002 --host 0.0.0.0

# The server will be available at: http://localhost:5002
```

#### Step 3: Test the Server

```bash
# Health check
curl http://localhost:5002/health

# Test TTS
curl -X POST http://localhost:5002/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en", "emotion": "neutral"}' \
  --output test.wav
```

### Environment Configuration

Add these environment variables to your `.env` file:

```env
# Coqui TTS Server (free alternative)
VITE_COQUI_TTS_ENDPOINT=http://localhost:5002

# Google TTS API (optional, paid)
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

## 🎵 Voice Quality Comparison

| Provider | Quality | Telugu Support | Cost | Setup Difficulty |
|----------|---------|----------------|------|------------------|
| Coqui TTS | ⭐⭐⭐⭐⭐ | Excellent | Free | Medium |
| Browser TTS | ⭐⭐⭐ | Good | Free | None |
| Google TTS | ⭐⭐⭐⭐⭐ | Excellent | Paid | Easy |

## 🔧 Troubleshooting

### Common Issues

#### 1. Coqui TTS Server Not Starting

```bash
# Check Python version
python --version  # Should be 3.8+

# Install missing dependencies
pip install TTS flask flask-cors torch

# Check for conflicts
pip list | grep -i tts
```

#### 2. Model Download Issues

```bash
# Clear TTS cache and retry
rm -rf ~/.local/share/tts/
python coqui_server.py
```

#### 3. GPU Not Detected

```bash
# Check CUDA installation
python -c "import torch; print(torch.cuda.is_available())"

# Install CUDA-enabled PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 4. Port Already in Use

```bash
# Use different port
python coqui_server.py --port 5003

# Update environment variable
VITE_COQUI_TTS_ENDPOINT=http://localhost:5003
```

### Performance Optimization

#### For Better Performance

```bash
# Use GPU acceleration
export CUDA_VISIBLE_DEVICES=0
python coqui_server.py

# Increase worker threads
python coqui_server.py --workers 4
```

#### For Lower Resource Usage

```bash
# Use CPU-only mode
export CUDA_VISIBLE_DEVICES=""
python coqui_server.py
```

## 🌐 API Reference

### Coqui TTS API

#### Synthesize Speech

```http
POST /api/tts
Content-Type: application/json

{
  "text": "Hello, how are you?",
  "language": "en",
  "emotion": "neutral",
  "speed": 1.0
}
```

**Response:** Audio file (WAV format)

#### Supported Languages

- `en` - English
- `te` - Telugu
- `hi` - Hindi
- `ta` - Tamil
- `kn` - Kannada
- `ml` - Malayalam
- `bn` - Bengali
- `mr` - Marathi
- `gu` - Gujarati

#### Supported Emotions

- `neutral` - Default voice
- `happy` - Cheerful tone
- `sad` - Melancholic tone
- `excited` - Energetic tone
- `calm` - Peaceful tone
- `confident` - Assertive tone
- `empathetic` - Caring tone

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": ["multilingual"],
  "cuda_available": true,
  "version": "1.0.0"
}
```

## 🔄 Automatic Fallback System

The system automatically tries providers in this order:

1. **Coqui TTS** - If server is running at `VITE_COQUI_TTS_ENDPOINT`
2. **Browser TTS** - If Web Speech API is available
3. **Google TTS** - If API key is configured (last resort)

### Error Handling

When Google TTS fails (403 Forbidden), the system automatically:

1. Logs the error with details
2. Switches to Coqui TTS if available
3. Falls back to browser TTS if Coqui is unavailable
4. Provides clear error messages for debugging

## 📊 Monitoring and Logs

### Server Logs

   ```bash
# View real-time logs
python coqui_server.py | tee coqui-tts.log

# Check for errors
grep -i error coqui-tts.log
```

### Client-Side Logs

Open browser DevTools (F12) and check console for:

- `🔧 Attempting Coqui TTS...` - Trying Coqui server
- `✅ Coqui TTS successful` - Success with Coqui
- `🎵 Using enhanced browser voice` - Fallback to browser TTS
- `⚠️ Google TTS API error detected` - Google API issues

## 🚀 Production Deployment

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY coqui_server.py .
EXPOSE 5002

CMD ["python", "coqui_server.py", "--host", "0.0.0.0", "--port", "5002"]
```

### Systemd Service

```ini
[Unit]
Description=Coqui TTS Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/coqui-tts
ExecStart=/opt/coqui-tts/venv/bin/python coqui_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

## 💡 Tips and Best Practices

1. **Use GPU acceleration** for faster inference
2. **Pre-load models** on server startup
3. **Cache audio files** for repeated text
4. **Monitor resource usage** in production
5. **Set up health checks** for reliability
6. **Use load balancing** for high traffic
7. **Configure proper logging** for debugging

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for errors
3. Test each component individually
4. Verify network connectivity
5. Check system requirements

The enhanced TTS system is designed to be robust and automatically handle failures, ensuring your 3D Avatar AI always has working voice capabilities! 