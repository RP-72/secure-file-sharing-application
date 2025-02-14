FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app/backend

COPY backend/requirements /app/backend/requirements/
RUN pip install --no-cache-dir -r requirements/dev.txt

COPY backend /app/backend/

# Add entrypoint script
COPY docker/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create migrations directories if they don't exist
RUN mkdir -p /app/backend/apps/authentication/migrations \
    && mkdir -p /app/backend/apps/files/migrations \
    && mkdir -p /app/backend/apps/sharing/migrations

RUN touch /app/backend/apps/authentication/migrations/__init__.py \
    && touch /app/backend/apps/files/migrations/__init__.py \
    && touch /app/backend/apps/sharing/migrations/__init__.py

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"] 