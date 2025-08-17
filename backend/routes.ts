/**
 * @file routes.ts
 * @description
 *  - Express Router를 사용하여 모든 RESTful API 엔드포인트를 정의합니다.
 *  - 개발 중에는 인증 미들웨어를 비활성화하여 테스트를 용이하게 합니다.
 *  - 프로덕션 배포 시 인증 미들웨어를 활성화해야 합니다.
 */

import { Router } from "express";
import OccurrenceController from "./controllers/occurrence.controller";
import InvestigationController from "./controllers/investigation.controller";
import HistoryController from "./controllers/history.controller";
// 인증 관련 컨트롤러 완전 제거 (개발 중 인증 비활성화)
// import AuthController from "./controllers/auth.controller";
import FileController from "./controllers/file.controller";
import * as CompanyController from "./controllers/company.controller";
import ReportFormController from "./controllers/report_form.controller";
// 인증 미들웨어 완전 제거 (개발 중 인증 비활성화)
// import { authMiddleware } from "./middleware/auth.middleware";
import { AnnualWorkingHoursController } from './controllers/annual_working_hours.controller';
import LaggingController from './controllers/lagging.controller';
// 중앙 로그인 시스템 연동 컨트롤러 완전 제거 (개발 중 인증 비활성화)
// import * as AuthProController from "./controllers/auth_pro.controller";
// 사용자 관리 컨트롤러 완전 제거 (개발 중 인증 비활성화)
// import UsersController from "./controllers/users.controller";

const router = Router();

/**
 * ──────────────────────────────────────────────────────────────
 * 1) 인증 관련 라우트 (개발 중 비활성화)
 *    - POST /api/auth/login   : 로그인 (JWT 발급) - 주석처리
 *    - GET  /api/auth/me      : 현재 로그인 사용자 정보 조회 (token 필요) - 주석처리
 *    - POST /api/auth/logout  : 로그아웃 (토큰 무효화) - 주석처리
 * ──────────────────────────────────────────────────────────────
 */
// router.post("/auth/login", AuthController.login);
// router.get("/auth/me", authMiddleware, AuthController.me);
// router.post("/auth/logout", authMiddleware, AuthController.logout);

/**
 * ──────────────────────────────────────────────────────────────
 * 1-1) 중앙 로그인 시스템 연동 라우트 (개발 중 비활성화)
 *    - POST /api/auth-pro/login      : 중앙 시스템을 통한 로그인 - 주석처리
 *    - POST /api/auth-pro/mfa        : MFA 인증 - 주석처리
 *    - POST /api/auth-pro/refresh    : 토큰 갱신 - 주석처리
 *    - POST /api/auth-pro/logout     : 로그아웃 - 주석처리
 *    - GET  /api/auth-pro/user       : 사용자 정보 조회 - 주석처리
 *    - POST /api/auth-pro/verify     : 토큰 검증 - 주석처리
 * ──────────────────────────────────────────────────────────────
 */
// router.post("/auth-pro/login", AuthProController.loginWithAuthPro);
// router.post("/auth-pro/mfa", AuthProController.verifyMFA);
// router.post("/auth-pro/refresh", AuthProController.refreshToken);
// router.post("/auth-pro/logout", authMiddleware, AuthProController.logout);
// router.get("/auth-pro/user", authMiddleware, AuthProController.getUserInfo);
// router.post("/auth-pro/verify", AuthProController.verifyToken);

/**
 * ──────────────────────────────────────────────────────────────
 * 2) 사고 발생보고 (OCCURRENCE_REPORT) 관련 라우트
 *    - 개발 중에는 인증 미들웨어를 제거하여 테스트를 용이하게 합니다.
 * ──────────────────────────────────────────────────────────────
 */
router.get("/occurrence", OccurrenceController.list);
router.get("/occurrence/sequence/:type/:code/:year", OccurrenceController.getNextSequence);
router.get("/occurrence/all", OccurrenceController.getAllByYear);
router.get("/occurrence/:id", OccurrenceController.getById);
router.post("/occurrence", OccurrenceController.create);
router.put("/occurrence/:id", OccurrenceController.update);
router.delete("/occurrence/:id", OccurrenceController.remove);

/**
 * ──────────────────────────────────────────────────────────────
 * 3) 사고 조사보고 (INVESTIGATION_REPORT) 관련 라우트
 *    - 단일 사고 ID 기준으로 조회/생성/수정/삭제 수행
 *    - 개발 중에는 인증 미들웨어를 제거하여 테스트를 용이하게 합니다.
 * ──────────────────────────────────────────────────────────────
 */
// 조사보고서(개선조치) 통계 API - 인증 없이 사용 (프론트 대시보드용)
router.get("/investigation", InvestigationController.getList);

// 개선조치(CorrectiveAction) 관련 API 라우팅 - 더 구체적인 라우트를 먼저 선언
// 개선조치 통계 및 필터링
router.get("/investigation/corrective-actions/stats", InvestigationController.getCorrectiveActionsStats);
console.log('[ROUTES] 라우트 등록: /investigation/corrective-actions/stats');

// 연도별 전체 개선조치 리스트 조회 (더 구체적인 라우트를 먼저 선언)
console.log('[ROUTES] 라우트 등록 시작: /investigation/corrective-actions');
router.get("/investigation/corrective-actions", InvestigationController.getAllCorrectiveActionsByYear);
console.log('[ROUTES] 라우트 등록 완료: /investigation/corrective-actions');

// 조사보고서별 개선조치 CRUD (파라미터가 있는 라우트는 나중에 선언)
console.log('[ROUTES] 라우트 등록: /investigation/:id/corrective-actions');
router.get("/investigation/:id/corrective-actions", InvestigationController.getCorrectiveActionsByInvestigation);
router.get("/investigation/:id/corrective-actions/:actionId", InvestigationController.getCorrectiveActionById);
router.post("/investigation/:id/corrective-actions", InvestigationController.createCorrectiveAction);
router.put("/investigation/:id/corrective-actions/:actionId", InvestigationController.updateCorrectiveAction);
router.delete("/investigation/:id/corrective-actions/:actionId", InvestigationController.deleteCorrectiveAction);

// 조사보고서 기본 CRUD (파라미터가 있는 라우트는 나중에 선언)
router.get("/investigation/:id", InvestigationController.getById);
router.get("/investigation/:id/exists", InvestigationController.checkExists);
router.get("/investigation/:id/original-property-damage", InvestigationController.getOriginalPropertyDamage);
router.get("/investigation/:id/original-victim/:victimIndex", InvestigationController.getOriginalVictim);
router.get("/investigation/:id/original-property-damage/:damageIndex", InvestigationController.getOriginalPropertyDamageItem);
router.post("/investigation", InvestigationController.create);
router.post("/investigation/from-occurrence/:occurrenceId", InvestigationController.createFromOccurrence);
router.put("/investigation/:id", InvestigationController.update);
router.patch("/investigation/:id/status", InvestigationController.updateStatus);
router.delete("/investigation/:id", InvestigationController.delete);

/**
 * ──────────────────────────────────────────────────────────────
 * 4) 사고 이력(목록) 조회 (ACCIDENT_HISTORY) 관련 라우트
 *    - GET /api/history       : 페이징·필터링 포함 목록 조회
 *    - GET /api/history/:id   : 단일 사고 이력 상세 조회
 * ──────────────────────────────────────────────────────────────
 */
router.get("/history", HistoryController.list);
router.get("/history/:id", HistoryController.getById);

/**
 * ──────────────────────────────────────────────────────────────
 * 5) 파일 업로드/다운로드 관련 라우트
 *    - POST   /api/files/upload         : 파일(이미지 등) 업로드
 *    - POST   /api/files/attach         : 업로드된 파일을 보고서에 첨부
 *    - GET    /api/files/:fileId        : 파일 다운로드
 *    - GET    /api/files/:fileId/info   : 파일 정보 조회
 *    - GET    /api/files/:fileId/preview: 파일 미리보기 (이미지)
 *    - DELETE /api/files/:fileId        : 파일 삭제
 *    - DELETE /api/files/cleanup        : 고아 파일 정리
 * ──────────────────────────────────────────────────────────────
 */
// upload는 배열로 정의되어 있으므로 스프레드 연산자(...)를 사용하여 풀어줍니다
// 개발 중에는 인증 미들웨어 제거
router.post("/files/upload", ...FileController.upload);
router.post("/files/attach", FileController.attachToReport);
router.get("/files/:fileId", FileController.download);
router.get("/files/:fileId/info", FileController.getFileInfo);
router.get("/files/:fileId/preview", FileController.preview);
router.delete("/files/:fileId", FileController.delete);
router.delete("/files/cleanup", FileController.cleanupOrphanedFiles);

/**
 * ──────────────────────────────────────────────────────────────
 * 6) 회사 및 사업장 관리 관련 라우트
 *    - GET    /api/companies      : 회사 및 사업장 목록 조회
 *    - GET    /api/companies/:id  : 특정 회사 정보 조회
 *    - POST   /api/companies      : 회사 정보 생성
 *    - PUT    /api/companies/:id  : 회사 정보 수정
 *    - DELETE /api/companies/:id  : 회사 삭제
 *    - POST   /api/sites          : 사업장 정보 생성
 *    - PUT    /api/sites/:id      : 사업장 정보 수정
 *    - DELETE /api/sites/:id      : 사업장 삭제
 *    - POST   /api/settings/companies : 전체 회사 및 사업장 정보 일괄 저장
 * ──────────────────────────────────────────────────────────────
 */
// 개발 중에는 인증 미들웨어를 제거 (테스트 용이성을 위해)
router.get("/companies", CompanyController.getCompanies);
router.get("/companies/:id", CompanyController.getCompanyById);
router.post("/companies", CompanyController.saveCompany);
router.put("/companies/:id", CompanyController.updateCompany);
router.delete("/companies/:id", CompanyController.deleteCompany);
router.get("/sites", CompanyController.getSites);
router.post("/sites", CompanyController.saveSite);
router.put("/sites/:id", CompanyController.updateSite);
router.delete("/sites/:id", CompanyController.deleteSite);
router.post("/settings/companies", CompanyController.saveAllCompanies);

/**
 * ──────────────────────────────────────────────────────────────
 * 7) 보고서 양식 설정 관련 라우트
 *    - GET    /api/settings/reports/:reportType           : 보고서 양식 설정 조회
 *    - PUT    /api/settings/reports/:reportType           : 보고서 양식 설정 업데이트
 *    - GET    /api/settings/reports/:reportType/required  : 필수 입력 필드 조회
 *    - GET    /api/settings/reports/:reportType/visible   : 표시 여부 필드 조회
 *    - POST   /api/settings/reports/:reportType/reset     : 설정 초기화
 *    - POST   /api/settings/reports/:reportType/save-as-default : 현재 설정을 기본설정으로 저장
 *    - POST   /api/settings/reports/:reportType/reset-to-default : 기본설정으로 초기화
 *    - POST   /api/settings/reports/move-victim-count     : 재해자 수 필드 이동
 *    - POST   /api/settings/reports/:reportType/add-missing-fields : 누락된 필드 추가
 *    - GET    /api/settings/reports/sequence                : 보고서 양식 시퀀스 조회
 *    - PUT    /api/settings/reports/sequence                : 보고서 양식 시퀀스 업데이트
 * ──────────────────────────────────────────────────────────────
 */
router.get("/settings/reports/:reportType", ReportFormController.getFormSettings);
router.put("/settings/reports/:reportType", ReportFormController.updateFormSettings);
router.get("/settings/reports/:reportType/required", ReportFormController.getRequiredFields);
router.get("/settings/reports/:reportType/visible", ReportFormController.getFieldsByVisibility);
router.post("/settings/reports/:reportType/reset", ReportFormController.resetFormSettings);
router.post("/settings/reports/:reportType/save-as-default", ReportFormController.saveCurrentSettingsAsDefault);
router.post("/settings/reports/:reportType/reset-to-default", ReportFormController.resetToDefaultSettings);
router.post("/settings/reports/:reportType/move-victim-count", ReportFormController.moveVictimCountField);
router.post("/settings/reports/:reportType/add-missing-fields", ReportFormController.addMissingFields);
router.get("/settings/reports/sequence", ReportFormController.getSequence);
router.put("/settings/reports/sequence", ReportFormController.updateSequence);

/**
 * ──────────────────────────────────────────────────────────────
 * 8) 연간 근로시간 관리 관련 라우트
 *    - GET    /settings/annual-working-hours           : 전체 목록 조회(회사/연도별)
 *    - GET    /settings/annual-working-hours/one       : 단일 조회(회사/사업장/연도)
 *    - POST   /settings/annual-working-hours           : 등록/수정(upsert)
 *    - DELETE /settings/annual-working-hours           : 삭제
 *    - POST   /settings/annual-working-hours/close     : 연도별 마감
 *    - POST   /settings/annual-working-hours/open      : 연도별 마감취소
 * ──────────────────────────────────────────────────────────────
 */
router.get("/settings/annual-working-hours", AnnualWorkingHoursController.getList);
router.get("/settings/annual-working-hours/one", AnnualWorkingHoursController.getOne);
router.post("/settings/annual-working-hours", AnnualWorkingHoursController.upsert);
router.delete("/settings/annual-working-hours", AnnualWorkingHoursController.remove);
router.post("/settings/annual-working-hours/close", AnnualWorkingHoursController.close);
router.post("/settings/annual-working-hours/open", AnnualWorkingHoursController.open);

/**
 * ──────────────────────────────────────────────────────────────
 * 9) Lagging 지표 관련 라우트
 *    - GET    /api/lagging/summary/:year           : 특정 연도 지표 요약 조회
 *    - GET    /api/lagging/chart-data              : 차트 데이터 배치 조회
 *    - POST   /api/lagging/investigation-batch     : 조사보고서 배치 조회
 * ──────────────────────────────────────────────────────────────
 */
router.get("/lagging/summary/:year", LaggingController.getSummary);
router.get("/lagging/chart-data", LaggingController.getChartData);
router.post("/lagging/investigation-batch", LaggingController.getInvestigationBatch);

/**
 * ──────────────────────────────────────────────────────────────
 * 10) 사용자 관리 관련 라우트 (개발 중 비활성화)
 *    - GET    /api/settings/users                    : 사용자 목록 조회 - 주석처리
 *    - GET    /api/settings/users/:id                : 특정 사용자 정보 조회 - 주석처리
 *    - POST   /api/settings/users                    : 사용자 생성 - 주석처리
 *    - PUT    /api/settings/users/:id                : 사용자 정보 수정 - 주석처리
 *    - PUT    /api/settings/users/:id/password       : 사용자 비밀번호 변경 - 주석처리
 *    - DELETE /api/settings/users/:id                : 사용자 삭제 - 주석처리
 *    - GET    /api/settings/users/check-username/:username : 사용자명 중복 확인 - 주석처리
 *    - GET    /api/settings/users/check-email/:email : 이메일 중복 확인 - 주석처리
 * ──────────────────────────────────────────────────────────────
 */
// router.get("/settings/users", UsersController.getAllUsers);
// router.get("/settings/users/:id", UsersController.getUserById);
// router.post("/settings/users", UsersController.createUser);
// router.put("/settings/users/:id", UsersController.updateUser);
// router.put("/settings/users/:id/password", UsersController.changePassword);
// router.delete("/settings/users/:id", UsersController.deleteUser);
// router.get("/settings/users/check-username/:username", UsersController.checkUsername);
// router.get("/settings/users/check-email/:email", UsersController.checkEmail);

// 한국 표준시 API
router.get('/server-time', (req, res) => {
  const now = new Date();
  res.json({
    serverTime: now.toISOString(), // UTC만 내려줌
    timezone: 'Asia/Seoul',
    timestamp: now.getTime()
  });
});

export default router;
