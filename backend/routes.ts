/**
 * @file routes.ts
 * @description
 *  - Express Router를 사용하여 모든 RESTful API 엔드포인트를 정의합니다.
 *  - 인증 미들웨어(authMiddleware)로 보호가 필요한 경로에 대해
 *    JWT 검증을 수행하도록 설정합니다.
 */

import { Router } from "express";
import OccurrenceController from "./controllers/occurrence.controller";
import InvestigationController from "./controllers/investigation.controller";
import HistoryController from "./controllers/history.controller";
import AuthController from "./controllers/auth.controller";
import FileController from "./controllers/file.controller";
import * as CompanyController from "./controllers/company.controller";
import ReportFormController from "./controllers/report_form.controller";
import { authMiddleware } from "./middleware/auth.middleware";

const router = Router();

/**
 * ──────────────────────────────────────────────────────────────
 * 1) 인증 관련 라우트 (아래 3개)
 *    - POST /api/auth/login   : 로그인 (JWT 발급)
 *    - GET  /api/auth/me      : 현재 로그인 사용자 정보 조회 (token 필요)
 *    - POST /api/auth/logout  : 로그아웃 (토큰 무효화)
 * ──────────────────────────────────────────────────────────────
 */
router.post("/auth/login", AuthController.login);
router.get("/auth/me", authMiddleware, AuthController.me);
router.post("/auth/logout", authMiddleware, AuthController.logout);

/**
 * ──────────────────────────────────────────────────────────────
 * 2) 사고 발생보고 (OCCURRENCE_REPORT) 관련 라우트
 *    - 개발 중에는 인증 미들웨어를 제거하여 테스트를 용이하게 합니다.
 * ──────────────────────────────────────────────────────────────
 */
router.get("/occurrence", OccurrenceController.list);
router.get("/occurrence/sequence/:type/:code/:year", OccurrenceController.getNextSequence);
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
router.get("/investigation", InvestigationController.getList);
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

export default router;
