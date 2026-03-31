# ApplyIQ Supabase Version

This version is connected to your Supabase project.

## Run

```bash
cd ApplyIQ-OLD/client
npm install
npm run dev
```

Open `http://localhost:4173`

## Important

1. Run `supabase/schema.sql` in your Supabase SQL editor.
2. In Supabase Auth, enable Email sign-in.
3. Use the built-in sign up / sign in screen in the app.
4. This version uses your project URL and publishable key in `client/.env.local`.

## Notes

- Boxicons is intentionally included.
- The Express server folder is no longer required for the client to work.
- Applications are saved to the `applications` table.
- Job descriptions are saved to the `job_descriptions` table.
