import subprocess
import sys
import time

print("=" * 70)
print("BACKEND ENVIRONMENT DIAGNOSTICS")
print("=" * 70)

# Run diagnostic script
print("\nRunning Python diagnostics...")
result = subprocess.run([sys.executable, "diagnose_env.py"], cwd=r"C:\Users\ps103\Downloads\Gis Utility, project 1\backend")

print("\n" + "=" * 70)
print("Attempting to start backend (will capture output for 12 seconds)...")
print("=" * 70 + "\n")

# Try to start the backend and capture output for 12 seconds
try:
    process = subprocess.Popen(
        [sys.executable, "main.py"],
        cwd=r"C:\Users\ps103\Downloads\Gis Utility, project 1\backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    start_time = time.time()
    while time.time() - start_time < 12:
        line = process.stdout.readline()
        if line:
            print(line, end='')
        else:
            time.sleep(0.1)
    
    # Terminate the process
    process.terminate()
    
    # Get any remaining output
    try:
        remaining_output, _ = process.communicate(timeout=2)
        if remaining_output:
            print(remaining_output)
    except subprocess.TimeoutExpired:
        process.kill()
        process.communicate()

except Exception as e:
    print(f"Error starting backend: {e}")

print("\n" + "=" * 70)
print("Diagnostics complete")
print("=" * 70)
