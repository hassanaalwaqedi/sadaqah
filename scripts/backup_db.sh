#!/bin/bash

# ==============================================================================
# Sadaqah Platform - Database Backup Script
# ==============================================================================
# This script dumps the PostgreSQL database from the running Docker container,
# compresses it, and uploads it to AWS S3 for secure off-site storage.
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

# --- Configuration ---
# Read environment variables from the production .env file if available
if [ -f "/home/ubuntu/backend/.env" ]; then
    export $(grep -v '^#' /home/ubuntu/backend/.env | xargs)
fi

DB_CONTAINER_NAME="sadaqah-postgres"
DB_USER=${DB_USER:-"sadaqah"}
DB_NAME=${DB_NAME:-"sadaqah"}
S3_BUCKET=${BACKUP_S3_BUCKET:-"sadaqah-db-backups"}

# Date format for the backup file (e.g., 20260606_043000)
DATE_SUFFIX=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="${DB_NAME}_backup_${DATE_SUFFIX}.sql.gz"
LOCAL_BACKUP_DIR="/tmp/sadaqah_backups"

# --- Initialization ---
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting Sadaqah Database Backup..."

# Create local backup directory if it doesn't exist
mkdir -p "$LOCAL_BACKUP_DIR"
cd "$LOCAL_BACKUP_DIR"

# --- Database Dump ---
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Dumping database from container '$DB_CONTAINER_NAME'..."

# Execute pg_dump inside the container and pipe to gzip
# Using -U specifies the user, -d specifies the database
docker exec "$DB_CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" -F p | gzip > "$BACKUP_FILENAME"

# Check if dump was successful and file is not empty
if [ ! -s "$BACKUP_FILENAME" ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Backup file is empty or failed to create."
    rm -f "$BACKUP_FILENAME"
    exit 1
fi

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup successfully created: $BACKUP_FILENAME ($(du -h $BACKUP_FILENAME | cut -f1))"

# --- AWS S3 Upload ---
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Uploading backup to S3 bucket 's3://${S3_BUCKET}/'..."

# Ensure AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: AWS CLI is not installed. Cannot upload to S3."
    echo "Please run: sudo apt install awscli"
    exit 1
fi

# Upload the file
aws s3 cp "$BACKUP_FILENAME" "s3://${S3_BUCKET}/${BACKUP_FILENAME}" --quiet

if [ $? -eq 0 ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Upload successful!"
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Failed to upload to S3."
    exit 1
fi

# --- Cleanup ---
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Cleaning up local backup file..."
rm -f "$BACKUP_FILENAME"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup process completed successfully!"
exit 0
