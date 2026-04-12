# GAMURA

A professional prompt generation tool powered by Gemini AI.

## 🚀 Deployment to Vercel

This project is a Client-Side Single Page Application (SPA) built with React and Vite.

### 1. Push to GitHub
Ensure your code is pushed to your GitHub repository.

### 2. Connect to Vercel
1. Go to [Vercel](https://vercel.com) and import your repository.
2. Vercel will automatically detect the Vite project.

### 3. Configure Environment Variables
**IMPORTANT**: You must add your Gemini API Key in the Vercel dashboard:
1. In Vercel, go to **Settings** > **Environment Variables**.
2. Add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `YOUR_ACTUAL_GEMINI_API_KEY`
3. Click **Save** and trigger a new deployment.

## 🛠️ Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with your key:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🛡️ Security Note
In this preview environment, the Gemini API is called directly from the frontend to ensure compatibility with the platform-provided API key. For production environments where you want to hide your API key, a backend proxy is recommended.
