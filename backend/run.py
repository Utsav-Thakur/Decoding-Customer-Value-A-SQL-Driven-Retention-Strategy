#!/usr/bin/env python3
"""
BrandIQ Backend — Quick start helper.
Copies Dataset.csv into the backend/ folder if missing, then launches uvicorn.
Run from the project root:  python backend/run.py
"""
import subprocess
import sys
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
BACKEND = Path(__file__).parent
CSV_SRC = ROOT / "Dataset.csv"
CSV_DST = BACKEND / "Dataset.csv"

if not CSV_DST.exists():
    if CSV_SRC.exists():
        shutil.copy2(CSV_SRC, CSV_DST)
        print(f"[BrandIQ] Copied Dataset.csv → backend/Dataset.csv")
    else:
        print("[BrandIQ] WARNING: Dataset.csv not found in project root. /api/stats will return empty.")

subprocess.run([
    sys.executable, "-m", "uvicorn",
    "main:app",
    "--host", "0.0.0.0",
    "--port", "8000",
    "--reload",
], cwd=str(BACKEND))
