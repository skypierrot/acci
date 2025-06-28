/**
 * @file controllers/occurrence.controller.ts
 * @description
 *  - 사고 발생보고(Occurrence Report) 관련 비즈니스 로직을 처리하는 Controller입니다.
 *  - HTTP 요청(Express Request)을 받아, Service를 호출하고 응답을 반환합니다.
 */

import { Request, Response } from "express";
import OccurrenceService from "../services/occurrence.service";

export default class OccurrenceController {
  /**
   * @method list
   * @description
   *  - GET /api/occurrence
   *  - 사고 발생보고 리스트를 페이징/필터링하여 조회합니다.
   * @param req Express Request 객체 (쿼리 파라미터: page, size, company, status, from, to)
   * @param res Express Response 객체
   */
  static async list(req: Request, res: Response) {
    // 쿼리 파라미터에서 페이징/필터 값을 가져옵니다.
    const { page = "1", size = "20", company, status, from, to } = req.query;
    const filters = {
      company: String(company || ""),
      status: String(status || ""),
      from: String(from || ""),
      to: String(to || ""),
    };
    const pagination = { page: Number(page), size: Number(size) };

    try {
      // Service 계층에 페이징/필터 정보를 전달하여 결과를 받아옵니다.
      const result = await OccurrenceService.fetchList(filters, pagination);
      return res.status(200).json(result);
    } catch (error: any) {
      // 에러 발생 시 500 Internal Server Error 응답
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * @method getById
   * @description
   *  - GET /api/occurrence/:id
   *  - 단일 사고 발생보고 상세 정보를 조회합니다.
   * @param req Express Request 객체 (경로 파라미터: id)
   * @param res Express Response 객체
   */
  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      // Service 계층에서 해당 id의 레코드를 조회
      const occurrence = await OccurrenceService.getById(id);
      if (!occurrence) {
        // 레코드가 없으면 404 Not Found 응답
        return res.status(404).json({ error: "사고를 찾을 수 없습니다." });
      }
      return res.status(200).json(occurrence);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * @method create
   * @description
   *  - POST /api/occurrence
   *  - 새로운 사고 발생보고를 등록합니다.
   * @param req Express Request 객체 (요청 바디: 사고 등록 정보)
   * @param res Express Response 객체
   */
  static async create(req: Request, res: Response) {
    try {
      // 요청 본문 로깅
      console.log("===== 사고 발생보고서 생성 요청 시작 =====");
      console.log("요청 본문 주요 필드:", {
        company: req.body.company_name,
        site: req.body.site_name,
        first_report_time: req.body.first_report_time,
        acci_time: req.body.acci_time,
        accident_id: req.body.accident_id,
        global_accident_no: req.body.global_accident_no
      });
      
      // victims_json 필드 유효성 검사
      if (req.body.victims_json) {
        try {
          JSON.parse(req.body.victims_json);
          console.log("victims_json 파싱 성공");
        } catch (e) {
          console.error("victims_json 파싱 오류:", e);
          req.body.victims_json = '[]';
        }
      }

      const newData = req.body;
      console.log("서비스 계층 호출 직전");
      
      // Service 계층에 전달하여 DB에 삽입 및 결과 반환
      const created = await OccurrenceService.create(newData);
      console.log("사고 발생보고서 생성 성공:", created.accident_id);
      
      return res.status(201).json(created);
    } catch (err: any) {
      console.error("===== 사고 발생보고서 생성 오류 =====");
      console.error("오류 메시지:", err.message);
      console.error("오류 스택:", err.stack);
      
      if (err.code) {
        console.error("데이터베이스 오류 코드:", err.code);
      }
      
      if (err.detail) {
        console.error("데이터베이스 오류 상세:", err.detail);
      }
      
      // 유효성 검증 실패 등 예외 처리 시 500 Internal Server Error 반환
      // 클라이언트에서 더 자세한 오류 정보를 확인할 수 있도록 함
      return res.status(500).json({ 
        error: err.message,
        details: err.stack,
        code: err.code,
        detail: err.detail
      });
    }
  }

  /**
   * @method update
   * @description
   *  - PUT /api/occurrence/:id
   *  - 기존 사고 발생보고를 수정합니다.
   * @param req Express Request 객체 (경로 파라미터: id, 바디: 수정할 필드)
   * @param res Express Response 객체
   */
  static async update(req: Request, res: Response) {
    const { id } = req.params;
    try {
      // Service 계층에 id와 수정할 데이터를 전달
      const updated = await OccurrenceService.update(id, req.body);
      return res.status(200).json(updated);
    } catch (err: any) {
      // 수정 도중 예외 발생 시 400 Bad Request 반환
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * @method remove
   * @description
   *  - DELETE /api/occurrence/:id
   *  - 기존 사고 발생보고를 삭제합니다.
   * @param req Express Request 객체 (경로 파라미터: id)
   * @param res Express Response 객체
   */
  static async remove(req: Request, res: Response) {
    const { id } = req.params;
    try {
      // Service 계층에 id를 전달하여 레코드를 삭제
      await OccurrenceService.remove(id);
      // 삭제 성공 시 204 No Content 반환
      return res.status(204).end();
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
