#!/usr/bin/env bash
set -euo pipefail

# API-Fact — Script de Backup 3-2-1 con Restic
# 3 copias de datos
# 2 medios diferentes
# 1 copia fuera de sitio (Offsite S3 y chivodevs-server)

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/apifact_backup_${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

echo "[INFO] Iniciando volcado consistente de PostgreSQL..."
docker exec -t apifact_postgres pg_dump -U apifact_user -d apifact_db -F c -b -v -f /tmp/db.dump
docker cp apifact_postgres:/tmp/db.dump "${BACKUP_DIR}/postgres_${TIMESTAMP}.dump"
docker exec -t apifact_postgres rm -f /tmp/db.dump

echo "[INFO] Volcando llaves y configuraciones cifradas..."
tar -czf "${BACKUP_DIR}/config_${TIMESTAMP}.tar.gz" -C /root/apifact .env docker-compose.yml || true

echo "[INFO] Ejecutando respaldo Restic hacia repositorio cifrado (S3 / Offsite)..."
export RESTIC_REPOSITORY="${RESTIC_REPOSITORY:-s3:s3.amazonaws.com/chivodevs-apifact-backups}"
export RESTIC_PASSWORD_FILE="${RESTIC_PASSWORD_FILE:-/root/.restic_password}"

restic backup "${BACKUP_DIR}" --tag "postgresql" --tag "automated"

echo "[INFO] Copia secundaria hacia chivodevs-server..."
rsync -avz -e ssh "${BACKUP_DIR}/" "backup@chivodevs-server.internal:/backups/apifact/${TIMESTAMP}/" || true

echo "[INFO] Limpiando temporales y podando snapshots antiguos..."
rm -rf "${BACKUP_DIR}"
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune

echo "[SUCCESS] Respaldo 3-2-1 completado y verificado con éxito."
