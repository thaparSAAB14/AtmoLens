#!/usr/bin/env python3
"""
Diagnostic script to check backend setup and dependencies.
"""
import sys
import subprocess
from pathlib import Path

backend_dir = Path(__file__).parent
print(f"Backend directory: {backend_dir}")
print(f"Python version: {sys.version}")
print()

# Check 1: Virtual environment
print("=" * 60)
print("CHECK 1: Virtual Environment")
print("=" * 60)
venv_dir = backend_dir / ".venv"
if venv_dir.exists():
    print(f"✓ Virtual environment exists at {venv_dir}")
    python_exe = venv_dir / "Scripts" / "python.exe"
    if python_exe.exists():
        print(f"✓ Python executable found at {python_exe}")
    else:
        print(f"✗ Python executable NOT found at {python_exe}")
else:
    print(f"✗ Virtual environment does NOT exist at {venv_dir}")

print()

# Check 2: Requirements file
print("=" * 60)
print("CHECK 2: Requirements File")
print("=" * 60)
req_file = backend_dir / "requirements.txt"
if req_file.exists():
    print(f"✓ requirements.txt exists")
    requirements = req_file.read_text()
    print("\nDependencies:")
    for line in requirements.strip().split("\n"):
        if line and not line.startswith("#"):
            print(f"  - {line}")
else:
    print(f"✗ requirements.txt NOT found")

print()

# Check 3: Import test
print("=" * 60)
print("CHECK 3: Python Import Test")
print("=" * 60)

required_modules = [
    "fastapi",
    "uvicorn",
    "cv2",
    "numpy",
    "PIL",
    "httpx",
    "apscheduler",
    "dotenv",
]

missing = []
for module_name in required_modules:
    try:
        __import__(module_name)
        print(f"✓ {module_name}")
    except ImportError as e:
        print(f"✗ {module_name} - MISSING")
        missing.append(module_name)

print()

# Check 4: Local modules
print("=" * 60)
print("CHECK 4: Local Modules")
print("=" * 60)

local_modules = ["config", "fetcher", "processor", "storage", "scheduler", "main"]
for mod in local_modules:
    mod_file = backend_dir / f"{mod}.py"
    if mod_file.exists():
        print(f"✓ {mod}.py exists")
    else:
        print(f"✗ {mod}.py NOT found")

print()

# Check 5: Assets
print("=" * 60)
print("CHECK 5: Assets")
print("=" * 60)

assets_dir = backend_dir / "assets"
if assets_dir.exists():
    print(f"✓ assets directory exists")
else:
    print(f"✗ assets directory NOT found")

land_mask = assets_dir / "land_mask.png" if assets_dir.exists() else None
if land_mask and land_mask.exists():
    print(f"✓ land_mask.png exists ({land_mask.stat().st_size} bytes)")
else:
    print(f"⚠ land_mask.png NOT found - will use fallback segmentation")

print()

# Check 6: .env file
print("=" * 60)
print("CHECK 6: Environment Variables")
print("=" * 60)

env_file = backend_dir / ".env"
if env_file.exists():
    print(f"✓ .env file exists")
else:
    print(f"⚠ .env file NOT found - will use defaults")

print()

# Summary
print("=" * 60)
print("SUMMARY")
print("=" * 60)
if missing:
    print(f"\n✗ MISSING DEPENDENCIES: {', '.join(missing)}")
    print("\nTo install missing dependencies, run:")
    print(f"  pip install -r requirements.txt")
else:
    print("\n✓ All dependencies are installed!")

print("\nTo start the backend, run:")
print(f"  python main.py")
print(f"\nThe API will be available at: http://localhost:8001")
print(f"API docs at: http://localhost:8001/docs")
