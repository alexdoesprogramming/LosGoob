@echo off
setlocal
cd /d "%~dp0"
title LosGoob
echo.
echo  LosGoob ^| starting up...
echo  -------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install the current Node.js LTS from https://nodejs.org/ then run start.bat again.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo First run: installing dependencies. This can take a few minutes...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] Dependency installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
echo.
echo LosGoob will open at http://localhost:8080
echo Keep this window open while using LosGoob.
echo Press Ctrl+C here to stop the server.
echo.
start "" "http://localhost:8080"
call npm start
if errorlevel 1 (
  echo.
  echo LosGoob stopped with an error.
  pause
)
endlocal
