# POT provider server (proof-of-origin token generator) — copied in below.
# Pinned to an exact version so the server and the pip plugin below stay a
# matched pair (mismatches silently fail and YouTube bot-challenges return).
FROM brainicism/bgutil-ytdlp-pot-provider:1.3.1-node AS pot

FROM node:20-slim

# Install yt-dlp, ffmpeg, and deno (required for yt-dlp YouTube extraction)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    unzip \
    && pip3 install --break-system-packages --upgrade "yt-dlp[default]" \
    && pip3 install --break-system-packages "bgutil-ytdlp-pot-provider==1.3.1" \
    && curl -fsSL https://deno.land/install.sh | sh \
    && ln -s /root/.deno/bin/deno /usr/local/bin/deno \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set deno in PATH for yt-dlp
ENV DENO_INSTALL="/root/.deno"
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

# POT provider HTTP server (auto-detected by the yt-dlp plugin on 127.0.0.1:4416).
# Lets yt-dlp mint proof-of-origin tokens so YouTube stops bot-challenging our
# datacenter IP on downloads — no cookies, no account.
COPY --from=pot /app /opt/bgutil-pot

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

# Start the POT provider in the background, then the app server.
# Provider output is prefixed and sent to stdout so Railway logs capture it —
# it previously went to /tmp and provider crashes were invisible.
# `exec` makes the node app PID 1 so Railway's signals/health checks target it.
CMD ["sh", "-c", "yt-dlp --version; (node /opt/bgutil-pot/build/main.js 2>&1 | sed -u 's/^/[pot] /') & exec node server.js"]
