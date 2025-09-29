import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './src/config/index.js';
import pricingRoutes from './src/routes/pricingRoutes.js';
import { corsMiddleware, customCorsMiddleware, handlePreflightRequest } from './src/middleware/cors.js';
import { requestLogger, pricingLogger, errorLogger } from './src/middleware/logger.js';
import { getMemoryUsage } from './src/utils/helpers.js';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS handling
app.use(handlePreflightRequest);
app.use(corsMiddleware);
app.use(customCorsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (config.logging.enableRequestLogging) {
  app.use(requestLogger);
}
app.use(pricingLogger);

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

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
  console.log('🚀 Blue-Green Pricing API Server Started');
  console.log(`📍 Environment: ${config.server.env}`);
  console.log(`🌐 Server running on port: ${config.server.port}`);
  console.log(`🔗 Base URL: http://localhost:${config.server.port}`);
  console.log(`📊 Health Check: http://localhost:${config.server.port}/pricing/health`);
  console.log(`📈 Stats: http://localhost:${config.server.port}/pricing/stats`);
  console.log(`⚙️  System Info: http://localhost:${config.server.port}/system`);
  console.log('');
  console.log('🎯 Routing Configuration:');
  console.log(`   Blue/Green Split: ${config.routing.percentage.blue}%/${config.routing.percentage.green}%`);
  console.log(`   Enabled Rules: ${Object.keys(config.routing).filter(key => config.routing[key]?.enabled).join(', ')}`);
  console.log('');
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