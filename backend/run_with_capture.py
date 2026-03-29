#!/usr/bin/env python3
"""
Run main.py and capture startup output for 15+ seconds
"""
import subprocess
import sys
import time
import os
from datetime import datetime

# Change to backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

print(f"Starting backend from: {backend_dir}")
print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 80)

# Start the process
start_time = time.time()
process = subprocess.Popen(
    [sys.executable, "main.py"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    universal_newlines=True,
    bufsize=1
)

# Capture output for 15 seconds
captured_output = []
try:
    while time.time() - start_time < 15:
        line = process.stdout.readline()
        if line:
            print(line.rstrip())
            captured_output.append(line)
        else:
            time.sleep(0.1)
except KeyboardInterrupt:
    pass

print("=" * 80)
print(f"Stopped after {time.time() - start_time:.1f} seconds")

# Check if process is still running
if process.poll() is None:
    print("✓ Process is still running - backend started successfully")
    process.terminate()
    process.wait(timeout=5)
else:
    print("✗ Process terminated unexpectedly")
    print(f"Exit code: {process.returncode}")
