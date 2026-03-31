# Deploy ApplyIQ to Vercel

## Recommended setup
Deploy the frontend only from `ApplyIQ-OLD/client`.

## 1. Push to GitHub
Upload the full project to a GitHub repository.

## 2. Import into Vercel
- Click **New Project**
- Import your GitHub repo
- Set **Root Directory** to `ApplyIQ-OLD/client`
- Framework preset: **Vite**

## 3. Add environment variables
Add these in Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the same values as your local `.env.local`.

## 4. Build settings
These should auto-detect, but if needed:
- Build command: `npm run build`
- Output directory: `dist`

## 5. Supabase setup
Before testing the deployed app:
- Run `ApplyIQ-OLD/supabase/schema.sql` in Supabase SQL Editor
- Enable Email auth in Supabase
- Confirm new user signups are allowed

## Notes
- This app is a client-side SPA, so `vercel.json` includes a rewrite to `index.html`
- Do not commit your private `.env.local` if you change keys later
