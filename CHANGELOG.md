# Changelog — GAMURA

All notable changes to the Gamura Platform, PWA, and Play Store release kit are documented in this file.

## [1.0.0] - 2026-11-12

### Added
- **PWA Production Ready**:
  - Web App Manifest (`public/manifest.json`) with standalone display mode, orientation, brand colors (`#10b981`, `#0f172a`), and maskable icon assets (192px and 512px).
  - Offline Service Worker (`public/sw.js`) with cache versioning (`gamura-v1`), offline fallback navigation (`/offline.html`), and automatic update lifecycle (`skipWaiting`, `clients.claim`).
  - Branded Offline Fallback page (`public/offline.html`) with connection state check and retry triggers.
  - Digital Asset Links (`public/.well-known/assetlinks.json`) for Android Trusted Web Activity (TWA) verification under package `com.gamura.app`.
  - Header content-type rule in `vercel.json` for `.well-known/assetlinks.json`.
- **Google Play Store Policy Compliance**:
  - Dedicated `/privacy` Privacy Policy page covering founder Selvaranjan G, Firebase Auth collection, user rights, and children's privacy.
  - Dedicated `/terms` Terms of Service page outlining platform usage, developer accounts, and licensing.
  - Account Deletion page (`/delete-account`) allowing users to request and execute permanent removal of their Firebase user account and Firestore profile.
- **Puter.js Integration**:
  - Free browser-based AI generation powered by Puter AI, offering 100% free and unlimited prompt generation for GPG without requiring API keys.
  - Multi-provider prompt generation architecture (Puter AI + Gemini Server).
- **Search Interaction**:
  - Interactive pulsing/shimmer glow animation on active search fields.
- **Apple Cupertino UI Redesign**:
  - Slide menu redesign inspired by iOS/macOS Cupertino standards: frosted glass blur backdrop, squircle icon tiles, and clean typography.
