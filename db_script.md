#!/bin/bash

# === SETUP KWA FEEVERT (Kutumia cluster MAIN - port 5432) ===
PROJECT_DIR="/storage/emulated/0/Movies/feevert-pro"
VENV_PATH="/root/jamiienv"
DB_NAME="feevert_db"
DB_USER="feevert_user"
DB_PASS="feevert123"
DB_PORT="5432"

echo "========================================="
echo "🚀 SETUP DATABASE KWA FEEVERT"
echo "========================================="

# === ANGALIA POSTGRESQL ===
echo "📂 Project path: $PROJECT_DIR"
echo "🔍 Database: $DB_NAME kwenye port $DB_PORT"

# === WARSHA POSTGRESQL CLUSTER MAIN ===
echo "🔄 Kuwasha PostgreSQL cluster main..."
su - postgres -c "pg_ctlcluster 16 main start" 2>/dev/null
echo "✅ PostgreSQL cluster iko tayari."

# === FUTA DATABASE NA USER IKIWEPO (Kwa usafi) ===
echo "🗑️ Kufuta database '$DB_NAME' ikiwepo..."
su - postgres -c "psql -p $DB_PORT -c 'DROP DATABASE IF EXISTS $DB_NAME;'" 2>/dev/null

echo "🗑️ Kufuta user '$DB_USER' ikiwepo..."
su - postgres -c "psql -p $DB_PORT -c 'DROP USER IF EXISTS $DB_USER;'" 2>/dev/null

# === UNDA USER MPYA ===
echo "👥 Kuunda user '$DB_USER'..."
su - postgres -c "psql -p $DB_PORT -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';\""
echo "✅ User '$DB_USER' ameundwa."

# === UNDA DATABASE NA OWNER NI USER ===
echo "📦 Kuunda database '$DB_NAME'..."
su - postgres -c "psql -p $DB_PORT -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\""
echo "✅ Database '$DB_NAME' imeundwa."

# === RUHUSA USER KUDHIBITI DATABASE ===
echo "🔐 Kuweka ruhusa kwa '$DB_USER' kwenye '$DB_NAME'..."
su - postgres -c "psql -p $DB_PORT -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""

# === RUHUSA USER KWA SCHEDMA PUBLIC (HII NDIO ILIKOSA) ===
echo "🔓 Kuweka ruhusa kwa schema public..."
su - postgres -c "psql -p $DB_PORT -d $DB_NAME -c \"GRANT ALL ON SCHEMA public TO $DB_USER;\""

# === RUHUSA USER KUUNDA TABLES ===
echo "📝 Kuweka ruhusa ya kuunda tables..."
su - postgres -c "psql -p $DB_PORT -d $DB_NAME -c \"GRANT CREATE ON SCHEMA public TO $DB_USER;\""

# === SET TIMEZONE ===
echo "🌍 Kuweka timezone kuwa Africa/Dar_es_Salaam..."
su - postgres -c "psql -p $DB_PORT -d $DB_NAME -c \"ALTER DATABASE $DB_NAME SET timezone TO 'Africa/Dar_es_Salaam';\""

echo "✅ Mazingira ya database yako tayari!"

# === WARSHA VIRTUALENV ===
echo "⚙️ Kuwasha virtualenv..."
source "$VENV_PATH/bin/activate"

cd "$PROJECT_DIR" || {
    echo "❌ Haikuweza kuingia $PROJECT_DIR"
    exit 1
}

# === MIGRATIONS ===
echo "⚙️ Kuandaa migrations..."
python manage.py makemigrations

echo "📦 Kuapply migrations..."
python manage.py migrate

# === UNDA SUPERUSER ===
echo "👤 Kuunda superuser kwa feevert..."

python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()

username = "feevert_admin"
email = "admin@feevert.co.tz"
password = "feevert123"

try:
    user = User.objects.get(username=username)
    print("ℹ️ User tayari yupo.")
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print("✅ User existing amewekwa password mpya.")
except User.DoesNotExist:
    print("ℹ️ User hayupo. Tunamuunda mpya...")
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    print("✅ Superuser mpya ameundwa.")
EOF

echo ""
echo "========================================="
echo "🎉 DONE: Database ya FEEVERT iko tayari!"
echo "========================================="
echo "📍 Login: http://127.0.0.1:8000/admin"
echo "📧 Username: feevert_admin"
echo "🔑 Password: feevert123"
echo "========================================="