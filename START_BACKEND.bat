@echo off
setlocal
cd /d "%~dp0backend"
echo ==============================================
echo RiderFlow - Backend Setup
echo ==============================================
where py >nul 2>nul
if %errorlevel%==0 (set "PY=py") else (set "PY=python")
if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  %PY% -m venv .venv
  if errorlevel 1 goto error
)
echo Installing/updating backend dependencies...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto error
echo Starting API at http://127.0.0.1:8000
".venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
goto end
:error
echo.
echo Setup failed. Check that Python 3.10+ is installed and available in PATH.
pause
:end
endlocal
