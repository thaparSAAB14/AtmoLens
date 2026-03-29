@echo off
title AtmoLens - Production Deployment
color 0E

echo.
echo     ╔══════════════════════════════════════════════════╗
echo     ║                                                  ║
echo     ║         🚀 ATMOLENS PRODUCTION DEPLOY 🚀         ║
echo     ║                                                  ║
echo     ╚══════════════════════════════════════════════════╝
echo.

REM ============================================
REM Check Git
REM ============================================
echo [1/5] Checking Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo     ❌ Git not found!
    echo     📥 Install from: https://git-scm.com/
    pause
    exit /b 1
)
echo     ✅ Git found
echo.

REM ============================================
REM Show Status
REM ============================================
echo [2/5] Checking repository status...
git status --short
echo.

REM ============================================
REM Add All Files
REM ============================================
echo [3/5] Adding all files to Git...
git add -A
echo     ✅ Files staged
echo.

REM ============================================
REM Commit
REM ============================================
echo [4/5] Committing changes...
set /p commit_message="Enter commit message (or press Enter for default): "
if "%commit_message%"=="" set commit_message=Production ready deployment

git commit -m "%commit_message%" -m "- Fixed backend production issues" -m "- Added Docker and deployment configs" -m "- Updated environment setup" -m "" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

if %errorlevel% neq 0 (
    echo     ⚠️  Nothing to commit or commit failed
    echo.
) else (
    echo     ✅ Changes committed
    echo.
)

REM ============================================
REM Push
REM ============================================
echo [5/5] Pushing to GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo     ❌ Push failed!
    echo.
    echo     Common fixes:
    echo     1. Make sure you have a remote: git remote add origin YOUR_REPO_URL
    echo     2. Make sure you're authenticated with GitHub
    echo     3. Try: git push -u origin main
    echo.
    pause
    exit /b 1
)

echo     ✅ Pushed to GitHub!
echo.

REM ============================================
REM Success
REM ============================================
echo.
echo     ╔══════════════════════════════════════════════════╗
echo     ║                                                  ║
echo     ║            ✅ DEPLOYMENT SUCCESSFUL! ✅          ║
echo     ║                                                  ║
echo     ╚══════════════════════════════════════════════════╝
echo.
echo     📝 Next Steps:
echo.
echo     1️⃣  Deploy Frontend to Vercel:
echo        https://vercel.com/new
echo        - Import your GitHub repo
echo        - Root: /frontend
echo        - Framework: Next.js (auto-detected)
echo.
echo     2️⃣  Deploy Backend to Railway:
echo        https://railway.app/new
echo        - Deploy from GitHub repo
echo        - Root: /backend
echo        - Add environment variables
echo.
echo     3️⃣  Connect them:
echo        - Add NEXT_PUBLIC_API_URL to Vercel
echo        - Add FRONTEND_ORIGIN to Railway
echo.
echo     📖 Full guide: PRODUCTION_DEPLOY.md
echo.
pause
