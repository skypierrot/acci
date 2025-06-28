/**
 * @file orm/migrations/add_grid_layout_to_report_form.js
 * @description
 *  - report_form_settings 테이블에 grid_layout 필드 추가
 *  - grid_layout: JSONB 타입, 필드의 그리드 레이아웃 정보 (x, y: 위치, w, h: 크기)
 */

const { Client } = require('pg');

// 기본 그리드 레이아웃 값
const DEFAULT_GRID_LAYOUT = { x: 0, y: 0, w: 1, h: 1 };

// PostgreSQL 접속 정보
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:6543/acci_kpi';

async function runMigration() {
  const client = new Client({ connectionString });
  
  try {
    console.log('DB 연결 중...');
    await client.connect();
    
    // 테이블이 있는지 확인
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'report_form_settings'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('report_form_settings 테이블이 존재하지 않습니다.');
      return;
    }
    
    // grid_layout 필드가 있는지 확인
    const columnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'report_form_settings' AND column_name = 'grid_layout'
      );
    `);
    
    if (columnCheck.rows[0].exists) {
      console.log('grid_layout 필드가 이미 존재합니다.');
      return;
    }
    
    console.log('grid_layout 필드 추가 중...');
    
    // 트랜잭션 시작
    await client.query('BEGIN');
    
    // 필드 추가
    await client.query(`
      ALTER TABLE report_form_settings
      ADD COLUMN IF NOT EXISTS grid_layout JSONB DEFAULT '${JSON.stringify(DEFAULT_GRID_LAYOUT)}';
    `);
    
    // 기존 데이터 업데이트
    const fields = await client.query(`
      SELECT id, field_name, display_order, field_group
      FROM report_form_settings;
    `);
    
    // 기존 필드 데이터에 기본 그리드 레이아웃 정보 설정
    for (const field of fields.rows) {
      // 그룹별 필드 위치 계산
      const displayOrder = field.display_order || 0;
      const row = Math.floor(displayOrder / 3);
      const col = displayOrder % 3;
      
      let width = 1;
      let height = 1;
      
      // 특정 필드는 더 큰 크기로 설정
      if (field.field_name.includes('summary') || field.field_name.includes('detail')) {
        width = 3;  // 전체 너비
        height = 2; // 더 높은 높이
      } else if (field.field_name.includes('time') || field.field_name.includes('location')) {
        width = 2;  // 더 넓은 너비
      }
      
      const gridLayout = {
        x: col,
        y: row,
        w: width,
        h: height
      };
      
      await client.query(`
        UPDATE report_form_settings
        SET grid_layout = $1
        WHERE id = $2;
      `, [gridLayout, field.id]);
    }
    
    // 트랜잭션 커밋
    await client.query('COMMIT');
    
    console.log('Migration 완료: grid_layout 필드가 추가되었습니다.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration 오류:', err);
    throw err;
  } finally {
    await client.end();
  }
}

// 마이그레이션 실행
runMigration()
  .then(() => console.log('Migration 스크립트가 성공적으로 실행되었습니다.'))
  .catch(err => {
    console.error('Migration 스크립트 실행 중 오류가 발생했습니다:', err);
    process.exit(1);
  }); 