import { createContext, useContext, useState, useCallback, useEffect } from "react";

const QueryCacheContext = createContext(null);

export function QueryCacheProvider({ children }) {
  const [cache, setCache] = useState(new Map());
  const [listeners, setListeners] = useState(new Map());

  const get = useCallback((key) => {
    return cache.get(key);
  }, [cache]);

  const set = useCallback((key, data) => {
    setCache((prev) => {
      const next = new Map(prev);
      next.set(key, { data, timestamp: Date.now() });
      return next;
    });
    // Notify listeners
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((cb) => cb(data));
    }
  }, [listeners]);

  const invalidate = useCallback((keyPattern) => {
    setCache((prev) => {
      const next = new Map(prev);
      for (const key of next.keys()) {
        if (key.includes(keyPattern)) {
          next.delete(key);
        }
      }
      return next;
    });
    // Notify listeners of invalidation
    for (const [key, cbs] of listeners.entries()) {
      if (key.includes(keyPattern)) {
        cbs.forEach((cb) => cb(null));
      }
    }
  }, [listeners]);

  const subscribe = useCallback((key, callback) => {
    setListeners((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) || new Set();
      existing.add(callback);
      next.set(key, existing);
      return next;
    });
    return () => {
      setListeners((prev) => {
        const next = new Map(prev);
        const existing = next.get(key);
        if (existing) {
          existing.delete(callback);
          if (existing.size === 0) next.delete(key);
        }
        return next;
      });
    };
  }, []);

  return (
    <QueryCacheContext.Provider value={{ get, set, invalidate, subscribe }}>
      {children}
    </QueryCacheContext.Provider>
  );
}

export function useQueryCache() {
  const context = useContext(QueryCacheContext);
  if (!context) {
    throw new Error("useQueryCache must be used within a QueryCacheProvider");
  }
  return context;
}

// Hook for cached data fetching with automatic deduplication
export function useQuery(key, fetcher, options = {}) {
  const { get, set, subscribe } = useQueryCache();
  const [data, setData] = useState(() => get(key)?.data);
  const [loading, setLoading] = useState(!get(key)?.data);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      set(key, result);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, set]);

  useEffect(() => {
    // Subscribe to cache invalidation
    const unsubscribe = subscribe(key, (newData) => {
      if (newData !== null) {
        setData(newData);
        setLoading(false);
      } else {
        // Invalidate - refetch
        refetch();
      }
    });

    // Initial fetch if no cached data
    if (!get(key)?.data) {
      refetch();
    } else {
      setLoading(false);
    }

    return unsubscribe;
  }, [key, subscribe, get, refetch]);

  return { data, loading, error, refetch };
}

// Mutation hook with automatic cache invalidation
export function useMutation(mutationFn, options = {}) {
  const { invalidate } = useQueryCache();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutationFn(...args);
      // Invalidate related queries
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => invalidate(key));
      }
      if (options.onSuccess) options.onSuccess(result);
      return result;
    } catch (err) {
      setError(err);
      if (options.onError) options.onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options, invalidate]);

  return { mutate, loading, error };
}