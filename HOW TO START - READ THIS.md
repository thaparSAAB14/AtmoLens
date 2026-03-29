# 🚀 ATMOLENS - ONE-CLICK START

## 🎯 No Coding Required!

### Just Double-Click This File:
```
🚀 START ATMOLENS.bat
```

**That's it!** Everything happens automatically:
1. ✅ Checks if Python and Node.js are installed
2. ✅ Installs all dependencies automatically
3. ✅ Creates necessary folders
4. ✅ Starts both servers
5. ✅ Opens your browser to http://localhost:3000

---

## 🛑 To Stop Everything:

Double-click:
```
🛑 STOP ATMOLENS.bat
```

---

## 📋 What You See:

### When You Start:
- Two small windows open in the background (backend + frontend)
- Your browser automatically opens to AtmoLens dashboard
- Status bar shows green "Live" indicator when ready

### Features That Run Automatically:
- 🔄 **Auto-fetch**: Weather maps download every 30 minutes
- 🎨 **Auto-process**: Colors applied to maps automatically
- 🗂️ **Auto-cleanup**: Old maps deleted after 7 days (runs at midnight)
- 💾 **Auto-save**: All processed maps saved to archive

---

## 🌐 URLs (Auto-Open):

- **Dashboard**: http://localhost:3000
- **Live Maps**: http://localhost:3000/maps
- **Archive**: http://localhost:3000/archive
- **Backend API**: http://localhost:8001/api/status

---

## ❓ Troubleshooting:

### If nothing happens:
1. Make sure Python is installed: https://www.python.org/downloads/
   - ⚠️ Check "Add Python to PATH" during install!
2. Make sure Node.js is installed: https://nodejs.org/

### If browser doesn't open:
- Manually open: http://localhost:3000

### If status bar says "Backend Offline":
- Wait 10-15 seconds for backend to start
- Or double-click `🚀 START ATMOLENS.bat` again

---

## 🎨 What You'll See:

### Home Page:
- Hero section with shader animation
- "View Live Maps" button
- "7-Day Archive" button

### Maps Page:
- Live status bar (green = working)
- Map type selector (8 types)
- Current weather map with zoom/download controls
- Toggle between Original vs Enhanced

### Archive Page:
- All processed maps from last 7 days
- Organized by date and type

---

## 🔒 Completely Automatic:

Once started, AtmoLens runs itself:
- No manual fetching needed
- No manual processing needed
- No manual cleanup needed
- Just leave it running!

---

## 💡 Tips:

- **Leave it running**: The longer it runs, the more maps it collects
- **First time**: May take 30 min to see first maps (auto-fetch interval)
- **Speed up**: Visit http://localhost:8001/api/maps/fetch to trigger immediate fetch
- **Check status**: Status bar shows last fetch time and next scheduled run

---

## 🎉 That's Everything!

No coding, no configuration, no manual work.

Just double-click `🚀 START ATMOLENS.bat` and enjoy!
