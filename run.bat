@echo off
echo Installing dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt
echo.
echo Starting server at http://localhost:8000
echo Press Ctrl+C to stop.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
