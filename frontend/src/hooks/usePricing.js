import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.js';

const usePricing = (options = {}) => {
  const { autoFetch = true, refreshInterval = null, retryOnError = true, maxRetries = 3 } = options;

  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    version: null,
    retryCount: 0
  });

  const fetchPricing = useCallback(async (specificVersion = null) => {
    console.log('[usePricing] fetchPricing called', { specificVersion });
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('[usePricing] Calling apiService.getPricing...');
      
      const endpoint = specificVersion ? `/pricing/version/${specificVersion}` : '/pricing';
      const result = await apiService.getPricing({ url: endpoint });
      
      console.log('[usePricing] Got result:', result);
      
      setState({
        data: result.data,
        version: result.data.routing.version,
        loading: false,
        error: null,
        retryCount: 0
      });
      
      return result.data;
    } catch (error) {
      console.error('[usePricing] Error:', error);
      
      const shouldRetry = retryOnError && state.retryCount < maxRetries;
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          message: error.error || 'Failed to load pricing data',
          status: error.status,
          isNetworkError: error.isNetworkError || false
        },
        retryCount: prev.retryCount + 1
      }));

      // Auto-retry if enabled
      if (shouldRetry) {
        console.log(`[usePricing] Retrying... (${state.retryCount + 1}/${maxRetries})`);
        setTimeout(() => fetchPricing(specificVersion), 2000 * (state.retryCount + 1));
      }
      
      throw error;
    }
  }, [retryOnError, maxRetries, state.retryCount]);

  const fetchSpecificVersion = useCallback(async (version) => {
    if (!version || !['blue', 'green'].includes(version)) {
      console.error('[usePricing] Invalid version:', version);
      return;
    }
    return fetchPricing(version);
  }, [fetchPricing]);

  const refresh = useCallback(() => {
    console.log('[usePricing] Refreshing data...');
    setState(prev => ({ ...prev, retryCount: 0 }));
    return fetchPricing();
  }, [fetchPricing]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, retryCount: 0 }));
  }, []);

  // Initial fetch
  useEffect(() => {
    console.log('[usePricing] useEffect triggered, autoFetch:', autoFetch);
    if (autoFetch) {
      fetchPricing();
    }
  }, [autoFetch, fetchPricing]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    console.log('[usePricing] Setting up refresh interval:', refreshInterval);
    const intervalId = setInterval(() => {
      console.log('[usePricing] Auto-refreshing...');
      fetchPricing();
    }, refreshInterval);

    return () => {
      console.log('[usePricing] Clearing refresh interval');
      clearInterval(intervalId);
    };
  }, [refreshInterval, fetchPricing]);

  return {
    // Data
    data: state.data,
    plans: state.data?.plans || [],
    version: state.version,
    routing: state.data?.routing,
    metadata: state.data?.metadata,
    
    // State flags
    loading: state.loading,
    error: state.error,
    hasData: !!state.data,
    isBlueVersion: state.version === 'blue',
    isGreenVersion: state.version === 'green',
    
    // Actions
    fetchPricing,
    fetchSpecificVersion,
    refresh,
    clearError
  };
};

export default usePricing;