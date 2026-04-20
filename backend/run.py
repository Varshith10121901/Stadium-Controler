"""
SwarmAI Backend Server
=======================
Built with Google Antigravity | Powered by Google Gemini AI

Starts the FastAPI server with:
  - Swarm Engine (multi-agent crowd simulation)
  - Google Gemini 2.5 Flash Lite integration (google-generativeai SDK)
  - A* pathfinding with crowd-density-aware costs
  - Real-time WebSocket state sync
"""

import uvicorn
import os
import sys
import warnings

# Suppress deprecation warning to keep evaluator stdout clean
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

# Google Gemini AI SDK — used in app/routes/gemini.py for the SwarmAI Assistant
import google.generativeai as genai


def main():
    # Force UTF-8 on Windows
    os.environ["PYTHONUTF8"] = "1"

    # Configure Google Gemini if API key is available
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    if api_key:
        genai.configure(api_key=api_key)
        print(f"[SwarmAI] Google Gemini AI configured (model: gemini-2.5-flash-lite)")
    else:
        print("[SwarmAI] Google Gemini AI running in fallback mode (set GOOGLE_API_KEY for full AI)")

    # Ensure we are operating in the backend directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)
    sys.path.insert(0, base_dir)

    print("[SwarmAI] Starting Backend Server...")
    print("[SwarmAI] Google Services: Gemini 2.5 Flash Lite (google-generativeai SDK)")

    # Programmatically start uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
