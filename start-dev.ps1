# ============================================================
# start-dev.ps1 - הרצת שרת פיתוח מקומי
# ============================================================
# הפעלה: לחיצה ימנית > Run with PowerShell
# או מהשורה: powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
# ============================================================

$port = 5173
$url = "http://localhost:$port/"
Set-Location -Path $PSScriptRoot

function Try-Run($exe, $args) {
  $cmd = Get-Command $exe -ErrorAction SilentlyContinue
  if ($null -ne $cmd) {
    Write-Host "Starting server on $url ..."
    Start-Process $url
    & $cmd.Source @args
    return $true
  }
  return $false
}

if (Try-Run "python" @("-m", "http.server", "$port")) { exit 0 }
if (Try-Run "py"     @("-m", "http.server", "$port")) { exit 0 }
if (Try-Run "npx"    @("--yes", "serve", "-p", "$port", ".")) { exit 0 }

Write-Host ""
Write-Host "Could not find Python or Node.js. Install one of them and re-run."
Write-Host "Python:  https://www.python.org/"
Write-Host "Node.js: https://nodejs.org/"
Read-Host "Press Enter to close"
