@echo off
setlocal
cd /d "%~dp0frontend"
echo ==============================================
echo RiderFlow - Frontend Setup
echo ==============================================
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js/npm was not found. Install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 goto error
)
echo Starting website. Keep this window open.
call npm run dev
goto end
:error
echo.
echo Frontend setup failed. Check your internet connection and package.json.
pause
:end
endlocal
