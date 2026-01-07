// Configuration for API endpoints
// Automatically switches between development and production

const isDevelopment = import.meta.env.DEV || 
                      (typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1'));

// Backend API URL
// In development: localhost:3001
// In production: Your Railway backend URL (set via environment variable or update here)
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_API_URL || 'https://spotify-webapp-visualizer-production.up.railway.app');

// Spotify redirect URI
// In development: localhost:3000/Spotify-Webapp-Visualizer/callback
// In production: GitHub Pages URL
export const SPOTIFY_REDIRECT_URI = isDevelopment
  ? 'http://127.0.0.1:3000/Spotify-Webapp-Visualizer/callback'
  : 'https://yerry262.github.io/Spotify-Webapp-Visualizer/callback';

// Spotify Client ID
// This is a PUBLIC identifier (not a secret) - safe to include in client-side code
// Using PKCE flow means no client secret is needed
export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '6ada4e42731d48f9ad85fab1764aca89';

export default {
  API_BASE_URL,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_CLIENT_ID,
  isDevelopment
};
