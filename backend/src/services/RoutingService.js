import crypto from 'crypto';
import config from '../config/index.js';

class RoutingService {
  constructor() {
    this.routingConfig = config.routing;
  }

  /**
   * Determine which version (blue/green) to serve based on routing rules
   * @param {Object} req - Express request object
   * @returns {string} 'blue' or 'green'
   */
  determineVersion(req) {
    const { priority } = this.routingConfig;
    
    // Check sticky session first
    if (this.routingConfig.stickySession.enabled) {
      const stickyVersion = this.checkStickySession(req);
      if (stickyVersion) {
        return stickyVersion;
      }
    }

    // Apply routing rules based on priority
    for (const rule of priority) {
      const version = this.applyRule(rule, req);
      if (version) {
        return version;
      }
    }

    // Default fallback
    return 'blue';
  }

  /**
   * Check for existing sticky session
   * @param {Object} req 
   * @returns {string|null}
   */
  checkStickySession(req) {
    const { cookieName } = this.routingConfig.stickySession;
    const sessionVersion = req.cookies[cookieName];
    
    if (sessionVersion && ['blue', 'green'].includes(sessionVersion)) {
      return sessionVersion;
    }
    
    return null;
  }

  /**
   * Apply a specific routing rule
   * @param {string} ruleName 
   * @param {Object} req 
   * @returns {string|null}
   */
  applyRule(ruleName, req) {
    const ruleConfig = this.routingConfig[ruleName];
    
    if (!ruleConfig || !ruleConfig.enabled) {
      return null;
    }

    switch (ruleName) {
      case 'header':
        return this.applyHeaderRouting(req, ruleConfig);
      case 'cookie':
        return this.applyCookieRouting(req, ruleConfig);
      case 'ip':
        return this.applyIpRouting(req, ruleConfig);
      case 'percentage':
        return this.applyPercentageRouting(req, ruleConfig);
      default:
        console.warn(`Unknown routing rule: ${ruleName}`);
        return null;
    }
  }

  /**
   * Apply header-based routing
   * @param {Object} req 
   * @param {Object} config 
   * @returns {string|null}
   */
  applyHeaderRouting(req, config) {
    const headerValue = req.headers[config.headerName.toLowerCase()];
    
    if (headerValue === config.blueValue) {
      return 'blue';
    } else if (headerValue === config.greenValue) {
      return 'green';
    }
    
    return null;
  }

  /**
   * Apply cookie-based routing
   * @param {Object} req 
   * @param {Object} config 
   * @returns {string|null}
   */
  applyCookieRouting(req, config) {
    const cookieValue = req.cookies[config.cookieName];
    
    if (cookieValue && ['blue', 'green'].includes(cookieValue)) {
      return cookieValue;
    }
    
    return null;
  }

  /**
   * Apply IP-based routing
   * @param {Object} req 
   * @param {Object} config 
   * @returns {string|null}
   */
  applyIpRouting(req, config) {
    const clientIp = this.getClientIp(req);
    
    if (config.blueIps.includes(clientIp)) {
      return 'blue';
    } else if (config.greenIps.includes(clientIp)) {
      return 'green';
    }
    
    return null;
  }

  /**
   * Apply percentage-based routing
   * @param {Object} req 
   * @param {Object} config 
   * @returns {string}
   */
  applyPercentageRouting(req, config) {
    // Use a combination of IP and User-Agent for consistent routing
    const identifier = this.getClientIdentifier(req);
    const hash = this.hashString(identifier);
    const percentage = hash % 100;
    
    return percentage < config.blue ? 'blue' : 'green';
  }

  /**
   * Get client IP address
   * @param {Object} req 
   * @returns {string}
   */
  getClientIp(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           '127.0.0.1';
  }

  /**
   * Generate a consistent identifier for the client
   * @param {Object} req 
   * @returns {string}
   */
  getClientIdentifier(req) {
    const ip = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    return `${ip}-${userAgent}`;
  }

  /**
   * Hash a string to a number for consistent percentage routing
   * @param {string} str 
   * @returns {number}
   */
  hashString(str) {
    const hash = crypto.createHash('md5').update(str).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Set sticky session cookie
   * @param {Object} res 
   * @param {string} version 
   */
  setStickySession(res, version) {
    if (!this.routingConfig.stickySession.enabled) {
      return;
    }

    const { cookieName } = this.routingConfig.stickySession;
    const maxAge = this.routingConfig.cookie.maxAge || 86400000; // 24 hours default
    
    res.cookie(cookieName, version, {
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }

  /**
   * Get routing statistics
   * @returns {Object}
   */
  getRoutingStats() {
    return {
      enabledRules: Object.keys(this.routingConfig)
        .filter(key => this.routingConfig[key]?.enabled),
      priority: this.routingConfig.priority,
      percentageSplit: {
        blue: this.routingConfig.percentage.blue,
        green: this.routingConfig.percentage.green
      }
    };
  }
}

export default RoutingService;