// Spotify API Configuration
// Using Authorization Code with PKCE Flow (no client secret needed)
import { SPOTIFY_REDIRECT_URI } from './config';

export const SPOTIFY_CONFIG = {
  clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID || '6ada4e42731d48f9ad85fab1764aca89',
  redirectUri: SPOTIFY_REDIRECT_URI,
  scopes: [
    'user-read-playback-state',
    'user-read-currently-playing',
    'user-read-private',
    'user-read-email',
    'streaming',
    'user-modify-playback-state'
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
  // Initiate login with PKCE
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
      scope: SPOTIFY_CONFIG.scopes
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
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('code_verifier');
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
      SpotifyAuth.logout();
      window.location.reload();
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
  }
};
