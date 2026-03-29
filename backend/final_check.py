#!/usr/bin/env python3
"""
Final syntax check - verifies all Python files are syntactically correct.
Run: python final_check.py
"""

import py_compile
import sys
from pathlib import Path

backend_dir = Path(__file__).parent
files_to_check = [
    "main.py",
    "config.py",
    "scheduler.py",
    "processor.py",
    "fetcher.py",
    "storage.py",
]

print("=" * 70)
print("PYTHON SYNTAX VERIFICATION")
print("=" * 70)
print()

all_ok = True
for filename in files_to_check:
    filepath = backend_dir / filename
    try:
        py_compile.compile(str(filepath), doraise=True)
        print(f"✓ {filename:20} - Syntax OK")
    except py_compile.PyCompileError as e:
        print(f"✗ {filename:20} - SYNTAX ERROR")
        print(f"  {e}")
        all_ok = False

print()
print("=" * 70)

if all_ok:
    print("✅ All files have valid Python syntax!")
    print()
    print("Backend is ready to run:")
    print("  python main.py")
    sys.exit(0)
else:
    print("❌ Syntax errors found. Please fix them.")
    sys.exit(1)
