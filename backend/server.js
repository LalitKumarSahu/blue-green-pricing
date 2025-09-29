import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './src/config/index.js';
import pricingRoutes from './src/routes/pricingRoutes.js';
import { requestLogger, pricingLogger, errorLogger } from './src/middleware/logger.js';
import { getMemoryUsage } from './src/utils/helpers.js';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// CORS - MUST BE FIRST (before any other middleware)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', // Vite default port
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || config.server.env === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-Version',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-ID', 'X-Version-Served'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Security middleware (after CORS)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Logging middleware
if (config.logging.enableRequestLogging) {
  app.use(requestLogger);
}
app.use(pricingLogger);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Blue-Green Pricing API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
    endpoints: {
      pricing: '/pricing',
      stats: '/pricing/stats',
      health: '/pricing/health'
    }
  });
});

// API routes
app.use('/pricing', pricingRoutes);

// System info endpoint
app.get('/system', (req, res) => {
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      memory: getMemoryUsage(),
      environment: config.server.env,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      path: req.originalUrl,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      details: config.server.env === 'development' ? err.stack : undefined
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('Server closed successfully');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(config.server.port, () => {
  console.log('\n==========================================');
  console.log('🚀 Blue-Green Pricing API Server Started');
  console.log('==========================================');
  console.log(`📍 Environment: ${config.server.env}`);
  console.log(`🌐 Server: http://localhost:${config.server.port}`);
  console.log(`📊 Health: http://localhost:${config.server.port}/pricing/health`);
  console.log(`📈 Stats: http://localhost:${config.server.port}/pricing/stats`);
  console.log(`⚙️  System: http://localhost:${config.server.port}/system`);
  console.log('\n🎯 Routing Configuration:');
  console.log(`   Split: ${config.routing.percentage.blue}%/${config.routing.percentage.green}%`);
  console.log(`   Rules: ${Object.keys(config.routing).filter(key => config.routing[key]?.enabled).join(', ')}`);
  console.log('\n✅ Server ready to accept connections');
  console.log('==========================================\n');
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;