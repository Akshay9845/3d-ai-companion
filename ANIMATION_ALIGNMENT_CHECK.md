# Animation Alignment Check with Happy-Idle Base

## Happy-Idle Base Configuration (Reference)
```
weight: 1.0 (base layer)
timeScale: 1.0 (natural speed)
crossFadeDuration: 3.0
priority: 1 (base layer)
```

## Issues Found - Animations NOT Aligned with Happy-Idle

### ❌ **Problem 1: Fighting Animations - Weight Too High**
These have `weight: 1.0` which overpowers the base happy-idle layer:
- fighting-idle, fight-idle, fight-idle-1, fight-idle-2, fight-idle-3
- **Issue**: Full weight dominates the base pose completely

### ❌ **Problem 2: Gesture Animations - Too Slow TimeScale**
These have `timeScale: 0.3` causing pose freezing:
- weight-shift, angry-gesture, being-cocky, dismissing-gesture, defeat
- acknowledging, head-nod-yes, happy-hand-gesture, looking, lengthy-head-nod
- relieved-sigh, thoughtful-head-shake, yawn, shaking-head-no, no
- look-away-gesture, sarcastic-head-nod, annoyed-head-shake, hard-head-nod
- **Issue**: Too slow, gets stuck in extreme poses, doesn't flow with happy-idle

### ❌ **Problem 3: Inconsistent CrossFade Durations**
Mixed crossFade times cause jarring transitions:
- Dance animations: 1.5s (good)
- Fighting animations: 0.8s (too short)
- Gestures: 0.6s - 1.0s (inconsistent)
- **Issue**: Inconsistent blending with happy-idle base

### ✅ **Properly Aligned (Recent Fixes)**
- salsa-dancing, gangnam-style, moonwalk, locking-hip-hop-dance, jump
- excited, happy, happy-walk
- warming-up, push-up, idle-to-push-up
- plank, end-plank, air-squat

## Required Fixes for Alignment

### **Fighting Animations** (NEED WEIGHT REDUCTION)
```
Current: weight: 1.0, timeScale: 0.7, crossFade: 0.8
Needed:  weight: 0.8, timeScale: 0.8, crossFade: 1.2
```

### **Gesture/Communication Animations** (NEED SPEED INCREASE)
```
Current: weight: 1.0, timeScale: 0.3, crossFade: 0.6-1.0
Needed:  weight: 0.8, timeScale: 0.7, crossFade: 1.0
```

### **Teaching/Education Animations** (NEED SPEED INCREASE)
```
Current: weight: 1.0, timeScale: 0.3, crossFade: 0.8
Needed:  weight: 0.8, timeScale: 0.7, crossFade: 1.0
```

### **Emotional Expressions** (NEED SPEED INCREASE)
```
Current: weight: 1.0, timeScale: 0.3, crossFade: 1.0
Needed:  weight: 0.8, timeScale: 0.7, crossFade: 1.0
```

## Target Unified Configuration

### **High Energy Animations** (Dance, Exercise, Action)
- weight: 0.7-0.8
- timeScale: 0.8-1.0
- crossFadeDuration: 1.2-1.5

### **Social/Communication Animations** (Gestures, Talking)
- weight: 0.8
- timeScale: 0.7
- crossFadeDuration: 1.0

### **Base Layer** (Happy-Idle)
- weight: 1.0 (always active)
- timeScale: 1.0
- crossFadeDuration: 3.0 