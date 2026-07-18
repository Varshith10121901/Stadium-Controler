import subprocess
import sys
import time
import os
import threading

def log_reader(pipe, prefix):
    try:
        for line in iter(pipe.readline, ''):
            if line:
                print(f"{prefix} {line.strip()}")
    except Exception:
        pass

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # 1. Start Backend Server
    backend_dir = os.path.join(base_dir, "backend")
    print("[SwarmAI Launcher] Starting Backend (FastAPI) server...")
    backend_proc = subprocess.Popen(
        [sys.executable, "run.py"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Start backend log reader thread
    threading.Thread(target=log_reader, args=(backend_proc.stdout, "\033[96m[Backend]\033[0m"), daemon=True).start()

    # 2. Start Frontend Server
    frontend_dir = os.path.join(base_dir, "frontend")
    print("[SwarmAI Launcher] Starting Frontend (Next.js) server...")
    
    # Check if npm modules are installed
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("[SwarmAI Launcher] Running npm install first (this may take a moment)...")
        subprocess.run("npm install", cwd=frontend_dir, shell=True)

    frontend_proc = subprocess.Popen(
        "npm run dev",
        cwd=frontend_dir,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Start frontend log reader thread
    threading.Thread(target=log_reader, args=(frontend_proc.stdout, "\033[92m[Frontend]\033[0m"), daemon=True).start()

    # Give them 3 seconds to spin up
    time.sleep(3)

    print("\n" + "="*60)
    print(" 🚀  SWARMAI BERNABEU EDITION IS UP AND RUNNING! ")
    print("="*60)
    print("Click on the links below to access the systems:\n")
    print("  📱 Attendee App:       http://localhost:3000")
    print("  📊 Operator Dashboard:  http://localhost:3000/dashboard")
    print("  🔧 Debug Console:       http://localhost:3000/debug")
    print("  📡 Backend API Docs:    http://localhost:8000/docs")
    print("\n" + "="*60)
    print("Press CTRL+C to terminate both servers.")
    print("="*60 + "\n")

    try:
        # Keep launcher alive
        while True:
            # Check if any process died unexpectedly
            if backend_proc.poll() is not None:
                print("❌ Backend server stopped unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("❌ Frontend server stopped unexpectedly.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[SwarmAI Launcher] Shutting down both servers gracefully...")
    finally:
        # Terminate backend process group
        try:
            backend_proc.terminate()
            backend_proc.wait(timeout=2)
        except Exception:
            pass

        # Terminate frontend process group (Next.js runs under cmd/powershell process)
        try:
            if os.name == 'nt':
                # Kill process tree on Windows to ensure Next.js dev server terminates completely
                subprocess.run(f"taskkill /F /T /PID {frontend_proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                frontend_proc.terminate()
                frontend_proc.wait(timeout=2)
        except Exception:
            pass

        print("[SwarmAI Launcher] Shutdown complete.")

if __name__ == "__main__":
    main()
