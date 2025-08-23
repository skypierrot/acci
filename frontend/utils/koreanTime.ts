/**
 * @file utils/koreanTime.ts
 * @description 프론트엔드용 한국 표준시(KST) 관리 유틸리티 함수들
 */

/**
 * 현재 한국 표준시를 반환합니다.
 * @returns 한국 표준시 Date 객체
 */
export const getKoreanTime = (): Date => {
  const now = new Date();
  // Intl.DateTimeFormat을 사용하여 정확한 한국 시간 가져오기
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
};

/**
 * 주어진 날짜를 한국 표준시로 변환합니다.
 * @param date 변환할 날짜 (UTC 또는 로컬 시간)
 * @returns 한국 표준시 Date 객체
 */
export const convertToKoreanTime = (date: Date | string): Date => {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  // Intl.DateTimeFormat을 사용하여 정확한 한국 시간으로 변환
  const koreanTimeString = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(inputDate).replace(' ', 'T');
  
  return new Date(koreanTimeString);
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
export const convertToKoreanTimeISO = (date: Date | string): string => {
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
 * 한국 표준시를 datetime-local input 형식으로 반환합니다.
 * @param date 포맷할 날짜 (기본값: 현재 시간)
 * @returns datetime-local 형식 문자열 (YYYY-MM-DDTHH:MM)
 */
export const formatKoreanTimeForInput = (date: Date | string | null = null): string => {
  const inputDate = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
  
  // Asia/Seoul 타임존으로 변환
  const koreanTimeString = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(inputDate);
  
  // sv-SE 형식은 "YYYY-MM-DD HH:MM" 형태이므로 공백을 T로 변경
  return koreanTimeString.replace(' ', 'T');
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

/**
 * 한국 표준시 기준 현재 연도를 반환합니다.
 * @returns 한국 표준시 기준 현재 연도
 */
export const getKoreanYear = (): number => {
  return getKoreanTime().getFullYear();
};

/**
 * UTC 시간을 한국 시간으로 변환 (잘못된 방식 - 사용 금지)
 * @deprecated setHours(+9) 방식은 DST를 고려하지 않으므로 사용하지 마세요.
 */
export const DEPRECATED_addNineHours = (date: Date): Date => {
  console.warn('DEPRECATED: setHours(+9) 방식은 정확하지 않습니다. convertToKoreanTime()을 사용하세요.');
  return convertToKoreanTime(date);
};