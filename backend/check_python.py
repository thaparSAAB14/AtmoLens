#!/usr/bin/env python3
"""Simple check for Python and dependencies"""

import sys
import os

# Change to backend directory
os.chdir(r"C:\Users\ps103\Downloads\Gis Utility, project 1\backend")

print("Python Info:")
print(f"  Executable: {sys.executable}")
print(f"  Version: {sys.version}")
print(f"  Version info: {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")

# Try to get pip list
print("\nChecking pip...")
import subprocess
result = subprocess.run([sys.executable, "-m", "pip", "list"], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)
