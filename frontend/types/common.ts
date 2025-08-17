/**
 * @file common.ts
 * @description 공통 타입 정의
 */

// 기본 API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션 타입
export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// 기본 엔티티 타입
export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

// 회사 정보 타입
export interface Company extends BaseEntity {
  name: string;
  code: string;
  sites?: Site[];
}

// 사업장 정보 타입
export interface Site extends BaseEntity {
  name: string;
  code: string;
  company_id: string;
}

// 사용자 정보 타입
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: string;
  company_id: string;
}

// 파일 정보 타입
export interface FileInfo extends BaseEntity {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

// 상태 타입
export type Status = '대기' | '진행' | '완료' | '취소' | '지연';

// 상해정도 타입
export type InjuryType = 
  | '사망'
  | '중상(3일 이상 휴업)'
  | '경상(1일 이상 휴업)'
  | '병원치료(MTC)'
  | '응급처치(FAC)'
  | '기타';

// 사고 유형 타입
export type AccidentType = '인적' | '물적' | '복합';

// 유틸리티 타입
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 타입 가드 함수
export const isApiResponse = <T>(obj: any): obj is ApiResponse<T> => {
  return obj && typeof obj === 'object' && 'success' in obj;
};

export const isPaginatedResponse = <T>(obj: any): obj is PaginatedResponse<T> => {
  return isApiResponse(obj) && 'total' in obj && 'page' in obj && 'size' in obj;
};

export const isCompany = (obj: any): obj is Company => {
  return obj && typeof obj === 'object' && 'name' in obj && 'code' in obj;
};

export const isSite = (obj: any): obj is Site => {
  return obj && typeof obj === 'object' && 'name' in obj && 'code' in obj && 'company_id' in obj;
};

export const isUser = (obj: any): obj is User => {
  return obj && typeof obj === 'object' && 'name' in obj && 'email' in obj && 'role' in obj;
};

export const isFileInfo = (obj: any): obj is FileInfo => {
  return obj && typeof obj === 'object' && 'filename' in obj && 'originalname' in obj && 'mimetype' in obj;
};
