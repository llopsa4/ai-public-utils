@echo off
rem Double-click me. Installs Python if needed, the app, and runs the setup wizard.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
if errorlevel 1 (
  echo.
  echo Setup did not finish. See messages above.
  pause
  exit /b 1
)
timeout /t 5
