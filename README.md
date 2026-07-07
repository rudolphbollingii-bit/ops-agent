# Ops Agent — Setup Guide
### Plain English, step by step. No experience needed.

---

## What you need before starting

- A Mac (you have a MacBook Pro — perfect)
- About 30–45 minutes
- An internet connection

You'll create accounts on 2 free services: **Supabase** (your database) and **Anthropic** (the AI).
That's it for this first version.

---

## STEP 1 — Install Node.js (5 minutes)

Node.js is the engine that runs your app. Think of it like installing a program.

1. Go to **nodejs.org**
2. Click the big green **"LTS"** download button (LTS = stable version)
3. Open the downloaded file and click through the installer (just keep clicking Next/Continue)
4. When done, open **Terminal** on your Mac:
   - Press `Cmd + Space`, type `Terminal`, press Enter
5. Type this and press Enter to confirm it worked:
   ```
   node --version
   ```
   You should see something like `v20.11.0` — any number is fine.

---

## STEP 2 — Create a Supabase account (10 minutes)

Supabase is your database — where all your tasks, alerts, and schedule live.

1. Go to **supabase.com** → click **Start your project** → sign up with GitHub or email
2. Click **New Project**
3. Fill in:
   - **Name:** ops-agent
   - **Database Password:** make up a strong password and save it somewhere
   - **Region:** US East (Ohio) — closest to PA
4. Click **Create new project** — wait about 2 minutes for it to set up
5. Once ready, click **SQL Editor** in the left sidebar
6. Click **New Query**
7. Open the file `supabase-schema.sql` from this project folder — select all the text, copy it
8. Paste it into the SQL editor and click **Run** (green button)
9. You should see "Success. No rows returned" — that means it worked

**Now get your keys:**
1. Click **Settings** (gear icon, bottom left)
2. Click **API**
3. You'll see:
   - **Project URL** — looks like `https://abcdefg.supabase.co`
   - **anon public** key — a long string starting with `eyJ`
   - **service_role secret** key — another long string starting with `eyJ`
4. Keep this page open — you'll need these in Step 4

---

## STEP 3 — Create an Anthropic account (5 minutes)

This is the AI brain of your app.

1. Go to **console.anthropic.com** → sign up
2. Click **API Keys** in the left sidebar
3. Click **Create Key** → name it "ops-agent" → click **Create**
4. Copy the key — it starts with `sk-ant-` — **save it somewhere safe, you only see it once**

> You'll need to add a credit card. The cost for personal use is about $1–3/month.
> Anthropic gives you $5 free credit when you sign up.

---

## STEP 4 — Download and set up the project (10 minutes)

1. Download this project folder to your Mac (wherever you want — Desktop is fine)
2. Open **Terminal**
3. Navigate to the folder. Type this (replace the path with wherever you put it):
   ```
   cd ~/Desktop/ops-simple
   ```
   Then press Enter. Your terminal prompt should now show `ops-simple`.

4. Install all the app's dependencies — type this and press Enter:
   ```
   npm install
   ```
   This will take 1–2 minutes. You'll see a lot of text scrolling — that's normal.

5. Set up your secret keys. In Terminal, type:
   ```
   cp .env.local.example .env.local
   ```
   This copies the template file.

6. Open the `.env.local` file. In Terminal:
   ```
   open .env.local
   ```
   It will open in TextEdit. Fill in your 3 values:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here

   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
   ```
   Save the file (Cmd+S) and close it.

---

## STEP 5 — Run the app (1 minute)

In Terminal, type:
```
npm run dev
```

You'll see some text, then:
```
▲ Next.js 14.2.3
- Local: http://localhost:3000
```

Open your browser and go to: **http://localhost:3000**

Your app is running. 🎉

---

## Using the app

**Overview tab** — your mission control. Domain task counts, today's schedule, high priority items, active alerts.

**Tasks tab** — all your open tasks pre-loaded with your real current work. Click the circle on the left to mark one done. Click "+ Add task" to add new ones.

**Alerts tab** — manually add alerts for now (like "oil dropped 3%", "Wayne County sale date announced"). Click ✓ to mark read. In the future, these will fill automatically.

**Schedule tab** — add time blocks for your day. "Family time 6–8pm" is already there and locked. Add your deep work sessions, admin time, etc.

**AI Agent tab** — type anything. It already knows all your businesses, your real estate counties, your tickers, your fleet details, your family schedule. Try:
- *"What should I focus on right now?"*
- *"I have 2 hours this afternoon, what's the best use?"*
- *"How does the /CL oil move affect my week?"*

---

## Stopping and restarting the app

**To stop:** In Terminal, press `Ctrl+C`

**To start again:** Open Terminal, navigate to the folder, run `npm run dev`

The app only runs while Terminal is open and the command is running. Your **data is always saved** in Supabase — you won't lose anything.

---

## What's next (Phase 2)

Once you're comfortable with this version:

1. **Deploy to Vercel** — so the app runs 24/7 from any device, not just your MacBook
2. **Add news alerts** — automatic scanning for NEPA tax sales, oil moves, Turo policy changes
3. **Add SMS alerts** — text message when something high-priority fires (Twilio)
4. **Connect Apple Calendar** — sync your schedule blocks to your iPhone

---

## Troubleshooting

**"command not found: npm"** → Node.js didn't install correctly. Redo Step 1.

**Page shows an error about Supabase** → Your keys in `.env.local` are wrong. Double-check them against what's in your Supabase Settings → API page.

**Page shows "Agent error"** → Your Anthropic API key is wrong, or you need to add a credit card at console.anthropic.com.

**"npm install" hangs or errors** → Check your internet connection and try again.

Any other issues — just ask.
