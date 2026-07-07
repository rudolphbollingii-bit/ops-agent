# Setting Up Google Calendar (for Apple Calendar sync)
### Plain English, step by step

---

## What you're doing

Apple Calendar doesn't have a direct API for apps to connect to.
The workaround: sync Apple Calendar → Google Calendar → this app.
Once set up, anything you add in the app shows on your iPhone automatically.

---

## PART 1 — Sync your Apple Calendar to Google (on your iPhone)

1. On your iPhone, open **Settings**
2. Scroll down and tap **Calendar**
3. Tap **Accounts** → **Add Account**
4. Tap **Google** → sign in with your Google account (the one you just made)
5. Make sure the **Calendars** toggle is ON
6. Tap Save

Done. Your Apple Calendar and Google Calendar are now synced.
Check by opening **calendar.google.com** in a browser — you should see your events.

---

## PART 2 — Create Google OAuth credentials (lets the app talk to Google)

1. Go to **console.cloud.google.com** — sign in with that same Google account
2. At the top, click **Select a project** → **New Project**
   - Name it: `ops-agent`
   - Click **Create**
3. Make sure your new project is selected in the top dropdown
4. In the left sidebar, click **APIs & Services** → **Library**
5. Search for "Google Calendar API" → click it → click **Enable**

**Now create credentials:**
6. Click **APIs & Services** → **Credentials**
7. Click **+ Create Credentials** → **OAuth client ID**
8. If it asks to configure the consent screen first:
   - Click **Configure consent screen**
   - Choose **External** → click **Create**
   - App name: `Ops Agent`
   - User support email: your email
   - Developer contact email: your email
   - Click **Save and Continue** through all the screens (you can skip optional fields)
   - On the **Test users** screen, click **+ Add users** → add your Google email → Save
   - Click **Back to Dashboard**
9. Now go back to **Credentials** → **+ Create Credentials** → **OAuth client ID**
10. Application type: **Web application**
11. Name: `Ops Agent`
12. Under **Authorized redirect URIs**, click **+ Add URI** and enter:
    ```
    http://localhost:3000/api/auth/google/callback
    ```
13. Click **Create**
14. A popup shows your **Client ID** and **Client Secret** — copy both

---

## PART 3 — Add credentials to your app

Open Terminal, navigate to your ops-simple folder, and open the .env.local file:
```
cd ~/Downloads/ops-simple
open -e .env.local
```

Add these 3 lines at the bottom:
```
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Save the file (Cmd+S).

---

## PART 4 — Restart the app and connect

1. In Terminal, press **Ctrl+C** to stop the app
2. Type `npm run dev` and press Enter to restart
3. Open **http://localhost:3000**
4. Click **Settings** in the left sidebar
5. Click the **Connect →** button next to Google Calendar
6. A Google login popup will appear — sign in and click **Allow**
7. You'll be redirected back to the app — Settings should now show **✓ Connected**

---

## Troubleshooting

**"redirect_uri_mismatch" error** → The redirect URI in Google Console doesn't match exactly.
Make sure it's: `http://localhost:3000/api/auth/google/callback` (no trailing slash)

**"Access blocked: This app hasn't been verified"** → Click **Advanced** → **Go to Ops Agent (unsafe)**
This is normal for apps you built yourself — Google just hasn't reviewed it.

**Still not connecting** → Screenshot the error and ask for help.
