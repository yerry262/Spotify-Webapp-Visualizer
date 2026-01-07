import React from 'react';
import './UserProfile.css';

const UserProfile = ({ user, onMenuClick, onLogout }) => {
  if (!user) return null;

  const profileImage = user.images?.[0]?.url;
  const displayName = user.display_name || user.id;

  return (
    <div className="user-profile">
      <div className="user-info">
        <div className="user-details">
          {profileImage ? (
            <img src={profileImage} alt={displayName} className="profile-image" />
          ) : (
            <div className="profile-placeholder">
              <span>{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="username">{displayName}</span>
          
          {/* Logout Button */}
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Hamburger Menu Button */}
      <button className="menu-btn" onClick={onMenuClick} title="Open Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

export default UserProfile;
