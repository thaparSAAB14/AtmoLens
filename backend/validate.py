#!/usr/bin/env python3
"""
Comprehensive validation script for AtmoLens Backend.
This script validates the backend configuration and identifies any issues.
"""

import sys
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.10+"""
    print("Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 10):
        print(f"  ✗ Python 3.10+ required, but found {version.major}.{version.minor}")
        return False
    print(f"  ✓ Python {version.major}.{version.minor}.{version.micro}")
    return True

def check_dependencies():
    """Check if all required packages are installed."""
    print("\nChecking dependencies...")
    required = {
        "fastapi": "0.115.0",
        "uvicorn": "0.30.0",
        "cv2": "4.10.0.84",
        "numpy": "1.26.4",
        "PIL": "10.4.0",
        "httpx": "0.27.0",
        "apscheduler": "3.10.4",
        "dotenv": "1.0.1",
    }
    
    all_ok = True
    for module, version in required.items():
        try:
            mod = __import__(module)
            print(f"  ✓ {module} ({version})")
        except ImportError:
            print(f"  ✗ {module} - MISSING")
            all_ok = False
    
    return all_ok

def check_backend_files():
    """Check if all backend files exist."""
    print("\nChecking backend files...")
    backend_dir = Path(__file__).parent
    files = [
        "main.py",
        "config.py",
        "scheduler.py",
        "processor.py",
        "fetcher.py",
        "storage.py",
        "requirements.txt",
    ]
    
    all_ok = True
    for filename in files:
        filepath = backend_dir / filename
        if filepath.exists():
            print(f"  ✓ {filename}")
        else:
            print(f"  ✗ {filename} - MISSING")
            all_ok = False
    
    return all_ok

def check_directories():
    """Check if output directories exist."""
    print("\nChecking output directories...")
    backend_dir = Path(__file__).parent
    dirs = {
        "maps": backend_dir / "maps",
        "assets": backend_dir / "assets",
    }
    
    all_ok = True
    for dir_name, dir_path in dirs.items():
        if dir_path.exists():
            print(f"  ✓ {dir_name}/ exists")
        else:
            print(f"  ⚠ {dir_name}/ does NOT exist (will be created on startup)")
    
    return True  # Not critical

def check_land_mask():
    """Check if land_mask.png exists (optional)."""
    print("\nChecking assets...")
    backend_dir = Path(__file__).parent
    land_mask = backend_dir / "assets" / "land_mask.png"
    
    if land_mask.exists():
        size_mb = land_mask.stat().st_size / (1024 * 1024)
        print(f"  ✓ land_mask.png exists ({size_mb:.1f} MB)")
    else:
        print(f"  ⚠ land_mask.png NOT found - will use intensity-based fallback")
    
    return True

def test_imports():
    """Test if all modules can be imported without errors."""
    print("\nTesting module imports...")
    backend_dir = Path(__file__).parent
    sys.path.insert(0, str(backend_dir))
    
    modules = ["config", "storage", "processor", "fetcher", "scheduler"]
    all_ok = True
    
    for module_name in modules:
        try:
            __import__(module_name)
            print(f"  ✓ {module_name}")
        except Exception as e:
            print(f"  ✗ {module_name} - {type(e).__name__}: {str(e)[:60]}")
            all_ok = False
    
    return all_ok

def main():
    """Run all checks."""
    print("=" * 70)
    print("ATMOSLENS BACKEND VALIDATION")
    print("=" * 70)
    print()
    
    checks = [
        check_python_version,
        check_dependencies,
        check_backend_files,
        check_directories,
        check_land_mask,
        test_imports,
    ]
    
    results = []
    for check in checks:
        try:
            results.append(check())
        except Exception as e:
            print(f"\n  ✗ Check failed with error: {e}")
            results.append(False)
    
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    if all(results):
        print("\n✓ All checks passed! Backend is ready to run.")
        print("\nTo start the backend:")
        print("  python main.py")
        print("\nThe API will run on http://localhost:8001")
        return 0
    else:
        print("\n✗ Some checks failed. See details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
