import { useRef, useCallback } from 'react';

interface CacheEntry {
  canvasData: ImageData;
  timestamp: number;
  scale: number;
  rotation: number;
}

interface CacheKey {
  pageNum: number;
  scale: number;
  rotation: number;
}

export function usePdfCache(maxSize: number = 5) {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const getCacheKey = ({ pageNum, scale, rotation }: CacheKey): string => {
    return `${pageNum}-${scale.toFixed(2)}-${rotation}`;
  };

  const getCached = useCallback((pageNum: number, scale: number, rotation: number): ImageData | null => {
    const key = getCacheKey({ pageNum, scale, rotation });
    const entry = cacheRef.current.get(key);
    
    if (entry) {
      entry.timestamp = Date.now();
      return entry.canvasData;
    }
    
    return null;
  }, []);

  const setCached = useCallback((pageNum: number, scale: number, rotation: number, data: ImageData) => {
    const key = getCacheKey({ pageNum, scale, rotation });
    
    if (cacheRef.current.size >= maxSize) {
      let oldestKey = '';
      let oldestTime = Date.now();
      
      cacheRef.current.forEach((entry, k) => {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = k;
        }
      });
      
      if (oldestKey) {
        cacheRef.current.delete(oldestKey);
      }
    }
    
    cacheRef.current.set(key, {
      canvasData: data,
      timestamp: Date.now(),
      scale,
      rotation,
    });
  }, [maxSize]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { getCached, setCached, clearCache };
}
