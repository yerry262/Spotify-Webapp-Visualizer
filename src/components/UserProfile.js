import React from 'react';
import './UserProfile.css';

const UserProfile = ({ user, onMenuClick }) => {
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
      
      <div className="header-decoration">
        <div className="decoration-line"></div>
      </div>
    </div>
  );
};

export default UserProfile;
