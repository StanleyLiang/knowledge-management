#!/bin/bash
set -e

# Export all infrastructure Docker images for air-gapped deployment
# Usage: ./scripts/export-images.sh [output-dir]

OUTPUT_DIR="${1:-./docker-images}"
mkdir -p "$OUTPUT_DIR"

IMAGES=(
  "postgres:16-alpine"
  "minio/minio:latest"
  "minio/mc:latest"
  "nats:2-alpine"
)

echo "Pulling images..."
for img in "${IMAGES[@]}"; do
  echo "  Pulling $img"
  docker pull "$img"
done

echo ""
echo "Saving images to $OUTPUT_DIR..."
for img in "${IMAGES[@]}"; do
  filename=$(echo "$img" | tr '/:' '_').tar
  echo "  Saving $img → $filename"
  docker save "$img" -o "$OUTPUT_DIR/$filename"
done

echo ""
echo "Copying config files..."
cp docker-compose.yml "$OUTPUT_DIR/"
cp -r infra "$OUTPUT_DIR/"

echo ""
echo "Done! Files in $OUTPUT_DIR:"
ls -lh "$OUTPUT_DIR"
echo ""
echo "Transfer the $OUTPUT_DIR directory to the air-gapped environment,"
echo "then run: ./import-images.sh"
