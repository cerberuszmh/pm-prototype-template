# =============================================================================
# Dead Reference Auto-Check Script (check-dead-refs.ps1)
# =============================================================================
#
# Purpose: Scan all markdown / mdc files in the project, validate that all
#          file path references point to existing files. Output dead reference
#          list with severity classification.
#
# Usage:
#   pwsh -File scripts/check-dead-refs.ps1
#   or in PowerShell:
#   .\scripts\check-dead-refs.ps1
#
# Exit codes:
#   0 = no severe dead references
#   1 = severe dead references found (CI/PR should fail)
#
# Design principles:
#   1. Only check explicit "path references" in active files; avoid false
#      positives from path-shaped plain text
#   2. Dead refs in historical archive reports (with date stamps) are
#      "ignorable" - history snapshots should not be modified
#   3. Placeholder paths ({moduleName}, *) are skipped
#   4. Zero external deps, pure PowerShell implementation
#   5. KNOWN_ALLOWED_DEAD_REFS whitelist for intentionally retained
#      historical markers (e.g., "this file was deprecated, see X SKILL")
#
# Maintainer notes:
#   - Sync $ScanGlobs / $KnownAllowedDeadRefs / $HistoricalSnapshotPatterns
#     when project structure changes
#   - This script must be saved as UTF-8 with BOM for PowerShell 5.1
#     compatibility
# =============================================================================

$ErrorActionPreference = "Stop"

# ----- Project root (script is in scripts/ subfolder) -----
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# ----- Scan scope (active documents only) -----
# Note: PowerShell 5.1 does NOT support `**` recursive glob, must use -Recurse.
# Each entry is { Root: relative dir, Filter: filename pattern, Recurse: bool }
$ScanTargets = @(
    @{ Root = ".cursor";   Filter = "*.md";  Recurse = $true  },
    @{ Root = ".cursor";   Filter = "*.mdc"; Recurse = $true  },
    @{ Root = "templates"; Filter = "*.md";  Recurse = $true  },
    @{ Root = "docs";      Filter = "*.md";  Recurse = $true  },
    @{ Root = ".";         Filter = "*.md";  Recurse = $false }
)

# ----- Known allowed dead references (whitelist) -----
# These are file paths intentionally retained in active SKILLs/rules/docs.
# They will be classified as "ignorable" rather than "severe".
# Two kinds:
#   (1) Historical markers retained after deletion (e.g., "X was deprecated")
#   (2) Example filenames inside doc-format.mdc naming convention table
$KnownAllowedDeadRefs = @(
    # Example filenames in naming convention table (doc-format.mdc)
    'GETTING_STARTED.md',
    'SKILL.md',
    'README.md',
    # Filename used as a placeholder in doc-format §"non-deliverable support files"
    'path/to/file.md'
)

# ----- Whitelist by file name pattern (ASCII-safe regex) -----
# Match date-stamped example filenames in doc-format.mdc naming convention table
# These follow patterns like "*-R{N}-{YYYYMMDD}.md" with arbitrary CN prefix.
# Using ASCII-safe negative lookahead to avoid CN regex encoding issues.
$KnownAllowedDeadRefPatterns = @(
    # Match: any prefix + "-R{number}-{8-digit-date}.md"
    '-R\d+-\d{8}\.md$',
    # Match: any prefix + "-{8-digit-date}.md" (e.g., delivery-check report)
    '-\d{8}\.md$'
)

function Test-IsAllowedByPattern {
    param([string]$Ref)
    $normalized = ($Ref -replace '\\', '/').TrimStart('./')
    # Only apply pattern matching to short-form refs (no path separator)
    # to avoid masking real dead refs in subdirs
    if ($normalized -match '/') { return $false }
    foreach ($pat in $KnownAllowedDeadRefPatterns) {
        if ($normalized -match $pat) { return $true }
    }
    return $false
}

# ----- File name index (for short-form reference resolution) -----
# Pre-built once; maps "filename.ext" -> @(absolute paths where it exists).
# Built lazily on first use.
$Script:FileNameIndex = $null

function Get-FileNameIndex {
    if ($null -ne $Script:FileNameIndex) { return $Script:FileNameIndex }
    $idx = @{}
    $allProjectFiles = Get-ChildItem -Path $ProjectRoot -Recurse -File `
        -ErrorAction SilentlyContinue `
        | Where-Object {
            $_.FullName -notlike '*\node_modules\*' -and
            $_.FullName -notlike '*\.git\*'
        }
    foreach ($f in $allProjectFiles) {
        $name = $f.Name
        if (-not $idx.ContainsKey($name)) { $idx[$name] = @() }
        $idx[$name] += $f.FullName
    }
    $Script:FileNameIndex = $idx
    return $idx
}

# ----- Historical archive report patterns -----
# Dead refs in these files are "ignorable" - they're time-stamped snapshots
# that should not be modified
$HistoricalSnapshotPatterns = @(
    '\\docs\\review\\.+-\d{8}\.md$',
    '\\docs\\review\\.+-R\d+-\d{8}\.md$'
)

# ----- Reference recognition patterns -----
# Pattern 1: Backtick-wrapped relative path (extension-restricted)
# Examples: `docs/standards/document-style.md`, `.cursor/rules/foo.mdc`
# First char allows: word chars OR dot (to support `.cursor/...` style)
$BacktickRefPattern = '`([\w\.][\w\.\-/\\]*\.(?:md|mdc|js|ts|vue|json|ps1|css|html))`'

# Pattern 2: Markdown link [text](path), extension-restricted
$MarkdownLinkPattern = '\[[^\]]+\]\(([\w\.][\w\.\-/\\]*\.(?:md|mdc|js|ts|vue|json|ps1|css|html))\)'

# ----- Skip rules -----
function Should-SkipReference {
    param([string]$Ref)

    # Skip placeholder paths
    if ($Ref -match '\{[^}]+\}') { return $true }
    if ($Ref -match '\*') { return $true }

    # Skip node_modules
    if ($Ref -like '*node_modules*') { return $true }

    return $false
}

function Test-IsHistoricalSnapshot {
    param([string]$FilePath)
    foreach ($pat in $HistoricalSnapshotPatterns) {
        if ($FilePath -match $pat) { return $true }
    }
    return $false
}

function Test-IsKnownAllowed {
    param([string]$Ref)
    $normalized = ($Ref -replace '\\', '/').TrimStart('./')
    foreach ($allowed in $KnownAllowedDeadRefs) {
        if ($normalized -eq $allowed) { return $true }
    }
    return $false
}

# ----- Path resolver (normalize to absolute) -----
# Resolution strategy:
#   Tier 1: Treat as path relative to project root
#   Tier 2: If ref is short form (no path separator), search file name index
function Test-RefExists {
    param([string]$Ref)
    $normalized = $Ref -replace '\\', '/'

    # Tier 1: project-root relative
    $absolute = Join-Path $ProjectRoot $normalized
    if (Test-Path $absolute) { return $true }

    # Tier 2: short form (no separator) -> look up by file name
    if ($normalized -notmatch '/') {
        $index = Get-FileNameIndex
        if ($index.ContainsKey($normalized)) {
            return $true
        }
    }

    return $false
}

# ----- Main -----
Write-Host "[Dead-Ref Check] Starting..." -ForegroundColor Cyan
Write-Host "   Project root: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

$severeIssues = @()
$ignorableIssues = @()

# Collect all files to scan
$allFiles = @()
foreach ($target in $ScanTargets) {
    $rootPath = Join-Path $ProjectRoot $target.Root
    if (-not (Test-Path $rootPath)) { continue }
    if ($target.Recurse) {
        $found = Get-ChildItem -Path $rootPath -Filter $target.Filter -File -Recurse -ErrorAction SilentlyContinue
    } else {
        $found = Get-ChildItem -Path $rootPath -Filter $target.Filter -File -ErrorAction SilentlyContinue
    }
    if ($found) {
        $allFiles += $found
    }
}
$allFiles = $allFiles | Sort-Object FullName -Unique

Write-Host "   Files scanned: $($allFiles.Count)" -ForegroundColor Gray
Write-Host ""

# For each file: extract refs + validate
foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Substring($ProjectRoot.Length + 1)
    $isHistorical = Test-IsHistoricalSnapshot -FilePath $file.FullName

    $lines = Get-Content $file.FullName -Encoding UTF8
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $lineNumber = $i + 1

        $refs = @()
        $matchesBacktick = [regex]::Matches($line, $BacktickRefPattern)
        foreach ($m in $matchesBacktick) { $refs += $m.Groups[1].Value }
        $matchesLink = [regex]::Matches($line, $MarkdownLinkPattern)
        foreach ($m in $matchesLink) { $refs += $m.Groups[1].Value }

        foreach ($ref in $refs) {
            if (Should-SkipReference -Ref $ref) { continue }

            if (-not (Test-RefExists -Ref $ref)) {
                $issue = [PSCustomObject]@{
                    SourceFile = $relativePath
                    LineNumber = $lineNumber
                    Ref        = $ref
                }
                # Classification:
                # - In historical snapshot file -> ignorable
                # - In whitelist (exact or pattern) -> ignorable
                # - Otherwise -> severe
                $isAllowed = (Test-IsKnownAllowed -Ref $ref) -or `
                             (Test-IsAllowedByPattern -Ref $ref)
                if ($isHistorical -or $isAllowed) {
                    $ignorableIssues += $issue
                } else {
                    $severeIssues += $issue
                }
            }
        }
    }
}

# ----- Output -----
Write-Host ""
if ($severeIssues.Count -eq 0 -and $ignorableIssues.Count -eq 0) {
    Write-Host "[OK] No dead references found. All path references valid." -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary: severe=0  ignorable=0" -ForegroundColor Green
    exit 0
}

if ($severeIssues.Count -gt 0) {
    Write-Host "[FAIL] Severe dead references: $($severeIssues.Count)" -ForegroundColor Red
    Write-Host ""
    foreach ($issue in $severeIssues) {
        Write-Host "   $($issue.SourceFile):$($issue.LineNumber)" -ForegroundColor Yellow
        Write-Host "      ref: $($issue.Ref)" -ForegroundColor White
        Write-Host ""
    }
}

if ($ignorableIssues.Count -gt 0) {
    Write-Host "[WARN] Ignorable dead refs: $($ignorableIssues.Count) (historical snapshots / whitelist)" -ForegroundColor DarkYellow
    Write-Host ""
    foreach ($issue in $ignorableIssues) {
        Write-Host "   $($issue.SourceFile):$($issue.LineNumber)" -ForegroundColor DarkGray
        Write-Host "      ref: $($issue.Ref)" -ForegroundColor DarkGray
        Write-Host ""
    }
}

Write-Host "Summary: severe=$($severeIssues.Count)  ignorable=$($ignorableIssues.Count)" -ForegroundColor Cyan

if ($severeIssues.Count -gt 0) {
    exit 1
} else {
    exit 0
}
