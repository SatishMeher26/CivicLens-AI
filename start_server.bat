@echo off
echo ========================================================
echo   CivicLens AI — Platform Launcher
echo   From Citizen Complaints to Civic Intelligence
echo   Team VisionX
echo ========================================================
echo.
echo Starting CivicLens AI Unified Server on http://127.0.0.1:8000 ...
echo - API Documentation: http://127.0.0.1:8000/docs
echo - Web Application:   http://127.0.0.1:8000/
echo.
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
