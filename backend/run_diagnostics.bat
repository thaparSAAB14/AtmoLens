@echo off
cd /d "C:\Users\ps103\Downloads\Gis Utility, project 1\backend"

echo ========================================
echo Running Python Environment Diagnostics
echo ========================================
python diagnose_env.py

echo.
echo ========================================
echo Attempting to start backend...
echo ========================================
timeout /t 3
python main.py
