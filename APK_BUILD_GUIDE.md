# APK Build & Deployment Instructions

## Prerequisites
- Node.js 16+ 
- Java Development Kit (JDK) 11+
- Android SDK
- Android Studio

## Installation Steps

### 1. Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/preferences
```

### 2. Initialize Capacitor
```bash
npx cap init
# When prompted:
# App name: DreamBid
# App Package ID: com.dreambid.app
# Web asset directory: dist
```

### 3. Add Android Platform
```bash
npx cap add android
```

### 4. Update capacitor.config.json
```json
{
  "appId": "com.dreambid.app",
  "appName": "DreamBid",
  "webDir": "dist",
  "server": {
    "cleartext": false,
    "url": "https://your-api.com"
  },
  "plugins": {
    "Preferences": {
      "group": "com.dreambid.app"
    }
  }
}
```

---

## Build Process

### Step 1: Production Build
```bash
# Run security checks first
bash scripts/security-check.sh

# Build production bundle
npm run build

# Verify dist folder is created
ls -la dist/
```

### Step 2: Sync to Android
```bash
npx cap sync android
```

### Step 3: Create Keystore (FIRST TIME ONLY)
```bash
# Generate secure keystore
keytool -genkey -v -keystore dreambid-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 -alias dreambid-key

# Keep this file SAFE and NEVER commit to git
# Store backup in secure location
# Add to .gitignore:
echo "dreambid-release.keystore" >> .gitignore
```

### Step 4: Build Signed APK in Android Studio

1. **Open Project:**
   ```bash
   npx cap open android
   ```

2. **Configure Signing:**
   - File → Project Structure → Modules → app
   - Select "Signing" tab
   - Add signing configuration with your keystore

3. **Build APK:**
   - Select Build → Build Bundle(s)/APK(s) → Build APK(s)
   - Choose "release" variant
   - Wait for build to complete

4. **Locate APK:**
   ```
   android/app/release/app-release.apk
   ```

---

## Testing Before Release

### Local Testing
```bash
# Install APK on connected device
adb install -r android/app/release/app-release.apk

# Test features:
# - Login/logout
# - Property browsing
# - Image loading
# - Location features
# - WhatsApp sharing
```

### Test Checklist
- [ ] App starts without crashes
- [ ] Login functionality works
- [ ] API calls successful
- [ ] Images load properly
- [ ] Maps display correctly
- [ ] No console errors
- [ ] Network requests use HTTPS
- [ ] Logout clears data
- [ ] Permissions prompt correctly

---

## Upload to Google Play

### Prerequisites
- Google Play Developer Account ($25)
- App signing certificate

### Steps
1. Create app listing in Google Play Console
2. Upload APK (signed with your keystore)
3. Add screenshots (2-5 per device type)
4. Write app description
5. Set content rating
6. Set pricing
7. Submit for review (24-72 hours)

---

## Security Verification

Before uploading, verify:

```bash
# Check APK contents
unzip -l android/app/release/app-release.apk | grep keystore
# Should be EMPTY (keystore not included)

# Verify signing
jarsigner -verify -verbose -certs android/app/release/app-release.apk
# Should show: "verified OK"

# Check for secrets in APK
unzip -p android/app/release/app-release.apk | strings | grep -i "secret\|password\|key="
# Should return nothing for sensitive data
```

---

## Version Updates

For subsequent builds:

```bash
# 1. Update version in capacitor.config.json and .env.production
# 2. Rebuild
npm run build
npx cap sync android

# 3. Build new APK with incremented version
# In Android Studio: Build → Build APK(s)

# 4. Test thoroughly
adb install -r android/app/release/app-release.apk

# 5. Upload to Play Store
```

---

## Troubleshooting

### APK won't install
```bash
# Uninstall previous version
adb uninstall com.dreambid.app

# Clear app data
adb shell pm clear com.dreambid.app

# Reinstall
adb install -r android/app/release/app-release.apk
```

### API connection fails
- Verify HTTPS is configured
- Check API URL in .env.production
- Verify firewall/proxy settings
- Check Android manifest permissions

### Build fails
- Clean build: `npx cap sync --clear`
- Update Android Studio
- Check Java version: `java -version`
- Update gradle: `./gradlew --version`

---

## Continuous Updates

### GitHub Actions (Optional)
Set up CI/CD to automatically build APK:

```yaml
# .github/workflows/build-apk.yml
name: Build APK
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v2
      - name: Build
        run: |
          npm install
          npm run build
          npx cap sync
      - name: Upload APK
        uses: actions/upload-artifact@v2
```

---

## Post-Launch

1. Monitor crash reports in Play Console
2. Set up analytics
3. Monitor user reviews
4. Plan updates for bug fixes
5. Track security vulnerabilities
