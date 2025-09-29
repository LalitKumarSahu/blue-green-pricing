import React from 'react';
import './Header.css';

const Header = ({ 
  title, 
  subtitle, 
  version, 
  showVersionBadge = true,
  showDebugInfo = false,
  routing = null 
}) => {
  const getVersionBadgeColor = (ver) => {
    return ver === 'blue' ? 'version-badge-blue' : 'version-badge-green';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <header className="pricing-header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-main">
            <h1 className="header-title">{title}</h1>
            {subtitle && (
              <p className="header-subtitle">{subtitle}</p>
            )}
          </div>
          
          {showVersionBadge && version && (
            <div className="header-meta">
              <div className={`version-badge ${getVersionBadgeColor(version)}`}>
                <span className="version-label">Version</span>
                <span className="version-value">{version.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>
        
        {showDebugInfo && routing && (
          <div className="debug-info">
            <div className="debug-section">
              <h3>Routing Information</h3>
              <div className="debug-grid">
                <div className="debug-item">
                  <span className="debug-label">Version:</span>
                  <span className="debug-value">{routing.version}</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Reason:</span>
                  <span className="debug-value">{routing.routingReason}</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Client ID:</span>
                  <span className="debug-value">{routing.clientId}</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Served At:</span>
                  <span className="debug-value">{formatTimestamp(routing.servedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="header-decoration">
          <div className="decoration-circle decoration-1"></div>
          <div className="decoration-circle decoration-2"></div>
          <div className="decoration-circle decoration-3"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;