#!/bin/bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  URBANMIND STARTUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Step 1: Verifying integration..."
python verify_integration.py
if [ $? -ne 0 ]; then
  echo "❌ Integration check failed. Fix errors above."
  exit 1
fi

echo "Step 2: Starting FastAPI backend..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
sleep 3

echo "Step 3: Starting React frontend..."
cd Abhinay && npm run dev &
FRONTEND_PID=$!

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ UrbanMind is running!"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

wait
