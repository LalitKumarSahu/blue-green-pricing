import React from 'react';
import './PricingCard.css';

const PricingCard = ({ 
  plan, 
  isPopular = false, 
  version = 'blue',
  onSelectPlan 
}) => {
  const {
    id,
    name,
    price,
    currency = 'USD',
    billing = 'monthly',
    description,
    features = [],
    buttonText = 'Get Started',
    color = 'blue'
  } = plan;

  const handleSelectPlan = () => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else {
      // Default action - could be modified to handle actual purchases
      console.log(`Selected plan: ${name}`);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  };

  const getCardColorClass = () => {
    const colorMap = {
      blue: 'card-blue',
      purple: 'card-purple', 
      emerald: 'card-emerald',
      green: 'card-green',
      gold: 'card-gold'
    };
    return colorMap[color] || 'card-blue';
  };

  const getButtonColorClass = () => {
    const buttonColorMap = {
      blue: 'btn-blue',
      purple: 'btn-purple',
      emerald: 'btn-emerald', 
      green: 'btn-green',
      gold: 'btn-gold'
    };
    return buttonColorMap[color] || 'btn-blue';
  };

  return (
    <div className={`pricing-card ${getCardColorClass()} ${isPopular ? 'popular' : ''}`}>
      {isPopular && (
        <div className="popular-badge">
          <span>Most Popular</span>
        </div>
      )}
      
      <div className="card-header">
        <h3 className="plan-name">{name}</h3>
        <div className="price-section">
          <span className="price">{formatPrice(price)}</span>
          <span className="billing-period">/{billing}</span>
        </div>
        {description && (
          <p className="plan-description">{description}</p>
        )}
      </div>

      <div className="card-body">
        <ul className="features-list">
          {features.map((feature, index) => (
            <li key={index} className="feature-item">
              <svg 
                className="check-icon" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-footer">
        <button 
          className={`select-button ${getButtonColorClass()}`}
          onClick={handleSelectPlan}
          aria-label={`Select ${name} plan`}
        >
          {buttonText}
          <svg 
            className="button-arrow" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      </div>

      {/* Version indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="version-indicator">
          <span className={`version-dot version-${version}`}></span>
        </div>
      )}
    </div>
  );
};

export default PricingCard;