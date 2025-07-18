/**
 * @file controllers/report_form.controller.ts
 * @description
 *  - 보고서 양식 설정 관리 API 컨트롤러
 *  - 발생보고서와 조사보고서의 필드 표시 여부, 필수 여부, 순서 등을 관리
 */

import { Request, Response } from "express";
import ReportFormService, { FormFieldSetting } from "../services/report_form.service";
import * as SettingsService from '../services/settings.service';
import { db, tables } from "../orm/index";
import { sql } from "drizzle-orm";

export default class ReportFormController {
  /**
   * @route GET /api/settings/reports/:reportType
   * @description 보고서 양식 설정을 가져옵니다.
   * @param req 요청 객체 (reportType: 보고서 유형)
   * @param res 응답 객체
   */
  static async getFormSettings(req: Request, res: Response) {
    try {
      const { reportType } = req.params;

      if (!reportType || !["occurrence", "investigation"].includes(reportType)) {
        return res.status(400).json({
          error: "유효하지 않은 보고서 유형입니다. 'occurrence' 또는 'investigation'을 사용하세요."
        });
      }

      const settings = await SettingsService.getReportFormSettings(reportType);
      
      return res.status(200).json({
        message: `${reportType} 보고서 양식 설정을 성공적으로 조회했습니다.`,
        data: settings
      });
    } catch (error: any) {
      console.error("보고서 양식 설정 조회 오류:", error);
      return res.status(500).json({
        error: "보고서 양식 설정을 조회하는 중 오류가 발생했습니다.",
        details: error.message
      });
    }
  }

  /**
   * @route PUT /api/settings/reports/:reportType
   * @description 보고서 양식 설정을 업데이트합니다.
   * @param req 요청 객체 (settings: 업데이트할 설정 배열)
   * @param res 응답 객체
   */
  static async updateFormSettings(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      const { settings } = req.body;
      
      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({ success: false, message: '유효한 설정 데이터가 제공되지 않았습니다.' });
      }
      
      // 각 설정을 순회하며 업데이트
      for (const setting of settings) {
        if (!setting.id) continue;
        await SettingsService.updateFormSetting(setting.id, {
          is_visible: setting.is_visible,
          is_required: setting.is_required,
          display_order: setting.display_order,
          field_group: setting.field_group,
          display_name: setting.display_name,
          grid_layout: setting.grid_layout,
          group_cols: setting.group_cols,  // group_cols 필드 추가
          is_default: false  // 명시적으로 일반 설정으로 표시
        });
      }
      
      res.json({ success: true, message: '양식 설정이 업데이트되었습니다.' });
    } catch (error) {
      console.error(`[양식 설정 업데이트 오류]: ${error}`);
      res.status(500).json({ success: false, message: '양식 설정을 업데이트하는 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @route GET /api/settings/reports/:reportType/required
   * @description 필수 입력 필드 목록을 가져옵니다.
   * @param req 요청 객체 (reportType: 보고서 유형)
   * @param res 응답 객체
   */
  static async getRequiredFields(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      const settings = await SettingsService.getReportFormSettings(reportType);
      const requiredFields = settings
        .filter(field => field.is_visible && field.is_required)
        .map(field => field.field_name);
      
      res.json({ success: true, data: requiredFields });
    } catch (error) {
      console.error(`[필수 필드 조회 오류]: ${error}`);
      res.status(500).json({ success: false, message: '필수 필드를 조회하는 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @route GET /api/settings/reports/:reportType/visible
   * @description 표시 여부에 따른 필드 목록을 가져옵니다.
   * @param req 요청 객체 (reportType: 보고서 유형, visible: 표시 여부)
   * @param res 응답 객체
   */
  static async getFieldsByVisibility(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      const { visible } = req.query;
      const settings = await SettingsService.getReportFormSettings(reportType);
      
      // visible 쿼리 파라미터가 있으면 해당 값에 따라 필터링
      const filteredFields = settings
        .filter(field => visible ? field.is_visible : !field.is_visible)
        .map(field => field.field_name);
      
      res.json({ success: true, data: filteredFields });
    } catch (error) {
      console.error(`[필드 가시성 조회 오류]: ${error}`);
      res.status(500).json({ success: false, message: '필드 가시성을 조회하는 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @route POST /api/settings/reports/:reportType/reset
   * @description 보고서 양식 설정을 기본값으로 초기화합니다.
   * @param req 요청 객체 (reportType: 보고서 유형)
   * @param res 응답 객체
   */
  static async resetFormSettings(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      await SettingsService.resetFormSettings(reportType);
      
      // 초기화 후 설정 데이터 조회
      const settings = await SettingsService.getReportFormSettings(reportType);
      
      res.json({
        success: true,
        message: '양식 설정이 기본값으로 초기화되었습니다.',
        data: settings
      });
    } catch (error) {
      console.error(`[설정 초기화 오류]: ${error}`);
      res.status(500).json({ success: false, message: '양식 설정을 초기화하는 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @route POST /api/settings/reports/:reportType/move-victim-count
   * @description 재해자 수 필드를 사고정보 그룹으로 이동합니다.
   * @param req 요청 객체 (reportType: 보고서 유형)
   * @param res 응답 객체
   */
  static async moveVictimCountField(req: Request, res: Response) {
    try {
      await SettingsService.moveVictimCountToAccidentGroup();
      res.json({ success: true, message: '재해자 수 필드를 사고정보 그룹으로 이동했습니다.' });
    } catch (error) {
      console.error(`[필드 이동 오류]: ${error}`);
      res.status(500).json({ success: false, message: '필드 이동 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @route POST /api/settings/reports/:reportType/add-missing-fields
   * @description 기존 설정에 누락된 필드들을 추가합니다.
   * @param req 요청 객체 (reportType: 보고서 유형)
   * @param res 응답 객체
   */
  static async addMissingFields(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      
      if (!reportType || !["occurrence", "investigation"].includes(reportType)) {
        return res.status(400).json({
          error: "유효하지 않은 보고서 유형입니다. 'occurrence' 또는 'investigation'을 사용하세요."
        });
      }

      const result = await SettingsService.addMissingFields(reportType);
      res.json({ success: true, message: `${result.addedCount}개의 누락된 필드가 추가되었습니다.`, data: result.addedFields });
    } catch (error) {
      console.error(`[누락 필드 추가 오류]: ${error}`);
      res.status(500).json({ success: false, message: '누락 필드 추가 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @route POST /api/settings/reports/:reportType/save-as-default
   * @description 현재 설정을 기본설정으로 저장합니다.
   * @param req 요청 객체 (reportType: 보고서 유형)
   * @param res 응답 객체
   */
  static async saveCurrentSettingsAsDefault(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      
      if (!reportType || !["occurrence", "investigation"].includes(reportType)) {
        return res.status(400).json({
          error: "유효하지 않은 보고서 유형입니다. 'occurrence' 또는 'investigation'을 사용하세요."
        });
      }

      const result = await SettingsService.saveCurrentSettingsAsDefault(reportType);
      res.json({ 
        success: true, 
        message: result.message,
        data: { savedCount: result.savedCount }
      });
    } catch (error) {
      console.error(`[기본설정 저장 오류]: ${error}`);
      res.status(500).json({ success: false, message: '기본설정 저장 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @route POST /api/settings/reports/:reportType/reset-to-default
   * @description 기본설정으로 초기화합니다.
   * @param req 요청 객체 (reportType: 보고서 유형)
   * @param res 응답 객체
   */
  static async resetToDefaultSettings(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      
      if (!reportType || !["occurrence", "investigation"].includes(reportType)) {
        return res.status(400).json({
          error: "유효하지 않은 보고서 유형입니다. 'occurrence' 또는 'investigation'을 사용하세요."
        });
      }

      const result = await SettingsService.resetToDefaultSettings(reportType);
      
      // 초기화 후 설정 데이터 조회
      const settings = await SettingsService.getReportFormSettings(reportType);
      
      res.json({
        success: true,
        message: result.message,
        data: settings
      });
    } catch (error) {
      console.error(`[기본설정 초기화 오류]: ${error}`);
      res.status(500).json({ success: false, message: '기본설정 초기화 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @route GET /api/settings/reports/sequence
   * @description 회사/사업장/연도별 시퀀스 값 조회
   * @query company, site, year, type
   */
  static async getSequence(req: Request, res: Response) {
    const { company, site, year, type } = req.query;
    if (!company || !year || !type) {
      return res.status(400).json({ error: "company, year, type 쿼리 파라미터가 필요합니다." });
    }
    const yearNum = Number(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ error: "year 파라미터가 올바르지 않습니다." });
    }
    if (type === 'site' && !site) {
      return res.status(400).json({ error: "type이 'site'일 때는 site 파라미터가 필요합니다." });
    }
    let whereSql;
    if (type === 'global') {
      whereSql = sql`${tables.occurrenceSequence.company_code} = ${company} AND ${tables.occurrenceSequence.year} = ${yearNum} AND ${tables.occurrenceSequence.type} = 'global'`;
    } else {
      whereSql = sql`${tables.occurrenceSequence.company_code} = ${company} AND ${tables.occurrenceSequence.site_code} = ${site} AND ${tables.occurrenceSequence.year} = ${yearNum} AND ${tables.occurrenceSequence.type} = 'site'`;
    }
    const seqRow = await db()
      .select()
      .from(tables.occurrenceSequence)
      .where(whereSql)
      .limit(1);
    if (seqRow.length === 0) {
      return res.status(200).json({ current_seq: 0 });
    }
    return res.status(200).json({ current_seq: seqRow[0].current_seq });
  }

  /**
   * @route PUT /api/settings/reports/sequence
   * @description 회사/사업장/연도별 시퀀스 값 수정 (제약조건: 1~999, 존재하는 accident_id의 최대값 이상, 중복 불가)
   * @body company, site, year, new_seq, type
   */
  static async updateSequence(req: Request, res: Response) {
    const { company, site, year, new_seq, type } = req.body;
    if (!company || !year || !new_seq || !type) {
      return res.status(400).json({ error: "company, year, new_seq, type 값이 필요합니다." });
    }
    if (type === 'site' && !site) {
      return res.status(400).json({ error: "type이 'site'일 때는 site 값이 필요합니다." });
    }
    if (new_seq < 1 || new_seq > 999) {
      return res.status(400).json({ error: "시퀀스 값은 1~999 사이여야 합니다." });
    }
    const yearNum = Number(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ error: "year 파라미터가 올바르지 않습니다." });
    }
    // 현재 존재하는 accident_id/global_accident_no 중 가장 큰 seq 추출
    let maxSeq = 0;
    if (type === 'global') {
      const maxSeqRow = await db()
        .select({ global_accident_no: tables.occurrenceReport.global_accident_no })
        .from(tables.occurrenceReport)
        .where(sql`${tables.occurrenceReport.company_code} = ${company} AND EXTRACT(YEAR FROM ${tables.occurrenceReport.acci_time}) = ${yearNum}`);
      maxSeqRow.forEach(r => {
        if (r.global_accident_no) {
          const parts = r.global_accident_no.split('-');
          let seq = (parts.length === 3) ? parseInt(parts[2], 10) : 0;
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      });
    } else {
      const maxSeqRow = await db()
        .select({ accident_id: tables.occurrenceReport.accident_id })
        .from(tables.occurrenceReport)
        .where(sql`${tables.occurrenceReport.company_code} = ${company} AND ${tables.occurrenceReport.site_code} = ${site} AND EXTRACT(YEAR FROM ${tables.occurrenceReport.acci_time}) = ${yearNum}`);
      maxSeqRow.forEach(r => {
        if (r.accident_id) {
          const parts = r.accident_id.split('-');
          let seq = (parts.length === 4) ? parseInt(parts[3], 10) : 0;
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      });
    }
    if (new_seq < maxSeq) {
      return res.status(400).json({ error: `시퀀스 값은 현재 존재하는 최대값(${maxSeq}) 이상이어야 합니다.` });
    }
    // accident_id/global_accident_no 중복 체크
    let seqStr = String(new_seq).padStart(3, '0');
    let exists;
    if (type === 'global') {
      const globalAccidentNo = `${company}-${yearNum}-${seqStr}`;
      exists = await db()
        .select()
        .from(tables.occurrenceReport)
        .where(sql`${tables.occurrenceReport.global_accident_no} = ${globalAccidentNo}`);
    } else {
      const accidentId = `${company}-${site}-${yearNum}-${seqStr}`;
      exists = await db()
        .select()
        .from(tables.occurrenceReport)
        .where(sql`${tables.occurrenceReport.accident_id} = ${accidentId}`);
    }
    if (exists.length > 0) {
      return res.status(400).json({ error: "이미 존재하는 accident_id/global_accident_no와 중복됩니다." });
    }
    // 시퀀스 테이블 업데이트
    let updated;
    if (type === 'global') {
      updated = await db()
        .update(tables.occurrenceSequence)
        .set({ current_seq: new_seq })
        .where(sql`${tables.occurrenceSequence.company_code} = ${company} AND ${tables.occurrenceSequence.year} = ${yearNum} AND ${tables.occurrenceSequence.type} = 'global'`);
      if (!updated || (Array.isArray(updated) && updated.length === 0)) {
        await db().insert(tables.occurrenceSequence).values({
          company_code: company,
          site_code: null,
          year: yearNum,
          type: 'global',
          current_seq: new_seq,
        });
      }
    } else {
      updated = await db()
        .update(tables.occurrenceSequence)
        .set({ current_seq: new_seq })
        .where(sql`${tables.occurrenceSequence.company_code} = ${company} AND ${tables.occurrenceSequence.site_code} = ${site} AND ${tables.occurrenceSequence.year} = ${yearNum} AND ${tables.occurrenceSequence.type} = 'site'`);
      if (!updated || (Array.isArray(updated) && updated.length === 0)) {
        await db().insert(tables.occurrenceSequence).values({
          company_code: company,
          site_code: site,
          year: yearNum,
          type: 'site',
          current_seq: new_seq,
        });
      }
    }
    return res.status(200).json({ success: true, current_seq: new_seq });
  }
} 