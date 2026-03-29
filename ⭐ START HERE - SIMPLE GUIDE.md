# 🎯 ATMOLENS - SUPER SIMPLE START GUIDE

## 🚀 THREE WAYS TO START (Pick Your Favorite!)

---

### METHOD 1: One-Click Start (Easiest!)
```
Double-click this file:
📁 🚀 START ATMOLENS.bat
```

**What happens:**
- ✅ Automatically installs everything needed
- ✅ Starts both servers
- ✅ Opens browser to dashboard
- ✅ Maps auto-fetch every 30 minutes

**Done! That's it!**

---

### METHOD 2: Visual Launcher
```
Double-click this file:
📁 🌐 OPEN ATMOLENS.html
```

**What you get:**
- Pretty launcher page with buttons
- Quick links to all features
- Auto-checks if servers are running

*Note: Still need to run 🚀 START ATMOLENS.bat first!*

---

### METHOD 3: Desktop Shortcut (For Daily Use)

**Create a shortcut:**
1. Right-click `🚀 START ATMOLENS.bat`
2. Click "Send to" → "Desktop (create shortcut)"
3. Now you have AtmoLens on your desktop!

**To use:**
- Double-click desktop icon → Everything starts automatically
- Close icon when done (servers keep running)

---

## 🛑 TO STOP EVERYTHING:

```
Double-click: 🛑 STOP ATMOLENS.bat
```

Kills all servers instantly.

---

## 🎨 WHAT YOU'LL SEE:

### Step 1: Starting Up (30 seconds)
```
[1/6] Checking Python...     ✅
[2/6] Installing backend...  ✅
[3/6] Checking Node.js...    ✅
[4/6] Setting up frontend... ✅
[5/6] Creating folders...    ✅
[6/6] Launching servers...   ✅
```

### Step 2: Browser Opens Automatically
You'll see:
- 🏠 **Home**: Beautiful hero section with shader effects
- 🗺️ **View Live Maps**: Click to see current weather
- 📦 **7-Day Archive**: All processed maps

### Step 3: Maps Appear (Automatic)
- First maps appear within 30 minutes
- Or click "Trigger Fetch" to get them now
- Status bar shows green dot when live

---

## 📍 USEFUL LINKS (Auto-Open in Browser):

| What | URL | What It Does |
|------|-----|--------------|
| **Main Dashboard** | http://localhost:3000 | Home page |
| **Live Maps** | http://localhost:3000/maps | View weather maps |
| **Archive** | http://localhost:3000/archive | Past 7 days |
| **Backend Status** | http://localhost:8001/api/status | Server health |
| **Force Update** | http://localhost:8001/api/maps/fetch | Get maps now |

---

## 🔄 FULLY AUTOMATIC FEATURES:

### What Runs Automatically (Zero Work for You):

1. **🌐 Auto-Fetch** (Every 30 min)
   - Downloads latest ECCC weather maps
   - Checks for new data
   - Saves originals

2. **🎨 Auto-Process** (Instant)
   - Applies color enhancement
   - Land/water segmentation
   - Smooths boundaries

3. **💾 Auto-Save** (Instant)
   - Saves to archive
   - Creates thumbnails
   - Updates manifest

4. **🗑️ Auto-Cleanup** (Daily at midnight)
   - Deletes maps older than 7 days
   - Keeps archive size manageable
   - Maintains file structure

5. **🔄 Auto-Recovery** (Always)
   - Restarts if crash
   - Handles network errors
   - Logs all activity

---

## ✨ NO CODING NEEDED:

### You DON'T need to:
- ❌ Edit config files
- ❌ Run commands in terminal
- ❌ Install dependencies manually
- ❌ Know Python or JavaScript
- ❌ Understand APIs
- ❌ Configure servers
- ❌ Set up databases

### You ONLY need to:
- ✅ Double-click `🚀 START ATMOLENS.bat`
- ✅ Wait ~1 minute for setup
- ✅ Use the website that opens
- ✅ That's literally it!

---

## 🎯 FIRST TIME CHECKLIST:

Before starting, make sure you have:

1. **Python Installed**
   - Download: https://www.python.org/downloads/
   - ⚠️ **IMPORTANT**: Check "Add Python to PATH" during install!

2. **Node.js Installed**
   - Download: https://nodejs.org/
   - Just click "Next" through installer

That's it! Just those two things.

---

## 💡 TIPS FOR SUCCESS:

### Tip 1: Be Patient First Time
- First run takes 2-3 minutes (installing packages)
- After that, starts in 10-15 seconds

### Tip 2: Leave It Running
- The longer it runs, the more maps you collect
- Perfect to leave running overnight
- Servers use minimal resources

### Tip 3: Bookmark It
- Add http://localhost:3000 to browser favorites
- Quick access anytime servers are running

### Tip 4: Force First Fetch
- Don't want to wait 30 minutes?
- Open: http://localhost:8001/api/maps/fetch
- Maps appear within 1-2 minutes

### Tip 5: Check Status Anytime
- Green dot = Everything working
- Yellow dot = Paused (rare)
- Red dot = Backend offline (restart)

---

## ❓ TROUBLESHOOTING (Super Rare!):

### "Python not found"
- Install Python: https://www.python.org/downloads/
- Make sure to check "Add to PATH"!

### "Node.js not found"
- Install Node: https://nodejs.org/
- Restart computer after install

### "Port already in use"
- Something else is using port 3000 or 8001
- Close other programs and try again
- Or run `🛑 STOP ATMOLENS.bat` then restart

### "Browser doesn't open"
- Manually go to: http://localhost:3000
- Bookmark it for next time

### "No maps showing"
- Wait 30 minutes for auto-fetch
- Or trigger now: http://localhost:8001/api/maps/fetch
- Check status bar for green dot

---

## 🎉 YOU'RE DONE!

Seriously, that's everything.

Just double-click `🚀 START ATMOLENS.bat` and enjoy!

No coding. No configuration. No stress.

**It just works!** ✨
