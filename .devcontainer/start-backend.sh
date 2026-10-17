#!/usr/bin/env bash
cd /workspaces/VoiceBox/backend
if curl -fsS http://127.0.0.1:8000/docs >/dev/null 2>&1; then
  echo "VoiceBox backend already running."
  exit 0
fi
nohup bash -c '
cd /workspaces/VoiceBox/backend
while true; do
  if [ -x .venv/bin/python ]; then
    .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
  else
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
  fi
  echo "Backend stopped; retrying in 5 seconds..."
  sleep 5
done
' >> /tmp/voicebox-backend.log 2>&1 < /dev/null &
echo "Backend startup requested."
