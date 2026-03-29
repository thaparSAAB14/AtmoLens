import subprocess
import sys

def run_command(cmd):
    """Run a command and print output"""
    print(f"\n> {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
    return result.returncode

def main():
    # Check git status
    print("=" * 60)
    print("CHECKING GIT STATUS")
    print("=" * 60)
    run_command("git --no-pager status")
    
    # Add all files
    print("\n" + "=" * 60)
    print("ADDING ALL FILES")
    print("=" * 60)
    run_command("git add -A")
    
    # Show what will be committed
    print("\n" + "=" * 60)
    print("FILES STAGED FOR COMMIT")
    print("=" * 60)
    run_command("git --no-pager status")
    
    # Commit
    print("\n" + "=" * 60)
    print("COMMITTING CHANGES")
    print("=" * 60)
    commit_message = """fix: resolve backend production blockers and improve code quality

- Fix FileNotFoundError crashes in storage.py (get_archive, cleanup_old_maps)
- Move asyncio import to module level in main.py
- Move time import to module level in processor.py
- Remove unused imports from main.py (Response, JSONResponse, StaticFiles, Path)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"""
    
    run_command(f'git commit -m "{commit_message}"')
    
    # Push to remote
    print("\n" + "=" * 60)
    print("PUSHING TO REMOTE")
    print("=" * 60)
    return_code = run_command("git push origin main")
    
    if return_code == 0:
        print("\n✅ Successfully pushed all files to Git!")
    else:
        print("\n❌ Push failed. You may need to manually run: git push origin main")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
