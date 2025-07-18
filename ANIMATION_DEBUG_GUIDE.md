# Animation Debug Guide

## Quick Tests in Browser Console

### 1. Test Animation System Status
```javascript
(window).animationStatus()
```
**Expected output:**
```
{
  modelVisible: true,
  currentAnimation: "happy-idle", 
  isPlaying: true,
  mixerExists: true,
  loaderExists: true,
  hasTimeout: false,
  animationServiceCallbackSet: "Check AvatarChatOverlay logs"
}
```

### 2. Test Direct Animation
```javascript
(window).testAnimation('waving-2')
```
**Expected:** Should see detailed logs and waving animation

### 3. Test Animation Service Detection
```javascript
// Type "hi" in chat and check console for:
// 🎯 Animation Mapping: "hi" → gestures:waving-2 (via "hi")
// 🎭 Animation service callback triggered: /ECHO/animations/basic reactions/waving-2.glb
// 🎭 Calling playEchoAnimation: waving-2, 0.6
```

### 4. Test Different Animations
```javascript
(window).testAnimation('salsa-dancing')    // Should dance salsa
(window).testAnimation('gangnam-style')    // Should do gangnam style  
(window).testAnimation('jump')             // Should jump
(window).testAnimation('talking')          // Should talk
```

## Debug Steps

### If animations not working:

1. **Check console for errors** - Look for red error messages
2. **Verify model loaded** - `animationStatus().modelVisible` should be `true`
3. **Test direct animation** - Use `testAnimation('waving-2')`
4. **Check animation service** - Type "hi" and look for callback logs

### Expected Flow for "hi":
1. User types "hi"
2. `🎯 Animation Mapping: "hi" → gestures:waving-2`
3. `🎭 Animation service callback triggered`
4. `🎭 SIMPLE: ===== PLAYING ANIMATION: waving-2 =====`
5. `✅ SIMPLE: waving-2 started successfully`
6. Animation plays for ~2.5 seconds
7. `🎭 SIMPLE: waving-2 completed, returning to idle`

## Common Issues

- **Only happy-idle playing**: Animation durations were too long, now fixed
- **Animations cut short**: Added 500ms buffer to prevent early timeout
- **No animation callback**: Fixed in AvatarChatOverlay initialization
- **Animation not found**: Check if animation exists in unifiedAnimationLoader

## Testing Commands

Type these in chat to test specific categories:
- `hi` or `hello` → Waving animation
- `dance` → Salsa dancing  
- `jump` → Jumping animation
- `fight` → Fighting stance
- `exercise` → Workout animation
- `yes` → Head nod
- `talk` → Talking gesture 