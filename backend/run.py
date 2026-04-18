import uvicorn
import os
import sys

def main():
    # Force UTF-8 on Windows
    os.environ["PYTHONUTF8"] = "1"
    
    # Ensure we are operating in the backend directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)
    sys.path.insert(0, base_dir)
    
    print("[SwarmAI] Starting Backend Server...")
    
    # Programmatically start uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
