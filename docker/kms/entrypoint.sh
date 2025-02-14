#!/bin/bash

# Wait for database to be ready using environment variables
until PGPASSWORD="${KMS_DB_PASSWORD}" psql -h "kms-db" -U "${KMS_DB_USER}" -d "${KMS_DB_NAME}" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"

# Start the FastAPI application with the correct module path
exec uvicorn src.main:app --host 0.0.0.0 --port 5001 --reload