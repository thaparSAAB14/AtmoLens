#!/usr/bin/env python3
"""
AtmoLens Production Deployment Helper
Automates the deployment process to Vercel and Railway/Render
"""

import subprocess
import sys
import webbrowser
from pathlib import Path

def run_command(cmd, shell=True):
    """Run a command and return success status."""
    try:
        result = subprocess.run(cmd, shell=shell, capture_output=True, text=True, check=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def check_git():
    """Check if git is available."""
    success, _ = run_command("git --version")
    return success

def git_status():
    """Show git status."""
    print("\n📊 Current Git Status:")
    print("=" * 60)
    subprocess.run("git status --short", shell=True)
    print("=" * 60)

def git_commit_and_push():
    """Commit and push changes."""
    print("\n📦 Preparing for deployment...")
    
    # Add all files
    print("   Adding files...")
    subprocess.run("git add -A", shell=True)
    
    # Get commit message
    commit_msg = input("\n💬 Enter commit message (or press Enter for default): ").strip()
    if not commit_msg:
        commit_msg = "Production ready deployment"
    
    # Commit
    print("   Committing...")
    full_msg = f"{commit_msg}\n\n- Fixed backend production issues\n- Added deployment configs\n- Production ready\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
    
    success, output = run_command(f'git commit -m "{full_msg}"')
    if not success:
        print("   ⚠️  Nothing to commit or commit failed")
        return False
    
    # Push
    print("   Pushing to GitHub...")
    success, output = run_command("git push origin main")
    if not success:
        print("\n❌ Push failed!")
        print("\nTry these:")
        print("  1. git remote add origin YOUR_REPO_URL")
        print("  2. git push -u origin main")
        return False
    
    print("   ✅ Pushed to GitHub!")
    return True

def open_deployment_pages():
    """Open deployment service pages in browser."""
    print("\n🌐 Opening deployment services...")
    
    services = [
        ("Vercel", "https://vercel.com/new"),
        ("Railway", "https://railway.app/new"),
    ]
    
    for name, url in services:
        print(f"   Opening {name}...")
        webbrowser.open(url)
    
    print("\n✅ Opened in browser!")

def show_instructions():
    """Show deployment instructions."""
    print("\n" + "=" * 60)
    print("📝 DEPLOYMENT INSTRUCTIONS")
    print("=" * 60)
    print("""
1️⃣  VERCEL (Frontend):
   - Select your GitHub repo
   - Root Directory: frontend
   - Framework: Next.js (auto-detected)
   - Deploy!
   
   After deploy, add environment variable:
   - Name: NEXT_PUBLIC_API_URL
   - Value: (your Railway backend URL)

2️⃣  RAILWAY (Backend):
   - Select your GitHub repo
   - Root Directory: backend
   - Add variables:
     * HOST=0.0.0.0
     * PORT=8001
     * FRONTEND_ORIGIN=(your Vercel URL)
   - Deploy!

3️⃣  CONNECT THEM:
   - Copy backend URL from Railway
   - Add to Vercel as NEXT_PUBLIC_API_URL
   - Redeploy Vercel
   - Done! ✅

📖 Full guide: PRODUCTION_DEPLOY.md
""")
    print("=" * 60)

def main():
    """Main deployment workflow."""
    print("\n" + "=" * 60)
    print("🚀 ATMOLENS PRODUCTION DEPLOYMENT")
    print("=" * 60)
    
    # Check git
    if not check_git():
        print("\n❌ Git not found!")
        print("Install from: https://git-scm.com/")
        input("\nPress Enter to exit...")
        return 1
    
    print("✅ Git found")
    
    # Show current status
    git_status()
    
    # Ask to proceed
    print("\n⚠️  This will commit and push ALL changes to GitHub.")
    proceed = input("Continue? (y/n): ").lower().strip()
    
    if proceed != 'y':
        print("\n❌ Deployment cancelled")
        return 0
    
    # Commit and push
    if not git_commit_and_push():
        input("\nPress Enter to exit...")
        return 1
    
    print("\n" + "=" * 60)
    print("✅ CODE PUSHED TO GITHUB!")
    print("=" * 60)
    
    # Ask to open deployment pages
    print("\nWould you like to open deployment pages now?")
    open_pages = input("(y/n): ").lower().strip()
    
    if open_pages == 'y':
        open_deployment_pages()
    
    # Show instructions
    show_instructions()
    
    print("\n✨ Deployment preparation complete!")
    print("Follow the instructions above to deploy.\n")
    
    input("Press Enter to exit...")
    return 0

if __name__ == "__main__":
    sys.exit(main())
