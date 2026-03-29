"""
Quick diagnostic script for AtmoLens development environment.
"""
import sys
import subprocess
from pathlib import Path

def check_python():
    """Check Python version."""
    print("🐍 Python Version:")
    print(f"   {sys.version}")
    major, minor = sys.version_info[:2]
    if major >= 3 and minor >= 8:
        print("   ✅ Python version OK")
    else:
        print("   ❌ Need Python 3.8+")
    print()

def check_dependencies():
    """Check if backend dependencies are installed."""
    print("📦 Backend Dependencies:")
    required = [
        "fastapi", "uvicorn", "cv2", "numpy",
        "PIL", "httpx", "apscheduler", "dotenv"
    ]
    missing = []
    for pkg in required:
        try:
            if pkg == "cv2":
                import cv2
            elif pkg == "PIL":
                import PIL
            elif pkg == "dotenv":
                import dotenv
            else:
                __import__(pkg)
            print(f"   ✅ {pkg}")
        except ImportError:
            print(f"   ❌ {pkg} - MISSING")
            missing.append(pkg)
    
    if missing:
        print(f"\n   Install with: pip install -r requirements.txt")
    print()

def check_directories():
    """Check if required directories exist."""
    print("📁 Directory Structure:")
    base = Path(__file__).parent
    dirs = {
        "Backend": base,
        "Frontend": base.parent / "frontend",
        "Maps output": base / "maps",
        "Assets": base / "assets",
    }
    
    for name, path in dirs.items():
        if path.exists():
            print(f"   ✅ {name}: {path}")
        else:
            print(f"   ⚠️  {name}: {path} (will be auto-created)")
    print()

def check_node():
    """Check if Node.js is available for frontend."""
    print("📦 Frontend Environment:")
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"   ✅ Node.js: {result.stdout.strip()}")
        
        result = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"   ✅ npm: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("   ❌ Node.js/npm not found")
        print("   Install from: https://nodejs.org/")
    print()

def check_ports():
    """Check if ports are available."""
    print("🔌 Port Availability:")
    import socket
    
    def is_port_free(port):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            return result != 0
        except:
            return False
    
    ports = {8001: "Backend", 3000: "Frontend"}
    for port, service in ports.items():
        if is_port_free(port):
            print(f"   ✅ Port {port} ({service}): Available")
        else:
            print(f"   ⚠️  Port {port} ({service}): In use")
    print()

def main():
    print("=" * 60)
    print("🔍 ATMOLENS DEVELOPMENT ENVIRONMENT CHECK")
    print("=" * 60)
    print()
    
    check_python()
    check_dependencies()
    check_directories()
    check_node()
    check_ports()
    
    print("=" * 60)
    print("✅ Diagnostics complete!")
    print()
    print("To start development:")
    print("  1. Run: start-dev.bat")
    print("  2. Or run individually:")
    print("     - Backend:  start-backend.bat")
    print("     - Frontend: start-frontend.bat")
    print("=" * 60)

if __name__ == "__main__":
    main()
    input("\nPress Enter to exit...")
