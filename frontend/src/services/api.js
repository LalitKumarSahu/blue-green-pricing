import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true, // Enable cookies for sticky sessions
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for adding custom headers
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to requests
    config.metadata = { startTime: Date.now() };
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Calculate response time
    const responseTime = Date.now() - response.config.metadata.startTime;
    
    // Add response time to response data
    if (response.data) {
      response.data.responseTime = responseTime;
    }
    
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url} (${responseTime}ms)`);
      if (response.data?.data?.routing) {
        console.log(`[API Routing] Version: ${response.data.data.routing.version}, Reason: ${response.data.data.routing.routingReason}`);
      }
    }
    
    return response;
  },
  (error) => {
    const responseTime = error.config ? Date.now() - error.config.metadata.startTime : 0;
    
    console.error('[API Error]', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      responseTime
    });
    
    // Transform error for consistent handling
    const transformedError = {
      message: error.message || 'Network error occurred',
      status: error.response?.status || 0,
      data: error.response?.data || null,
      isNetworkError: !error.response,
      responseTime
    };
    
    return Promise.reject(transformedError);
  }
);

// Generate unique request ID
const generateRequestId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// API Service class
class ApiService {
  
  /**
   * Get pricing data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Pricing data
   */
  async getPricing(options = {}) {
    try {
      const config = {
        ...options
      };
      
      // Add custom headers if provided
      if (options.version) {
        config.headers = {
          ...config.headers,
          'X-Version': options.version
        };
      }
      
      const response = await apiClient.get('/pricing', config);
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
        responseTime: response.data.responseTime
      };
    } catch (error) {
      console.error('Failed to fetch pricing data:', error);
      throw {
        success: false,
        error: error.message || 'Failed to fetch pricing data',
        status: error.status || 500,
        isNetworkError: error.isNetworkError || false
      };
    }
  }
  
  /**
   * Get specific version pricing (for testing)
   * @param {string} version - 'blue' or 'green'
   * @returns {Promise<Object>} Pricing data
   */
  async getSpecificVersion(version) {
    try {
      const response = await apiClient.get(`/pricing/version/${version}`);
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
        responseTime: response.data.responseTime
      };
    } catch (error) {
      console.error(`Failed to fetch ${version} pricing:`, error);
      throw {
        success: false,
        error: error.message || `Failed to fetch ${version} pricing`,
        status: error.status || 500
      };
    }
  }
  
  /**
   * Get API statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getStats() {
    try {
      const response = await apiClient.get('/pricing/stats');
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      throw {
        success: false,
        error: error.message || 'Failed to fetch statistics'
      };
    }
  }
  
  /**
   * Get API health status
   * @returns {Promise<Object>} Health status
   */
  async getHealth() {
    try {
      const response = await apiClient.get('/pricing/health');
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      throw {
        success: false,
        error: error.message || 'Failed to fetch health status',
        status: error.status || 503
      };
    }
  }
  
  /**
   * Reset statistics (admin function)
   * @returns {Promise<Object>} Reset confirmation
   */
  async resetStats() {
    try {
      const response = await apiClient.post('/pricing/reset-stats');
      return {
        success: true,
        message: response.data.message,
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Failed to reset stats:', error);
      throw {
        success: false,
        error: error.message || 'Failed to reset statistics'
      };
    }
  }
  
  /**
   * Test connectivity to API
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const response = await apiClient.get('/', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.warn('API connection test failed:', error.message);
      return false;
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();

export default apiService;