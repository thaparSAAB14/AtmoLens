"""
ATMOLENS - FULLY AUTOMATIC BACKEND LAUNCHER
No manual intervention required - just run and forget!
"""

import sys
import subprocess
import time
import os
from pathlib import Path

def setup_environment():
    """Ensure all directories and dependencies exist."""
    print("🔧 Setting up environment...")
    
    base_dir = Path(__file__).parent
    
    # Create necessary directories
    dirs_to_create = [
        base_dir / "maps",
        base_dir / "assets"
    ]
    
    for dir_path in dirs_to_create:
        if not dir_path.exists():
            dir_path.mkdir(parents=True)
            print(f"   ✅ Created {dir_path.name}/ directory")
        else:
            print(f"   ✅ {dir_path.name}/ exists")
    
    print()

def install_dependencies():
    """Check and install missing dependencies automatically."""
    print("📦 Checking dependencies...")
    
    required_packages = {
        "fastapi": "fastapi==0.115.0",
        "uvicorn": "uvicorn[standard]==0.30.0",
        "cv2": "opencv-python-headless==4.10.0.84",
        "numpy": "numpy==1.26.4",
        "PIL": "Pillow==10.4.0",
        "httpx": "httpx==0.27.0",
        "apscheduler": "apscheduler==3.10.4",
        "dotenv": "python-dotenv==1.0.1",
    }
    
    missing = []
    
    for module_name, package_name in required_packages.items():
        try:
            # Try importing with alternate names
            if module_name == "cv2":
                import cv2
            elif module_name == "PIL":
                import PIL
            elif module_name == "dotenv":
                import dotenv
            else:
                __import__(module_name)
            print(f"   ✅ {module_name}")
        except ImportError:
            print(f"   📥 Installing {module_name}...")
            missing.append(package_name)
    
    if missing:
        print("\n   Installing missing packages...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install"] + missing + ["--quiet"],
            check=False
        )
        print("   ✅ Dependencies installed\n")
    else:
        print("   ✅ All dependencies satisfied\n")

def start_backend():
    """Start the FastAPI backend server."""
    print("🚀 Starting AtmoLens Backend Server...")
    print("=" * 60)
    print()
    
    # Import and run the main app
    import main
    import config
    import uvicorn
    
    print(f"📍 Backend running at: http://{config.HOST}:{config.PORT}")
    print(f"📍 API Status: http://localhost:{config.PORT}/api/status")
    print(f"📍 Trigger Fetch: http://localhost:{config.PORT}/api/maps/fetch")
    print()
    print("🔄 Automatic fetch: Every {config.FETCH_INTERVAL_MINUTES} minutes")
    print("🗂️  Archive cleanup: Daily at midnight")
    print()
    print("Press Ctrl+C to stop")
    print("=" * 60)
    print()
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=False,  # Disable reload for production-like behavior
        log_level="info",
    )

def main():
    """Main entry point - fully automatic setup and launch."""
    print()
    print("=" * 60)
    print("     🌤️  ATMOLENS - AUTOMATIC BACKEND LAUNCHER  🌤️")
    print("=" * 60)
    print()
    
    try:
        setup_environment()
        install_dependencies()
        start_backend()
    except KeyboardInterrupt:
        print("\n\n⚠️  Shutting down gracefully...")
        print("✅ Backend stopped")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nIf issues persist, check:")
        print("  1. Python version (need 3.8+)")
        print("  2. Internet connection (for dependencies)")
        print("  3. Port 8001 availability")
        input("\nPress Enter to exit...")
        sys.exit(1)

if __name__ == "__main__":
    main()
