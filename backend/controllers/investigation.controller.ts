/**
 * @file controllers/investigation.controller.ts
 * @description 조사보고서 관련 API 엔드포인트를 처리하는 컨트롤러
 */

import { Request, Response } from "express";
import InvestigationService, { InvestigationReportData } from "../services/investigation.service";

export default class InvestigationController {
  
  /**
   * 조사보고서 생성
   * POST /api/investigation
   */
  static async create(req: Request, res: Response) {
    try {
      console.log("[INVESTIGATION][POST] 조사보고서 생성 요청:", req.body);
      
      const data: InvestigationReportData = req.body;
      
      // 필수 필드 검증
      if (!data.accident_id) {
        return res.status(400).json({
          success: false,
          message: "사고 ID는 필수입니다.",
        });
      }

      // 조사보고서 중복 생성 방지
      const exists = await InvestigationService.exists(data.accident_id);
      if (exists) {
        return res.status(409).json({
          success: false,
          message: "해당 사고에 대한 조사보고서가 이미 존재합니다.",
        });
      }

      const result = await InvestigationService.create(data);
      
      console.log("[INVESTIGATION][POST] 조사보고서 생성 완료");
      res.status(201).json({
        success: true,
        message: "조사보고서가 생성되었습니다.",
        data: result,
      });
    } catch (error: any) {
      console.error("[INVESTIGATION][POST] 조사보고서 생성 실패:", error);
      res.status(500).json({
        success: false,
        message: error.message || "조사보고서 생성 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 조사보고서 조회 (ID로)
   * GET /api/investigation/:id
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log("[INVESTIGATION][GET] 조사보고서 조회:", id);
      
      const result = await InvestigationService.getById(id);
      
      console.log("[INVESTIGATION][GET] 조사보고서 조회 완료");
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[INVESTIGATION][GET] 조사보고서 조회 실패:", error);
      
      if (error.message.includes("찾을 수 없습니다")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "조사보고서 조회 중 오류가 발생했습니다.",
        });
      }
    }
  }

  /**
   * 조사보고서 수정
   * PUT /api/investigation/:id
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      console.log("[INVESTIGATION][PUT] 조사보고서 수정:", id, data);
      
      // 빈 문자열 timestamp 필드들을 제거
      const cleanedData = { ...data };
      
      // timestamp 필드들에서 빈 문자열 제거
      const timestampFields = [
        'investigation_start_time', 
        'investigation_end_time',
        'original_acci_time',
        'investigation_acci_time',
        'report_written_date'
      ];
      
      timestampFields.forEach(field => {
        if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
          delete cleanedData[field]; // 빈 문자열이나 null/undefined는 제거
        }
      });
      
      // 읽기 전용 필드 제거 (데이터베이스에서 자동 관리)
      delete cleanedData.created_at;
      delete cleanedData.updated_at;
      
      const result = await InvestigationService.update(id, cleanedData);
      
      console.log("[INVESTIGATION][PUT] 조사보고서 수정 완료");
      res.json({
        success: true,
        message: "조사보고서가 수정되었습니다.",
        data: result,
      });
    } catch (error: any) {
      console.error("[INVESTIGATION][PUT] 조사보고서 수정 실패:", error);
      
      if (error.message.includes("찾을 수 없습니다")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "조사보고서 수정 중 오류가 발생했습니다.",
        });
      }
    }
  }

  /**
   * 조사보고서 삭제
   * DELETE /api/investigation/:id
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log("[INVESTIGATION][DELETE] 조사보고서 삭제:", id);
      
      const result = await InvestigationService.delete(id);
      
      console.log("[INVESTIGATION][DELETE] 조사보고서 삭제 완료");
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error("[INVESTIGATION][DELETE] 조사보고서 삭제 실패:", error);
      res.status(500).json({
        success: false,
        message: "조사보고서 삭제 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 조사보고서 목록 조회
   * GET /api/investigation
   */
  static async getList(req: Request, res: Response) {
    try {
      const { investigation_status, investigation_team_lead, searchTerm, limit, offset } = req.query;
      
      const filters = {
        investigation_status: investigation_status as string,
        investigation_team_lead: investigation_team_lead as string,
        searchTerm: searchTerm as string, // 검색어 파라미터 추가
        limit: limit ? parseInt(limit as string) : 10, // 기본 limit 10
        offset: offset ? parseInt(offset as string) : 0,
      };
      
      console.log("[INVESTIGATION][GET_LIST] 조사보고서 목록 조회:", filters);
      
      const result = await InvestigationService.getList(filters);
      
      // 페이지네이션 메타 데이터 계산
      const limitNum = filters.limit;
      const offsetNum = filters.offset;
      const total = result.total;
      const currentPage = Math.floor(offsetNum / limitNum) + 1;
      const totalPages = Math.ceil(total / limitNum);
      
      console.log("[INVESTIGATION][GET_LIST] 조사보고서 목록 조회 완료");
      res.json({
        success: true,
        reports: result.data,
        totalPages,
        currentPage,
        total,
      });
    } catch (error: any) {
      console.error("[INVESTIGATION][GET_LIST] 조사보고서 목록 조회 실패:", error);
      res.status(500).json({
        success: false,
        message: "조사보고서 목록 조회 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 조사보고서 존재 여부 확인
   * GET /api/investigation/:id/exists
   */
  static async checkExists(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log("[INVESTIGATION][EXISTS] 조사보고서 존재 확인:", id);
      
      const exists = await InvestigationService.exists(id);
      
      console.log("[INVESTIGATION][EXISTS] 조사보고서 존재 확인 완료:", exists);
      res.json({
        success: true,
        exists: exists,
      });
    } catch (error: any) {
      console.error("[INVESTIGATION][EXISTS] 조사보고서 존재 확인 실패:", error);
      res.status(500).json({
        success: false,
        message: "조사보고서 존재 확인 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 조사보고서 상태 업데이트
   * PATCH /api/investigation/:id/status
   */
  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      console.log("[INVESTIGATION][PATCH_STATUS] 조사보고서 상태 업데이트:", id, status);
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: "상태 값은 필수입니다.",
        });
      }
      
      const result = await InvestigationService.updateStatus(id, status);
      
      console.log("[INVESTIGATION][PATCH_STATUS] 조사보고서 상태 업데이트 완료");
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error("[INVESTIGATION][PATCH_STATUS] 조사보고서 상태 업데이트 실패:", error);
      res.status(500).json({
        success: false,
        message: "조사보고서 상태 업데이트 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 발생보고서에서 조사보고서 생성 (기본 정보 복사)
   * POST /api/investigation/from-occurrence/:occurrenceId
   */
  static async createFromOccurrence(req: Request, res: Response) {
    try {
      const { occurrenceId } = req.params;
      const additionalData = req.body;
      
      console.log("[INVESTIGATION][CREATE_FROM_OCCURRENCE] 발생보고서에서 조사보고서 생성:", occurrenceId);
      
      // 빈 문자열 timestamp 필드들을 null로 변환
      const cleanedData = { ...additionalData };
      
      // timestamp 필드들 처리
      const timestampFields = ['investigation_start_time', 'investigation_end_time'];
      timestampFields.forEach(field => {
        if (cleanedData[field] === '') {
          delete cleanedData[field]; // 빈 문자열은 제거
        }
      });
      
      // 발생보고서 기반으로 조사보고서 생성 (원본 정보 자동 복사)
      const result = await InvestigationService.createFromOccurrence(occurrenceId);
      
      // 추가 데이터가 있으면 업데이트
      if (Object.keys(cleanedData).length > 0) {
        await InvestigationService.update(occurrenceId, cleanedData);
      }
      
      console.log("[INVESTIGATION][CREATE_FROM_OCCURRENCE] 조사보고서 생성 완료");
      res.status(201).json({
        success: true,
        message: "발생보고서를 기반으로 조사보고서가 생성되었습니다.",
        data: result,
      });
    } catch (error: any) {
      console.error("[INVESTIGATION][CREATE_FROM_OCCURRENCE] 조사보고서 생성 실패:", error);
      if (error.message?.includes("이미 조사보고서가 존재합니다")) {
        return res.status(409).json({
          success: false,
          message: error.message,
          existingId: req.params.occurrenceId
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "조사보고서 생성 중 오류가 발생했습니다.",
      });
    }
  }
}
