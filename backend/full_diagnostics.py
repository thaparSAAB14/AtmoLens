#!/usr/bin/env python3
"""Comprehensive Backend Environment Diagnostics"""

import sys
import subprocess
from pathlib import Path

backend_dir = Path(r"C:\Users\ps103\Downloads\Gis Utility, project 1\backend")

print("\n" + "="*80)
print(" BACKEND ENVIRONMENT DIAGNOSTICS REPORT ".center(80, "="))
print("="*80)

# 1. PYTHON VERSION
print("\n1️⃣  PYTHON VERSION")
print("-" * 80)
print(f"   Python Executable: {sys.executable}")
print(f"   Version: {sys.version.split()[0]}")
print(f"   Full Version Info: {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")

# 2. VIRTUAL ENVIRONMENT
print("\n2️⃣  VIRTUAL ENVIRONMENT")
print("-" * 80)
in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
print(f"   Running in venv: {in_venv}")
if in_venv:
    print(f"   venv path: {sys.prefix}")
    
venv_path = backend_dir / ".venv"
print(f"   .venv directory exists: {venv_path.exists()}")
if venv_path.exists():
    print(f"   .venv size: {sum(f.stat().st_size for f in venv_path.rglob('*') if f.is_file()) / (1024*1024):.1f} MB")

# 3. REQUIRED MODULES & VERSIONS
print("\n3️⃣  REQUIRED MODULES & VERSIONS")
print("-" * 80)

modules_to_check = {
    'fastapi': 'fastapi',
    'uvicorn': 'uvicorn',
    'cv2 (OpenCV)': 'cv2',
    'numpy': 'numpy',
    'PIL (Pillow)': 'PIL',
    'httpx': 'httpx',
    'apscheduler': 'apscheduler',
    'python-dotenv': 'dotenv'
}

all_installed = True
for display_name, module_name in modules_to_check.items():
    try:
        mod = __import__(module_name)
        version = getattr(mod, '__version__', 'unknown')
        print(f"   ✅ {display_name:<25} INSTALLED (v{version})")
    except ImportError as e:
        print(f"   ❌ {display_name:<25} MISSING")
        all_installed = False

# 4. BACKEND FILES
print("\n4️⃣  BACKEND FILES")
print("-" * 80)
backend_files = list(backend_dir.glob('*.py'))
backend_files += list(backend_dir.glob('*.txt'))
for f in sorted(backend_files):
    size = f.stat().st_size
    print(f"   • {f.name:<30} ({size:>6} bytes)")

# 5. ASSETS DIRECTORY
print("\n5️⃣  ASSETS DIRECTORY")
print("-" * 80)
assets_dir = backend_dir / "assets"
print(f"   assets/ directory exists: {assets_dir.exists()}")
if assets_dir.exists():
    asset_files = list(assets_dir.glob('*'))
    print(f"   Files in assets/: {len(asset_files)}")
    if asset_files:
        for f in asset_files:
            print(f"      • {f.name}")
    else:
        print(f"      (empty)")

land_mask = assets_dir / "land_mask.png"
print(f"   land_mask.png exists: {land_mask.exists()}")

# 6. MAPS DIRECTORY
print("\n6️⃣  MAPS DIRECTORY")
print("-" * 80)
maps_dir = backend_dir / "maps"
print(f"   maps/ directory exists: {maps_dir.exists()}")
if maps_dir.exists():
    try:
        map_subdirs = [d for d in maps_dir.iterdir() if d.is_dir()]
        print(f"   Subdirectories: {len(map_subdirs)}")
        for d in sorted(map_subdirs):
            files = list(d.glob('*'))
            print(f"      • {d.name}/ ({len(files)} files)")
    except Exception as e:
        print(f"   (could not list: {e})")

# 7. REQUIREMENTS FILE
print("\n7️⃣  REQUIREMENTS.txt")
print("-" * 80)
req_file = backend_dir / "requirements.txt"
if req_file.exists():
    with open(req_file) as f:
        reqs = f.read().strip().split('\n')
    print(f"   Dependencies listed: {len([r for r in reqs if r.strip()])}")
    for req in reqs:
        if req.strip():
            print(f"      • {req}")

# 8. PYTHON PATH & MODULES
print("\n8️⃣  PYTHON PATH")
print("-" * 80)
print(f"   sys.path entries:")
for p in sys.path[:5]:  # Show first 5
    print(f"      • {p}")
if len(sys.path) > 5:
    print(f"      ... and {len(sys.path)-5} more")

# 9. SUMMARY
print("\n" + "="*80)
print(" SUMMARY ".center(80, "="))
print("="*80)
print(f"   Python Version: {sys.version_info.major}.{sys.version_info.minor}")
print(f"   In Virtual Environment: {'✅ Yes' if in_venv else '⚠️  No (system Python)'}")
print(f"   All Dependencies Installed: {'✅ Yes' if all_installed else '❌ No - some missing'}")
print(f"   Assets Directory: {'✅ Exists' if assets_dir.exists() else '❌ Missing'}")
print(f"   land_mask.png: {'✅ Present' if land_mask.exists() else '⚠️  Missing (may be needed)'}")
print(f"   Maps Directory: {'✅ Exists' if maps_dir.exists() else '❌ Missing'}")
print("="*80)

# Try pip list for installed packages
print("\n9️⃣  INSTALLED PACKAGES (via pip list)")
print("-" * 80)
try:
    result = subprocess.run([sys.executable, "-m", "pip", "list"], 
                          capture_output=True, text=True, timeout=10)
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')
        # Show relevant packages only
        for line in lines:
            if any(pkg in line.lower() for pkg in ['fastapi', 'uvicorn', 'opencv', 'numpy', 'pillow', 'httpx', 'apscheduler', 'dotenv']):
                print(f"   {line}")
except Exception as e:
    print(f"   (could not run pip list: {e})")

print("\n" + "="*80)
