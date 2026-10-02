# Copilot Session Launcher

Start Copilot for this repository through the launcher:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-copilot.ps1
```

Pass normal Copilot CLI arguments after the script path:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-copilot.ps1 --model auto
```

Before starting Copilot, the launcher checks the repository working tree. If
tracked, deleted, or non-ignored untracked files exist, it stages them and
creates a local commit with the message `chore: checkpoint before Copilot
session`. It creates no commit when the tree is clean and never pushes.

If Git cannot stage or commit the changes, the launcher stops and Copilot does
not start. Resolve the Git error and run the launcher again.
