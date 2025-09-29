import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.js';

/**
 * Custom hook for managing pricing data
 * @param {Object} options - Hook options
 * @returns {Object} Hook state and methods
 */
const usePricing = (options = {}) => {
  const {
    autoFetch = true,
    refreshInterval = null,
    retryOnError = true,
    maxRetries = 3
  } = options;

  // State management
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    version: null,
    lastFetch: null,
    retryCount: 0
  });

  // Fetch pricing data
  const fetchPricing = useCallback(async (forceRefresh = false) => {
    if (state.loading && !forceRefresh) return;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const result = await apiService.getPricing();
      
      setState(prev => ({
        ...prev,
        data: result.data,
        version: result.data.routing.version,
        loading: false,
        error: null,
        lastFetch: new Date(),
        retryCount: 0
      }));

      return result.data;
    } catch (error) {
      console.error('Error fetching pricing:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          message: error.error || 'Failed to load pricing data',
          status: error.status,
          isNetworkError: error.isNetworkError,
          timestamp: new Date()
        },
        retryCount: prev.retryCount + 1
      }));

      // Auto-retry on network errors
      if (retryOnError && 
          error.isNetworkError && 
          state.retryCount < maxRetries) {
        console.log(`Retrying in 2 seconds... (${state.retryCount + 1}/${maxRetries})`);
        setTimeout(() => fetchPricing(true), 2000);
      }

      throw error;
    }
  }, [state.loading, state.retryCount, retryOnError, maxRetries]);

  // Fetch specific version for testing
  const fetchSpecificVersion = useCallback(async (version) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const result = await apiService.getSpecificVersion(version);
      
      setState(prev => ({
        ...prev,
        data: result.data,
        version: result.data.routing.version,
        loading: false,
        error: null,
        lastFetch: new Date()
      }));

      return result.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          message: error.error || `Failed to load ${version} pricing`,
          status: error.status,
          timestamp: new Date()
        }
      }));
      throw error;
    }
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    return fetchPricing(true);
  }, [fetchPricing]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: true,
      error: null,
      version: null,
      lastFetch: null,
      retryCount: 0
    });
  }, []);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchPricing();
    }
  }, [autoFetch]); // Only run on mount or when autoFetch changes

  // Set up refresh interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (!state.loading) {
        fetchPricing(true);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, state.loading, fetchPricing]);

  // Derived state
  const isBlueVersion = state.version === 'blue';
  const isGreenVersion = state.version === 'green';
  const hasData = !!state.data;
  const canRetry = state.error && state.retryCount < maxRetries;

  return {
    // Data
    data: state.data,
    plans: state.data?.plans || [],
    version: state.version,
    
    // Status
    loading: state.loading,
    error: state.error,
    hasData,
    isBlueVersion,
    isGreenVersion,
    
    // Metadata
    lastFetch: state.lastFetch,
    retryCount: state.retryCount,
    canRetry,
    
    // Methods
    fetchPricing,
    fetchSpecificVersion,
    refresh,
    clearError,
    reset,
    
    // Routing info
    routing: state.data?.routing,
    metadata: state.data?.metadata
  };
};

export default usePricing;