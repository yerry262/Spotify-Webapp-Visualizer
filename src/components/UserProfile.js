import React from 'react';
import './UserProfile.css';

const UserProfile = ({ user, onLogout }) => {
  if (!user) return null;

  const profileImage = user.images?.[0]?.url;
  const displayName = user.display_name || user.id;

  return (
    <div className="user-profile">
      <div className="user-info">
        <span className="signed-in-label">SIGNED IN AS</span>
        <div className="user-details">
          {profileImage ? (
            <img src={profileImage} alt={displayName} className="profile-image" />
          ) : (
            <div className="profile-placeholder">
              <span>{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="username">{displayName}</span>
        </div>
      </div>
      
      <button className="logout-btn" onClick={onLogout}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
        </svg>
      </button>
      
      <div className="header-decoration">
        <div className="decoration-line"></div>
      </div>
    </div>
  );
};

export default UserProfile;
