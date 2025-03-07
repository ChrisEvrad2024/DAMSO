const NodeCache = require('node-cache');
const logger = require('../config/logger');

// Create cache instance
const cache = new NodeCache({ stdTTL: 300 }); // Default TTL: 5 minutes

/**
 * Middleware to cache API responses
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
exports.cacheMiddleware = (ttl = 300) => {
    return (req, res, next) => {
        // Skip cache for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip cache for authenticated requests (to avoid caching user-specific content)
        if (req.user) {
            return next();
        }

        // Create a cache key from the request URL
        const cacheKey = `__cache__${req.originalUrl}`;
        const cachedResponse = cache.get(cacheKey);

        // If cache hit, return cached response
        if (cachedResponse) {
            logger.debug(`Cache hit for: ${req.originalUrl}`);
            return res.json(cachedResponse);
        }

        // Cache miss, continue to the controller
        logger.debug(`Cache miss for: ${req.originalUrl}`);

        // Store original res.json method
        const originalJson = res.json;

        // Override res.json method to cache the response
        res.json = function (data) {
            // Store response in cache
            cache.set(cacheKey, data, ttl);

            // Call original json method
            return originalJson.call(this, data);
        };

        next();
    };
};

/**
 * Invalidate cache by key pattern
 * @param {string} pattern - Key pattern to invalidate
 */
exports.invalidateCache = (pattern) => {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));

    matchingKeys.forEach(key => {
        cache.del(key);
    });

    logger.debug(`Invalidated ${matchingKeys.length} cache entries matching: ${pattern}`);
};

// Export cache instance
exports.cache = cache;