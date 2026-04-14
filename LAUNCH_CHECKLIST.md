# Play Store Launch Checklist

## 1) One-time Setup
- Install EAS CLI: npm install -g eas-cli
- Login: eas login
- Verify project: npx expo config --type public

## 2) Security and Compliance
- Confirm .env is not committed
- Deploy Firestore rules: firebase deploy --only firestore:rules
- Publish privacy policy and add URL in Play Console

## 3) Build Configuration
- App version in app.json should be correct
- Android versionCode must increment every release
- iOS buildNumber must increment for each iOS release

## 4) Test Pass
- Auth: signup/login/logout
- Home: create multiple challenges, check-in, auto-complete
- History: status badges and delete
- Profile: user info, stats, badges

## 5) Build and Release
- Internal test build: npm run build:android:preview
- Production build (AAB): npm run build:android:prod
- Submit: npm run submit:android:prod

## 6) Play Console
- Complete Data safety form
- Complete content rating
- Provide support contact and privacy policy URL
- Upload screenshots and feature graphic
- Start with internal or closed testing, then production
