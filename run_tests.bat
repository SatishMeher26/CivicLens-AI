@echo off
echo Running CivicLens AI Automated Test Suite (Pytest)...
cd /d "%~dp0backend"
python -m pytest tests/test_ai_and_lifecycle.py -v
pause
