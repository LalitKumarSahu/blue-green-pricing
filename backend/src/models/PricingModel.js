import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PricingModel {
  constructor() {
    this.bluePricingPath = path.join(__dirname, '../data/blue-pricing.json');
    this.greenPricingPath = path.join(__dirname, '../data/green-pricing.json');
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
  }

  /**
   * Get pricing data for a specific version
   * @param {string} version - 'blue' or 'green'
   * @returns {Object} Pricing data
   */
  async getPricingData(version) {
    const cacheKey = `pricing-${version}`;
    
    // Check cache first
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey) > Date.now()) {
      this.cacheHitCount++;
      return this.cache.get(cacheKey);
    }

    this.cacheMissCount++;

    try {
      const filePath = version === 'blue' ? this.bluePricingPath : this.greenPricingPath;
      const data = await fs.promises.readFile(filePath, 'utf8');
      const pricingData = JSON.parse(data);
      
      // Add timestamp for tracking
      pricingData.loadedAt = new Date().toISOString();
      pricingData.version = version;
      
      // Cache the data
      this.cache.set(cacheKey, pricingData);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return pricingData;
    } catch (error) {
      console.error(`Error loading ${version} pricing data:`, error);
      throw new Error(`Failed to load ${version} pricing data`);
    }
  }

  /**
   * Validate pricing data structure
   * @param {Object} pricingData 
   * @returns {boolean}
   */
  validatePricingData(pricingData) {
    const requiredFields = ['version', 'title', 'plans'];
    const missingFields = requiredFields.filter(field => !pricingData[field]);
    
    if (missingFields.length > 0) {
      console.error(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }

    if (!Array.isArray(pricingData.plans) || pricingData.plans.length === 0) {
      console.error('Plans must be a non-empty array');
      return false;
    }

    // Validate each plan
    for (const plan of pricingData.plans) {
      const requiredPlanFields = ['id', 'name', 'price', 'features'];
      const missingPlanFields = requiredPlanFields.filter(field => !plan[field]);
      
      if (missingPlanFields.length > 0) {
        console.error(`Plan ${plan.id || 'unknown'} missing fields: ${missingPlanFields.join(', ')}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get all available versions
   * @returns {Array<string>}
   */
  getAvailableVersions() {
    return ['blue', 'green'];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      cachedVersions: Array.from(this.cache.keys()),
      cacheHitRate: this.cacheHitCount / (this.cacheHitCount + this.cacheMissCount) || 0
    };
  }
}

export default PricingModel;