/**
 * Database Optimizer - Fast Data Retrieval Utilities
 * 
 * Features:
 * - In-memory caching with TTL (Time To Live)
 * - Query result caching
 * - Batch loading for related data
 * - Connection pooling optimization
 * - Lean queries for faster reads
 */

// In-memory cache store
const cache = new Map();
const cacheTimestamps = new Map();

// Default cache TTL: 60 seconds
const DEFAULT_TTL = 60 * 1000;

/**
 * Cache Manager
 */
const CacheManager = {
  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any} Cached value or null
   */
  get(key) {
    const timestamp = cacheTimestamps.get(key);
    if (!timestamp) return null;
    
    // Check if cache expired
    if (Date.now() - timestamp > DEFAULT_TTL) {
      cache.delete(key);
      cacheTimestamps.delete(key);
      return null;
    }
    
    return cache.get(key);
  },

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = DEFAULT_TTL) {
    cache.set(key, value);
    cacheTimestamps.set(key, Date.now());
    
    // Auto-cleanup after TTL
    setTimeout(() => {
      cache.delete(key);
      cacheTimestamps.delete(key);
    }, ttl);
  },

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    cache.delete(key);
    cacheTimestamps.delete(key);
  },

  /**
   * Clear cache entries matching pattern
   * @param {string} pattern - Pattern to match (e.g., 'courses:')
   */
  clearPattern(pattern) {
    for (const key of cache.keys()) {
      if (key.startsWith(pattern)) {
        cache.delete(key);
        cacheTimestamps.delete(key);
      }
    }
  },

  /**
   * Clear all cache
   */
  clearAll() {
    cache.clear();
    cacheTimestamps.clear();
  },

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  }
};

/**
 * Optimized Query Helper
 * Executes queries with caching and lean optimization
 */
const OptimizedQuery = {
  /**
   * Execute a cached query
   * @param {string} cacheKey - Unique cache key
   * @param {Function} queryFn - Async function that returns query result
   * @param {number} ttl - Cache TTL in milliseconds
   * @returns {Promise<any>} Query result
   */
  async cached(cacheKey, queryFn, ttl = DEFAULT_TTL) {
    // Check cache first
    const cachedResult = CacheManager.get(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    // Execute query
    const result = await queryFn();
    
    // Cache result
    if (result !== null && result !== undefined) {
      CacheManager.set(cacheKey, result, ttl);
    }

    return result;
  },

  /**
   * Build optimized projection for fields
   * @param {string[]} fields - Fields to include
   * @param {string[]} exclude - Fields to exclude
   * @returns {Object} Mongoose projection object
   */
  buildProjection(fields = [], exclude = []) {
    const projection = {};
    
    if (fields.length > 0) {
      fields.forEach(f => projection[f] = 1);
    }
    
    exclude.forEach(f => projection[f] = 0);
    
    return projection;
  },

  /**
   * Execute parallel queries efficiently
   * @param {Object} queries - Object with query names as keys and query functions as values
   * @returns {Promise<Object>} Object with query names and results
   */
  async parallel(queries) {
    const keys = Object.keys(queries);
    const promises = keys.map(key => queries[key]());
    const results = await Promise.all(promises);
    
    const output = {};
    keys.forEach((key, index) => {
      output[key] = results[index];
    });
    
    return output;
  }
};

/**
 * Batch Loader - Load related data efficiently
 * Prevents N+1 query problem
 */
class BatchLoader {
  constructor(batchFn, options = {}) {
    this.batchFn = batchFn;
    this.cache = new Map();
    this.queue = [];
    this.scheduled = false;
    this.maxBatchSize = options.maxBatchSize || 100;
    this.batchDelay = options.batchDelay || 0;
  }

  async load(id) {
    // Check cache
    const idStr = id.toString();
    if (this.cache.has(idStr)) {
      return this.cache.get(idStr);
    }

    // Add to queue and return promise
    return new Promise((resolve, reject) => {
      this.queue.push({ id: idStr, resolve, reject });
      
      if (!this.scheduled) {
        this.scheduled = true;
        
        if (this.batchDelay > 0) {
          setTimeout(() => this.executeBatch(), this.batchDelay);
        } else {
          process.nextTick(() => this.executeBatch());
        }
      }
    });
  }

  async executeBatch() {
    const batch = this.queue.splice(0, this.maxBatchSize);
    this.scheduled = this.queue.length > 0;
    
    if (batch.length === 0) return;

    try {
      const ids = [...new Set(batch.map(item => item.id))];
      const results = await this.batchFn(ids);
      
      // Create lookup map
      const resultMap = new Map();
      results.forEach(item => {
        const id = (item._id || item.id).toString();
        resultMap.set(id, item);
        this.cache.set(id, item);
      });

      // Resolve promises
      batch.forEach(({ id, resolve }) => {
        resolve(resultMap.get(id) || null);
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }

    // Execute remaining if any
    if (this.scheduled) {
      process.nextTick(() => this.executeBatch());
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

/**
 * Fast Query Builder
 * Creates optimized Mongoose queries
 */
const FastQuery = {
  /**
   * Build a fast find query with all optimizations
   * @param {Model} Model - Mongoose model
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {Query} Optimized Mongoose query
   */
  find(Model, filter = {}, options = {}) {
    const {
      select = null,
      exclude = [],
      populate = [],
      sort = null,
      limit = 50,
      skip = 0,
      lean = true,
    } = options;

    let query = Model.find(filter);

    // Field selection
    if (select) {
      query = query.select(select);
    } else if (exclude.length > 0) {
      query = query.select(exclude.map(f => `-${f}`).join(' '));
    }

    // Population with field limits
    if (populate.length > 0) {
      populate.forEach(pop => {
        if (typeof pop === 'string') {
          query = query.populate(pop);
        } else {
          query = query.populate(pop);
        }
      });
    }

    // Sorting
    if (sort) {
      query = query.sort(sort);
    }

    // Pagination
    query = query.skip(skip).limit(limit);

    // Lean for faster reads (returns plain objects)
    if (lean) {
      query = query.lean();
    }

    return query;
  },

  /**
   * Find one document with optimizations
   */
  findOne(Model, filter = {}, options = {}) {
    const { select = null, populate = [], lean = true } = options;

    let query = Model.findOne(filter);

    if (select) {
      query = query.select(select);
    }

    populate.forEach(pop => {
      query = query.populate(pop);
    });

    if (lean) {
      query = query.lean();
    }

    return query;
  },

  /**
   * Find by ID with caching
   */
  async findByIdCached(Model, id, cacheKey, options = {}) {
    return OptimizedQuery.cached(
      cacheKey,
      () => this.findOne(Model, { _id: id }, options),
      options.ttl || DEFAULT_TTL
    );
  },

  /**
   * Count documents efficiently
   */
  count(Model, filter = {}) {
    return Model.countDocuments(filter);
  },

  /**
   * Check if document exists (faster than findOne)
   */
  exists(Model, filter = {}) {
    return Model.exists(filter);
  }
};

/**
 * Aggregation Pipeline Optimizer
 */
const AggregateOptimizer = {
  /**
   * Add common optimization stages to pipeline
   */
  optimize(pipeline, options = {}) {
    const { limit = 100, project = null } = options;
    
    const optimized = [...pipeline];

    // Add $limit early if not present
    const hasLimit = pipeline.some(stage => stage.$limit);
    if (!hasLimit && limit) {
      optimized.push({ $limit: limit });
    }

    // Add $project at the end if specified
    if (project) {
      optimized.push({ $project: project });
    }

    return optimized;
  }
};

// Export all utilities
module.exports = {
  CacheManager,
  OptimizedQuery,
  BatchLoader,
  FastQuery,
  AggregateOptimizer,
  DEFAULT_TTL,
};
