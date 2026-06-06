#!/bin/bash
set -e

# Extract the archive
tar -xzvf deploy.tar.gz

# Generate random secrets
DB_PASSWORD=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
REDIS_PASSWORD=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
JWT_ACCESS=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
JWT_REFRESH=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)

# Create .env
cat <<EOF > .env
APP_ENV=production
API_HOST=0.0.0.0
API_PORT=8080

DB_USER=sadaqah
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=sadaqah_prod

REDIS_PASSWORD=${REDIS_PASSWORD}

JWT_ACCESS_SECRET=${JWT_ACCESS}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=sadaqahminio
MINIO_SECRET_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
MINIO_BUCKET=sadaqah-files
MINIO_USE_SSL=false

AI_INTERNAL_API_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
EOF

echo "Environment setup complete!"
