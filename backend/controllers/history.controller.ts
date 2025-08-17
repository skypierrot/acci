/**
 * @file controllers/history.controller.ts
 * @description
 *  - 사고 이력 조회를 위한 컨트롤러
 */

import { Request, Response } from 'express';
import HistoryService from '../services/history.service';

export default class HistoryController {
  /**
   * 사고 이력 목록 조회
   */
  static async list(req: Request, res: Response) {
    try {
      // 쿼리 파라미터에서 페이징/필터 값을 가져옵니다.
      const { page = "1", size = "10", company, site, status, startDate, endDate } = req.query;
      const filters = {
        company: String(company || ""),
        site: String(site || ""),
        status: String(status || ""),
        startDate: String(startDate || ""),
        endDate: String(endDate || ""),
      };
      const pagination = { page: Number(page), size: Number(size) };

      console.log('[HISTORY][LIST] 사고 이력 목록 조회:', { filters, pagination });

      // Service 계층에 페이징/필터 정보를 전달하여 결과를 받아옵니다.
      const result = await HistoryService.fetchHistoryList(filters, pagination);
      
      console.log('[HISTORY][LIST] 사고 이력 목록 조회 완료');
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[HISTORY][LIST] 사고 이력 목록 조회 오류:', error);
      // 에러 발생 시 500 Internal Server Error 응답
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * 사고 이력 단일 조회
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      console.log('[HISTORY][GET] 사고 이력 상세 조회:', id);
      
      const result = await HistoryService.getHistoryById(id);
      
      if (!result) {
        return res.status(404).json({ error: '해당 사고 이력을 찾을 수 없습니다.' });
      }
      
      console.log('[HISTORY][GET] 사고 이력 상세 조회 완료');
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[HISTORY][GET] 사고 이력 상세 조회 오류:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  }
}
