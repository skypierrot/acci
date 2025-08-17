/**
 * @file services/company.service.ts
 * @description
 *  - 회사 및 사업장 정보 관리 서비스
 *  - 회사 및 사업장의 CRUD 작업을 담당합니다.
 */

import { eq, and } from "drizzle-orm";
import { db, tables } from "../orm";

// 회사 정보 인터페이스
export interface CompanyInfo {
  id?: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  contact?: string;
  sites?: SiteInfo[];
}

// 사업장 정보 인터페이스
export interface SiteInfo {
  id?: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  contact?: string;
}

/**
 * 회사 목록 조회
 * @returns 회사 목록 (사업장 포함)
 */
export async function getCompanies(): Promise<CompanyInfo[]> {
  try {
    // 회사 목록 조회
    const companies = await db().select().from(tables.company);
    
    // 모든 사업장 조회
    const sites = await db().select().from(tables.site);
    
    // 회사별로 사업장 목록 매핑
    return companies.map(company => {
      const companySites = sites.filter(site => site.companyId === company.id);
      
      return {
        ...company,
        sites: companySites.map(site => ({
          id: site.id,
          companyId: site.companyId,
          name: site.name,
          code: site.code,
          description: site.description,
          address: site.address,
          contact: site.contact
        }))
      };
    });
  } catch (error) {
    console.error("회사 목록 조회 오류:", error);
    throw new Error("회사 목록을 조회하는 중 오류가 발생했습니다.");
  }
}

/**
 * 사이트 목록 조회
 * @returns 사이트 목록
 */
export async function getSites(): Promise<SiteInfo[]> {
  try {
    // 모든 사이트 조회
    const sites = await db().select().from(tables.site);
    
    return sites.map(site => ({
      id: site.id,
      companyId: site.companyId,
      name: site.name,
      code: site.code,
      description: site.description,
      address: site.address,
      contact: site.contact
    }));
  } catch (error) {
    console.error("사이트 목록 조회 오류:", error);
    throw new Error("사이트 목록을 조회하는 중 오류가 발생했습니다.");
  }
}

/**
 * 특정 회사 조회
 * @param companyId 회사 ID
 * @returns 회사 정보 (사업장 포함)
 */
export async function getCompanyById(companyId: string): Promise<CompanyInfo | null> {
  try {
    // 회사 정보 조회
    const company = await db()
      .select()
      .from(tables.company)
      .where(eq(tables.company.id, companyId))
      .limit(1);
    
    if (company.length === 0) {
      return null;
    }
    
    // 회사의 사업장 목록 조회
    const sites = await db()
      .select()
      .from(tables.site)
      .where(eq(tables.site.companyId, companyId));
    
    return {
      ...company[0],
      sites: sites.map(site => ({
        id: site.id,
        companyId: site.companyId,
        name: site.name,
        code: site.code,
        description: site.description,
        address: site.address,
        contact: site.contact
      }))
    };
  } catch (error) {
    console.error(`회사 ID(${companyId}) 조회 오류:`, error);
    throw new Error("회사 정보를 조회하는 중 오류가 발생했습니다.");
  }
}

/**
 * 회사 정보 저장 (생성 또는 업데이트)
 * @param companyData 저장할 회사 정보
 * @returns 저장된 회사 정보
 */
export async function saveCompany(companyData: CompanyInfo): Promise<CompanyInfo> {
  try {
    const { sites, ...companyInfo } = companyData;
    
    // 회사 코드 중복 확인
    const existingCompanyWithCode = await db()
      .select()
      .from(tables.company)
      .where(eq(tables.company.code, companyInfo.code));
    
    if (existingCompanyWithCode.length > 0 && existingCompanyWithCode[0].id !== companyInfo.id) {
      throw new Error(`이미 사용 중인 회사 코드입니다: ${companyInfo.code}`);
    }
    
    let savedCompany;
    
    if (companyInfo.id) {
      // 기존 회사 정보 업데이트
      await db()
        .update(tables.company)
        .set({
          name: companyInfo.name,
          code: companyInfo.code,
          description: companyInfo.description,
          address: companyInfo.address,
          contact: companyInfo.contact
        })
        .where(eq(tables.company.id, companyInfo.id));
      
      savedCompany = { ...companyInfo };
    } else {
      // 새 회사 생성
      const [newCompany] = await db()
        .insert(tables.company)
        .values({
          name: companyInfo.name,
          code: companyInfo.code,
          description: companyInfo.description,
          address: companyInfo.address,
          contact: companyInfo.contact
        })
        .returning();
      
      savedCompany = newCompany;
    }
    
    // 저장된 회사 정보 반환 (사업장 포함)
    if (sites && sites.length > 0) {
      const savedSites = await Promise.all(
        sites.map(site => saveSite({ ...site, companyId: savedCompany.id! }))
      );
      
      return {
        ...savedCompany,
        sites: savedSites
      };
    }
    
    return {
      ...savedCompany,
      sites: []
    };
  } catch (error) {
    console.error("회사 정보 저장 오류:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("회사 정보를 저장하는 중 오류가 발생했습니다.");
  }
}

/**
 * 사업장 정보 저장 (생성 또는 업데이트)
 * @param siteData 저장할 사업장 정보
 * @returns 저장된 사업장 정보
 */
export async function saveSite(siteData: SiteInfo): Promise<SiteInfo> {
  try {
    // 사업장 코드 중복 확인
    const existingSiteWithCode = await db()
      .select()
      .from(tables.site)
      .where(eq(tables.site.code, siteData.code));
    
    if (existingSiteWithCode.length > 0 && existingSiteWithCode[0].id !== siteData.id) {
      throw new Error(`이미 사용 중인 사업장 코드입니다: ${siteData.code}`);
    }
    
    // 회사 ID 유효성 확인
    const company = await db()
      .select()
      .from(tables.company)
      .where(eq(tables.company.id, siteData.companyId))
      .limit(1);
    
    if (company.length === 0) {
      throw new Error(`존재하지 않는 회사 ID입니다: ${siteData.companyId}`);
    }
    
    if (siteData.id) {
      // 기존 사업장 정보 업데이트
      await db()
        .update(tables.site)
        .set({
          companyId: siteData.companyId,
          name: siteData.name,
          code: siteData.code,
          description: siteData.description,
          address: siteData.address,
          contact: siteData.contact
        })
        .where(eq(tables.site.id, siteData.id));
      
      return siteData;
    } else {
      // 새 사업장 생성
      const [newSite] = await db()
        .insert(tables.site)
        .values({
          companyId: siteData.companyId,
          name: siteData.name,
          code: siteData.code,
          description: siteData.description,
          address: siteData.address,
          contact: siteData.contact
        })
        .returning();
      
      return newSite;
    }
  } catch (error) {
    console.error("사업장 정보 저장 오류:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("사업장 정보를 저장하는 중 오류가 발생했습니다.");
  }
}

/**
 * 회사 삭제
 * @param companyId 삭제할 회사 ID
 * @returns 삭제 성공 여부
 */
export async function deleteCompany(companyId: string): Promise<boolean> {
  try {
    await db()
      .delete(tables.company)
      .where(eq(tables.company.id, companyId));
    
    return true;
  } catch (error) {
    console.error(`회사 ID(${companyId}) 삭제 오류:`, error);
    throw new Error("회사를 삭제하는 중 오류가 발생했습니다.");
  }
}

/**
 * 사업장 삭제
 * @param siteId 삭제할 사업장 ID
 * @returns 삭제 성공 여부
 */
export async function deleteSite(siteId: string): Promise<boolean> {
  try {
    await db()
      .delete(tables.site)
      .where(eq(tables.site.id, siteId));
    
    return true;
  } catch (error) {
    console.error(`사업장 ID(${siteId}) 삭제 오류:`, error);
    throw new Error("사업장을 삭제하는 중 오류가 발생했습니다.");
  }
} 