import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import PricingGrid from './components/PricingGrid/PricingGrid';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import usePricing from './hooks/usePricing';
import './App.css';

function App() {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [forceVersion, setForceVersion] = useState(null);
  
  // Use the pricing hook with configuration
  const {
    data: pricingData,
    plans,
    version,
    loading,
    error,
    hasData,
    isBlueVersion,
    isGreenVersion,
    fetchPricing,
    fetchSpecificVersion,
    refresh,
    clearError,
    routing,
    metadata
  } = usePricing({
    autoFetch: true,
    refreshInterval: null, // Set to a value like 30000 for auto-refresh every 30 seconds
    retryOnError: true,
    maxRetries: 3
  });

  // Handle keyboard shortcuts for debugging
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Toggle debug info with Ctrl+D
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        setShowDebugInfo(prev => !prev);
      }
      
      // Force blue version with Ctrl+B
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        handleForceVersion('blue');
      }
      
      // Force green version with Ctrl+G
      if (event.ctrlKey && event.key === 'g') {
        event.preventDefault();
        handleForceVersion('green');
      }
      
      // Refresh data with Ctrl+R
      if (event.ctrlKey && event.key === 'r') {
        event.preventDefault();
        handleRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleForceVersion = async (targetVersion) => {
    try {
      setForceVersion(targetVersion);
      await fetchSpecificVersion(targetVersion);
      console.log(`Forced to ${targetVersion} version`);
    } catch (err) {
      console.error(`Failed to force ${targetVersion} version:`, err);
    }
  };

  const handleRefresh = async () => {
    try {
      setForceVersion(null);
      await refresh();
      console.log('Data refreshed');
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
  };

  const handleSelectPlan = (plan) => {
    console.log('Plan selected:', plan);
    
    // Here you could implement actual plan selection logic
    // For example: redirect to checkout, show a modal, etc.
    
    // For demo purposes, show an alert
    alert(`You selected the ${plan.name} plan for ${plan.price} ${plan.currency}/${plan.billing}!`);
    
    // You could also track this event
    // analytics.track('plan_selected', { 
    //   plan_id: plan.id, 
    //   plan_name: plan.name, 
    //   version: version,
    //   routing_reason: routing?.routingReason 
    // });
  };

  const handleRetry = () => {
    clearError();
    fetchPricing();
  };

  // Loading state
  if (loading && !hasData) {
    return (
      <div className="app">
        <div className="app-loading">
          <LoadingSpinner 
            size="large" 
            color="white" 
            message="Loading pricing plans..."
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !hasData) {
    return (
      <div className="app">
        <div className="app-error">
          <div className="error-content">
            <div className="error-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h2>Unable to Load Pricing</h2>
            <p>{error.message}</p>
            {error.isNetworkError && (
              <p className="error-hint">
                Please check your internet connection and try again.
              </p>
            )}
            <div className="error-actions">
              <button 
                onClick={handleRetry}
                className="retry-button"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app app-${version}`}>
      {/* Header */}
      <Header 
        title={pricingData?.title || 'Pricing Plans'}
        subtitle={pricingData?.subtitle || 'Choose the perfect plan for your needs'}
        version={version}
        showVersionBadge={true}
        showDebugInfo={showDebugInfo}
        routing={routing}
      />

      {/* Main content */}
      <main className="app-main">
        <PricingGrid 
          plans={plans}
          version={version}
          loading={loading}
          onSelectPlan={handleSelectPlan}
          showVersionInfo={showDebugInfo}
        />

        {/* Debug panel */}
        {showDebugInfo && (
          <div className="debug-panel">
            <div className="debug-header">
              <h3>Debug Information</h3>
              <button 
                onClick={() => setShowDebugInfo(false)}
                className="debug-close"
                aria-label="Close debug panel"
              >
                ×
              </button>
            </div>
            
            <div className="debug-content">
              <div className="debug-section">
                <h4>Current State</h4>
                <ul>
                  <li>Version: <code>{version}</code></li>
                  <li>Loading: <code>{loading.toString()}</code></li>
                  <li>Has Data: <code>{hasData.toString()}</code></li>
                  <li>Plans Count: <code>{plans.length}</code></li>
                  <li>Forced Version: <code>{forceVersion || 'none'}</code></li>
                </ul>
              </div>
              
              {routing && (
                <div className="debug-section">
                  <h4>Routing Info</h4>
                  <ul>
                    <li>Reason: <code>{routing.routingReason}</code></li>
                    <li>Client ID: <code>{routing.clientId}</code></li>
                    <li>Served At: <code>{new Date(routing.servedAt).toLocaleTimeString()}</code></li>
                  </ul>
                </div>
              )}
              
              {metadata && (
                <div className="debug-section">
                  <h4>Metadata</h4>
                  <ul>
                    <li>Last Updated: <code>{metadata.lastUpdated}</code></li>
                    <li>Region: <code>{metadata.region}</code></li>
                    <li>Currency: <code>{metadata.currency}</code></li>
                  </ul>
                </div>
              )}
              
              <div className="debug-actions">
                <button 
                  onClick={() => handleForceVersion('blue')}
                  className="debug-button blue"
                  disabled={loading}
                >
                  Force Blue
                </button>
                <button 
                  onClick={() => handleForceVersion('green')}
                  className="debug-button green"
                  disabled={loading}
                >
                  Force Green
                </button>
                <button 
                  onClick={handleRefresh}
                  className="debug-button refresh"
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="debug-footer">
              <p>Keyboard shortcuts: Ctrl+D (toggle), Ctrl+B (blue), Ctrl+G (green), Ctrl+R (refresh)</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; 2024 Blue-Green Pricing Demo. Built with React and Express.</p>
          {!showDebugInfo && (
            <button 
              onClick={() => setShowDebugInfo(true)}
              className="debug-toggle"
              title="Show debug info (Ctrl+D)"
            >
              Debug
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;