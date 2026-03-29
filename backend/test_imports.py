#!/usr/bin/env python3
"""
Test script to import all backend modules and identify runtime errors.
Run with: python test_imports.py
"""

import sys
import traceback
from pathlib import Path

print("=" * 70)
print("BACKEND MODULE IMPORT TEST")
print("=" * 70)
print()

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

modules_to_test = [
    ("config", "Configuration module"),
    ("storage", "Storage management"),
    ("processor", "Image processor"),
    ("fetcher", "HTTP fetcher"),
    ("scheduler", "APScheduler integration"),
    ("main", "FastAPI main application"),
]

errors_found = []

for module_name, description in modules_to_test:
    try:
        print(f"Importing {module_name:20} ({description:30})...", end=" ")
        __import__(module_name)
        print("✓ OK")
    except Exception as e:
        print(f"✗ ERROR")
        errors_found.append((module_name, e))
        print(f"  Error: {type(e).__name__}: {str(e)[:100]}")
        traceback.print_exc()
        print()

print()
print("=" * 70)
print("SUMMARY")
print("=" * 70)

if errors_found:
    print(f"\n✗ {len(errors_found)} module(s) failed to import:")
    for module_name, error in errors_found:
        print(f"\n  Module: {module_name}")
        print(f"  Error: {type(error).__name__}: {str(error)}")
        print("\n  Full traceback:")
        traceback.print_exception(type(error), error, error.__traceback__)
else:
    print("\n✓ All modules imported successfully!")
    print("\nThe backend should be ready to start. Run:")
    print("  python main.py")

print()
