import React from 'react';
import PricingCard from '../PricingCard/PricingCard';
import './PricingGrid.css';

const PricingGrid = ({ 
  plans = [], 
  version = 'blue', 
  loading = false,
  onSelectPlan,
  showVersionInfo = false
}) => {
  
  if (loading) {
    return (
      <div className="pricing-grid-container">
        <div className="pricing-grid-loading">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="pricing-card-skeleton">
              <div className="skeleton-header">
                <div className="skeleton-title"></div>
                <div className="skeleton-price"></div>
                <div className="skeleton-description"></div>
              </div>
              <div className="skeleton-body">
                {[...Array(5)].map((_, featureIndex) => (
                  <div key={featureIndex} className="skeleton-feature"></div>
                ))}
              </div>
              <div className="skeleton-footer">
                <div className="skeleton-button"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="pricing-grid-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h3>No pricing plans available</h3>
          <p>Please check back later or contact support.</p>
        </div>
      </div>
    );
  }

  const handleSelectPlan = (plan) => {
    console.log(`Plan selected: ${plan.name}`, plan);
    
    // Call parent handler if provided
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
    
    // Here you could add analytics tracking, show a modal, etc.
    // Example: track('plan_selected', { plan_id: plan.id, version });
  };

  return (
    <div className="pricing-grid-container">
      {showVersionInfo && (
        <div className={`version-info version-info-${version}`}>
          <div className="version-info-content">
            <span className="version-label">Current Version:</span>
            <span className="version-value">{version.toUpperCase()}</span>
          </div>
        </div>
      )}
      
      <div className={`pricing-grid grid-${plans.length}-cols`}>
        {plans.map((plan, index) => (
          <PricingCard
            key={plan.id || index}
            plan={plan}
            isPopular={plan.popular}
            version={version}
            onSelectPlan={handleSelectPlan}
          />
        ))}
      </div>
      
      {plans.length > 0 && (
        <div className="pricing-grid-footer">
          <div className="guarantee-section">
            <div className="guarantee-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white"/>
              </svg>
            </div>
            <div className="guarantee-text">
              <h4>30-Day Money Back Guarantee</h4>
              <p>Try any plan risk-free. If you're not satisfied, get a full refund within 30 days.</p>
            </div>
          </div>
          
          <div className="trust-indicators">
            <div className="trust-item">
              <span className="trust-icon">🔒</span>
              <span>Secure Payment</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">⚡</span>
              <span>Instant Activation</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">📞</span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingGrid;