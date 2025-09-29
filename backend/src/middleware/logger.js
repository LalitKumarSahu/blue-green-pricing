import morgan from 'morgan';
import config from '../config/index.js';

// Custom token for client IP
morgan.token('client-ip', (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         'unknown';
});

// Custom token for request ID (if available)
morgan.token('req-id', (req) => {
  return req.id || 'none';
});

// Custom token for user agent
morgan.token('user-agent-short', (req) => {
  const ua = req.headers['user-agent'] || 'unknown';
  return ua.length > 50 ? ua.substring(0, 50) + '...' : ua;
});

// Request logger configuration
const requestLoggerFormat = config.server.env === 'production' 
  ? 'combined' 
  : ':method :url :status :response-time ms - :res[content-length] - :client-ip - :user-agent-short';

const requestLogger = morgan(requestLoggerFormat, {
  skip: (req, res) => {
    // Skip logging for health checks in production
    return config.server.env === 'production' && req.path === '/pricing/health';
  }
});

// Enhanced request logger for pricing endpoints
const pricingLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Parse response data if it's JSON
    let parsedData = {};
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      // If parsing fails, continue with empty object
    }
    
    // Extract relevant information
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      clientIp: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      responseTime,
      version: parsedData.data?.routing?.version,
      routingReason: parsedData.data?.routing?.routingReason,
      clientId: parsedData.data?.routing?.clientId
    };
    
    // Enhanced logging for pricing requests
    if (req.path.startsWith('/pricing')) {
      console.log('[PRICING_REQUEST]', JSON.stringify(logData, null, 2));
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Error logger
const errorLogger = (err, req, res, next) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    clientIp: req.ip || req.connection.remoteAddress,
    error: {
      message: err.message,
      stack: config.server.env === 'development' ? err.stack : undefined
    },
    headers: req.headers,
    body: req.body
  };
  
  console.error('[ERROR]', JSON.stringify(errorData, null, 2));
  next(err);
};

// Access logger for file-based logging (optional)
const accessLogger = morgan('combined', {
  stream: {
    write: (message) => {
      // You can implement file logging here if needed
      console.log(`[ACCESS] ${message.trim()}`);
    }
  }
});

export {
  requestLogger,
  pricingLogger,
  errorLogger,
  accessLogger
};