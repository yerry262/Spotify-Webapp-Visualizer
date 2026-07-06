FROM node:18-slim

# Install yt-dlp, ffmpeg, and deno (required for yt-dlp YouTube extraction)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    unzip \
    && pip3 install --break-system-packages --upgrade "yt-dlp[default]" \
    && curl -fsSL https://deno.land/install.sh | sh \
    && ln -s /root/.deno/bin/deno /usr/local/bin/deno \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set deno in PATH for yt-dlp
ENV DENO_INSTALL="/root/.deno"
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

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
