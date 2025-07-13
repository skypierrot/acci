import { Request, Response } from 'express';
import { AnnualWorkingHoursService } from '../services/annual_working_hours.service';

// 연간 근로시간 컨트롤러
// 회사/사업장 단위로 연도별 근로시간을 CRUD 및 마감/마감취소 처리
export class AnnualWorkingHoursController {
  /**
   * 연간 근로시간 단일 조회
   */
  static async getOne(req: Request, res: Response) {
    try {
      const { company_id, site_id, year } = req.query;
      const data = await AnnualWorkingHoursService.getOne({
        company_id: String(company_id),
        site_id: site_id ? String(site_id) : undefined,
        year: Number(year)
      });
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * 연간 근로시간 전체 조회 (회사/연도별)
   */
  static async getList(req: Request, res: Response) {
    try {
      const { company_id, year } = req.query;
      const data = await AnnualWorkingHoursService.getList({
        company_id: String(company_id),
        year: year ? Number(year) : undefined
      });
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * 연간 근로시간 등록/수정 (upsert)
   */
  static async upsert(req: Request, res: Response) {
    try {
      const { company_id, site_id, year, employee_hours, partner_on_hours, partner_off_hours } = req.body;
      const result = await AnnualWorkingHoursService.upsert({
        company_id,
        site_id,
        year,
        employee_hours,
        partner_on_hours,
        partner_off_hours
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * 연간 근로시간 삭제
   */
  static async remove(req: Request, res: Response) {
    try {
      const { company_id, site_id, year } = req.body;
      const result = await AnnualWorkingHoursService.remove({
        company_id,
        site_id,
        year
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * 연도별 마감 처리
   */
  static async close(req: Request, res: Response) {
    try {
      const { company_id, site_id, year } = req.body;
      const result = await AnnualWorkingHoursService.close({
        company_id,
        site_id,
        year
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * 연도별 마감 취소
   */
  static async open(req: Request, res: Response) {
    try {
      const { company_id, site_id, year } = req.body;
      const result = await AnnualWorkingHoursService.open({
        company_id,
        site_id,
        year
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
} 