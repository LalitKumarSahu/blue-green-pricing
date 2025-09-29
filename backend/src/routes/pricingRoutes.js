import express from 'express';
import PricingController from '../controllers/pricingController.js';

const router = express.Router();
const pricingController = new PricingController();

// Main pricing endpoint
router.get('/', pricingController.getPricing.bind(pricingController));

// Statistics endpoint
router.get('/stats', pricingController.getStats.bind(pricingController));

// Health check endpoint
router.get('/health', pricingController.getHealth.bind(pricingController));

// Reset statistics endpoint
router.post('/reset-stats', pricingController.resetStats.bind(pricingController));

// Force specific version (for testing/debugging)
router.get('/version/:version', pricingController.getSpecificVersion.bind(pricingController));

export default router;