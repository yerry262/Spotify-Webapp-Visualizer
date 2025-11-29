FROM node:18-slim

# Install yt-dlp and ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && pip3 install --break-system-packages yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy server files
COPY server/package*.json ./
RUN npm install

COPY server/ ./

# Create directories for MP3s and analysis data
RUN mkdir -p mp3files analysis

# Expose port (Railway will set PORT env var)
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
