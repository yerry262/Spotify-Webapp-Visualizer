import React, { useEffect, useState, useCallback } from 'react';
import { SpotifyAPI } from '../spotifyService';
import './PlaylistPicker.css';

const PlaylistPicker = ({ isOpen, onClose, onPlaylistStarted }) => {
  const [playlists, setPlaylists] = useState(null);
  const [error, setError] = useState(null);
  const [startingId, setStartingId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError(null);
    SpotifyAPI.getMyPlaylists()
      .then((data) => {
        if (cancelled) return;
        if (data?.items) {
          setPlaylists(data.items.filter(Boolean));
        } else {
          setError('Could not load playlists');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load playlists');
      });
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handlePlay = useCallback(async (playlist) => {
    setStartingId(playlist.id);
    setError(null);
    try {
      const result = await SpotifyAPI.playContext(playlist.uri);
      if (result?.error) {
        setError(`Couldn't start "${playlist.name}" — is a Spotify device active?`);
      } else {
        onPlaylistStarted?.(playlist);
        onClose();
      }
    } catch {
      setError(`Couldn't start "${playlist.name}" — is a Spotify device active?`);
    } finally {
      setStartingId(null);
    }
  }, [onClose, onPlaylistStarted]);

  if (!isOpen) return null;

  return (
    <div className="playlist-picker-overlay" onClick={onClose}>
      <div className="playlist-picker" onClick={(e) => e.stopPropagation()}>
        <div className="playlist-picker-header">
          <h2>Play from a playlist</h2>
          <button className="playlist-picker-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && <div className="playlist-picker-error">{error}</div>}

        {!playlists && !error && (
          <div className="playlist-picker-loading">
            <div className="playlist-picker-spinner" />
            Loading playlists…
          </div>
        )}

        {playlists && playlists.length === 0 && (
          <div className="playlist-picker-loading">No playlists found</div>
        )}

        {playlists && playlists.length > 0 && (
          <div className="playlist-picker-grid">
            {playlists.map((p) => (
              <button
                key={p.id}
                className={`playlist-card ${startingId === p.id ? 'starting' : ''}`}
                onClick={() => handlePlay(p)}
                disabled={startingId !== null}
              >
                {p.images?.[0]?.url ? (
                  <img src={p.images[0].url} alt="" className="playlist-card-art" loading="lazy" />
                ) : (
                  <div className="playlist-card-art placeholder">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
                    </svg>
                  </div>
                )}
                <div className="playlist-card-play">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <span className="playlist-card-name">{p.name}</span>
                <span className="playlist-card-count">{p.tracks?.total ?? 0} tracks</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistPicker;
