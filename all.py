import subprocess
import sys
import time
import os
import threading

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def log_reader(pipe, prefix):
    try:
        for line in iter(pipe.readline, ''):
            if line:
                print(f"{prefix} {line.strip()}")
    except Exception:
        pass

def main():
    os.environ["PYTHONUTF8"] = "1"
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # 1. Start Backend & Unified Frontend Server (FastAPI on Port 8000)
    backend_dir = os.path.join(base_dir, "backend")
    
    # Auto-detect virtualenv python interpreter
    venv_python = None
    if os.name == 'nt':
        p = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
        if os.path.exists(p):
            venv_python = p
    else:
        p = os.path.join(backend_dir, "venv", "bin", "python")
        if os.path.exists(p):
            venv_python = p

    python_exe = venv_python if venv_python else sys.executable
    
    # Auto-verify required backend dependencies and install if missing
    req_check = subprocess.run([python_exe, "-c", "import uvicorn, fastapi"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if req_check.returncode != 0:
        print(f"[SwarmAI Launcher] Missing Python dependencies in {python_exe}. Installing requirements...")
        req_file = os.path.join(backend_dir, "requirements.txt")
        if os.path.exists(req_file):
            subprocess.run([python_exe, "-m", "pip", "install", "-r", req_file], cwd=backend_dir)

    print(f"[SwarmAI Launcher] Starting SwarmAI Unified Server (FastAPI + HTML5/WebGL UI) using: {python_exe}...")
    
    backend_proc = subprocess.Popen(
        [python_exe, "run.py"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Start backend log reader thread
    threading.Thread(target=log_reader, args=(backend_proc.stdout, "\033[96m[SwarmAI]\033[0m"), daemon=True).start()

    # 2. Optional: Next.js dev server if Node environment is available
    frontend_dir = os.path.join(base_dir, "frontend")
    frontend_proc = None
    if os.path.exists(os.path.join(frontend_dir, "package.json")):
        try:
            print("[SwarmAI Launcher] Starting Next.js Dev Server (Port 3000)...")
            frontend_proc = subprocess.Popen(
                "npm run dev",
                cwd=frontend_dir,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            threading.Thread(target=log_reader, args=(frontend_proc.stdout, "\033[92m[Next.js]\033[0m"), daemon=True).start()
        except Exception:
            print("[SwarmAI Launcher] Next.js skipped — running unified HTML5 frontend on port 8000.")

    time.sleep(3)

    print("\n" + "="*60)
    print(" 🚀  SWARMAI BERNABEU EDITION IS UP AND RUNNING! ")
    print("="*60)
    print("Click on the links below to access the systems:\n")
    print("  📱 Next.js Frontend App:  http://localhost:3000")
    print("  📊 Operator Dashboard:   http://localhost:3000/dashboard")
    print("  🔧 Debug Console:        http://localhost:3000/debug")
    print("  📡 Backend API Server:   http://localhost:8000")
    print("  📡 Backend API Docs:     http://localhost:8000/docs")
    print("\n" + "="*60)
    print("Press CTRL+C to terminate servers.")
    print("="*60 + "\n")

    try:
        while True:
            if backend_proc.poll() is not None:
                print("❌ SwarmAI server stopped unexpectedly.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[SwarmAI Launcher] Shutting down servers gracefully...")
    finally:
        try:
            backend_proc.terminate()
            backend_proc.wait(timeout=2)
        except Exception:
            pass

        if frontend_proc:
            try:
                if os.name == 'nt':
                    subprocess.run(f"taskkill /F /T /PID {frontend_proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    frontend_proc.terminate()
                    frontend_proc.wait(timeout=2)
            except Exception:
                pass

        print("[SwarmAI Launcher] Shutdown complete.")

if __name__ == "__main__":
    main()
