#!/bin/bash
set -e

# Import Docker images in air-gapped environment
# Usage: ./scripts/import-images.sh [images-dir]

IMAGES_DIR="${1:-.}"

echo "Loading Docker images from $IMAGES_DIR..."
for tarfile in "$IMAGES_DIR"/*.tar; do
  [ -f "$tarfile" ] || continue
  echo "  Loading $(basename "$tarfile")"
  docker load -i "$tarfile"
done

echo ""
echo "Images loaded. Start services with:"
echo "  docker compose up -d"
echo ""
echo "Then run database migrations:"
echo "  cd apps/api && npx prisma migrate deploy"
echo "  cd apps/api && npx prisma db seed"
