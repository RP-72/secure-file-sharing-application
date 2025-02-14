FROM python:3.11-slim

WORKDIR /app/kms

# Install system dependencies including PostgreSQL development files
RUN apt-get update && apt-get install -y \
    postgresql-client \
    postgresql-server-dev-all \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY kms/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the KMS application code
COPY kms/src /app/kms/src

# Create directory for SQLite database (if using SQLite)
RUN mkdir -p /data

# Add entrypoint script
COPY docker/kms/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5001

ENTRYPOINT ["/entrypoint.sh"]