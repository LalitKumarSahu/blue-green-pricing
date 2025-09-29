import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique request ID
 * @returns {string}
 */
export const generateRequestId = () => {
  return uuidv4();
};

/**
 * Hash a string using MD5
 * @param {string} input 
 * @returns {string}
 */
export const hashString = (input) => {
  return crypto.createHash('md5').update(input).digest('hex');
};

/**
 * Generate a hash number from string (for percentage routing)
 * @param {string} input 
 * @returns {number}
 */
export const hashToNumber = (input) => {
  const hash = hashString(input);
  return parseInt(hash.substring(0, 8), 16);
};

/**
 * Calculate percentage from hash
 * @param {string} input 
 * @returns {number} Percentage (0-99)
 */
export const getPercentageFromHash = (input) => {
  return hashToNumber(input) % 100;
};

/**
 * Sanitize IP address
 * @param {string} ip 
 * @returns {string}
 */
export const sanitizeIp = (ip) => {
  if (!ip) return '0.0.0.0';
  
  // Remove IPv6 prefix if present
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  // Handle localhost variations
  if (ip === '::1') return '127.0.0.1';
  
  return ip;
};

/**
 * Extract client information from request
 * @param {Object} req 
 * @returns {Object}
 */
export const extractClientInfo = (req) => {
  return {
    ip: sanitizeIp(req.ip || req.connection.remoteAddress),
    userAgent: req.headers['user-agent'] || 'unknown',
    acceptLanguage: req.headers['accept-language'] || 'unknown',
    forwardedFor: req.headers['x-forwarded-for'],
    realIp: req.headers['x-real-ip']
  };
};

/**
 * Generate a consistent client fingerprint
 * @param {Object} req 
 * @returns {string}
 */
export const generateClientFingerprint = (req) => {
  const clientInfo = extractClientInfo(req);
  const fingerprint = `${clientInfo.ip}-${clientInfo.userAgent}`;
  return hashString(fingerprint);
};

/**
 * Format response time
 * @param {number} startTime 
 * @returns {string}
 */
export const formatResponseTime = (startTime) => {
  const duration = Date.now() - startTime;
  return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
};

/**
 * Validate version string
 * @param {string} version 
 * @returns {boolean}
 */
export const isValidVersion = (version) => {
  return ['blue', 'green'].includes(version);
};

/**
 * Safe JSON parse
 * @param {string} jsonString 
 * @param {*} fallback 
 * @returns {*}
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error.message);
    return fallback;
  }
};

/**
 * Deep clone object
 * @param {Object} obj 
 * @returns {Object}
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 * @param {Object} obj 
 * @returns {boolean}
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Format bytes to human readable string
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get memory usage information
 * @returns {Object}
 */
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: formatBytes(usage.rss),
    heapTotal: formatBytes(usage.heapTotal),
    heapUsed: formatBytes(usage.heapUsed),
    external: formatBytes(usage.external),
    arrayBuffers: formatBytes(usage.arrayBuffers)
  };
};

/**
 * Create a delay/sleep function
 * @param {number} ms 
 * @returns {Promise}
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn 
 * @param {number} retries 
 * @param {number} delay 
 * @returns {Promise}
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate random string
 * @param {number} length 
 * @returns {string}
 */
export const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};