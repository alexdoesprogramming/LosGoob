@echo off
setlocal
cd /d "%~dp0"
title LosGoob Setup
echo.
echo  LosGoob setup
echo  -------------
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install the current LTS from https://nodejs.org/
  pause
  exit /b 1
)
echo Node:
node --version
echo npm:
npm --version
echo.
call npm install
if errorlevel 1 (
  echo.
  echo Setup failed. Check your connection and try again.
  pause
  exit /b 1
)
echo.
echo Setup complete! Double-click start.bat to launch LosGoob.
pause
endlocal
