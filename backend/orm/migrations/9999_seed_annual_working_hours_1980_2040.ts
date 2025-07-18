import { db, connectDB } from '../index';
import { annualWorkingHours } from '../schema/annual_working_hours';
import { company, site } from '../schema/company';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * 1980~2040년까지 회사/사업장별 연간근로시간 row를 미리 생성하는 seed 스크립트
 * 이미 row가 있으면 건너뜀(중복 생성 방지)
 */
async function seedAnnualWorkingHours() {
  // DB 연결 초기화
  connectDB();
  // 1. 회사 목록 조회
  const companies = await db().select().from(company);
  for (const c of companies) {
    // 2. 사업장 목록 조회 (site 테이블에서 companyId로 조회)
    const sites = await db().select().from(site).where(eq(site.companyId, c.id));
    // 3. 전사(null) + 각 사업장별로 row 생성
    const siteList = [null, ...sites];
    for (const s of siteList) {
      for (let year = 1980; year <= 2040; year++) {
        // 4. 이미 row가 있으면 건너뜀
        const exist = await db().select().from(annualWorkingHours).where(and(
          eq(annualWorkingHours.company_id, c.id),
          eq(annualWorkingHours.year, year),
          s ? eq(annualWorkingHours.site_id, s.id) : isNull(annualWorkingHours.site_id)
        )).limit(1);
        if (exist.length > 0) continue;
        // 5. row 생성
        await db().insert(annualWorkingHours).values({
          company_id: c.id,
          site_id: s ? s.id : null,
          year,
          employee_hours: 0,
          partner_on_hours: 0,
          partner_off_hours: 0,
          total_hours: 0,
          is_closed: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }
  }
  console.log('1980~2040년 연간근로시간 row 생성 완료!');
}

// 직접 실행
seedAnnualWorkingHours().then(() => process.exit(0)); 