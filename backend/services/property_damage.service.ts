/**
 * @file services/property_damage.service.ts
 * @description 물적피해 정보 관련 비즈니스 로직을 처리하는 서비스 클래스
 */

import { eq, desc } from "drizzle-orm";
import { db, tables } from "../orm/index";

export interface PropertyDamageData {
  damage_id?: number;
  accident_id: string;
  damage_target?: string;
  estimated_cost?: number;
  damage_content?: string;
  recovery_plan?: string;
  etc_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export default class PropertyDamageService {
  /**
   * 물적피해 정보 생성
   * @param data 물적피해 정보 데이터
   * @returns 생성된 물적피해 정보
   */
  static async create(data: PropertyDamageData) {
    console.log("[PROPERTY_DAMAGE][create] 물적피해 정보 생성:", data.accident_id);
    
    try {
      const result = await db()
        .insert(tables.propertyDamages)
        .values(data)
        .returning();

      console.log("[PROPERTY_DAMAGE][create] 물적피해 정보 생성 완료:", result[0]);
      return result[0];
    } catch (error) {
      console.error("[PROPERTY_DAMAGE][create] 물적피해 정보 생성 실패:", error);
      throw error;
    }
  }

  /**
   * 사고 ID로 물적피해 정보 목록 조회
   * @param accident_id 사고 ID
   * @returns 물적피해 정보 목록
   */
  static async getByAccidentId(accident_id: string) {
    console.log("[PROPERTY_DAMAGE][getByAccidentId] 물적피해 정보 조회:", accident_id);
    
    try {
      const result = await db()
        .select()
        .from(tables.propertyDamages)
        .where(eq(tables.propertyDamages.accident_id, accident_id))
        .orderBy(desc(tables.propertyDamages.created_at));

      console.log("[PROPERTY_DAMAGE][getByAccidentId] 조회 완료:", result.length, "건");
      return result;
    } catch (error) {
      console.error("[PROPERTY_DAMAGE][getByAccidentId] 물적피해 정보 조회 실패:", error);
      throw error;
    }
  }

  /**
   * 물적피해 정보 수정
   * @param damage_id 물적피해 ID
   * @param data 수정할 데이터
   * @returns 수정된 물적피해 정보
   */
  static async update(damage_id: number, data: Partial<PropertyDamageData>) {
    console.log("[PROPERTY_DAMAGE][update] 물적피해 정보 수정:", damage_id);
    
    try {
      const result = await db()
        .update(tables.propertyDamages)
        .set({
          ...data,
          updated_at: new Date()
        })
        .where(eq(tables.propertyDamages.damage_id, damage_id))
        .returning();

      if (result.length === 0) {
        throw new Error(`물적피해 정보를 찾을 수 없습니다: ${damage_id}`);
      }

      console.log("[PROPERTY_DAMAGE][update] 물적피해 정보 수정 완료:", result[0]);
      return result[0];
    } catch (error) {
      console.error("[PROPERTY_DAMAGE][update] 물적피해 정보 수정 실패:", error);
      throw error;
    }
  }

  /**
   * 물적피해 정보 삭제
   * @param damage_id 물적피해 ID
   * @returns 삭제 성공 여부
   */
  static async delete(damage_id: number) {
    console.log("[PROPERTY_DAMAGE][delete] 물적피해 정보 삭제:", damage_id);
    
    try {
      const result = await db()
        .delete(tables.propertyDamages)
        .where(eq(tables.propertyDamages.damage_id, damage_id))
        .returning();

      if (result.length === 0) {
        throw new Error(`물적피해 정보를 찾을 수 없습니다: ${damage_id}`);
      }

      console.log("[PROPERTY_DAMAGE][delete] 물적피해 정보 삭제 완료");
      return true;
    } catch (error) {
      console.error("[PROPERTY_DAMAGE][delete] 물적피해 정보 삭제 실패:", error);
      throw error;
    }
  }

  /**
   * 사고 ID로 모든 물적피해 정보 삭제
   * @param accident_id 사고 ID
   * @returns 삭제 성공 여부
   */
  static async deleteByAccidentId(accident_id: string) {
    console.log("[PROPERTY_DAMAGE][deleteByAccidentId] 사고별 물적피해 정보 삭제:", accident_id);
    
    try {
      const result = await db()
        .delete(tables.propertyDamages)
        .where(eq(tables.propertyDamages.accident_id, accident_id))
        .returning();

      console.log("[PROPERTY_DAMAGE][deleteByAccidentId] 삭제 완료:", result.length, "건");
      return true;
    } catch (error) {
      console.error("[PROPERTY_DAMAGE][deleteByAccidentId] 물적피해 정보 삭제 실패:", error);
      throw error;
    }
  }

  /**
   * 물적피해 정보 일괄 저장 (기존 데이터 삭제 후 새로 생성)
   * @param accident_id 사고 ID
   * @param propertyDamages 물적피해 정보 배열
   * @returns 저장된 물적피해 정보 목록
   */
  static async saveAll(accident_id: string, propertyDamages: PropertyDamageData[]) {
    console.log("[PROPERTY_DAMAGE][saveAll] 물적피해 정보 일괄 저장:", accident_id, propertyDamages.length, "건");
    
    try {
      return await db().transaction(async (tx) => {
        // 1. 기존 물적피해 정보 삭제
        await tx
          .delete(tables.propertyDamages)
          .where(eq(tables.propertyDamages.accident_id, accident_id));

        // 2. 새로운 물적피해 정보 생성
        if (propertyDamages.length > 0) {
          const result = await tx
            .insert(tables.propertyDamages)
            .values(propertyDamages.map(item => ({
              ...item,
              accident_id
            })))
            .returning();

          console.log("[PROPERTY_DAMAGE][saveAll] 일괄 저장 완료:", result.length, "건");
          return result;
        }

        return [];
      });
    } catch (error) {
      console.error("[PROPERTY_DAMAGE][saveAll] 물적피해 정보 일괄 저장 실패:", error);
      throw error;
    }
  }
} 