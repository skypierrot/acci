/**
 * @file utils/koreanTime.ts
 * @description 한국 표준시(KST) 관리 유틸리티 함수들
 */

/**
 * 현재 한국 표준시를 반환합니다.
 * @returns 한국 표준시 Date 객체
 */
export const getKoreanTime = (): Date => {
  const now = new Date();
  const koreaTimeOffset = 9 * 60; // 9시간을 분으로 변환
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000); // UTC 시간 (밀리초)
  return new Date(utc + (koreaTimeOffset * 60000)); // 한국 시간
};

/**
 * 주어진 날짜를 한국 표준시로 변환합니다.
 * @param date 변환할 날짜
 * @returns 한국 표준시 Date 객체
 */
export const convertToKoreanTime = (date: Date): Date => {
  const koreaTimeOffset = 9 * 60; // 9시간을 분으로 변환
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000); // UTC 시간 (밀리초)
  return new Date(utc + (koreaTimeOffset * 60000)); // 한국 시간
};

/**
 * 한국 표준시를 ISO 문자열로 반환합니다.
 * @returns 한국 표준시 ISO 문자열
 */
export const getKoreanTimeISO = (): string => {
  return getKoreanTime().toISOString();
};

/**
 * 주어진 날짜를 한국 표준시 ISO 문자열로 변환합니다.
 * @param date 변환할 날짜
 * @returns 한국 표준시 ISO 문자열
 */
export const convertToKoreanTimeISO = (date: Date): string => {
  return convertToKoreanTime(date).toISOString();
};

/**
 * 한국 표준시를 포맷된 문자열로 반환합니다.
 * @param date 포맷할 날짜 (기본값: 현재 시간)
 * @returns 포맷된 한국 표준시 문자열
 */
export const formatKoreanTime = (date: Date = new Date()): string => {
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

/**
 * 한국 표준시를 간단한 포맷으로 반환합니다 (분까지).
 * @param date 포맷할 날짜 (기본값: 현재 시간)
 * @returns 간단한 포맷의 한국 표준시 문자열
 */
export const formatKoreanTimeMinute = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}; 