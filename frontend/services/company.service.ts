/**
 * @file services/company.service.ts
 * @description
 *  - 회사 및 사업장 정보 관리 서비스
 *  - 프론트엔드에서 회사 및 사업장 정보 CRUD를 위한 API 호출 함수들
 */

// 회사 정보 인터페이스
export interface Company {
  id?: string;         // 자동 생성 ID
  name: string;        // 회사명
  code: string;        // 회사 코드
  description?: string; // 설명
  address?: string;     // 주소
  contact?: string;     // 연락처
  sites: Site[];       // 사업장 목록
}

// 사업장 정보 인터페이스
export interface Site {
  id?: string;         // 자동 생성 ID
  companyId: string;   // 소속 회사 ID
  name: string;        // 사업장명
  code: string;        // 사업장 코드
  description?: string; // 설명
  address?: string;     // 주소
  contact?: string;     // 연락처
}

/**
 * 회사 목록 조회
 * @returns 회사 목록 (사업장 포함)
 */
export async function getCompanies(): Promise<Company[]> {
  try {
    // Next.js API 라우트를 통해 데이터 요청
    const response = await fetch('/api/settings/companies');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '회사 목록을 불러오는 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('회사 목록 조회 오류:', error);
    throw error;
  }
}

/**
 * 개별 회사 조회
 * @param id 회사 ID
 * @returns 회사 정보 (사업장 포함)
 */
export async function getCompany(id: string): Promise<Company> {
  try {
    // Next.js API 라우트를 통해 데이터 요청
    const response = await fetch(`/api/companies/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '회사 정보를 불러오는 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('회사 정보 조회 오류:', error);
    throw error;
  }
}

/**
 * 회사 정보 저장 (생성 또는 수정)
 * @param company 저장할 회사 정보
 * @returns 저장된 회사 정보
 */
export async function saveCompany(company: Company): Promise<Company> {
  try {
    let url = '/api/companies';
    let method = 'POST';
    
    // ID가 있으면 수정, 없으면 생성
    if (company.id) {
      url = `/api/companies/${company.id}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(company),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '회사 정보를 저장하는 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('회사 정보 저장 오류:', error);
    throw error;
  }
}

/**
 * 회사 삭제
 * @param id 삭제할 회사 ID
 */
export async function deleteCompany(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '회사를 삭제하는 중 오류가 발생했습니다.');
    }
  } catch (error: any) {
    console.error('회사 삭제 오류:', error);
    throw error;
  }
}

/**
 * 전체 회사 및 사업장 정보 저장
 * @param companies 저장할 회사 목록
 */
export async function saveAllCompanies(companies: Company[]): Promise<void> {
  try {
    // 순차적으로 각 회사 저장
    for (const company of companies) {
      await saveCompany(company);
    }
  } catch (error: any) {
    console.error('회사 일괄 저장 오류:', error);
    throw error;
  }
}

/**
 * 사업장 정보 조회
 * @param id 사업장 ID
 * @returns 사업장 정보
 */
export async function getSite(id: string): Promise<Site> {
  try {
    const response = await fetch(`/api/sites/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '사업장 정보를 불러오는 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('사업장 정보 조회 오류:', error);
    throw error;
  }
}

/**
 * 사업장 정보 저장 (생성 또는 수정)
 * @param site 저장할 사업장 정보
 * @returns 저장된 사업장 정보
 */
export async function saveSite(site: Site): Promise<Site> {
  try {
    let url = '/api/sites';
    let method = 'POST';
    
    // ID가 있으면 수정, 없으면 생성
    if (site.id) {
      url = `/api/sites/${site.id}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(site),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '사업장 정보를 저장하는 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('사업장 정보 저장 오류:', error);
    throw error;
  }
}

/**
 * 사업장 삭제
 * @param id 삭제할 사업장 ID
 */
export async function deleteSite(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/sites/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '사업장을 삭제하는 중 오류가 발생했습니다.');
    }
  } catch (error: any) {
    console.error('사업장 삭제 오류:', error);
    throw error;
  }
}

/**
 * 회사 코드 목록 생성 (자동 제안용)
 * @returns 회사 코드 목록
 */
export async function getCompanyCodes(): Promise<string[]> {
  const companies = await getCompanies();
  return companies.map(company => company.code);
}

/**
 * 사업장 코드 목록 생성 (자동 제안용)
 * @returns 사업장 코드 목록
 */
export async function getSiteCodes(): Promise<string[]> {
  const companies = await getCompanies();
  const allSites = companies.flatMap(company => company.sites);
  return allSites.map(site => site.code);
} 