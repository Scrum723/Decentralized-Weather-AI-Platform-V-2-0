# Use Python 3.9 slim image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY vercel-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY vercel-backend/ ./vercel-backend/
COPY . .

# Create a simple startup script
RUN echo '#!/bin/bash\nuvicorn vercel-backend.api.index:app --host 0.0.0.0 --port ${PORT:-8000}' > start.sh
RUN chmod +x start.sh

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start the application
CMD ["./start.sh"]