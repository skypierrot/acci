/**
 * @file controllers/history.controller.ts
 * @description
 *  - 사고 이력 조회를 위한 컨트롤러
 */

import { Request, Response } from 'express';

export default class HistoryController {
  /**
   * 사고 이력 목록 조회
   */
  static async list(req: Request, res: Response) {
    try {
      // 임시 응답
      return res.status(200).json({ 
        message: '현재 개발 중입니다. 곧 구현될 예정입니다.',
        data: []
      });
    } catch (error: any) {
      console.error('사고 이력 목록 조회 에러:', error.message);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  }

  /**
   * 사고 이력 단일 조회
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 임시 응답
      return res.status(200).json({ 
        message: '현재 개발 중입니다. 곧 구현될 예정입니다.',
        id
      });
    } catch (error: any) {
      console.error('사고 이력 단일 조회 에러:', error.message);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  }
}
