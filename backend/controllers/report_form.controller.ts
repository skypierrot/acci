/**
 * @file controllers/report_form.controller.ts
 * @description
 *  - 보고서 양식 설정 관리 API 컨트롤러
 *  - 발생보고서와 조사보고서의 필드 표시 여부, 필수 여부, 순서 등을 관리
 */

import { Request, Response } from "express";
import ReportFormService, { FormFieldSetting } from "../services/report_form.service";
import * as SettingsService from '../services/settings.service';

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
          group_cols: setting.group_cols  // group_cols 필드 추가
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
} 