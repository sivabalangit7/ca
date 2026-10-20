import uvicorn
import os
import sys

if __name__ == "__main__":
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)

    port = int(os.environ.get("PORT", 8001))

    print("=======================================================")
    print("🚀 NutriTrack India Precision SQLite Database Server")
    print(f"   Listening on: http://127.0.0.1:{port}")
    print(f"   API Docs:     http://127.0.0.1:{port}/docs")
    print(f"   Health Check: http://127.0.0.1:{port}/api/health")
    print("=======================================================")

    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
