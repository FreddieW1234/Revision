# Revision Tracker

A study revision tracking app built with React, Vite, Tailwind CSS, and Supabase.

## Features

- **Topic Tracker** — Add subjects with sub-topics. Track each topic's status (Not Started / In Progress / Confident) with a progress bar per subject.
- **Study Session Logger** — Log study sessions by subject and duration. View session history and total hours per subject.
- **Exam Countdown** — Add upcoming exams and see days remaining, sorted by date. Exams within 14 days are highlighted in red.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Supabase](https://supabase.com/) project (free tier works)

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `supabase-schema.sql` and click **Run** to create the tables and RLS policies.
4. Go to **Settings → API** and copy your **Project URL** and **anon public** key.

## Local Development

```bash
# Install dependencies
npm install

# Create your .env file from the example
cp .env.example .env

# Fill in your Supabase credentials in .env:
#   VITE_SUPABASE_URL=https://your-project-id.supabase.co
#   VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Deploying to Render (Static Site)

1. Push your code to a GitHub repository.
2. Go to [render.com](https://render.com/) and create a new **Static Site**.
3. Connect your GitHub repo.
4. Set the following:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Add environment variables in Render's dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Add a **Rewrite Rule** so client-side routing works:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite
7. Deploy. Render will build and serve the static files.

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 8](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
