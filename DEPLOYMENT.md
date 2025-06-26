# 🚀 Deployment Guide - 3D AI Avatar System

> Complete guide to deploy the most advanced 3D AI Avatar System to production

## 📋 **Table of Contents**

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Docker Deployment](#docker-deployment)
- [Performance Optimization](#performance-optimization)
- [Environment Configuration](#environment-configuration)
- [Monitoring & Analytics](#monitoring--analytics)
- [Troubleshooting](#troubleshooting)

## 🔧 **Prerequisites**

### **System Requirements**
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: Latest version
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+
- **GPU**: NVIDIA GPU recommended for optimal performance
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB available space

### **Optional Dependencies**
- **Google Cloud Account**: For enhanced TTS
- **Supabase Account**: For user management
- **Groq AI Account**: For enhanced conversations
- **Domain Name**: For production deployment

## 🏠 **Local Development**

### **Quick Start**
```bash
# Clone the repository
git clone https://github.com/yourusername/3dmama.git
cd 3dmama

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:5173
```

### **Development Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

### **Environment Setup**
Create a `.env` file in the root directory:

```env
# Google Cloud TTS (Optional - for enhanced voice quality)
VITE_GOOGLE_API_KEY=your_google_api_key

# Supabase (Optional - for user management)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Groq AI (Optional - for enhanced conversations)
VITE_GROQ_API_KEY=your_groq_api_key

# Development settings
VITE_DEV_MODE=true
VITE_DEBUG_ANIMATIONS=true
```

## 🌐 **Production Deployment**

### **Build for Production**
```bash
# Build the project
npm run build

# The build output will be in the 'dist' directory
ls dist/
```

### **Static File Deployment**
```bash
# Copy build files to your web server
cp -r dist/* /var/www/html/

# Or use a static file server
npx serve dist/
```

## ☁️ **Cloud Platforms**

### **Vercel Deployment**

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy to Vercel**
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_GOOGLE_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GROQ_API_KEY
```

3. **Vercel Configuration**
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### **Netlify Deployment**

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Deploy to Netlify**
```bash
# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables
netlify env:set VITE_GOOGLE_API_KEY your_google_api_key
netlify env:set VITE_SUPABASE_URL your_supabase_url
netlify env:set VITE_SUPABASE_ANON_KEY your_supabase_key
netlify env:set VITE_GROQ_API_KEY your_groq_api_key
```

3. **Netlify Configuration**
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### **GitHub Pages Deployment**

1. **Add GitHub Pages Script**
Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

2. **Install gh-pages**
```bash
npm install --save-dev gh-pages
```

3. **Deploy**
```bash
npm run deploy
```

### **AWS S3 + CloudFront**

1. **Build and Upload**
```bash
# Build the project
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

2. **S3 Configuration**
- Enable static website hosting
- Set index document to `index.html`
- Configure CORS if needed

### **Google Cloud Platform**

1. **Deploy to App Engine**
```bash
# Create app.yaml
cat > app.yaml << EOF
runtime: nodejs18
service: 3dmama

handlers:
  - url: /static
    static_dir: dist/static
  - url: /.*
    static_files: dist/index.html
    upload: dist/index.html
EOF

# Deploy
gcloud app deploy
```

2. **Deploy to Cloud Run**
```bash
# Build and deploy
gcloud run deploy 3dmama --source . --platform managed --region us-central1
```

## 🐳 **Docker Deployment**

### **Dockerfile**
Create `Dockerfile`:
```dockerfile
# Use Node.js 18 Alpine
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### **Docker Compose**
Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - VITE_GOOGLE_API_KEY=${VITE_GOOGLE_API_KEY}
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - VITE_GROQ_API_KEY=${VITE_GROQ_API_KEY}
    restart: unless-stopped
```

### **Build and Run**
```bash
# Build Docker image
docker build -t 3dmama .

# Run container
docker run -p 3000:3000 3dmama

# Or use Docker Compose
docker-compose up -d
```

## ⚡ **Performance Optimization**

### **Build Optimization**
```bash
# Analyze bundle size
npm run build -- --analyze

# Optimize images
npm install --save-dev vite-plugin-imagemin

# Enable compression
npm install --save-dev vite-plugin-compression
```

### **Runtime Optimization**
```javascript
// Lazy load components
const VoiceDrivenConversationSystem = lazy(() => import('./components/VoiceDrivenConversationSystem'));

// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Optimize animations
const animationConfig = {
  timeScale: 0.5,
  crossFade: 0.8,
  priority: 1
};
```

### **Caching Strategy**
```javascript
// Service Worker for caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Cache static assets
const CACHE_NAME = '3dmama-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/ECHO/animations/'
];
```

## 🔧 **Environment Configuration**

### **Production Environment**
```env
# Production settings
NODE_ENV=production
VITE_APP_ENV=production

# API Keys (set in your deployment platform)
VITE_GOOGLE_API_KEY=your_production_google_api_key
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_key
VITE_GROQ_API_KEY=your_production_groq_api_key

# Performance settings
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_MONITORING=true
VITE_CACHE_DURATION=3600
```

### **Staging Environment**
```env
# Staging settings
NODE_ENV=staging
VITE_APP_ENV=staging

# Use staging API keys
VITE_GOOGLE_API_KEY=your_staging_google_api_key
VITE_SUPABASE_URL=your_staging_supabase_url
VITE_SUPABASE_ANON_KEY=your_staging_supabase_key
VITE_GROQ_API_KEY=your_staging_groq_api_key

# Debug settings
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**
```javascript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### **Error Tracking**
```javascript
// Error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Send error to monitoring service
    console.error('Error caught:', error, errorInfo);
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});
```

### **User Analytics**
```javascript
// Track user interactions
const trackEvent = (eventName, properties) => {
  // Send to analytics service
  console.log('Event:', eventName, properties);
};

// Track animation performance
const trackAnimationPerformance = (animationName, duration) => {
  trackEvent('animation_performance', {
    animation: animationName,
    duration: duration,
    timestamp: Date.now()
  });
};
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version

# Update dependencies
npm update
```

#### **Performance Issues**
```bash
# Check bundle size
npm run build -- --analyze

# Monitor memory usage
node --max-old-space-size=4096 node_modules/.bin/vite

# Enable performance profiling
VITE_PROFILE=true npm run dev
```

#### **Animation Issues**
```bash
# Check WebGL support
npx webgl-check

# Verify animation files
ls -la public/ECHO/animations/

# Test animation system
npm run test:animations
```

#### **API Issues**
```bash
# Test API connectivity
curl -X GET "https://your-api-endpoint.com/health"

# Check environment variables
echo $VITE_GOOGLE_API_KEY

# Verify API keys
npm run test:api
```

### **Debug Mode**
```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// Check console for detailed logs
console.log('Debug mode enabled');

// Monitor performance
performance.mark('start');
// ... your code ...
performance.mark('end');
performance.measure('duration', 'start', 'end');
```

### **Support Resources**
- **Documentation**: [Full Documentation](https://docs.3dmama.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/3dmama/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/3dmama/discussions)
- **Email**: support@3dmama.com

## 🎯 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All tests pass
- [ ] Build completes successfully
- [ ] Environment variables configured
- [ ] API keys valid and working
- [ ] Performance benchmarks met
- [ ] Security audit completed

### **Deployment**
- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Performance testing completed
- [ ] User acceptance testing passed
- [ ] Deploy to production
- [ ] Monitor for issues

### **Post-Deployment**
- [ ] Verify all features working
- [ ] Monitor performance metrics
- [ ] Check error rates
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Documentation updates

## 🚀 **Advanced Deployment**

### **Multi-Region Deployment**
```bash
# Deploy to multiple regions
vercel --prod --regions sfo1,iad1,cdg1

# Or use AWS Global Accelerator
aws globalaccelerator create-accelerator --name 3dmama-global
```

### **CDN Configuration**
```javascript
// Configure CDN for static assets
const cdnConfig = {
  baseURL: 'https://cdn.3dmama.com',
  assets: ['/ECHO/animations/', '/static/'],
  cache: {
    maxAge: 31536000, // 1 year
    immutable: true
  }
};
```

### **Load Balancing**
```nginx
# Nginx configuration
upstream 3dmama_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name 3dmama.com;
    
    location / {
        proxy_pass http://3dmama_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🎉 **Deployment Complete!**

Your 3D AI Avatar System is now deployed and ready to serve users worldwide! 

**Next Steps:**
1. **Monitor performance** and user feedback
2. **Optimize** based on usage patterns
3. **Scale** as user base grows
4. **Update** with new features and improvements

**Happy Deploying!** 🚀

---

*This deployment guide is continuously updated. For the latest information, check the [GitHub repository](https://github.com/yourusername/3dmama).* 