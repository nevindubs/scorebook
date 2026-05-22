# Scorebook — Deploy Guide

This folder is your complete app. Follow these steps to get it on your phone. Don't skip steps. If something seems wrong, the troubleshooting section at the bottom probably covers it.

**Total time: ~20 minutes. Cost: $0.**

---

## What you need before starting

1. **A computer** (Mac or Windows, doesn't matter).
2. **Node.js installed** — go to [nodejs.org](https://nodejs.org), download the big green "LTS" button, run the installer, click Next a bunch. Done.
3. **A GitHub account** — go to [github.com](https://github.com), sign up. Free.
4. **A Vercel account** — go to [vercel.com](https://vercel.com), click "Sign Up", choose "Continue with GitHub". Free.

You can do steps 3 and 4 in 2 minutes. Don't overthink them.

---

## Step 1: Test it on your computer first (5 min)

This makes sure everything works before we put it online.

1. **Open this folder in a terminal.**
   - **Mac:** Open the Terminal app. Type `cd ` (with a space after `cd`), then drag this `scorebook-app` folder into the Terminal window. Press Enter.
   - **Windows:** Open this folder in File Explorer. Click the address bar at the top, type `cmd`, press Enter. A black window opens.

2. **Install the app's dependencies.** In the terminal, type:
   ```
   npm install
   ```
   Wait 1-2 minutes. You'll see a lot of text scroll by. That's fine.

3. **Start the app.** Type:
   ```
   npm run dev
   ```
   It'll print something like `Local: http://localhost:5173`. Open that link in your browser. You should see Scorebook running.

4. **Stop the server.** Back in the terminal, press `Ctrl+C` (yes, even on Mac).

If you got this far, the app works. Now we put it online.

---

## Step 2: Put your code on GitHub (5 min)

1. **Go to [github.com/new](https://github.com/new).**
2. **Repository name:** type `scorebook`. Leave everything else as-is. Click **Create repository**.
3. **You'll see a page with commands.** Look for the section labeled **"…or push an existing repository from the command line"**. It shows three commands. You're going to do something slightly different.

In your terminal (still inside the `scorebook-app` folder), run these commands one at a time. Replace `YOUR_USERNAME` with your actual GitHub username:

```
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/scorebook.git
git push -u origin main
```

It may ask you to log in to GitHub. Follow the prompts. (If it asks for a password and yours doesn't work, that's normal — GitHub wants a "personal access token" instead. Search "github create personal access token", make one with `repo` permissions, paste it in place of your password.)

When it's done, refresh your GitHub page. You should see all your files. ✓

---

## Step 3: Deploy to Vercel (5 min)

1. **Go to [vercel.com/new](https://vercel.com/new).**
2. You'll see a list of your GitHub repos. Find **`scorebook`** and click **Import**.
3. **Don't change any settings.** Vercel detects it's a Vite project automatically.
4. Click **Deploy**.
5. Wait ~1 minute. When it's done, you get a URL like `scorebook-yourname.vercel.app`.

**That's your app. It's live on the internet.**

---

## Step 4: Install it on your phone (2 min)

Open the Vercel URL on your phone's browser.

### iPhone (Safari)
1. Tap the **Share** button (square with arrow pointing up, at the bottom).
2. Scroll down and tap **Add to Home Screen**.
3. Tap **Add** in the top-right.

The icon appears on your home screen. Tap it. Boom — fullscreen app, no browser bar, looks native.

### Android (Chrome)
1. Tap the three-dot menu in the top-right.
2. Tap **Install app** (or **Add to Home screen**).
3. Tap **Install**.

Same deal — icon on your home screen, opens like an app.

---

## Making changes later

Edit any file in `src/`, then in your terminal run:

```
git add .
git commit -m "what I changed"
git push
```

Vercel automatically rebuilds and pushes the update. Your phone app updates within ~30 seconds — no reinstall needed.

---

## Troubleshooting

**`npm install` fails or hangs.** Make sure Node.js is installed: open a fresh terminal and type `node --version`. If you don't see a version number, reinstall from [nodejs.org](https://nodejs.org).

**`git: command not found`.** You need Git. Mac: `xcode-select --install` and accept the prompt. Windows: download from [git-scm.com](https://git-scm.com), use defaults.

**GitHub asks for a password and yours doesn't work.** Make a Personal Access Token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token. Check the `repo` box. Use the token as your password.

**Vercel deploy fails.** Click "View Build Logs" in Vercel. The actual error is in there. Usually it's a typo in a file you edited — git revert and try again.

**Phone shows "Add to Home Screen" but it doesn't look like an app.** The first time you open it from the home screen icon, it activates fullscreen mode. Close it once and re-open.

**Stats reset when I switch phones.** Stats are saved in `localStorage` on each device. They don't sync. That's the next thing to build if you want it.
