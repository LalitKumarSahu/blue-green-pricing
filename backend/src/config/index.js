import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load routing rules from JSON file
let routingRules = {};
try {
  const routingRulesPath = path.join(__dirname, 'routing-rules.json');
  const routingRulesData = fs.readFileSync(routingRulesPath, 'utf8');
  routingRules = JSON.parse(routingRulesData);
} catch (error) {
  console.error('Error loading routing rules:', error);
  // Fallback configuration
  routingRules = {
    routingRules: {
      percentage: { enabled: true, blue: 70, green: 30 },
      header: { enabled: true, headerName: 'X-Version', blueValue: 'blue', greenValue: 'green' },
      cookie: { enabled: true, cookieName: 'pricing-version', maxAge: 86400000 },
      ip: { enabled: true, blueIps: [], greenIps: [] }
    },
    stickySession: { enabled: true, cookieName: 'session-version' },
    priority: ['header', 'cookie', 'ip', 'percentage']
  };
}

const config = {
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },
  routing: {
    ...routingRules.routingRules,
    stickySession: routingRules.stickySession,
    priority: routingRules.priority,
    // Override from environment variables if available
    percentage: {
      ...routingRules.routingRules.percentage,
      blue: parseInt(process.env.BLUE_PERCENTAGE) || routingRules.routingRules.percentage.blue,
      green: parseInt(process.env.GREEN_PERCENTAGE) || routingRules.routingRules.percentage.green,
      enabled: process.env.ENABLE_PERCENTAGE_ROUTING === 'true' || routingRules.routingRules.percentage.enabled
    },
    header: {
      ...routingRules.routingRules.header,
      enabled: process.env.ENABLE_HEADER_ROUTING === 'true' || routingRules.routingRules.header.enabled
    },
    cookie: {
      ...routingRules.routingRules.cookie,
      enabled: process.env.ENABLE_COOKIE_ROUTING === 'true' || routingRules.routingRules.cookie.enabled
    },
    ip: {
      ...routingRules.routingRules.ip,
      enabled: process.env.ENABLE_IP_ROUTING === 'true' || routingRules.routingRules.ip.enabled
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
};

export default config;