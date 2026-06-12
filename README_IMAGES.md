# Image Management for GAMURA

To ensure your images are always visible and to avoid 404 errors (especially when deploying to Vercel), follow these steps:

1. **Upload your images** to the `public/` folder in this project.
2. **Rename them** to match the names used in the code:
   - `logo.png` (Main Logo)
   - `main.png` (Main Hero Image)
   - `gpg-logo.png` (GPG Page Logo)
   - `profile.png` (Portfolio Profile Image)
   - `certificate.png` (Education Certificate)
   - `project.png` (Project Preview)

3. **Update `App.tsx`**: I have already updated the code to prioritize these local files. If a local file is missing, it will fallback to the Google Drive link, but local files are much more reliable.

### Why use the `public` folder?
- **Speed**: Images are served directly from your hosting (Vercel), which is faster than fetching from Google Drive.
- **Reliability**: Google Drive links can expire or be throttled, causing 404 errors.
- **Offline Support**: Local images work even if Google services are down.
