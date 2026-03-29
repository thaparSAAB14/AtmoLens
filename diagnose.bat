@echo off
echo ============================================
echo ATMOLENS - ENVIRONMENT DIAGNOSTICS
echo ============================================
echo.
echo Checking your development environment...
echo.

cd backend
python check_env.py

echo.
echo ============================================
echo ADDITIONAL CHECKS
echo ============================================
echo.

echo Checking if backend maps directory exists:
if exist "maps" (
    echo ✅ maps\ directory exists
    dir /b maps 2>nul | find /c /v "" > nul
    if errorlevel 1 (
        echo    No maps yet - run initial fetch
    ) else (
        echo    Contains processed maps
    )
) else (
    echo ⚠️  maps\ directory will be created on first run
)
echo.

echo Checking frontend dependencies:
cd ..\frontend
if exist "node_modules" (
    echo ✅ node_modules exists
) else (
    echo ⚠️  node_modules missing - run: npm install
)
echo.

if exist ".next" (
    echo ✅ .next build cache exists
) else (
    echo ℹ️  .next will be created on first run
)
echo.

echo ============================================
echo READY TO START
echo ============================================
echo.
echo To start development:
echo   1. Double-click: start-dev.bat
echo   2. Open browser: http://localhost:3000
echo.
pause
