import { useState, useEffect } from 'react';

interface ServerTimeResponse {
  serverTime: string;
  timezone: string;
  timestamp: number;
  koreanTime: string;
  koreanTimeFormatted?: string;
}

interface UseServerTimeReturn {
  serverTime: Date | null;
  lastSync: Date | null;
  isLoading: boolean;
  syncServerTime: () => Promise<void>;
  getCurrentTime: () => Date;
  formatKoreanTime: (date: Date) => string;
  getKoreanTimeString: () => string;
}

/**
 * 한국 표준시를 관리하는 커스텀 훅
 * - 6시간마다 자동 동기화
 * - 설정 페이지 방문 시 즉시 동기화
 * - 여러 컴포넌트에서 공유 가능
 * - 한국 표준시 기준으로 정확한 시간 제공
 */
export const useServerTime = (): UseServerTimeReturn => {
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 한국 표준시 서버 동기화
  const syncServerTime = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/server-time');
      if (!response.ok) {
        throw new Error('한국 표준시 조회 실패');
      }
      
      const data: ServerTimeResponse = await response.json();
      // 서버에서 보낸 koreanTime을 사용 (이미 한국 시간으로 변환됨)
      const newServerTime = new Date(data.koreanTime);
      
      setServerTime(newServerTime);
      setLastSync(new Date());
      
      console.log('한국 표준시 동기화 완료:', data.koreanTimeFormatted || data.koreanTime);
    } catch (error) {
      console.error('한국 표준시 동기화 실패:', error);
      // 실패 시 클라이언트 시간을 Asia/Seoul 타임존으로 변환하여 사용
      if (!serverTime) {
        const now = new Date();
        // Intl.DateTimeFormat을 사용해 정확한 한국 시간 가져오기
        const koreanTimeString = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(now).replace(' ', 'T');
        setServerTime(new Date(koreanTimeString));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 6시간마다 자동 동기화
  useEffect(() => {
    // 초기 동기화
    syncServerTime();
    
    // 6시간마다 동기화 (6 * 60 * 60 * 1000 = 21,600,000ms)
    const syncInterval = setInterval(syncServerTime, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(syncInterval);
  }, []);

  // 현재 한국 표준시 반환 (서버 시간 기준으로 보간)
  const getCurrentTime = (): Date => {
    if (!serverTime || !lastSync) {
      // 서버 시간이 없으면 클라이언트 시간을 Asia/Seoul 타임존으로 변환
      const now = new Date();
      const koreanTimeString = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now).replace(' ', 'T');
      return new Date(koreanTimeString);
    }
    
    // 서버 시간이 이미 한국 시간이므로 시간 차이만 더해서 반환
    const now = new Date();
    const timeDiff = now.getTime() - lastSync.getTime();
    return new Date(serverTime.getTime() + timeDiff);
  };

  // 한국 표준시 형식으로 포맷
  const formatKoreanTime = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  // 한국 표준시 문자열 반환
  const getKoreanTimeString = (): string => {
    const currentTime = getCurrentTime();
    return formatKoreanTime(currentTime);
  };

  return {
    serverTime,
    lastSync,
    isLoading,
    syncServerTime,
    getCurrentTime,
    formatKoreanTime,
    getKoreanTimeString
  };
}; 