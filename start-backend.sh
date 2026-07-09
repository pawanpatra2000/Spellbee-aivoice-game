#!/bin/bash
set -e

cd /root/spellbee/backend

if [ -f .env ]; then
    set -a && source .env && set +a
fi

exec venv/bin/uvicorn app.main:app \
    --host 127.0.0.1 \
    --port 7860 \
    --workers 2 \
    --log-level info
