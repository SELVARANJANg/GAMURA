# GAMURA — Google Play Store Launch Checklist

Use this checklist to track your app submission through Google Play Console and PWABuilder.

## 1. Technical PWA Readiness
- [x] `public/manifest.json` configured (standalone, theme `#10b981`, background `#0f172a`, icons 192/512/maskable).
- [x] `public/sw.js` service worker with cache versioning and offline fallback.
- [x] `public/offline.html` branded offline fallback page created.
- [x] Service worker registration in client layout.
- [x] `public/.well-known/assetlinks.json` configured for Android TWA verification.
- [x] `vercel.json` headers configured for `.well-known/assetlinks.json`.
- [x] In-app `/privacy`, `/terms`, and `/delete-account` pages implemented.
- [x] Meta tags updated for mobile viewport, theme color, icons, and Play Store discoverability.

## 2. Android Package (.AAB) Generation via PWABuilder
1. Open [PWABuilder.com](https://www.pwabuilder.com/).
2. Enter your live URL: `https://gamura.vercel.app/`.
3. Select **Android > Google Play**.
4. Set Package ID: `com.gamura.app`.
5. Version Code: `1`, Version Name: `1.0.0`.
6. Generate a signing key and download the `.aab` package and key password.
7. **Important**: Store the `.keystore` / signing key file in a secure backup location. Never lose it.

## 3. Play Console Setup & Verification
1. Log in to [Google Play Console](https://play.google.com/console).
2. Pay the one-time $25 registration fee and complete ID verification.
3. Create App:
   - App Name: `Gamura`
   - Default language: `English (United States)`
   - App or Game: `App`
   - Free or Paid: `Free`
4. App Signing:
   - Go to **Setup > App signing** in Play Console.
   - Copy the **SHA-256 certificate fingerprint**.
   - Paste the SHA-256 fingerprint into `public/.well-known/assetlinks.json`.
   - Deploy to Vercel/production so Google Play can verify digital asset links.

## 4. Required Policy & Listing URLs
- **Privacy Policy URL**: `https://gamura.vercel.app/privacy`
- **Account Deletion URL**: `https://gamura.vercel.app/delete-account`
- **Short Description (max 80 chars)**: `Gamura - games, tools and your digital identity in one app.`
- **Target Audience**: 13+ (or 18+).

## 5. Closed Testing (12 Testers for 14 Days)
- Upload the generated `.aab` file to **Closed Testing**.
- Add at least 12 testers via email list / Google Group.
- Testers must install and stay opted-in for 14 consecutive days.
- Once 14 days elapse, apply for **Production Access** in Play Console.
