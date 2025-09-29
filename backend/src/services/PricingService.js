import PricingModel from '../models/PricingModel.js';
import RoutingService from './RoutingService.js';

class PricingService {
  constructor() {
    this.pricingModel = new PricingModel();
    this.routingService = new RoutingService();
    this.requestCount = new Map();
    this.versionStats = { blue: 0, green: 0 };
  }

  /**
   * Get pricing data based on routing rules
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Pricing data with metadata
   */
  async getPricing(req, res) {
    try {
      // Determine which version to serve
      const version = this.routingService.determineVersion(req);
      
      // Set sticky session cookie
      this.routingService.setStickySession(res, version);
      
      // Get pricing data
      const pricingData = await this.pricingModel.getPricingData(version);
      
      // Validate data
      if (!this.pricingModel.validatePricingData(pricingData)) {
        throw new Error(`Invalid pricing data for version: ${version}`);
      }
      
      // Update statistics
      this.updateStats(version, req);
      
      // Add routing metadata
      const response = {
        ...pricingData,
        routing: {
          version,
          servedAt: new Date().toISOString(),
          clientId: this.generateClientId(req),
          routingReason: this.getRoutingReason(req, version)
        }
      };
      
      return response;
    } catch (error) {
      console.error('Error in PricingService.getPricing:', error);
      throw error;
    }
  }

  /**
   * Generate a client ID for tracking
   * @param {Object} req 
   * @returns {string}
   */
  generateClientId(req) {
    const ip = this.routingService.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const timestamp = Date.now();
    
    // Create a simple hash for client identification
    const identifier = `${ip}-${userAgent}-${timestamp}`;
    return Buffer.from(identifier).toString('base64').substring(0, 12);
  }

  /**
   * Determine why a specific version was chosen
   * @param {Object} req 
   * @param {string} version 
   * @returns {string}
   */
  getRoutingReason(req, version) {
    const { priority } = this.routingService.routingConfig;
    
    // Check sticky session first
    if (this.routingService.routingConfig.stickySession.enabled) {
      const stickyVersion = this.routingService.checkStickySession(req);
      if (stickyVersion === version) {
        return 'sticky-session';
      }
    }
    
    // Check each rule in priority order
    for (const rule of priority) {
      const ruleConfig = this.routingService.routingConfig[rule];
      if (!ruleConfig || !ruleConfig.enabled) continue;
      
      switch (rule) {
        case 'header':
          const headerValue = req.headers[ruleConfig.headerName.toLowerCase()];
          if ((headerValue === ruleConfig.blueValue && version === 'blue') ||
              (headerValue === ruleConfig.greenValue && version === 'green')) {
            return `header-${ruleConfig.headerName}`;
          }
          break;
          
        case 'cookie':
          const cookieValue = req.cookies[ruleConfig.cookieName];
          if (cookieValue === version) {
            return `cookie-${ruleConfig.cookieName}`;
          }
          break;
          
        case 'ip':
          const clientIp = this.routingService.getClientIp(req);
          if ((ruleConfig.blueIps.includes(clientIp) && version === 'blue') ||
              (ruleConfig.greenIps.includes(clientIp) && version === 'green')) {
            return 'ip-based';
          }
          break;
          
        case 'percentage':
          return 'percentage-split';
      }
    }
    
    return 'default-fallback';
  }

  /**
   * Update service statistics
   * @param {string} version 
   * @param {Object} req 
   */
  updateStats(version, req) {
    // Update version counts
    this.versionStats[version] = (this.versionStats[version] || 0) + 1;
    
    // Update request count by IP
    const clientIp = this.routingService.getClientIp(req);
    this.requestCount.set(clientIp, (this.requestCount.get(clientIp) || 0) + 1);
  }

  /**
   * Get service statistics
   * @returns {Object}
   */
  getStats() {
    const totalRequests = this.versionStats.blue + this.versionStats.green;
    
    return {
      totalRequests,
      versionDistribution: {
        blue: {
          count: this.versionStats.blue,
          percentage: totalRequests > 0 ? ((this.versionStats.blue / totalRequests) * 100).toFixed(2) : 0
        },
        green: {
          count: this.versionStats.green,
          percentage: totalRequests > 0 ? ((this.versionStats.green / totalRequests) * 100).toFixed(2) : 0
        }
      },
      uniqueClients: this.requestCount.size,
      routingConfig: this.routingService.getRoutingStats(),
      cacheStats: this.pricingModel.getCacheStats()
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.versionStats = { blue: 0, green: 0 };
    this.requestCount.clear();
  }

  /**
   * Health check for the service
   * @returns {Object}
   */
  async healthCheck() {
    try {
      // Try to load both versions
      const blueData = await this.pricingModel.getPricingData('blue');
      const greenData = await this.pricingModel.getPricingData('green');
      
      return {
        status: 'healthy',
        versions: {
          blue: {
            available: true,
            plansCount: blueData.plans?.length || 0,
            lastUpdated: blueData.metadata?.lastUpdated
          },
          green: {
            available: true,
            plansCount: greenData.plans?.length || 0,
            lastUpdated: greenData.metadata?.lastUpdated
          }
        },
        routing: this.routingService.getRoutingStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default PricingService;