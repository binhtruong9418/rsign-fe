<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DWsvoyO8rN7qE74GSusfKb_6fK96duUQ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy
1. Install Vercel CLI:
   `npm install -g vercel`
2. Deploy the app:
   `vercel`
3. Follow the prompts to complete the deployment process.
4. Set the `GEMINI_API_KEY` in your Vercel dashboard to your Gemini API key
5. Your app will be live at the URL provided by Vercel after deployment.
6. View your app in AI Studio: https://ai.studio/apps/drive/1DWsvoyO8rN7qE74GSusfKb_6fK96duUQ
7. To update your app, make changes locally and run `vercel --prod` to deploy the latest version to production.
8. Your app will be updated at the same URL provided by Vercel.