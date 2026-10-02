$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$launcherSource = Join-Path $repositoryRoot "scripts\start-copilot.ps1"
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("copilot-launcher-test-" + [guid]::NewGuid())

function Assert-Equal {
  param(
    [string]$Expected,
    [string]$Actual,
    [string]$Message
  )

  if ($Expected -ne $Actual) {
    throw "$Message Expected '$Expected', received '$Actual'."
  }
}

try {
  New-Item -ItemType Directory -Path $testRoot | Out-Null
  git -C $testRoot init --quiet
  git -C $testRoot config user.name "Test User"
  git -C $testRoot config user.email "test@example.com"

  Set-Content -NoNewline -Path (Join-Path $testRoot "tracked.txt") -Value "initial"
  git -C $testRoot add --all
  git -C $testRoot commit --quiet -m "initial"

  Set-Content -NoNewline -Path (Join-Path $testRoot "tracked.txt") -Value "changed"
  Set-Content -NoNewline -Path (Join-Path $testRoot "untracked.txt") -Value "new"

  $scriptsDirectory = Join-Path $testRoot "scripts"
  $binDirectory = Join-Path $testRoot "bin"
  New-Item -ItemType Directory -Path $scriptsDirectory, $binDirectory | Out-Null
  Copy-Item -Path $launcherSource -Destination (Join-Path $scriptsDirectory "start-copilot.ps1")

  $copilotArgumentsFile = Join-Path $testRoot "copilot-arguments.txt"
  @'
@echo off
echo %* > "%COPILOT_TEST_ARGUMENTS_FILE%"
'@ | Set-Content -NoNewline -Path (Join-Path $binDirectory "copilot.cmd")

  $originalPath = $env:Path
  $env:Path = "$binDirectory;$originalPath"
  $env:COPILOT_TEST_ARGUMENTS_FILE = $copilotArgumentsFile
  try {
    & (Join-Path $scriptsDirectory "start-copilot.ps1") --model auto
  } finally {
    $env:Path = $originalPath
    Remove-Item Env:COPILOT_TEST_ARGUMENTS_FILE -ErrorAction SilentlyContinue
  }

  $forwardedArguments = (Get-Content -Raw $copilotArgumentsFile).Trim()
  Remove-Item $copilotArgumentsFile

  Assert-Equal -Expected "" -Actual (git -C $testRoot status --porcelain) -Message "The launcher must clean the working tree."
  Assert-Equal -Expected "chore: checkpoint before Copilot session" -Actual (git -C $testRoot log -1 --format=%s) -Message "The launcher must create a checkpoint commit."
  Assert-Equal -Expected "--model auto" -Actual $forwardedArguments -Message "The launcher must forward Copilot arguments."

  Write-Output "PASS: commits tracked and untracked changes before starting Copilot"
} finally {
  if (Test-Path $testRoot) {
    Remove-Item -Recurse -Force $testRoot
  }
}
