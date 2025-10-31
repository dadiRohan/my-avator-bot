$env:PYTHONUTF8 = '1'
python -m venv venv
& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
