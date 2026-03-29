#!/usr/bin/env python3
"""Diagnostic script to check backend environment and dependencies."""

import sys
import os
from pathlib import Path

print("=" * 70)
print("BACKEND ENVIRONMENT DIAGNOSTICS")
print("=" * 70)

# 1. Python version
print(f"\n1. PYTHON VERSION:")
print(f"   Python executable: {sys.executable}")
print(f"   Version: {sys.version}")
print(f"   Version info: {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")

# 2. Virtual environment
print(f"\n2. VIRTUAL ENVIRONMENT:")
in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
print(f"   In virtual environment: {in_venv}")
if in_venv:
    print(f"   Virtual environment path: {sys.prefix}")

# 3. Check required modules
print(f"\n3. REQUIRED MODULES:")
modules_to_check = [
    'fastapi',
    'uvicorn',
    'cv2',
    'numpy',
    'PIL',
    'httpx',
    'apscheduler',
    'dotenv'
]

missing_modules = []
for module in modules_to_check:
    try:
        if module == 'dotenv':
            __import__('dotenv')
        else:
            __import__(module)
        print(f"   ✓ {module:<20} INSTALLED")
    except ImportError as e:
        print(f"   ✗ {module:<20} MISSING - {str(e)}")
        missing_modules.append(module)

# 4. Assets directory
print(f"\n4. ASSETS DIRECTORY:")
backend_dir = Path(__file__).parent
assets_dir = backend_dir / "assets"
land_mask_path = assets_dir / "land_mask.png"

print(f"   Backend directory: {backend_dir}")
print(f"   Assets directory exists: {assets_dir.exists()}")
if assets_dir.exists():
    assets_files = list(assets_dir.iterdir())
    print(f"   Files in assets: {len(assets_files)}")
    for f in assets_files:
        print(f"      - {f.name} ({f.stat().st_size} bytes)")
else:
    print(f"   Assets directory does not exist!")

print(f"   land_mask.png exists: {land_mask_path.exists()}")

# 5. Backend files
print(f"\n5. BACKEND FILES:")
backend_files = [f.name for f in backend_dir.iterdir() if f.is_file() and not f.name.startswith('.')]
for f in sorted(backend_files):
    file_path = backend_dir / f
    size = file_path.stat().st_size
    print(f"   - {f:<30} ({size} bytes)")

# Summary
print(f"\n" + "=" * 70)
print("SUMMARY:")
print(f"   Python Version: {sys.version_info.major}.{sys.version_info.minor}")
print(f"   In Virtual Environment: {in_venv}")
print(f"   Missing Dependencies: {len(missing_modules)}")
if missing_modules:
    print(f"   Missing modules: {', '.join(missing_modules)}")
print(f"   Assets directory exists: {assets_dir.exists()}")
print(f"   land_mask.png exists: {land_mask_path.exists()}")
print("=" * 70)
