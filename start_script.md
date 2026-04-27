#!/bin/bash

echo "========================================="
echo "🚀 KUWASHA MAZINGIRA YA FEEVERT"
echo "========================================="

# === POSTGRESQL CLUSTER ===
echo "🔄 Kuwasha PostgreSQL cluster (main)..."
su - postgres -c "pg_ctlcluster 16 main start" 2>/dev/null
echo "✅ PostgreSQL cluster iko tayari."

# === DIRECTORY YA PROJECT ===
echo "📁 Kuingia kwenye directory ya feevert..."
cd /storage/emulated/0/Movies/feevert-pro || {
    echo "❌ Haikuweza kuingia kwenye directory: /storage/emulated/0/Movies/feevert-pro"
    exit 1
}

# === VIRTUALENV ===
echo "🐍 Kuwasha virtualenv (jamiienv)..."
VENV_PATH="/root/jamiienv/bin/activate"
if [ -f "$VENV_PATH" ]; then
    source "$VENV_PATH"
    echo "✅ Virtualenv imewashwa (jamiienv)."
    echo "📍 Django version: $(python -m django --version 2>/dev/null || echo 'ipo')"
else
    echo "❌ Haikuweza kupata virtualenv kwenye $VENV_PATH"
    exit 1
fi

# === REDIS ===
echo "🧠 Kukagua kama Redis inaendelea (PING)..."
if redis-cli ping | grep -q PONG; then
    echo "✅ Redis inafanya kazi (PONG)"
else
    echo "⚠️ Redis haifanyi kazi. Inawashwa sasa..."
    if [ -f "/etc/redis/redis.conf" ]; then
        redis-server /etc/redis/redis.conf --daemonize yes
    else
        echo "ℹ️ Hakuna /etc/redis/redis.conf — tunawasha Redis kwa mode ya basic..."
        redis-server --daemonize yes --port 6379 --bind 127.0.0.1 --protected-mode no
    fi
    sleep 2
    if redis-cli ping | grep -q PONG; then
        echo "✅ Redis imewashwa na inajibu (PONG)"
    else
        echo "⚠️ Redis bado haijibu PONG (si lazima kwa feevert)."
    fi
fi

echo ""
echo "========================================="
echo "🎉 MAZINGIRA YAMEKAMILIKA KWA FEEVERT!"
echo "========================================="
echo "📍 Endesha backend:"
echo "   cd /storage/emulated/0/Movies/feevert-pro && python manage.py runserver 0.0.0.0:8000"
echo "📍 Admin panel: http://127.0.0.1:8000/admin"
echo "========================================="

exec $SHELL