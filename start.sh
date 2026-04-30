#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! python3 -c "import flask, gunicorn" 2>/dev/null; then
  echo "Installing dependencies..."
  pip install -r requirements.txt
fi

echo "Starting Task Orbit at http://localhost:5000"
exec gunicorn \
  --worker-class=gthread \
  --workers=2 \
  --threads=8 \
  --timeout=3600 \
  --bind=0.0.0.0:5000 \
  server:app
