import { db } from '../index';
import { investigationReport } from '../schema/investigation';
import { correctiveAction } from '../schema/investigation';
import { eq, sql } from 'drizzle-orm';

/**
 * @file 9999_migrate_prevention_actions_to_corrective_action.ts
 * @description
 *  - investigation_report 테이블의 prevention_actions(JSON) 필드에서 개선조치 데이터를 추출하여
 *    corrective_action 테이블로 이관하는 마이그레이션 스크립트
 *  - 기존 JSON 구조: technical_actions, educational_actions, managerial_actions 배열
 *  - 대상 테이블: corrective_action
 *  - 매핑: investigation_id, action_type, improvement_plan, progress_status, scheduled_date, responsible_person 등
 */

async function migratePreventionActions() {
  // 1. 모든 조사보고서 데이터 조회
  const reports = await db().select().from(investigationReport);

  let insertCount = 0;

  for (const report of reports) {
    const { accident_id, prevention_actions } = report;
    if (!prevention_actions) continue;
    let actionsJson;
    try {
      actionsJson = typeof prevention_actions === 'string' ? JSON.parse(prevention_actions) : prevention_actions;
    } catch (e) {
      console.error(`[SKIP] JSON 파싱 오류: accident_id=${accident_id}`);
      continue;
    }
    // 각 action type별로 반복
    for (const type of ['technical_actions', 'educational_actions', 'managerial_actions']) {
      const arr = actionsJson[type] || [];
      for (const action of arr) {
        // 한글 주석: 각 개선조치 항목을 corrective_action 테이블에 insert
        await db().insert(correctiveAction).values({
          investigation_id: accident_id,
          action_type: action.action_type || type.replace('_actions',''),
          title: action.title || null,
          improvement_plan: action.improvement_plan,
          progress_status: action.progress_status,
          scheduled_date: action.scheduled_date,
          responsible_person: action.responsible_person,
        });
        insertCount++;
      }
    }
  }
  console.log(`총 ${insertCount}건의 개선조치가 corrective_action 테이블로 이관되었습니다.`);
}

// 스크립트 직접 실행 시
if (require.main === module) {
  migratePreventionActions().then(() => process.exit(0));
}

export { migratePreventionActions }; 