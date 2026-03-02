#!/bin/sh
set -e
echo "Running migrations..."
node -r dotenv/config node_modules/typeorm/cli.js migration:run -d dist/infrastructure/database/data-source.js
echo "Starting API..."
exec node dist/main.js
