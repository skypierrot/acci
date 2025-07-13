import { db } from '../orm';
import { annualWorkingHours } from '../orm/schema/annual_working_hours';
import { eq, and, isNull } from 'drizzle-orm';

// 연간 근로시간 서비스
// 회사/사업장 단위로 연도별 근로시간을 관리하며, 마감/마감취소 기능을 제공합니다.
export class AnnualWorkingHoursService {
  /**
   * 연간 근로시간 단일 조회 (회사/사업장/연도 기준)
   */
  static async getOne({ company_id, site_id, year }: { company_id: string, site_id?: string, year: number }) {
    // site_id가 있으면 사업장 단위, 없으면 회사 단위
    const where = and(
      eq(annualWorkingHours.company_id, company_id),
      eq(annualWorkingHours.year, year),
      site_id ? eq(annualWorkingHours.site_id, site_id) : isNull(annualWorkingHours.site_id)
    );
    return db().select().from(annualWorkingHours).where(where).limit(1);
  }

  /**
   * 연간 근로시간 전체 조회 (회사/사업장/연도별)
   */
  static async getList({ company_id, year }: { company_id: string, year?: number }) {
    // 연도별 전체 조회, year가 없으면 전체 연도
    const where = year ? and(eq(annualWorkingHours.company_id, company_id), eq(annualWorkingHours.year, year)) : eq(annualWorkingHours.company_id, company_id);
    return db().select().from(annualWorkingHours).where(where);
  }

  /**
   * 연간 근로시간 등록/수정 (upsert)
   * 종합(total_hours)는 자동 계산
   */
  static async upsert({ company_id, site_id, year, employee_hours, partner_on_hours, partner_off_hours }: {
    company_id: string,
    site_id?: string,
    year: number,
    employee_hours: number,
    partner_on_hours: number,
    partner_off_hours: number
  }) {
    const total_hours = employee_hours + partner_on_hours + partner_off_hours;
    // 이미 존재하면 update, 없으면 insert
    const where = and(
      eq(annualWorkingHours.company_id, company_id),
      eq(annualWorkingHours.year, year),
      site_id ? eq(annualWorkingHours.site_id, site_id) : isNull(annualWorkingHours.site_id)
    );
    const exist = await db().select().from(annualWorkingHours).where(where).limit(1);
    if (exist.length > 0) {
      // 마감된 데이터는 수정 불가
      if (exist[0].is_closed) throw new Error('마감된 연도는 수정할 수 없습니다.');
      return db().update(annualWorkingHours)
        .set({ employee_hours, partner_on_hours, partner_off_hours, total_hours, updated_at: new Date() })
        .where(where);
    } else {
      return db().insert(annualWorkingHours)
        .values({ company_id, site_id, year, employee_hours, partner_on_hours, partner_off_hours, total_hours, created_at: new Date(), updated_at: new Date() });
    }
  }

  /**
   * 연간 근로시간 삭제 (마감된 데이터는 삭제 불가)
   */
  static async remove({ company_id, site_id, year }: { company_id: string, site_id?: string, year: number }) {
    const where = and(
      eq(annualWorkingHours.company_id, company_id),
      eq(annualWorkingHours.year, year),
      site_id ? eq(annualWorkingHours.site_id, site_id) : isNull(annualWorkingHours.site_id)
    );
    const exist = await db().select().from(annualWorkingHours).where(where).limit(1);
    if (exist.length > 0 && exist[0].is_closed) throw new Error('마감된 연도는 삭제할 수 없습니다.');
    return db().delete(annualWorkingHours).where(where);
  }

  /**
   * 연도별 마감 처리 (is_closed = true, closed_at = now)
   * 회사 단위 데이터가 없으면 자동 생성
   */
  static async close({ company_id, site_id, year }: { company_id: string, site_id?: string, year: number }) {
    const where = and(
      eq(annualWorkingHours.company_id, company_id),
      eq(annualWorkingHours.year, year),
      site_id ? eq(annualWorkingHours.site_id, site_id) : isNull(annualWorkingHours.site_id)
    );
    
    // 회사 단위 마감인 경우 (site_id가 null)
    if (!site_id) {
      const exist = await db().select().from(annualWorkingHours).where(where).limit(1);
      if (exist.length === 0) {
        // 회사 단위 데이터가 없으면 생성
        await db().insert(annualWorkingHours)
          .values({ 
            company_id, 
            site_id: null, 
            year, 
            employee_hours: 0, 
            partner_on_hours: 0, 
            partner_off_hours: 0, 
            total_hours: 0,
            is_closed: true,
            closed_at: new Date(),
            created_at: new Date(), 
            updated_at: new Date() 
          });
        return;
      }
    }
    
    return db().update(annualWorkingHours)
      .set({ is_closed: true, closed_at: new Date(), updated_at: new Date() })
      .where(where);
  }

  /**
   * 연도별 마감 취소 (is_closed = false, closed_at = null)
   */
  static async open({ company_id, site_id, year }: { company_id: string, site_id?: string, year: number }) {
    const where = and(
      eq(annualWorkingHours.company_id, company_id),
      eq(annualWorkingHours.year, year),
      site_id ? eq(annualWorkingHours.site_id, site_id) : isNull(annualWorkingHours.site_id)
    );
    
    // 회사 단위 마감취소인 경우 (site_id가 null)
    if (!site_id) {
      const exist = await db().select().from(annualWorkingHours).where(where).limit(1);
      if (exist.length === 0) {
        // 회사 단위 데이터가 없으면 생성 (마감되지 않은 상태로)
        await db().insert(annualWorkingHours)
          .values({ 
            company_id, 
            site_id: null, 
            year, 
            employee_hours: 0, 
            partner_on_hours: 0, 
            partner_off_hours: 0, 
            total_hours: 0,
            is_closed: false,
            closed_at: null,
            created_at: new Date(), 
            updated_at: new Date() 
          });
        return;
      }
    }
    
    return db().update(annualWorkingHours)
      .set({ is_closed: false, closed_at: null, updated_at: new Date() })
      .where(where);
  }
} 