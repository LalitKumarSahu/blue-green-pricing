import PricingService from '../services/PricingService.js';

class PricingController {
  constructor() {
    this.pricingService = new PricingService();
  }

  /**
   * Handle GET /pricing requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPricing(req, res) {
    try {
      const startTime = Date.now();
      
      // Get pricing data through the service
      const pricingData = await this.pricingService.getPricing(req, res);
      
      const responseTime = Date.now() - startTime;
      
      // Log the request
      console.log(`[PRICING] Version: ${pricingData.routing.version}, ` +
                 `Client: ${pricingData.routing.clientId}, ` +
                 `Reason: ${pricingData.routing.routingReason}, ` +
                 `Response Time: ${responseTime}ms`);
      
      res.status(200).json({
        success: true,
        data: pricingData,
        meta: {
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('[PRICING_ERROR]', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve pricing data',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Handle GET /pricing/stats requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStats(req, res) {
    try {
      const stats = this.pricingService.getStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('[STATS_ERROR]', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve statistics'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Handle GET /pricing/health requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHealth(req, res) {
    try {
      const health = await this.pricingService.healthCheck();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('[HEALTH_ERROR]', error);
      
      res.status(503).json({
        success: false,
        error: {
          message: 'Health check failed',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Handle POST /pricing/reset-stats requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resetStats(req, res) {
    try {
      this.pricingService.resetStats();
      
      console.log('[PRICING] Statistics reset');
      
      res.status(200).json({
        success: true,
        message: 'Statistics reset successfully',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('[RESET_STATS_ERROR]', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to reset statistics'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Handle requests to force a specific version (for testing)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSpecificVersion(req, res) {
    try {
      const { version } = req.params;
      
      if (!['blue', 'green'].includes(version)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid version. Must be "blue" or "green"'
          }
        });
      }

      const startTime = Date.now();
      
      // Temporarily override the routing to force specific version
      const originalDetermineVersion = this.pricingService.routingService.determineVersion;
      this.pricingService.routingService.determineVersion = () => version;
      
      const pricingData = await this.pricingService.getPricing(req, res);
      
      // Restore original routing function
      this.pricingService.routingService.determineVersion = originalDetermineVersion;
      
      const responseTime = Date.now() - startTime;
      
      console.log(`[PRICING_FORCED] Version: ${version}, Response Time: ${responseTime}ms`);
      
      res.status(200).json({
        success: true,
        data: pricingData,
        meta: {
          responseTime,
          timestamp: new Date().toISOString(),
          forced: true
        }
      });
      
    } catch (error) {
      console.error('[PRICING_FORCED_ERROR]', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve specific version',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }
}

export default PricingController;