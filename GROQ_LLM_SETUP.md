# 🤖 Groq LLM Integration Setup Guide

This guide will help you integrate Groq's fast LLM service into your speech pipeline for real AI responses.

## 🎯 What is Groq?

Groq is a lightning-fast LLM service that provides:
- **Ultra-fast responses** (often under 100ms)
- **High-quality AI models** (Llama 3.1, Mixtral, etc.)
- **Cost-effective pricing** 
- **Simple API integration**

## 📋 Prerequisites

1. **Groq Account**: Sign up at [console.groq.com](https://console.groq.com)
2. **API Key**: Get your free API key from the Groq console
3. **Node.js**: Version 16+ (already installed in your project)

## 🔑 Getting Your Groq API Key

1. **Visit** [console.groq.com](https://console.groq.com)
2. **Sign up** for a free account
3. **Navigate** to API Keys section
4. **Create** a new API key
5. **Copy** the key (it starts with `gsk_...`)

## 🚀 Quick Setup

### Option 1: Through Settings Panel (Recommended)

1. **Open** your app and go to the main chat interface
2. **Click** the settings icon (⚙️) in the top right
3. **Scroll** to "Groq LLM Configuration" section
4. **Enter** your Groq API key
5. **Click** "Save API Key"
6. **Verify** the status shows "Real LLM Active"

### Option 2: Through Test Page

1. **Navigate** to `http://localhost:5173/groq-test.html`
2. **Enter** your Groq API key
3. **Click** "Set API Key"
4. **Test** with a sample message
5. **Verify** you get real AI responses

### Option 3: Programmatically

```javascript
import { groqService } from './src/lib/groqService.js';

// Set your API key
groqService.setApiKey('gsk_your_api_key_here');

// Test the service
const response = await groqService.chat('Hello! How are you?');
console.log(response);
```

## 🧪 Testing the Integration

### Test Page
Visit `http://localhost:5173/groq-test.html` for a comprehensive test interface.

### Manual Testing
```javascript
// In browser console
const response = await groqService.chat('Tell me a joke');
console.log(response);
```

### Integration Test
1. **Open** the main chat interface
2. **Type** or **speak** a message
3. **Verify** you get intelligent responses instead of mock responses

## 🔧 Configuration Options

### Available Models
The service uses these Groq models:
- **`llama3.1-8b-instant`** (default) - Fast and efficient
- **`llama3.1-70b-8192`** - Higher quality, slower
- **`mixtral-8x7b-32768`** - Balanced performance

### Customizing the Service
```javascript
// Change model (in groqService.ts)
const requestBody = {
  model: 'llama3.1-70b-8192', // Change this line
  messages: [...],
  temperature: 0.7,           // Adjust creativity (0-1)
  max_tokens: 1000,          // Adjust response length
  top_p: 0.9                 // Adjust response diversity
};
```

## 📊 Monitoring & Debugging

### Console Logs
The service provides detailed logging:
```
🤖 Initializing Groq Service...
✅ Groq Service initialized with API key
🤖 Processing message with Groq...
✅ Groq response generated
📊 Tokens used: 45
```

### Status Indicators
- **Mock Mode**: ⚠️ No API key configured
- **Real LLM**: ✅ Connected and ready
- **Error**: ❌ API key invalid or network issue

### Common Issues

#### ❌ "Mock Mode Active"
**Cause**: No API key configured
**Solution**: Set your Groq API key in settings

#### ❌ "Groq API error: 401"
**Cause**: Invalid API key
**Solution**: Check your API key at console.groq.com

#### ❌ "Groq API error: 429"
**Cause**: Rate limit exceeded
**Solution**: Wait a moment and try again

#### ❌ "Network error"
**Cause**: Internet connection issue
**Solution**: Check your internet connection

## 💰 Pricing & Limits

### Free Tier
- **$0.05 per 1M input tokens**
- **$0.10 per 1M output tokens**
- **No monthly limits**
- **Fast response times**

### Example Costs
- **Short conversation**: ~$0.001
- **Long response**: ~$0.01
- **Daily usage**: ~$0.10-1.00

## 🔄 Fallback Behavior

The service includes intelligent fallback:
1. **Real Groq API** (if API key configured)
2. **Mock responses** (if no API key or error)
3. **Enhanced mock responses** (context-aware)

## 🛠️ Advanced Configuration

### Environment Variables
```bash
# .env file
GROQ_API_KEY=gsk_your_api_key_here
```

### Local Storage
The API key is automatically saved to browser localStorage for persistence.

### Conversation History
The service maintains conversation context for better responses:
```javascript
// Clear conversation history
groqService.clearConversation();
```

## 🎯 Integration with Speech Pipeline

The Groq service is fully integrated with your speech pipeline:

1. **User speaks** → Whisper STT converts to text
2. **Text sent** → Groq LLM generates response
3. **Response sent** → Gemini TTS converts to speech
4. **Speech played** → User hears AI response

### Flow Example
```
🎤 "Hello, how are you?" 
    ↓ (Whisper STT)
📝 "Hello, how are you?"
    ↓ (Groq LLM)
🤖 "Hello! I'm doing great, thank you for asking. How can I help you today?"
    ↓ (Gemini TTS)
🔊 [Audio response played]
```

## 🚀 Performance Tips

1. **Use appropriate models** for your use case
2. **Keep conversations focused** for faster responses
3. **Monitor token usage** in console logs
4. **Clear conversation history** periodically

## 📞 Support

- **Groq Documentation**: [docs.groq.com](https://docs.groq.com)
- **API Reference**: [api.groq.com](https://api.groq.com)
- **Console**: [console.groq.com](https://console.groq.com)

## ✅ Success Checklist

- [ ] Groq account created
- [ ] API key obtained
- [ ] API key configured in settings
- [ ] Test page working
- [ ] Real responses received
- [ ] Speech pipeline integrated
- [ ] Conversation flow working

---

**🎉 Congratulations!** You now have a fully functional AI speech pipeline with real LLM responses! 