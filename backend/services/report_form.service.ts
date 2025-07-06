/**
 * @file services/report_form.service.ts
 * @description
 *  - 보고서 양식 설정 관리 기능을 제공하는 서비스
 *  - 양식 필드의 표시 여부, 필수 여부, 순서 등을 관리
 */

import { db } from "../orm/index";
import * as tables from "../orm/schema/report_form";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// 양식 필드 설정 타입 정의
export interface FormFieldSetting {
  id?: string;
  report_type: string;
  field_name: string;
  is_visible: boolean;
  is_required: boolean;
  display_order: number;
  field_group: string;
  display_name: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export default class ReportFormService {
  /**
   * @method getFormSettings
   * @description
   *  - 보고서 양식 설정을 가져옵니다.
   * @param reportType 보고서 유형 (occurrence 또는 investigation)
   * @returns 보고서 양식 설정 배열
   */
  static async getFormSettings(reportType: string): Promise<FormFieldSetting[]> {
    try {
      console.log(`===== 서비스: ${reportType} 보고서 양식 설정 조회 시작 =====`);

      // 양식 설정 조회
      const settings = await db()
        .select()
        .from(tables.reportFormSettings)
        .where(eq(tables.reportFormSettings.report_type, reportType))
        .orderBy(tables.reportFormSettings.display_order);

      // 설정이 없을 경우 기본 설정 생성 및 반환
      if (settings.length === 0) {
        console.log(`===== 서비스: ${reportType} 보고서 양식 기본 설정 생성 =====`);
        return this.initializeDefaultSettings(reportType);
      }

      return settings;
    } catch (error) {
      console.error(`===== 서비스 오류: ${reportType} 보고서 양식 설정 조회 실패 =====`, error);
      throw error;
    }
  }

  /**
   * @method updateFormSettings
   * @description
   *  - 보고서 양식 설정을 업데이트합니다.
   * @param settings 업데이트할 양식 설정 배열
   * @returns 업데이트된 양식 설정 배열
   */
  static async updateFormSettings(settings: FormFieldSetting[]): Promise<FormFieldSetting[]> {
    try {
      console.log(`===== 서비스: 보고서 양식 설정 업데이트 시작 =====`);
      console.log(`설정 항목 수: ${settings.length}`);

      // 트랜잭션 시작
      return await db().transaction(async (tx) => {
        const updatedSettings: FormFieldSetting[] = [];

        for (const setting of settings) {
          if (setting.id) {
            // 기존 설정 업데이트
            const [updated] = await tx
              .update(tables.reportFormSettings)
              .set({
                is_visible: setting.is_visible,
                is_required: setting.is_required,
                display_order: setting.display_order,
                field_group: setting.field_group,
                display_name: setting.display_name,
                description: setting.description,
                updated_at: new Date(),
              })
              .where(eq(tables.reportFormSettings.id, setting.id))
              .returning();

            if (updated) {
              updatedSettings.push(updated);
            }
          } else {
            // 새로운 설정 추가
            const [inserted] = await tx
              .insert(tables.reportFormSettings)
              .values({
                id: uuidv4(),
                report_type: setting.report_type,
                field_name: setting.field_name,
                is_visible: setting.is_visible,
                is_required: setting.is_required,
                display_order: setting.display_order,
                field_group: setting.field_group,
                display_name: setting.display_name,
                description: setting.description,
              })
              .returning();

            if (inserted) {
              updatedSettings.push(inserted);
            }
          }
        }

        return updatedSettings;
      });
    } catch (error) {
      console.error(`===== 서비스 오류: 보고서 양식 설정 업데이트 실패 =====`, error);
      throw error;
    }
  }

  /**
   * @method initializeDefaultSettings
   * @description
   *  - 기본 보고서 양식 설정을 초기화합니다.
   * @param reportType 보고서 유형 (occurrence 또는 investigation)
   * @returns 생성된 기본 양식 설정 배열
   */
  static async initializeDefaultSettings(reportType: string): Promise<FormFieldSetting[]> {
    try {
      console.log(`===== 서비스: ${reportType} 보고서 양식 기본 설정 초기화 =====`);

      let defaultFields: any[] = [];
      
      // 보고서 유형에 따른 기본 필드 가져오기
      if (reportType === "occurrence") {
        defaultFields = tables.defaultOccurrenceFormFields;
      } else {
        // 추후 조사보고서 기본 필드 추가 시 사용
        defaultFields = [];
      }

      // 기본 설정이 없을 경우 빈 배열 반환
      if (defaultFields.length === 0) {
        return [];
      }

      // 트랜잭션 시작
      return await db().transaction(async (tx) => {
        const insertedSettings: FormFieldSetting[] = [];

        for (const field of defaultFields) {
          const [inserted] = await tx
            .insert(tables.reportFormSettings)
            .values({
              id: uuidv4(),
              report_type: reportType,
              field_name: field.field_name,
              is_visible: field.is_visible,
              is_required: field.is_required,
              display_order: field.display_order,
              field_group: field.field_group,
              display_name: field.display_name,
              description: field.description || null,
            })
            .returning();

          if (inserted) {
            insertedSettings.push(inserted);
          }
        }

        return insertedSettings;
      });
    } catch (error) {
      console.error(`===== 서비스 오류: ${reportType} 보고서 양식 기본 설정 초기화 실패 =====`, error);
      throw error;
    }
  }

  /**
   * @method getFormFieldsByVisibility
   * @description
   *  - 표시 여부에 따른 보고서 양식 필드를 가져옵니다.
   * @param reportType 보고서 유형 (occurrence 또는 investigation)
   * @param isVisible 표시 여부 (true: 표시, false: 숨김)
   * @returns 필드 설정 배열
   */
  static async getFormFieldsByVisibility(reportType: string, isVisible: boolean): Promise<FormFieldSetting[]> {
    try {
      console.log(`===== 서비스: ${reportType} 보고서 양식 표시 여부(${isVisible}) 필드 조회 =====`);

      // 표시 여부에 따른 필드 조회
      const fields = await db()
        .select()
        .from(tables.reportFormSettings)
        .where(
          and(
            eq(tables.reportFormSettings.report_type, reportType),
            eq(tables.reportFormSettings.is_visible, isVisible)
          )
        )
        .orderBy(tables.reportFormSettings.display_order);

      return fields;
    } catch (error) {
      console.error(`===== 서비스 오류: ${reportType} 보고서 양식 표시 여부(${isVisible}) 필드 조회 실패 =====`, error);
      throw error;
    }
  }

  /**
   * @method getRequiredFields
   * @description
   *  - 필수 입력 필드 목록을 가져옵니다.
   * @param reportType 보고서 유형 (occurrence 또는 investigation)
   * @returns 필수 입력 필드 배열
   */
  static async getRequiredFields(reportType: string): Promise<FormFieldSetting[]> {
    try {
      console.log(`===== 서비스: ${reportType} 보고서 필수 입력 필드 조회 =====`);

      // 필수 입력 필드 조회
      const requiredFields = await db()
        .select()
        .from(tables.reportFormSettings)
        .where(
          and(
            eq(tables.reportFormSettings.report_type, reportType),
            eq(tables.reportFormSettings.is_required, true),
            eq(tables.reportFormSettings.is_visible, true)
          )
        )
        .orderBy(tables.reportFormSettings.display_order);

      return requiredFields;
    } catch (error) {
      console.error(`===== 서비스 오류: ${reportType} 보고서 필수 입력 필드 조회 실패 =====`, error);
      throw error;
    }
  }
} 