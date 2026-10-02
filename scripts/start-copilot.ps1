[CmdletBinding()]
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$CopilotArguments
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repositoryRoot
try {
  if ((git rev-parse --is-inside-work-tree) -ne "true") {
    throw "The Copilot launcher must be run from a Git repository."
  }

  $changes = git status --porcelain
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to inspect the Git working tree."
  }

  if ($changes) {
    git add --all
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to stage Git changes."
    }

    git diff --cached --quiet
    if ($LASTEXITCODE -gt 1) {
      throw "Unable to inspect staged Git changes."
    }

    if ($LASTEXITCODE -eq 1) {
      git commit -m "chore: checkpoint before Copilot session"
      if ($LASTEXITCODE -ne 0) {
        throw "Unable to create the Git checkpoint commit."
      }
    }
  }

  & copilot @CopilotArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Copilot exited with code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
