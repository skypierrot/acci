/**
 * @file controllers/lagging.controller.ts
 * @description
 *  - Lagging 지표 관련 비즈니스 로직을 처리하는 Controller입니다.
 *  - 성능 최적화를 위해 통합 API 엔드포인트를 제공합니다.
 */

import { Request, Response } from "express";
import LaggingService from "../services/lagging.service";

export default class LaggingController {
  /**
   * @method getSummary
   * @description
   *  - GET /api/lagging/summary/:year
   *  - 특정 연도의 모든 lagging 지표를 한 번에 계산하여 반환합니다.
   *  - 성능 최적화를 위해 단일 API 호출로 모든 데이터를 제공합니다.
   * @param req Express Request 객체 (경로 파라미터: year)
   * @param res Express Response 객체
   */
  static async getSummary(req: Request, res: Response) {
    const { year } = req.params;
    
    if (!year || isNaN(Number(year))) {
      return res.status(400).json({ error: '유효한 연도가 필요합니다.' });
    }

    try {
      console.log(`[LaggingController] ${year}년도 지표 요약 조회 시작`);
      
      const summary = await LaggingService.getSummaryByYear(Number(year));
      
      console.log(`[LaggingController] ${year}년도 지표 요약 조회 완료`);
      
      return res.status(200).json(summary);
    } catch (error: any) {
      console.error(`[LaggingController] 지표 요약 조회 오류:`, error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * @method getChartData
   * @description
   *  - GET /api/lagging/chart-data?startYear=YYYY&endYear=YYYY
   *  - 그래프용 데이터를 배치로 처리하여 반환합니다.
   * @param req Express Request 객체 (쿼리 파라미터: startYear, endYear)
   * @param res Express Response 객체
   */
  static async getChartData(req: Request, res: Response) {
    const { startYear, endYear } = req.query;
    
    if (!startYear || !endYear || isNaN(Number(startYear)) || isNaN(Number(endYear))) {
      return res.status(400).json({ error: '유효한 시작 연도와 종료 연도가 필요합니다.' });
    }

    try {
      console.log(`[LaggingController] 차트 데이터 조회 시작: ${startYear}년 ~ ${endYear}년`);
      
      const chartData = await LaggingService.getChartData(Number(startYear), Number(endYear));
      
      console.log(`[LaggingController] 차트 데이터 조회 완료`);
      
      return res.status(200).json(chartData);
    } catch (error: any) {
      console.error(`[LaggingController] 차트 데이터 조회 오류:`, error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * @method getInvestigationBatch
   * @description
   *  - POST /api/lagging/investigation-batch
   *  - 조사보고서 존재 여부를 배치로 조회합니다.
   * @param req Express Request 객체 (바디: accidentIds 배열)
   * @param res Express Response 객체
   */
  static async getInvestigationBatch(req: Request, res: Response) {
    const { accidentIds } = req.body;
    
    if (!accidentIds || !Array.isArray(accidentIds)) {
      return res.status(400).json({ error: '사고 ID 배열이 필요합니다.' });
    }

    try {
      console.log(`[LaggingController] 조사보고서 배치 조회 시작: ${accidentIds.length}건`);
      
      const investigationStatus = await LaggingService.getInvestigationBatch(accidentIds);
      
      console.log(`[LaggingController] 조사보고서 배치 조회 완료`);
      
      return res.status(200).json(investigationStatus);
    } catch (error: any) {
      console.error(`[LaggingController] 조사보고서 배치 조회 오류:`, error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * @method getDashboardSummary
   * @description
   *  - GET /api/lagging/dashboard/:year
   *  - 대시보드용 간소화된 사고지표를 반환합니다.
   *  - 메인 지표(사고건수, 재해자수, 물적피해, LTIR, TRIR, 강도율)만 포함
   * @param req Express Request 객체 (경로 파라미터: year)
   * @param res Express Response 객체
   */
  static async getDashboardSummary(req: Request, res: Response) {
    const { year } = req.params;
    
    if (!year || isNaN(Number(year))) {
      return res.status(400).json({ error: '유효한 연도가 필요합니다.' });
    }

    try {
      console.log(`[LaggingController] ${year}년도 대시보드 지표 조회 시작`);
      
      const dashboardSummary = await LaggingService.getDashboardSummary(Number(year));
      
      console.log(`[LaggingController] ${year}년도 대시보드 지표 조회 완료`);
      
      return res.status(200).json(dashboardSummary);
    } catch (error: any) {
      console.error(`[LaggingController] 대시보드 지표 조회 오류:`, error);
      return res.status(500).json({ error: error.message });
    }
  }
} 