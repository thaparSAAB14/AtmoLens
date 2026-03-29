@echo off
title AtmoLens - Stop Servers
color 0C

echo.
echo     ╔══════════════════════════════════════════════════╗
echo     ║                                                  ║
echo     ║           🛑 Stopping AtmoLens Servers           ║
echo     ║                                                  ║
echo     ╚══════════════════════════════════════════════════╝
echo.

REM Kill Python backend
echo     Stopping backend server...
taskkill /FI "WINDOWTITLE eq AtmoLens Backend*" /F >nul 2>&1
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :8001') do taskkill /PID %%a /F >nul 2>&1
echo     ✅ Backend stopped

REM Kill Node frontend
echo     Stopping frontend server...
taskkill /FI "WINDOWTITLE eq AtmoLens Frontend*" /F >nul 2>&1
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
echo     ✅ Frontend stopped

echo.
echo     ╔══════════════════════════════════════════════════╗
echo     ║                                                  ║
echo     ║              ✅ All servers stopped              ║
echo     ║                                                  ║
echo     ╚══════════════════════════════════════════════════╝
echo.
timeout /t 2 /nobreak >nul
exit
