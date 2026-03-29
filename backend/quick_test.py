#!/usr/bin/env python3
"""
Quick test to verify backend can start without errors.
Run this before starting the full server.
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

print("\n" + "=" * 70)
print("ATMOSLENS BACKEND - PRE-START VERIFICATION")
print("=" * 70 + "\n")

# Test 1: Import all modules
print("Testing module imports...")
try:
    import config
    print("  ✓ config")
    import storage
    print("  ✓ storage")
    import processor
    print("  ✓ processor")
    import fetcher
    print("  ✓ fetcher")
    import scheduler
    print("  ✓ scheduler")
    import main
    print("  ✓ main")
except Exception as e:
    print(f"  ✗ Import failed: {e}")
    sys.exit(1)

print("\n" + "=" * 70)
print("✅ All modules loaded successfully!")
print("=" * 70)
print("\nYou can now start the backend with:")
print("  python main.py")
print("\nThe API will be available at:")
print("  http://localhost:8001")
print("  http://localhost:8001/docs (API documentation)")
print()
