@echo off
title Busk-O
cd /d "%~dp0"

echo ============================================
echo   Busk-O - starting local preview
echo ============================================
echo.

REM Install dependencies the first time only.
if not exist "node_modules" (
  echo First run: installing dependencies. This can take a few minutes...
  call npm install
  echo.
)

REM Open the browser a few seconds after the server starts.
start "" cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:3000"

echo Opening http://localhost:3000 in your browser...
echo Leave this window open while you use the app.
echo Close it (or press Ctrl+C) to stop.
echo.

call npm run dev
pause
