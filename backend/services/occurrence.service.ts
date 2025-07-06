/**
 * @file services/occurrence.service.ts
 * @description
 *  - 사고 발생보고 관련 비즈니스 로직을 구현합니다.
 *  - Drizzle ORM을 활용하여 데이터베이스에 CRUD 작업을 수행합니다.
 */

import { db, tables } from "../orm/index";
import { sql, desc } from "drizzle-orm";
import { victims } from "../orm/schema/victims";

// 타임스탬프 필드 목록 (스키마에 정의된 모든 타임스탬프 필드)
const TIMESTAMP_FIELDS = [
  'acci_time',
  'first_report_time',
  'created_at',
  'updated_at'
];

// 문자열이나 다른 값을 Date 객체로 변환하는 헬퍼 함수
const ensureDate = (value: any): Date | null => {
  if (!value) return null;
  
  if (value instanceof Date) {
    console.log(`[BACK][ensureDate] 이미 Date 객체임: ${value}`);
    return value;
  }
  
  try {
    // 문자열 또는 숫자를 Date 객체로 변환 시도
    const date = new Date(value);
    // 유효한 날짜인지 확인
    if (!isNaN(date.getTime())) {
      console.log(`[BACK][ensureDate] 유효한 날짜로 변환 성공: ${value} → ${date.toISOString()}`);
      return date;
    }
  } catch (e) {
    console.error('[BACK][ensureDate] 날짜 변환 오류:', e, value);
  }
  
  console.log(`[BACK][ensureDate] 변환 실패: ${value} (타입: ${typeof value})`);
  return null; // 변환 실패 시 null 반환
};

// 데이터 객체의 모든 타임스탬프 필드를 처리하는 함수
const processTimestampFields = (data: any): any => {
  const result = { ...data };
  
  console.log('[BACK][processTimestampFields] 시작 - 필드 타입 현황:');
  TIMESTAMP_FIELDS.forEach(field => {
    console.log(`[BACK][processTimestampFields] ${field}:`, {
      value: result[field],
      type: typeof result[field],
      isDate: result[field] instanceof Date,
      isString: typeof result[field] === 'string',
      isValidDate: result[field] && !isNaN(new Date(result[field]).getTime()),
      hasToISOString: result[field] && typeof result[field].toISOString === 'function'
    });
  });
  
  TIMESTAMP_FIELDS.forEach(field => {
    if (field in result) {
      const dateValue = ensureDate(result[field]);
      // null이 아닌 경우에만 값 설정 (null이면 해당 필드 제거)
      if (dateValue) {
        result[field] = dateValue;
        console.log(`[BACK][processTimestampFields] ${field} 설정: ${dateValue.toISOString()}`);
      } else {
        delete result[field];
        console.log(`[BACK][processTimestampFields] ${field} 필드 제거 (유효하지 않은 날짜)`);
      }
    }
  });
  
  return result;
};

// 재해자 배열에서 JSON 구문 분석을 위한 헬퍼 함수
const parseVictimsFromJson = (victimsJson: string | null | undefined): any[] => {
  if (!victimsJson) return [];
  
  try {
    const parsedVictims = JSON.parse(victimsJson);
    if (Array.isArray(parsedVictims)) {
      return parsedVictims;
    }
  } catch (e) {
    console.error('[BACK][parseVictimsFromJson] 재해자 정보 JSON 파싱 오류:', e);
  }
  
  return [];
};

// 재해자 정보 DB 저장 함수
const saveVictims = async (
  accident_id: string, 
  victimsData: any[], 
  transaction?: any
): Promise<number> => {
  const dbClient = transaction || db();
  
  try {
    if (!victimsData || !Array.isArray(victimsData) || victimsData.length === 0) {
      console.log('[BACK][saveVictims] 저장할 재해자 정보 없음');
      return 0;
    }
    
    console.log(`[BACK][saveVictims] 저장할 재해자 수: ${victimsData.length}`);
    
    // 해당 사고ID의 기존 재해자 정보 삭제 (업데이트 시)
    await dbClient
      .delete(victims)
      .where(sql`${victims.accident_id} = ${accident_id}`);
    
    console.log(`[BACK][saveVictims] 기존 재해자 정보 삭제 완료 (accident_id: ${accident_id})`);
    
    // 새 재해자 정보 일괄 저장
    const preparedVictims = victimsData.map((victim: any, index: number) => {
      console.log(`[BACK][saveVictims] 재해자 ${index + 1} 정보:`, {
        name: victim.name,
        age: victim.age,
        belong: victim.belong,
        injury_type: victim.injury_type
      });
      
      // 재해자별 날짜 필드 처리
      let birthDate = null;
      if (victim.birth_date) {
        try {
          birthDate = ensureDate(victim.birth_date);
          console.log(`[BACK][saveVictims] 생년월일 변환: ${victim.birth_date} → ${birthDate?.toISOString()}`);
        } catch (e) {
          console.error(`[BACK][saveVictims] 생년월일 변환 오류:`, e);
        }
      }
      
      return {
        accident_id,
        name: victim.name || `재해자 ${index + 1}`,
        age: victim.age || 0,
        belong: victim.belong || '',
        duty: victim.duty || '',
        injury_type: victim.injury_type || '',
        ppe_worn: victim.ppe_worn || '',
        first_aid: victim.first_aid || '',
        birth_date: birthDate,
        injury_location: victim.injury_location || '',
        medical_opinion: victim.medical_opinion || '',
        training_completed: victim.training_completed || '',
        etc_notes: victim.etc_notes || '',
        created_at: new Date(),
        updated_at: new Date()
      };
    });
    
    if (preparedVictims.length > 0) {
      await dbClient.insert(victims).values(preparedVictims);
      console.log(`[BACK][saveVictims] ${preparedVictims.length}명의 재해자 정보 저장 성공`);
    }
    
    return preparedVictims.length;
  } catch (error: any) {
    console.error('[BACK][saveVictims] 재해자 정보 저장 오류:', error);
    console.error('[BACK][saveVictims] 오류 메시지:', error.message);
    
    if (error.code) {
      console.error('[BACK][saveVictims] 데이터베이스 오류 코드:', error.code);
    }
    
    throw error;
  }
};

interface Filters {
  company: string;
  status: string;
  from: string;
  to: string;
}

interface Pagination {
  page: number;
  size: number;
}

export default class OccurrenceService {
  /**
   * @method fetchList
   * @description
   *  - 페이징과 필터 조건을 적용하여 사고 발생보고 목록을 조회합니다.
   * @param filters 필터 조건 (company, status, from, to)
   * @param pagination 페이징 정보 (page, size)
   * @returns 페이징 결과와 데이터 배열
   */
  static async fetchList(filters: Filters, pagination: Pagination) {
    const { company, status, from, to } = filters;
    const { page, size } = pagination;
    const offset = (page - 1) * size;

    // Drizzle ORM 쿼리 빌더 사용 예시
    // 1) 조건 배열 생성
    const conditions: any[] = [];

    // 2) 회사명 필터가 있을 경우 조건 추가
    if (company) {
      conditions.push(sql`${tables.occurrenceReport.company_name} = ${company}`);
    }

    // 3) 날짜 범위 필터가 있을 경우 조건 추가
    if (from && to) {
      conditions.push(sql`${tables.occurrenceReport.acci_time} BETWEEN ${from} AND ${to}`);
    }

    // 4) 쿼리 빌드 및 실행
    let query = db().select().from(tables.occurrenceReport);
    
    // 조건이 있으면 where 절 추가
    if (conditions.length > 0) {
      query = query.where(sql.join(conditions, sql` AND `));
    }
    
    // 최신순 정렬 (created_at 기준 내림차순)
    query = query.orderBy(desc(tables.occurrenceReport.created_at));
    
    // 페이징 적용: limit, offset
    const data = (await query.limit(size).offset(offset)) as unknown as any[];

    // 5) 전체 개수(count) 조회 (필터 적용 포함)
    const totalResult = (await db()
      .select({ count: sql`COUNT(*)` })
      .from(tables.occurrenceReport)
      // 위에서 사용한 필터와 동일하게 중복 적용해야 함
      .where(
        company
          ? sql`${tables.occurrenceReport.company_name} = ${company}`
          : sql`1 = 1`
      )
      .where(
        from && to
          ? sql`${tables.occurrenceReport.acci_time} BETWEEN ${from} AND ${to}`
          : sql`1 = 1`
      )) as unknown as any[];
    const total = Number((totalResult[0] as any).count);

    return {
      data,
      pagination: {
        total,
        page,
        size,
        pages: Math.ceil(total / size),
      },
    };
  }

  /**
   * @method getById
   * @description
   *  - 단일 사고 발생보고 데이터를 ID로 조회하고 재해자 정보도 함께 조회합니다.
   * @param id 사고 ID
   */
  static async getById(id: string) {
    // 사고 발생보고서 조회
    const reports = (await db()
      .select()
      .from(tables.occurrenceReport)
      .where(sql`${tables.occurrenceReport.accident_id} = ${id}`)
      .limit(1)) as unknown as any[];
    
    if (reports.length === 0) {
      return null;
    }
    
    const report = reports[0];
    
    // 첨부파일(attachments) 필드만 사용, 항상 배열로 반환
    if (typeof report.attachments === 'string' && report.attachments) {
      try {
        (report as any).attachments = JSON.parse(report.attachments);
      } catch (e) {
        console.error('[BACK][getById] attachments 파싱 오류:', e);
        (report as any).attachments = [];
      }
    } else if (!Array.isArray(report.attachments)) {
      (report as any).attachments = [];
    }
    
    // 해당 사고의 재해자 정보 조회
    const victimsData = (await db()
      .select()
      .from(victims)
      .where(sql`${victims.accident_id} = ${id}`)
      .orderBy(victims.victim_id)) as unknown as any[];
    
    console.log(`[BACK][getById] 재해자 정보 ${victimsData.length}건 조회됨`);
    
    // 재해자 정보가 있으면 보고서 데이터에 포함
    if (victimsData.length > 0) {
      // victims_json 필드 업데이트
      report.victims_json = JSON.stringify(victimsData);
      
      // 기존 DB에서는 victims 필드가 없지만, API 응답용으로 추가
      (report as any).victims = victimsData;
    } else if (report.victims_json) {
      // DB에 재해자 정보는 없지만 victims_json이 있는 경우 파싱
      try {
        const parsedVictims = parseVictimsFromJson(report.victims_json);
        if (parsedVictims.length > 0) {
          (report as any).victims = parsedVictims;
        }
      } catch (e) {
        console.error('[BACK][getById] victims_json 파싱 오류:', e);
        (report as any).victims = [];
      }
    } else {
      // 재해자 정보가 없는 경우 빈 배열로 초기화
      (report as any).victims = [];
    }
    
    // 파일 필드들을 배열로 변환
    const fileFields = ['scene_photos', 'cctv_video', 'statement_docs', 'etc_documents'];
    fileFields.forEach(field => {
      const value = report[field as keyof typeof report];
      if (typeof value === 'string' && value) {
        try {
          // JSON 문자열 파싱 시도
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            (report as any)[field] = parsed;
          } else if (parsed && typeof parsed === 'object') {
            // 객체인 경우 값들을 배열로 변환
            (report as any)[field] = Object.values(parsed).filter(v => typeof v === 'string');
          } else {
            (report as any)[field] = [];
          }
        } catch (e) {
          console.error(`[BACK][getById] ${field} 파싱 오류:`, e);
          (report as any)[field] = [];
        }
      } else if (Array.isArray(value)) {
        // 이미 배열인 경우 그대로 사용
        (report as any)[field] = value;
      } else {
        // 기타 경우 빈 배열로 초기화
        (report as any)[field] = [];
      }
    });
    
    console.log(`[BACK][getById] 파일 필드 변환 완료:`, {
      scene_photos: (report as any).scene_photos,
      cctv_video: (report as any).cctv_video,
      statement_docs: (report as any).statement_docs,
      etc_documents: (report as any).etc_documents
    });
    
    return report;
  }

  /**
   * @method create
   * @description
   *  - 새로운 사고 발생보고 데이터와 재해자 정보를 DB에 삽입합니다.
   * @param data 요청 바디에 담긴 사고 등록 정보
   * @returns 생성된 레코드
   */
  static async create(data: any) {
    try {
      console.log("===== 서비스: 사고 발생보고서 생성 시작 =====");
      console.log("[BACK][create] 테이블 스키마:", Object.keys(tables.occurrenceReport));
      console.log("[BACK][create] 데이터 필드 수:", Object.keys(data).length);
      
      // 트랜잭션 시작
      return await db().transaction(async (tx) => {
        // === 순번 생성 로직 개선 ===
        const year = new Date(data.acci_time).getFullYear();
        const companyCode = data.company_code;
        const siteCode = data.site_code;
        const date = new Date(data.acci_time);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateStr = `${year}${month}${day}`;

        // 1. 전체사고코드 순번 구하기 (회사별, 연도별)
        const companyReports = (await tx
          .select()
          .from(tables.occurrenceReport)
          .where(sql`${tables.occurrenceReport.company_code} = ${companyCode} AND EXTRACT(YEAR FROM ${tables.occurrenceReport.acci_time}) = ${year}`)) as unknown as any[];

        let maxCompanySeq = 0;
        companyReports.forEach(r => {
          if (r.global_accident_no) {
            // 형식: "HHH-2025-001"에서 마지막 숫자 부분 추출
            const match = r.global_accident_no.match(/\-(\d+)$/);
            if (match && match[1]) {
              const seq = parseInt(match[1], 10);
              if (!isNaN(seq) && seq > maxCompanySeq) {
                maxCompanySeq = seq;
              }
            }
          }
        });
        const nextCompanySeq = maxCompanySeq + 1;
        console.log(`[BACK][create] 전체사고코드 최대 순번: ${maxCompanySeq}, 다음 순번: ${nextCompanySeq}`);

        // 2. 사업장사고코드 순번 구하기 (회사-사업장별, 연도별)
        const siteReports = (await tx
          .select()
          .from(tables.occurrenceReport)
          .where(sql`${tables.occurrenceReport.company_code} = ${companyCode} AND ${tables.occurrenceReport.site_code} = ${siteCode} AND EXTRACT(YEAR FROM ${tables.occurrenceReport.acci_time}) = ${year}`)) as unknown as any[];

        let maxSiteSeq = 0;
        siteReports.forEach(r => {
          if (r.accident_id) {
            // 새 형식: "[회사코드]-[사업장코드]-[년도]-[사업장 순번]"에서 마지막 부분 추출
            // 기존 형식: "HHH-A-001-20250404"에서 세 번째 부분 추출 (호환성)
            const parts = r.accident_id.split('-');
            let seq = 0;
            
            if (parts.length === 4) {
              // 새 형식: 마지막 부분이 순번
              seq = parseInt(parts[3], 10);
            } else if (parts.length >= 3) {
              // 기존 형식: 세 번째 부분이 순번
              seq = parseInt(parts[2], 10);
            }
            
            if (!isNaN(seq) && seq > maxSiteSeq) {
              maxSiteSeq = seq;
            }
          }
        });
        const nextSiteSeq = maxSiteSeq + 1;
        console.log(`[BACK][create] 사업장사고코드 최대 순번: ${maxSiteSeq}, 다음 순번: ${nextSiteSeq}`);

        // 코드 생성
        const companyCountStr = nextCompanySeq.toString().padStart(3, '0');
        const siteCountStr = nextSiteSeq.toString().padStart(3, '0');
        // 형식: [회사코드]-[사업장코드]-[년도]-[사업장 순번]
        const accidentId = `${companyCode}-${siteCode}-${year}-${siteCountStr}`;
        const globalAccidentNo = `${companyCode}-${year}-${companyCountStr}`;

        // 데이터에 반영
        data.accident_id = accidentId;
        data.global_accident_no = globalAccidentNo;
        data.report_channel_no = accidentId; // 사고 ID와 동일하게 설정
        
        console.log(`[BACK][create] 생성된 코드:`, {
          accident_id: data.accident_id,
          global_accident_no: data.global_accident_no,
          report_channel_no: data.report_channel_no
        });
        
        // first_report_time이 없는 경우 현재 시간으로 설정
        if (!data.first_report_time) {
          data.first_report_time = new Date().toISOString();
          console.log("[BACK][create] first_report_time 기본값 설정:", data.first_report_time);
        }
        
        // created_at, updated_at이 없는 경우 현재 시간으로 설정
        if (!data.created_at) {
          data.created_at = new Date().toISOString();
          console.log("[BACK][create] created_at 기본값 설정:", data.created_at);
        }
        
        if (!data.updated_at) {
          data.updated_at = new Date().toISOString();
          console.log("[BACK][create] updated_at 기본값 설정:", data.updated_at);
        }
        
        // 첨부파일(attachments) 필드만 사용, 항상 JSON 문자열로 저장
        if (Array.isArray(data.attachments)) {
          data.attachments = JSON.stringify(data.attachments);
        } else if (typeof data.attachments !== 'string') {
          data.attachments = '[]';
        }
        
        // 필수 필드 확인
        const requiredFields = ['accident_id', 'company_name', 'site_name', 'acci_location'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
          console.error('[BACK][create] 필수 필드 누락:', missingFields);
          throw new Error(`필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
        }
        
        // 재해자 정보 처리
        let victimsArray: any[] = [];
        
        // victims 배열이 있는 경우
        if (data.victims && Array.isArray(data.victims)) {
          console.log(`[BACK][create] victims 배열 확인: ${data.victims.length}명`);
          victimsArray = data.victims;
        } 
        // victims_json 문자열이 있는 경우
        else if (data.victims_json) {
          try {
            const parsedVictims = parseVictimsFromJson(data.victims_json);
            if (parsedVictims.length > 0) {
              victimsArray = parsedVictims;
              console.log(`[BACK][create] victims_json 파싱 결과: ${victimsArray.length}명`);
            }
          } catch (e) {
            console.error('[BACK][create] victims_json 파싱 오류:', e);
            data.victims_json = '[]';
          }
        }
        
        // 재해자 수 자동 설정
        if (victimsArray.length > 0 && (!data.victim_count || data.victim_count === 0)) {
          data.victim_count = victimsArray.length;
          console.log(`[BACK][create] victim_count 자동 설정: ${data.victim_count}`);
        }
        
        // 보고자 정보 로깅
        if (data.reporter_name || data.reporter_position || data.reporter_belong) {
          console.log('[BACK][create] 보고자 정보:', {
            name: data.reporter_name,
            position: data.reporter_position,
            belong: data.reporter_belong
          });
        }
        
        console.log("[BACK][create] DB 삽입 직전 - 주요 필드:", {
          accident_id: data.accident_id,
          company_name: data.company_name,
          site_name: data.site_name,
          first_report_time: data.first_report_time,
          global_accident_no: data.global_accident_no,
          created_at: data.created_at,
          updated_at: data.updated_at,
          reporter_name: data.reporter_name,
          victim_count: data.victim_count
        });
        
        // 데이터 클리닝
        const cleanData = { ...data };
        
        // victims 배열은 DB에 직접 저장하지 않으므로 제거
        if (cleanData.victims) {
          delete cleanData.victims;
        }
        
        // 테이블 스키마에 존재하는 필드만 필터링
        const schemaKeys = Object.keys(tables.occurrenceReport);
        const filteredKeys: string[] = [];
        const removedKeys: string[] = [];
        
        Object.keys(cleanData).forEach(key => {
          if (!schemaKeys.includes(key)) {
            console.log(`[BACK][create] 스키마에 없는 필드 제거: ${key}`);
            removedKeys.push(key);
            delete cleanData[key];
          } else {
            filteredKeys.push(key);
          }
        });
        
        console.log(`[BACK][create] 총 ${filteredKeys.length}개 필드 유지, ${removedKeys.length}개 필드 제거`);
        
        // 모든 timestamp 필드가 Date 객체인지 확인하고 처리
        const processedData = processTimestampFields(cleanData);
        
        // 사고 발생보고서 저장
        console.log("[BACK][create] 최종 삽입 데이터 필드:", Object.keys(processedData));
        console.log("[BACK][create] 타임스탬프 필드 값:", {
          acci_time: processedData.acci_time,
          first_report_time: processedData.first_report_time,
          created_at: processedData.created_at,
          updated_at: processedData.updated_at
        });
        
        await tx.insert(tables.occurrenceReport).values(processedData);
        console.log("[BACK][create] 사고 발생보고서 저장 성공");
        
        // 재해자 정보 저장
        if (victimsArray.length > 0) {
          const savedCount = await saveVictims(data.accident_id, victimsArray, tx);
          console.log(`[BACK][create] 재해자 정보 ${savedCount}건 저장 완료`);
        }
        
        console.log("===== 서비스: DB 삽입 성공 =====");
        
        // 저장된 결과 조회
        const savedReport = await this.getById(data.accident_id);
        return savedReport || processedData;
      });
    } catch (error: any) {
      console.error("===== 서비스: 사고 발생보고서 생성 오류 =====");
      console.error("[BACK][create] 오류 타입:", error.constructor.name);
      console.error("[BACK][create] 오류 메시지:", error.message);
      console.error("[BACK][create] 오류 스택:", error.stack);
      
      if (error.code) {
        console.error("[BACK][create] 데이터베이스 오류 코드:", error.code);
      }
      
      if (error.detail) {
        console.error("[BACK][create] 데이터베이스 오류 상세:", error.detail);
      }
      
      throw error;
    }
  }

  /**
   * @method update
   * @description
   *  - 기존 사고 발생보고 데이터를 수정하고 재해자 정보도 업데이트합니다.
   * @param id 수정할 사고 ID
   * @param data 수정할 필드 값
   * @returns 수정된 레코드
   */
  static async update(id: string, data: any) {
    try {
      console.log(`===== 서비스: 사고 발생보고서 수정 시작 (ID: ${id}) =====`);
      console.log("[BACK][update] 테이블 스키마:", Object.keys(tables.occurrenceReport));
      console.log("[BACK][update] 데이터 필드 수:", Object.keys(data).length);
      
      // 트랜잭션 시작
      return await db().transaction(async (tx) => {
        // 예: id에 해당하는 레코드가 없으면 예외 발생
        const existing = await this.getById(id);
        if (!existing) {
          throw new Error("수정할 사고를 찾을 수 없습니다.");
        }
        
        console.log("[BACK][update] 기존 데이터 확인:", {
          accident_id: existing.accident_id,
          acci_time: existing.acci_time,
          first_report_time: existing.first_report_time,
          created_at: existing.created_at,
          updated_at: existing.updated_at,
          reporter_name: existing.reporter_name
        });
        
        // 데이터 클리닝
        const cleanData = { ...data };
        
        // updated_at은 항상 현재 시간으로 업데이트
        cleanData.updated_at = new Date().toISOString();
        console.log("[BACK][update] updated_at 업데이트:", cleanData.updated_at);
        
        // 첨부파일(attachments) 필드만 사용, 항상 JSON 문자열로 저장
        if (Array.isArray(cleanData.attachments)) {
          cleanData.attachments = JSON.stringify(cleanData.attachments);
        } else if (typeof cleanData.attachments !== 'string') {
          cleanData.attachments = '[]';
        }
        
        // 재해자 정보 처리
        let victimsArray: any[] = [];
        
        // victims 배열이 있는 경우
        if (cleanData.victims && Array.isArray(cleanData.victims)) {
          console.log(`[BACK][update] victims 배열 확인: ${cleanData.victims.length}명`);
          victimsArray = cleanData.victims;
          
          // 재해자 수 업데이트
          if (victimsArray.length > 0) {
            cleanData.victim_count = victimsArray.length;
            console.log(`[BACK][update] victim_count 업데이트: ${cleanData.victim_count}`);
          }
          
          // victims 배열은 DB에 직접 저장하지 않으므로 제거
          delete cleanData.victims;
        } 
        // victims_json 문자열이 있는 경우
        else if (cleanData.victims_json) {
          try {
            const parsedVictims = parseVictimsFromJson(cleanData.victims_json);
            if (parsedVictims.length > 0) {
              victimsArray = parsedVictims;
              console.log(`[BACK][update] victims_json 파싱 결과: ${victimsArray.length}명`);
              
              // 재해자 수 업데이트
              cleanData.victim_count = victimsArray.length;
            }
          } catch (e) {
            console.error('[BACK][update] victims_json 파싱 오류:', e);
            cleanData.victims_json = existing.victims_json || '[]';
          }
        }
        
        // 보고자 정보 로깅
        if (cleanData.reporter_name || cleanData.reporter_position || cleanData.reporter_belong) {
          console.log('[BACK][update] 보고자 정보 업데이트:', {
            name: cleanData.reporter_name,
            position: cleanData.reporter_position,
            belong: cleanData.reporter_belong
          });
        }
        
        // 테이블 스키마에 존재하는 필드만 필터링
        const schemaKeys = Object.keys(tables.occurrenceReport);
        const filteredKeys: string[] = [];
        const removedKeys: string[] = [];
        
        Object.keys(cleanData).forEach(key => {
          if (!schemaKeys.includes(key)) {
            console.log(`[BACK][update] 스키마에 없는 필드 제거: ${key}`);
            removedKeys.push(key);
            delete cleanData[key];
          } else {
            filteredKeys.push(key);
          }
        });
        
        console.log(`[BACK][update] 총 ${filteredKeys.length}개 필드 유지, ${removedKeys.length}개 필드 제거`);
        
        // 모든 timestamp 필드가 Date 객체인지 확인하고 처리
        const processedData = processTimestampFields(cleanData);
        
        console.log("[BACK][update] 수정 직전 데이터 필드:", Object.keys(processedData));
        console.log("[BACK][update] 타임스탬프 필드 값:", {
          acci_time: processedData.acci_time,
          first_report_time: processedData.first_report_time,
          created_at: processedData.created_at,
          updated_at: processedData.updated_at
        });

        // 사고 발생보고서 업데이트
        await tx
          .update(tables.occurrenceReport)
          .set(processedData)
          .where(sql`${tables.occurrenceReport.accident_id} = ${id}`);
        
        console.log(`[BACK][update] 사고 발생보고서 업데이트 성공`);
        
        // 재해자 정보 업데이트
        if (victimsArray.length > 0) {
          const savedCount = await saveVictims(id, victimsArray, tx);
          console.log(`[BACK][update] 재해자 정보 ${savedCount}건 업데이트 완료`);
        }
        
        console.log(`===== 서비스: 사고 발생보고서 수정 완료 (ID: ${id}) =====`);
        
        // 수정된 결과 조회
        const updatedReport = await this.getById(id);
        return updatedReport || { ...existing, ...processedData };
      });
    } catch (error: any) {
      console.error(`===== 서비스: 사고 발생보고서 수정 오류 (ID: ${id}) =====`);
      console.error("[BACK][update] 오류 타입:", error.constructor.name);
      console.error("[BACK][update] 오류 메시지:", error.message);
      console.error("[BACK][update] 오류 스택:", error.stack);
      
      if (error.code) {
        console.error("[BACK][update] 데이터베이스 오류 코드:", error.code);
      }
      
      if (error.detail) {
        console.error("[BACK][update] 데이터베이스 오류 상세:", error.detail);
      }
      
      throw error;
    }
  }

  /**
   * @method remove
   * @description
   *  - 사고 발생보고 레코드를 삭제합니다.
   * @param id 삭제할 사고 ID
   */
  static async remove(id: string) {
    // 삭제 전 존재 여부 확인
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("삭제할 사고를 찾을 수 없습니다.");
    }

    // Drizzle ORM delete 쿼리 사용
    await db()
      .delete(tables.occurrenceReport)
      .where(sql`${tables.occurrenceReport.accident_id} = ${id}`);
  }

  /**
   * @method getNextSequence
   * @description
   *  - 특정 회사/사업장의 연도별 다음 순번을 조회합니다.
   * @param type 타입 ('company' 또는 'site')
   * @param code 회사코드 또는 사업장코드
   * @param year 연도
   * @returns 다음 순번 (3자리 문자열)
   */
  static async getNextSequence(type: string, code: string, year: string): Promise<string> {
    try {
      console.log(`[BACK][getNextSequence] 순번 조회 시작: type=${type}, code=${code}, year=${year}`);
      
      // 해당 연도와 코드로 시작하는 사고 ID의 최대 순번 조회
      let pattern: string;
      let field: string;
      
      if (type === 'company') {
        pattern = `${code}-${year}-%`;
        field = 'global_accident_no';
      } else if (type === 'site') {
        pattern = `${code}-${year}-%`;
        field = 'accident_id';
      } else {
        throw new Error('잘못된 타입입니다. company 또는 site만 허용됩니다.');
      }
      
      // SQL 쿼리로 해당 패턴의 최대 순번 조회
      const result = (await db().execute(sql`
        SELECT ${sql.raw(field)} as code
        FROM occurrence_report 
        WHERE ${sql.raw(field)} LIKE ${pattern}
        ORDER BY ${sql.raw(field)} DESC 
        LIMIT 1
      `)) as unknown as any[];
      
      let nextSequence = 1;
      
      if (result.length > 0 && result[0].code) {
        // 기존 코드에서 순번 부분 추출 (마지막 3자리)
        const existingCode = result[0].code as string;
        const parts = existingCode.split('-');
        
        if (parts.length >= 3) {
          const currentSequence = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(currentSequence)) {
            nextSequence = currentSequence + 1;
          }
        }
      }
      
      // 3자리 문자열로 포맷팅 (001, 002, ...)
      const formattedSequence = nextSequence.toString().padStart(3, '0');
      
      console.log(`[BACK][getNextSequence] 순번 조회 완료: ${formattedSequence}`);
      return formattedSequence;
      
    } catch (error: any) {
      console.error('[BACK][getNextSequence] 순번 조회 오류:', error);
      throw error;
    }
  }
}
