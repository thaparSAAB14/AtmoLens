@echo off
echo ============================================
echo ATMOLENS GIT DEPLOYMENT
echo ============================================
echo.

echo [1/4] Adding all files...
git add -A
if %errorlevel% neq 0 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)

echo [2/4] Checking status...
git status --short
echo.

echo [3/4] Committing changes...
git commit -m "fix: resolve backend production blockers and improve code quality" -m "- Fix FileNotFoundError crashes in storage.py" -m "- Move asyncio import to module level in main.py" -m "- Move time import to module level in processor.py" -m "- Remove unused imports from main.py" -m "" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
if %errorlevel% neq 0 (
    echo WARNING: Commit failed or nothing to commit
)

echo [4/4] Pushing to remote...
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Failed to push to remote
    echo You may need to set up your Git credentials or remote
    pause
    exit /b 1
)

echo.
echo ============================================
echo SUCCESS! All files pushed to Git
echo ============================================
echo.
echo Vercel will auto-deploy if connected to your repo.
echo Or run: vercel --prod
echo.
pause
