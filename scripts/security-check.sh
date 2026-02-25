#!/bin/bash
# Pre-build security checks

echo "🔒 Running security checks before build..."

# Check for exposed secrets
echo "Checking for exposed secrets..."
if grep -r "sk_live\|pk_live\|STRIPE_KEY\|AWS_SECRET" src/ --include="*.js" --include="*.jsx"; then
    echo "❌ WARNING: Possible exposed secrets found!"
    exit 1
fi

# Check for console logs in production code
echo "Checking for console logs..."
if grep -r "console\." src/ --include="*.js" --include="*.jsx" | grep -v "console\.error\|console\.warn" | head -5; then
    echo "⚠️  Found console logs - consider removing for production"
fi

# Check for localStorage of sensitive data
echo "Checking for localStorage usage of sensitive data..."
if grep -r "localStorage.*token\|localStorage.*password\|localStorage.*secret" src/; then
    echo "❌ ERROR: Sensitive data stored in localStorage!"
    exit 1
fi

# Check for hardcoded API keys
echo "Checking for hardcoded API keys..."
if grep -r "apiKey.*=.*['\"]" src/ --include="*.js" --include="*.jsx" | grep -v "import\|env"; then
    echo "⚠️  Found potential hardcoded API keys"
fi

echo "✅ Security checks passed!"
echo ""
echo "Next steps:"
echo "1. Run: npm run build"
echo "2. Run: npx cap sync"
echo "3. Open: npx cap open android"
echo "4. Build signed APK in Android Studio"
