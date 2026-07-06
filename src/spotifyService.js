// Spotify API Configuration
// Using Authorization Code with PKCE Flow (no client secret needed)
import { SPOTIFY_REDIRECT_URI, SPOTIFY_CLIENT_ID } from './config';

// Use Client ID from config (handles both dev and production)
const CLIENT_ID = SPOTIFY_CLIENT_ID;
if (!CLIENT_ID) {
  console.error('❌ Spotify Client ID is not configured! Check src/config.js');
}

export const SPOTIFY_CONFIG = {
  clientId: CLIENT_ID || '',
  redirectUri: SPOTIFY_REDIRECT_URI,
  scopes: [
    'user-read-playback-state',
    'user-read-currently-playing',
    'user-read-private',
    'user-read-email',
    'streaming',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ')
};

// Generate random string for PKCE
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

// SHA256 hash for PKCE
const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

// Base64 URL encode for PKCE
const base64urlencode = (a) => {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Generate code challenge for PKCE
const generateCodeChallenge = async (codeVerifier) => {
  const hashed = await sha256(codeVerifier);
  return base64urlencode(hashed);
};

// Spotify Auth Service
export const SpotifyAuth = {
  // Initiate login with PKCE (always shows the Spotify dialog so accounts can be switched)
  async login() {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    localStorage.setItem('code_verifier', codeVerifier);
    
    const params = new URLSearchParams({
      client_id: SPOTIFY_CONFIG.clientId,
      response_type: 'code',
      redirect_uri: SPOTIFY_CONFIG.redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: SPOTIFY_CONFIG.scopes,
      show_dialog: 'true' // Always show dialog to allow account switching
    });
    
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  },
  
  // Exchange code for token
  async getToken(code) {
    const codeVerifier = localStorage.getItem('code_verifier');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CONFIG.clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_CONFIG.redirectUri,
        code_verifier: codeVerifier,
      }),
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('token_expiry', Date.now() + (data.expires_in * 1000));
    }
    
    return data;
  },
  
  // Refresh token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) return null;
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CONFIG.clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_expiry', Date.now() + (data.expires_in * 1000));
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    }
    
    return data;
  },
  
  // Get valid access token
  async getValidToken() {
    const expiry = localStorage.getItem('token_expiry');
    const token = localStorage.getItem('access_token');
    
    if (!token) return null;
    
    if (expiry && Date.now() > parseInt(expiry) - 60000) {
      const refreshed = await this.refreshToken();
      return refreshed?.access_token;
    }
    
    return token;
  },
  
  // Logout
  // fullLogout: if true, also redirects to Spotify logout page to clear their session
  logout(fullLogout = false) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('code_verifier');
    
    if (fullLogout) {
      // Clear Spotify's session cookies (so a different account can log in) by
      // hitting their logout endpoint in a hidden iframe, then return to our app.
      // Spotify's /logout does not support a redirect param, so navigating there
      // directly would strand the user on Spotify. The iframe clears the session
      // in the background and we re-initiate login (which uses show_dialog=true).
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = 'https://accounts.spotify.com/logout';
        document.body.appendChild(iframe);
        iframe.onload = () => {
          setTimeout(() => {
            iframe.remove();
            this.login(true);
          }, 600);
        };
        // Fallback in case onload never fires (blocked frame)
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            iframe.remove();
            this.login(true);
          }
        }, 2000);
      } catch {
        // If anything goes wrong, fall back to a normal re-login
        this.login(true);
      }
    }
  },
  
  // Check if logged in
  isLoggedIn() {
    return !!localStorage.getItem('access_token');
  }
};

// Spotify API Service
export const SpotifyAPI = {
  baseUrl: 'https://api.spotify.com/v1',
  
  async request(endpoint, options = {}) {
    const token = await SpotifyAuth.getValidToken();
    
    if (!token) {
      throw new Error('No valid token');
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (response.status === 401) {
      console.warn('⚠️ Session expired. Please log in again.');
      // Dispatch custom event for UI notification
      window.dispatchEvent(new CustomEvent('spotify-auth-error', { 
        detail: { message: 'Your session has expired. Please log in again.' }
      }));
      SpotifyAuth.logout();
      window.location.reload();
      return null;
    }
    
    if (response.status === 403) {
      console.error('❌ Forbidden: Check your Spotify app permissions');
      window.dispatchEvent(new CustomEvent('spotify-api-error', { 
        detail: { message: 'Permission denied. Check your Spotify app settings.' }
      }));
      return null;
    }
    
    if (response.status >= 500) {
      console.error('❌ Spotify server error');
      window.dispatchEvent(new CustomEvent('spotify-api-error', { 
        detail: { message: 'Spotify is experiencing issues. Please try again later.' }
      }));
      return null;
    }
    
    if (response.status === 204) {
      return null;
    }
    
    return response.json();
  },
  
  // Get current user profile
  async getMe() {
    return this.request('/me');
  },
  
  // Get current playback state
  async getPlaybackState() {
    return this.request('/me/player');
  },
  
  // Get user's playback queue (next tracks)
  async getQueue() {
    return this.request('/me/player/queue');
  },
  
  // Get currently playing track
  async getCurrentlyPlaying() {
    return this.request('/me/player/currently-playing');
  },
  
  // Playback controls
  async play() {
    return this.request('/me/player/play', { method: 'PUT' });
  },
  
  async pause() {
    return this.request('/me/player/pause', { method: 'PUT' });
  },
  
  async next() {
    return this.request('/me/player/next', { method: 'POST' });
  },
  
  async previous() {
    return this.request('/me/player/previous', { method: 'POST' });
  },
  
  async seek(positionMs) {
    return this.request(`/me/player/seek?position_ms=${positionMs}`, { method: 'PUT' });
  },
  
  async setVolume(volumePercent) {
    return this.request(`/me/player/volume?volume_percent=${volumePercent}`, { method: 'PUT' });
  },
  
  async setShuffle(state) {
    return this.request(`/me/player/shuffle?state=${state}`, { method: 'PUT' });
  },
  
  async setRepeat(state) {
    // state can be: 'track', 'context', or 'off'
    return this.request(`/me/player/repeat?state=${state}`, { method: 'PUT' });
  },

  // Get the current user's playlists (first 50)
  async getMyPlaylists() {
    return this.request('/me/playlists?limit=50');
  },

  // Start playback of a context (playlist/album/artist URI) on the active device
  async playContext(contextUri) {
    return this.request('/me/player/play', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context_uri: contextUri }),
    });
  }
};
