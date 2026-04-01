/**
 * Performance optimization utilities
 */

/**
 * Debounce function to limit API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Memoize expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Optimized data fetching with caching
 */
export class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Singleton instance
  static instance = new DataCache();
}

/**
 * Optimized pagination helper
 */
export function createPagination<T>(
  items: T[],
  page: number,
  limit: number
): {
  items: T[];
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.ceil(items.length / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    items: items.slice(startIndex, endIndex),
    totalPages,
    currentPage: page,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Optimized search with debouncing
 */
export const createOptimizedSearch = <T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  delay = 300
) => {
  const debouncedSearch = debounce((query: string, callback: (results: T[]) => void) => {
    const results = items.filter(item => searchFn(item, query));
    callback(results);
  }, delay);

  return (query: string, callback: (results: T[]) => void) => {
    debouncedSearch(query, callback);
  };
};

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    };
  }

  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  static getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  static getMetrics(): Record<string, { avg: number; count: number }> {
    const result: Record<string, { avg: number; count: number }> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        avg: this.getAverageMetric(name),
        count: values.length
      };
    });
    
    return result;
  }

  static clear(): void {
    this.metrics.clear();
  }
}
