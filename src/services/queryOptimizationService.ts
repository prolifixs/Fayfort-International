export class QueryOptimizationService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async optimizeQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: {
      forceFresh?: boolean;
      batchKey?: string;
    } = {}
  ): Promise<T> {
    // Check cache first
    if (!options.forceFresh) {
      const cached = this.getFromCache<T>(key);
      if (cached) return cached;
    }

    // Execute query
    const result = await this.executeBatchedQuery(options.batchKey, queryFn);
    
    // Cache result
    this.cache.set(key, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private batchedQueries = new Map<string, Promise<any>>();

  private async executeBatchedQuery<T>(
    batchKey: string | undefined,
    queryFn: () => Promise<T>
  ): Promise<T> {
    if (!batchKey) return queryFn();

    if (!this.batchedQueries.has(batchKey)) {
      const queryPromise = queryFn().finally(() => {
        setTimeout(() => {
          this.batchedQueries.delete(batchKey);
        }, 0);
      });
      this.batchedQueries.set(batchKey, queryPromise);
    }

    return this.batchedQueries.get(batchKey);
  }
} 