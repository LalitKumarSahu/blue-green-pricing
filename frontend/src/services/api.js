import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log('[API Config] Base URL:', API_BASE_URL);

const REQUEST_TIMEOUT = 10000;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    config.headers['X-Request-ID'] = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('[API Request] Headers:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    const responseTime = Date.now() - response.config.metadata.startTime;
    console.log(`[API Response] ${response.status} ${response.config.url} (${responseTime}ms)`);
    
    if (response.data?.data?.routing) {
      console.log(`[API Routing] Version: ${response.data.data.routing.version}, Reason: ${response.data.data.routing.routingReason}`);
    }
    
    return response;
  },
  (error) => {
    const responseTime = error.config ? Date.now() - error.config.metadata.startTime : 0;
    
    console.error('[API Error]', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      responseTime: responseTime + 'ms'
    });
    
    // Log response data if available
    if (error.response?.data) {
      console.error('[API Error Response]', error.response.data);
    }
    
    const transformedError = {
      message: error.response?.data?.message || error.message || 'Network error occurred',
      status: error.response?.status || 0,
      data: error.response?.data || null,
      isNetworkError: !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK',
      responseTime
    };
    
    return Promise.reject(transformedError);
  }
);

class ApiService {
  /**
   * Get pricing data
   * @param {Object} options - Request options
   * @param {string} options.url - Optional custom URL path (default: '/pricing')
   * @returns {Promise<Object>} Pricing data with metadata
   */
  async getPricing(options = {}) {
    const { url = '/pricing', ...restOptions } = options;
    
    try {
      console.log('[getPricing] Starting request to:', url);
      const response = await apiClient.get(url, restOptions);
      console.log('[getPricing] Success:', response.data);
      
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta
      };
    } catch (error) {
      console.error('[getPricing] Failed:', error);
      throw {
        success: false,
        error: error.message || 'Failed to fetch pricing data',
        status: error.status || 500,
        isNetworkError: error.isNetworkError || false
      };
    }
  }

  /**
   * Get specific version pricing
   * @param {string} version - 'blue' or 'green'
   * @returns {Promise<Object>} Pricing data for specific version
   */
  async getVersionPricing(version) {
    if (!version || !['blue', 'green'].includes(version)) {
      throw {
        success: false,
        error: 'Invalid version. Must be "blue" or "green"',
        status: 400
      };
    }
    
    return this.getPricing({ url: `/pricing/version/${version}` });
  }

  /**
   * Get routing statistics
   * @returns {Promise<Object>} Routing statistics
   */
  async getStats() {
    try {
      console.log('[getStats] Fetching statistics...');
      const response = await apiClient.get('/pricing/stats');
      console.log('[getStats] Success:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('[getStats] Failed:', error);
      throw {
        success: false,
        error: error.message || 'Failed to fetch statistics',
        status: error.status || 500,
        isNetworkError: error.isNetworkError || false
      };
    }
  }

  /**
   * Get health status
   * @returns {Promise<Object>} Health status
   */
  async getHealth() {
    try {
      console.log('[getHealth] Checking health...');
      const response = await apiClient.get('/pricing/health');
      console.log('[getHealth] Success:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[getHealth] Failed:', error);
      throw {
        success: false,
        error: error.message || 'Failed to check health',
        status: error.status || 500,
        isNetworkError: error.isNetworkError || false
      };
    }
  }

  /**
   * Reset routing statistics (admin only)
   * @returns {Promise<Object>} Reset confirmation
   */
  async resetStats() {
    try {
      console.log('[resetStats] Resetting statistics...');
      const response = await apiClient.post('/pricing/reset-stats');
      console.log('[resetStats] Success:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[resetStats] Failed:', error);
      throw {
        success: false,
        error: error.message || 'Failed to reset statistics',
        status: error.status || 500,
        isNetworkError: error.isNetworkError || false
      };
    }
  }
}

const apiService = new ApiService();
export default apiService;