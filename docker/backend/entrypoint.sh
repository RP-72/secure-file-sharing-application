#!/bin/bash

# Optionally wait a few seconds (if needed)
sleep 2

# Remove the existing SQLite database (if you want a fresh start)
rm -f /app/backend/db.sqlite3

# Apply the existing, version-controlled migrations
python /app/backend/manage.py migrate --noinput

# Start server
python /app/backend/manage.py runserver 0.0.0.0:8000 