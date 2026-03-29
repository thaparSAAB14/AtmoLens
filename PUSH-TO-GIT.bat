@echo off
echo ========================================
echo ATMOLENS - GIT PUSH AND DEPLOY
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Git status...
git status
echo.

echo [2/4] Adding all files...
git add .
echo.

echo [3/4] Committing...
git commit -m "Production ready: Backend fixes, CORS config, deployment setup" -m "- Fixed CORS to support multiple origins" -m "- Added environment variable templates" -m "- Created Docker and deployment configs" -m "- Fixed frontend-backend communication" -m "- Production deployment ready" -m "" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
echo.

echo [4/4] Pushing to GitHub...
git push origin main
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo SUCCESS! Code pushed to GitHub
    echo ========================================
    echo.
    echo Next: Deploy to Vercel and Railway
    echo.
    echo 1. Vercel: https://vercel.com/new
    echo    - Import repo
    echo    - Root: frontend
    echo    - Deploy!
    echo.
    echo 2. Railway: https://railway.app/new
    echo    - Import repo
    echo    - Root: backend
    echo    - Add env: FRONTEND_ORIGIN=your-vercel-url
    echo    - Deploy!
    echo.
    echo 3. Vercel Settings - Add env var:
    echo    - NEXT_PUBLIC_API_URL=your-railway-url
    echo    - Redeploy
    echo.
) else (
    echo ========================================
    echo PUSH FAILED
    echo ========================================
    echo.
    echo Try manually:
    echo   git remote add origin YOUR_REPO_URL
    echo   git push -u origin main
    echo.
)

pause
