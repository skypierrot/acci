// 로깅 단계 타입
export type LoadingStage = 'initial' | 'data' | 'charts' | 'complete';

// 탭 타입 정의
export type TabType = 'overview' | 'charts';

// 🔧 로깅 중복 방지를 위한 유틸리티 함수
export const createLogger = (componentName: string) => {
  const logCache = new Map<string, number>();
  const LOG_THROTTLE_MS = 1000; // 1초 내 동일 로그 중복 방지
  
  return {
    log: (message: string, data?: any) => {
      const now = Date.now();
      const lastLogTime = logCache.get(message) || 0;
      
      if (now - lastLogTime > LOG_THROTTLE_MS) {
        console.log(`[${componentName}] ${message}`, data);
        logCache.set(message, now);
      }
    },
    
    error: (message: string, error?: any) => {
      const now = Date.now();
      const lastLogTime = logCache.get(`ERROR:${message}`) || 0;
      
      if (now - lastLogTime > LOG_THROTTLE_MS) {
        console.error(`[${componentName}] ${message}`, error);
        logCache.set(`ERROR:${message}`, now);
      }
    },
    
    warn: (message: string, data?: any) => {
      const now = Date.now();
      const lastLogTime = logCache.get(`WARN:${message}`) || 0;
      
      if (now - lastLogTime > LOG_THROTTLE_MS) {
        console.warn(`[${componentName}] ${message}`, data);
        logCache.set(`WARN:${message}`, now);
      }
    }
  };
};

// 캐시 시스템
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 캐시된 함수 래퍼
export const withCache = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string
) => {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    const now = Date.now();
    
    // 캐시 확인
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`[캐시] ${key} 캐시 사용`);
      return cached.data;
    }
    
    // 함수 실행
    console.log(`[캐시] ${key} API 호출`);
    const result = await fn(...args);
    
    // 캐시 저장
    cache.set(key, { data: result, timestamp: now });
    
    return result;
  };
};