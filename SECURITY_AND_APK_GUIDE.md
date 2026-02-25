# DreamBid APK Security & Deployment Guide

## Security Checklist for APK Release

### 1. DATA PROTECTION IN TRANSIT
- ✅ Use HTTPS/TLS only (enforce in API URLs)
- ✅ Implement certificate pinning for API calls
- ✅ Use strong encryption for all API communications
- ✅ Add request/response validation

### 2. DATA PROTECTION AT REST
- ✅ Never store sensitive data in localStorage
- ✅ Use Capacitor's Preferences plugin (encrypted on Android)
- ✅ Store JWT tokens in sessionStorage (cleared on app close)
- ✅ Encrypt user PII before storing locally

### 3. AUTHENTICATION & AUTHORIZATION
- ✅ JWT token expiration (implement refresh tokens)
- ✅ Secure token storage in secure enclave
- ✅ Implement token rotation on each login
- ✅ Add logout functionality that clears all stored data

### 4. API SECURITY
- ✅ Rate limiting on backend
- ✅ CSRF protection
- ✅ Input validation on backend
- ✅ Output encoding to prevent XSS
- ✅ Add API request signing

### 5. CODE SECURITY
- ✅ No sensitive credentials in code
- ✅ Remove console.log statements in production
- ✅ Obfuscate/minify JavaScript
- ✅ Disable source maps in production build

### 6. APK SIGNING
- ✅ Create keystore for signing
- ✅ Store keystore securely (never commit)
- ✅ Use strong keystore password
- ✅ Sign APK before distribution

### 7. ANDROID SPECIFIC
- ✅ Set android:usesCleartextTraffic="false" (HTTPS only)
- ✅ Implement proper permissions in AndroidManifest.xml
- ✅ Use WebView security best practices
- ✅ Implement certificate pinning using OkHttp

### 8. USER DATA PRIVACY
- ✅ Privacy policy in app
- ✅ Clear user consent for data collection
- ✅ GDPR compliance if applicable
- ✅ Implement data deletion functionality

---

## Step-by-Step APK Setup & Deployment

### Step 1: Environment Setup
```bash
# Install required tools
npm install @capacitor/core @capacitor/cli
npm install @capacitor/preferences @capacitor/secure-storage

# For Capacitor
npx cap init
# Enter: DreamBid, com.dreambid.app, .
```

### Step 2: Build Configuration for Production
```bash
# Create production build with security optimizations
npm run build -- --mode production
# This will minify and obfuscate code
```

### Step 3: Android Setup
```bash
# Add Android platform
npx cap add android

# Sync latest code
npx cap sync android
```

### Step 4: Configure Android Security
Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest>
    <!-- Disable cleartext traffic -->
    <application android:usesCleartextTraffic="false">
        <!-- Required permissions -->
        <uses-permission android:name="android.permission.INTERNET" />
        <uses-permission android:name="android.permission.CAMERA" />
        <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
        <!-- Configure WebView security -->
        <activity
            android:name=".MainActivity"
            android:usesCleartextTraffic="false">
        </activity>
    </application>
</manifest>
```

### Step 5: Create Keystore for Signing
```bash
# Generate keystore (do this ONCE and keep it safe)
keytool -genkey -v -keystore dreambid-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias dreambid-key

# Store keystore in safe location (NOT in repo)
# Save the password securely
```

### Step 6: Configure Capacitor for Production APIs
Create `capacitor.config.json`:
```json
{
  "appId": "com.dreambid.app",
  "appName": "DreamBid",
  "webDir": "dist",
  "server": {
    "url": "https://your-production-domain.com",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0
    },
    "Preferences": {
      "group": "com.dreambid.app"
    }
  }
}
```

### Step 7: Build Signed APK
```bash
# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Go to Build → Generate Signed Bundle / APK
# 2. Select APK
# 3. Choose your keystore
# 4. Enter keystore password and key alias password
# 5. Select release build type
# 6. Choose V1 and V2 signing versions
# 7. Click Finish

# APK will be in: android/app/release/app-release.apk
```

---

## Security Best Practices Implementation

### 1. Update API Interceptor
Add to `src/services/api.js`:
```javascript
// Add request interceptor
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add request signing
  config.headers['X-Request-Time'] = Date.now();
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - clear and redirect to login
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 2. Disable Debug Mode in Production
```javascript
// src/main.jsx
if (import.meta.env.PROD) {
  // Disable console in production
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {}; // Keep errors for error tracking
}
```

### 3. Add Content Security Policy
Add to `public/index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               img-src 'self' https: data:; 
               connect-src 'self' https://your-api.com;">
```

---

## Distribution Checklist

- [ ] Keystore created and backed up securely
- [ ] APK signed with release key
- [ ] Tested on multiple Android devices
- [ ] All console logs removed
- [ ] Source maps disabled in production build
- [ ] API endpoints pointing to production servers
- [ ] HTTPS enforced
- [ ] Privacy policy implemented
- [ ] Terms of service created
- [ ] Google Play Developer account created ($25)
- [ ] App signing configured

---

## GitHub Push Before APK

```bash
# Make sure all changes are committed
git add .
git commit -m "Security implementation and APK configuration"
git push origin main
```

---

## Testing Before Release

1. **Security Testing:**
   - Test with Charles Proxy to verify HTTPS
   - Verify no sensitive data in network traffic
   - Check localStorage/sessionStorage for sensitive data

2. **Functionality Testing:**
   - Login/logout flows
   - Data persistence
   - Network error handling
   - Offline behavior

3. **Device Testing:**
   - Test on Android 8, 9, 10, 11, 12+
   - Test on various screen sizes
   - Test camera and location permissions

---

## Production Deployment

### Google Play Store Upload:
1. Create Google Play Developer Account
2. Create app listing
3. Upload APK (signed)
4. Add screenshots and description
5. Submit for review (24-72 hours)

### Direct APK Distribution:
1. Host APK on secure server
2. Add integrity checking
3. Implement in-app update mechanism

---

## Ongoing Security

- Monitor for vulnerabilities
- Keep dependencies updated
- Implement security headers
- Regular penetration testing
- User data audit logs
