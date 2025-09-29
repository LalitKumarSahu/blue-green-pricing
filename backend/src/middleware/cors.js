import cors from 'cors';
import config from '../config/index.js';

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.cors.origin,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    
    if (config.server.env === 'development') {
      // In development, allow all origins
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Version', // Custom header for version routing
    'Accept',
    'Origin'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Version-Served',
    'X-Response-Time'
  ],
  maxAge: 86400 // 24 hours
};

// Custom CORS middleware for additional headers
const customCorsMiddleware = (req, res, next) => {
  // Add custom headers for debugging in development
  if (config.server.env === 'development') {
    res.header('X-Debug-Mode', 'true');
  }
  
  // Add server identification
  res.header('X-Powered-By', 'Blue-Green-Pricing-API');
  
  next();
};

// Pre-flight request handler
const handlePreflightRequest = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  next();
};

const corsMiddleware = cors(corsOptions);

export {
  corsMiddleware,
  customCorsMiddleware,
  handlePreflightRequest,
  corsOptions
};