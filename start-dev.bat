@echo off
echo ============================================
echo ATMOLENS - FULL STACK LOCAL DEVELOPMENT
echo ============================================
echo.
echo This will start both backend and frontend servers.
echo.
echo Backend:  http://localhost:8001
echo Frontend: http://localhost:3000
echo.
echo Press any key to start both servers...
pause >nul

echo.
echo [1/2] Starting Backend Server...
start "AtmoLens Backend" cmd /k "cd backend && python main.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server...
start "AtmoLens Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo Both servers started in separate windows!
echo ============================================
echo.
echo Backend:  http://localhost:8001/api/status
echo Frontend: http://localhost:3000
echo.
echo Close this window or press any key to exit.
pause >nul
