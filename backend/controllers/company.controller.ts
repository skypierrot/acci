/**
 * @file controllers/company.controller.ts
 * @description
 *  - 회사 및 사업장 정보 관리 컨트롤러
 *  - 회사 및 사업장의 CRUD API를 제공합니다.
 */

import { Request, Response } from "express";
import * as companyService from "../services/company.service";

/**
 * 회사 목록 조회
 * @route GET /api/companies
 */
export async function getCompanies(req: Request, res: Response) {
  try {
    const companies = await companyService.getCompanies();
    return res.status(200).json(companies);
  } catch (error) {
    console.error("회사 목록 조회 오류:", error);
    return res.status(500).json({ error: "회사 목록을 불러오는 중 오류가 발생했습니다." });
  }
}

/**
 * 사이트 목록 조회
 * @route GET /api/sites
 */
export async function getSites(req: Request, res: Response) {
  try {
    const sites = await companyService.getSites();
    return res.status(200).json(sites);
  } catch (error) {
    console.error("사이트 목록 조회 오류:", error);
    return res.status(500).json({ error: "사이트 목록을 불러오는 중 오류가 발생했습니다." });
  }
}

/**
 * 특정 회사 조회
 * @route GET /api/companies/:id
 */
export async function getCompanyById(req: Request, res: Response) {
  try {
    const companyId = req.params.id;
    const company = await companyService.getCompanyById(companyId);
    
    if (!company) {
      return res.status(404).json({ error: "회사를 찾을 수 없습니다." });
    }
    
    return res.status(200).json(company);
  } catch (error) {
    console.error("회사 조회 오류:", error);
    return res.status(500).json({ error: "회사 정보를 불러오는 중 오류가 발생했습니다." });
  }
}

/**
 * 회사 정보 저장 (생성 또는 업데이트)
 * @route POST /api/companies
 */
export async function saveCompany(req: Request, res: Response) {
  try {
    const companyData = req.body;
    
    // 기본 데이터 유효성 검증
    if (!companyData.name || !companyData.code) {
      return res.status(400).json({ error: "회사명과 회사 코드는 필수 입력 항목입니다." });
    }
    
    const savedCompany = await companyService.saveCompany(companyData);
    return res.status(200).json(savedCompany);
  } catch (error) {
    console.error("회사 정보 저장 오류:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "회사 정보를 저장하는 중 오류가 발생했습니다." });
  }
}

/**
 * 사업장 정보 저장 (생성 또는 업데이트)
 * @route POST /api/sites
 */
export async function saveSite(req: Request, res: Response) {
  try {
    const siteData = req.body;
    
    // 기본 데이터 유효성 검증
    if (!siteData.companyId || !siteData.name || !siteData.code) {
      return res.status(400).json({ error: "회사 ID, 사업장명, 사업장 코드는 필수 입력 항목입니다." });
    }
    
    const savedSite = await companyService.saveSite(siteData);
    return res.status(200).json(savedSite);
  } catch (error) {
    console.error("사업장 정보 저장 오류:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "사업장 정보를 저장하는 중 오류가 발생했습니다." });
  }
}

/**
 * 회사 삭제
 * @route DELETE /api/companies/:id
 */
export async function deleteCompany(req: Request, res: Response) {
  try {
    const companyId = req.params.id;
    await companyService.deleteCompany(companyId);
    return res.status(200).json({ success: true, message: "회사가 삭제되었습니다." });
  } catch (error) {
    console.error("회사 삭제 오류:", error);
    return res.status(500).json({ error: "회사를 삭제하는 중 오류가 발생했습니다." });
  }
}

/**
 * 사업장 삭제
 * @route DELETE /api/sites/:id
 */
export async function deleteSite(req: Request, res: Response) {
  try {
    const siteId = req.params.id;
    await companyService.deleteSite(siteId);
    return res.status(200).json({ success: true, message: "사업장이 삭제되었습니다." });
  } catch (error) {
    console.error("사업장 삭제 오류:", error);
    return res.status(500).json({ error: "사업장을 삭제하는 중 오류가 발생했습니다." });
  }
}

/**
 * 전체 회사 및 사업장 정보 일괄 저장
 * @route POST /api/settings/companies
 */
export async function saveAllCompanies(req: Request, res: Response) {
  try {
    const { companies } = req.body;
    
    if (!companies || !Array.isArray(companies)) {
      return res.status(400).json({ error: "올바른 회사 정보가 제공되지 않았습니다." });
    }
    
    // 회사 코드 중복 검사
    const companyCodes = companies.map(company => company.code);
    const uniqueCompanyCodes = new Set(companyCodes);
    if (uniqueCompanyCodes.size !== companyCodes.length) {
      return res.status(400).json({ error: "중복된 회사 코드가 존재합니다." });
    }
    
    // 사업장 코드 중복 검사
    const allSites = companies.flatMap(company => company.sites || []);
    const siteCodes = allSites.map(site => site.code);
    const uniqueSiteCodes = new Set(siteCodes);
    if (uniqueSiteCodes.size !== siteCodes.length) {
      return res.status(400).json({ error: "중복된 사업장 코드가 존재합니다." });
    }
    
    // 각 회사 정보 저장
    const savedCompanies = await Promise.all(
      companies.map(company => companyService.saveCompany(company))
    );
    
    return res.status(200).json({
      success: true,
      message: "회사 및 사업장 정보가 성공적으로 저장되었습니다.",
      companies: savedCompanies
    });
  } catch (error) {
    console.error("회사 정보 일괄 저장 오류:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "회사 정보를 저장하는 중 오류가 발생했습니다." });
  }
}

/**
 * 회사 정보 수정
 * @route PUT /api/companies/:id
 */
export async function updateCompany(req: Request, res: Response) {
  try {
    const companyId = req.params.id;
    const companyData = req.body;
    
    // 기본 데이터 유효성 검증
    if (!companyData.name || !companyData.code) {
      return res.status(400).json({ error: "회사명과 회사 코드는 필수 입력 항목입니다." });
    }
    
    // ID 일치 확인
    if (companyData.id && companyData.id !== companyId) {
      return res.status(400).json({ error: "URL의 ID와 요청 본문의 ID가 일치하지 않습니다." });
    }
    
    // ID 설정
    companyData.id = companyId;
    
    const updatedCompany = await companyService.saveCompany(companyData);
    return res.status(200).json(updatedCompany);
  } catch (error) {
    console.error("회사 정보 수정 오류:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "회사 정보를 수정하는 중 오류가 발생했습니다." });
  }
}

/**
 * 사업장 정보 수정
 * @route PUT /api/sites/:id
 */
export async function updateSite(req: Request, res: Response) {
  try {
    const siteId = req.params.id;
    const siteData = req.body;
    
    // 기본 데이터 유효성 검증
    if (!siteData.companyId || !siteData.name || !siteData.code) {
      return res.status(400).json({ error: "회사 ID, 사업장명, 사업장 코드는 필수 입력 항목입니다." });
    }
    
    // ID 일치 확인
    if (siteData.id && siteData.id !== siteId) {
      return res.status(400).json({ error: "URL의 ID와 요청 본문의 ID가 일치하지 않습니다." });
    }
    
    // ID 설정
    siteData.id = siteId;
    
    const updatedSite = await companyService.saveSite(siteData);
    return res.status(200).json(updatedSite);
  } catch (error) {
    console.error("사업장 정보 수정 오류:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "사업장 정보를 수정하는 중 오류가 발생했습니다." });
  }
} 