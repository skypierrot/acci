// React Strict Mode 중복 로그 방지를 위한 전역 타입 정의
declare global {
  interface Window {
    __filterLogs?: Set<string>;
    __loadingLogs?: Set<string>;
    __actionLogs?: Set<string>;
  }
}

export {}; 