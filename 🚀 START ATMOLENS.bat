@echo off
title AtmoLens - Automatic Setup and Launch
color 0B

echo.
echo     ╔══════════════════════════════════════════════════╗
echo     ║                                                  ║
echo     ║              🌤️  ATMOLENS  🌤️                    ║
echo     ║                                                  ║
echo     ║        Automatic Weather Map Enhancement        ║
echo     ║                                                  ║
echo     ╚══════════════════════════════════════════════════╝
echo.
echo     ⏳ Setting up everything automatically...
echo.

REM ============================================
REM STEP 1: Check Python
REM ============================================
echo [1/6] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo     ❌ Python not found!
    echo     📥 Please install Python from: https://www.python.org/downloads/
    echo     ⚠️  Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)
echo     ✅ Python found
echo.

REM ============================================
REM STEP 2: Install Backend Dependencies
REM ============================================
echo [2/6] Installing backend dependencies...
cd backend
echo     Installing packages...
python -m pip install -r requirements.txt --quiet --disable-pip-version-check
if %errorlevel% equ 0 (
    echo     ✅ Backend ready
) else (
    echo     ⚠️  Installing packages (this may take a moment)...
    python -m pip install -r requirements.txt
)
cd ..
echo.

REM ============================================
REM STEP 3: Check Node.js and Frontend
REM ============================================
echo [3/6] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo     ❌ Node.js not found!
    echo     📥 Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo     ✅ Node.js found
echo.

REM ============================================
REM STEP 4: Install Frontend Dependencies
REM ============================================
echo [4/6] Setting up frontend...
cd frontend
if not exist "node_modules" (
    echo     Installing packages (this may take a minute)...
    call npm install --silent >nul 2>&1
)
echo     ✅ Frontend ready
cd ..
echo.

REM ============================================
REM STEP 5: Create Output Directories
REM ============================================
echo [5/6] Creating directories...
if not exist "backend\maps" mkdir backend\maps
if not exist "backend\assets" mkdir backend\assets
echo     ✅ Directories ready
echo.

REM ============================================
REM STEP 6: Launch Everything
REM ============================================
echo [6/6] Launching AtmoLens...
echo.
echo     🚀 Starting backend server...
timeout /t 2 /nobreak >nul
start "AtmoLens Backend" cmd /c "cd backend && python main.py"

echo     🚀 Starting frontend server...
timeout /t 3 /nobreak >nul
start "AtmoLens Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo     ╔══════════════════════════════════════════════════╗
echo     ║                                                  ║
echo     ║              ✅ ATMOLENS IS READY! ✅            ║
echo     ║                                                  ║
echo     ╚══════════════════════════════════════════════════╝
echo.
echo     🌐 Your browser will open in a moment...
echo.
echo     📍 Backend:  http://localhost:8001
echo     📍 Frontend: http://localhost:3000
echo.

REM Wait for servers to start
echo     ⏳ Waiting for servers to start...
timeout /t 8 /nobreak >nul

REM Open browser automatically
echo     🌐 Opening browser...
start http://localhost:3000

echo.
echo     ╔══════════════════════════════════════════════════╗
echo     ║                                                  ║
echo     ║              ✨ ALL DONE! ✨                     ║
echo     ║                                                  ║
echo     ║  AtmoLens is now running in the background.     ║
echo     ║  Your browser should show the dashboard.        ║
echo     ║                                                  ║
echo     ║  Maps will fetch automatically every 30 min.    ║
echo     ║                                                  ║
echo     ║  Close this window anytime - servers keep       ║
echo     ║  running in the background.                     ║
echo     ║                                                  ║
echo     ╚══════════════════════════════════════════════════╝
echo.
echo     Press any key to close this window...
pause >nul
exit
