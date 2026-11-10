# Premiere Tracker installer. Run via Setup.bat (double-click).
# Keep this file ASCII-only: Windows PowerShell 5.1 reads BOM-less files as ANSI.

$ErrorActionPreference = 'Stop'
$Src        = Split-Path -Parent $MyInvocation.MyCommand.Path
$InstallDir = Join-Path $env:LOCALAPPDATA 'PremiereTracker'
$AppDir     = Join-Path $InstallDir 'app'
$VenvDir    = Join-Path $InstallDir 'venv'
$PyVersion  = '3.12.10'

function Step($msg) { Write-Host "`n== $msg" -ForegroundColor Cyan }

# Returns path to a python.exe (>= 3.10 with tkinter), or $null.
function Find-Python {
    $candidates = @()
    foreach ($name in 'py', 'python', 'python3') {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($cmd -and $cmd.Source -notlike '*WindowsApps*') { $candidates += $cmd.Source }
    }
    $candidates += Get-ChildItem "$env:LOCALAPPDATA\Programs\Python\Python3*\python.exe" -ErrorAction SilentlyContinue | ForEach-Object FullName
    $candidates += Get-ChildItem "$env:ProgramFiles\Python3*\python.exe" -ErrorAction SilentlyContinue | ForEach-Object FullName

    foreach ($exe in $candidates) {
        $pyArgs = @()
        if ((Split-Path $exe -Leaf) -eq 'py.exe') { $pyArgs = @('-3') }
        try {
            $out = & $exe @pyArgs -c "import sys, tkinter; print(sys.version_info >= (3, 10)); print(sys.executable)" 2>$null
            if ($LASTEXITCODE -eq 0 -and $out -and $out[0] -eq 'True') { return $out[1] }
        } catch { }
    }
    return $null
}

function Install-Python {
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Host 'Installing Python with winget...'
        & winget install --id Python.Python.3.12 --scope user --silent --accept-package-agreements --accept-source-agreements
        $py = Find-Python
        if ($py) { return $py }
        Write-Host 'winget did not work, trying direct download...'
    }
    $url = "https://www.python.org/ftp/python/$PyVersion/python-$PyVersion-amd64.exe"
    $installer = Join-Path $env:TEMP "python-$PyVersion-amd64.exe"
    Write-Host "Downloading $url"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
    Write-Host 'Running Python installer (quiet, current user only)...'
    $p = Start-Process -FilePath $installer -Wait -PassThru -ArgumentList @(
        '/quiet', 'InstallAllUsers=0', 'Include_tcltk=1', 'Include_pip=1',
        'Include_test=0', 'PrependPath=0', 'Shortcuts=0')
    if ($p.ExitCode -ne 0) { throw "Python installer failed (exit $($p.ExitCode))." }
    $py = Find-Python
    if (-not $py) { throw 'Python installed but not found. Restart the PC and run Setup.bat again.' }
    return $py
}

function New-Shortcut($lnk, $target, $arguments, $workdir) {
    $s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
    $s.TargetPath = $target
    $s.Arguments = $arguments
    $s.WorkingDirectory = $workdir
    $s.Save()
}

Write-Host 'Premiere Tracker setup' -ForegroundColor Green

Step 'Stopping running copy (if any)'
Get-CimInstance Win32_Process -Filter "Name='pythonw.exe' OR Name='python.exe'" |
    Where-Object { $_.CommandLine -like "*$AppDir*" } |
    ForEach-Object { Invoke-CimMethod -InputObject $_ -MethodName Terminate | Out-Null }

Step 'Checking Python'
$py = Find-Python
if (-not $py) { $py = Install-Python }
Write-Host "Using $py"

Step "Copying app to $AppDir"
New-Item -ItemType Directory -Force $InstallDir | Out-Null
if (Test-Path $AppDir) { Remove-Item -Recurse -Force $AppDir }
Copy-Item -Recurse (Join-Path $Src 'app') $AppDir
Get-ChildItem $AppDir -Recurse -Directory -Filter '__pycache__' | Remove-Item -Recurse -Force

Step 'Creating private Python environment + libraries'
if (-not (Test-Path (Join-Path $VenvDir 'Scripts\python.exe'))) {
    & $py -m venv $VenvDir
    if ($LASTEXITCODE -ne 0) { throw 'Could not create virtual environment.' }
}
$venvPy  = Join-Path $VenvDir 'Scripts\python.exe'
$venvPyw = Join-Path $VenvDir 'Scripts\pythonw.exe'
& $venvPy -m pip install --disable-pip-version-check -q -r (Join-Path $Src 'requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'pip install failed (internet connection?).' }

Step 'Setup wizard'
$main = Join-Path $AppDir 'main.py'
Start-Process -FilePath $venvPyw -ArgumentList "`"$main`" --setup" -WorkingDirectory $AppDir -Wait
if (-not (Test-Path (Join-Path $InstallDir 'config.json'))) {
    Write-Host 'Wizard cancelled. Run Setup.bat again when ready.' -ForegroundColor Yellow
    exit 1
}

Step 'Desktop shortcut'
$desktop = [Environment]::GetFolderPath('Desktop')
New-Shortcut (Join-Path $desktop 'Premiere Tracker.lnk') $venvPyw "`"$main`" --show" $AppDir

Step 'Starting Premiere Tracker'
Start-Process -FilePath $venvPyw -ArgumentList "`"$main`" --show" -WorkingDirectory $AppDir

Write-Host "`nDone. Look for the dot icon next to the clock (click ^ if hidden)." -ForegroundColor Green
