"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Company, Site, getCompanies, saveAllCompanies, saveCompany, saveSite, deleteSite, deleteCompany } from "@/services/company.service";

/**
 * @file app/settings/companies/page.tsx
 * @description
 *  - 회사와 사업장 정보 관리 페이지
 *  - 데이터 입력 및 목록 관리를 단일 화면에서 제공
 */

export default function CompanyManagementPage() {
  const router = useRouter();
  
  // 상태 관리
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState<{ name: string; code: string; description?: string; address?: string; contact?: string }>({ 
    name: "", 
    code: "" 
  });
  const [newSite, setNewSite] = useState<{ name: string; code: string; description?: string; address?: string; contact?: string }>({ 
    name: "", 
    code: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 회사 수정 모드 상태 관리
  const [isEditingCompany, setIsEditingCompany] = useState<boolean>(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);

  // 사업장 수정 모드 상태 관리
  const [isEditingSite, setIsEditingSite] = useState<boolean>(false);
  const [siteToEdit, setSiteToEdit] = useState<Site | null>(null);
  
  // 회사 목록 불러오기
  useEffect(() => {
    const fetchCompanyList = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // getCompanies 서비스 호출
        const fetchedCompanies = await getCompanies();
        setCompanies(fetchedCompanies);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "회사 정보를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
        console.error("회사 정보 로딩 오류:", err);
      }
    };
    
    fetchCompanyList();
  }, []);
  
  // 회사 선택 핸들러
  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
  };
  
  // 새 회사 입력 핸들러
  const handleNewCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCompany(prev => ({ ...prev, [name]: value }));
  };
  
  // 새 사업장 입력 핸들러
  const handleNewSiteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSite(prev => ({ ...prev, [name]: value }));
  };
  
  // 회사 추가 핸들러
  const handleAddCompany = async () => {
    if (!newCompany.name || !newCompany.code) {
      alert("회사명과 회사 코드는 필수 입력 항목입니다.");
      return;
    }
    
    // 회사 코드 중복 검사 (로컬 + 서버)
    if (companies.some(company => company.code === newCompany.code)) {
      alert("이미 사용 중인 회사 코드입니다. (로컬 목록)");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 새 회사 객체 (ID 없이)
      const companyToSave: Omit<Company, 'id' | 'sites'> & { sites: Site[] } = {
        name: newCompany.name,
        code: newCompany.code,
        description: newCompany.description,
        address: newCompany.address,
        contact: newCompany.contact,
        sites: [] // 새 회사는 초기에 사업장이 없음
      };

      // saveCompany 서비스 호출하여 새 회사 저장
      const savedCompany = await saveCompany(companyToSave);
      
      setCompanies(prev => [...prev, savedCompany]); // DB에 저장된 회사 정보로 상태 업데이트
      setNewCompany({ name: "", code: "", description: "", address: "", contact: "" });
      alert("회사가 성공적으로 추가되었습니다.");

    } catch (err: any) {
      console.error("회사 추가 오류:", err);
      setError(err.message || "회사 추가 중 오류가 발생했습니다.");
      alert(`회사 추가 실패: ${err.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 사업장 추가 핸들러
  const handleAddSite = async () => {
    if (!selectedCompany) {
      alert("사업장을 추가할 회사를 선택해주세요.");
      return;
    }
    
    if (!newSite.name || !newSite.code) {
      alert("사업장명과 사업장 코드는 필수 입력 항목입니다.");
      return;
    }
    
    // 사업장 코드 중복 검사
    const allSites = companies.flatMap(company => company.sites);
    if (allSites.some(site => site.code === newSite.code)) {
      alert("이미 사용 중인 사업장 코드입니다.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 새 사업장 객체 생성
      const siteToAdd: Site = {
        companyId: selectedCompany.id!,
        name: newSite.name,
        code: newSite.code,
        description: newSite.description,
        address: newSite.address,
        contact: newSite.contact
      };
      
      // saveSite 서비스 호출하여 실제 저장
      const savedSite = await saveSite(siteToAdd);
      
      // 상태 업데이트
      const updatedCompanies = companies.map(company => {
        if (company.id === selectedCompany.id) {
          return {
            ...company,
            sites: [...company.sites, savedSite]
          };
        }
        return company;
      });
      
      setCompanies(updatedCompanies);
      
      // 선택된 회사 업데이트
      const updatedSelectedCompany = updatedCompanies.find(
        company => company.id === selectedCompany.id
      );
      
      if (updatedSelectedCompany) {
        setSelectedCompany(updatedSelectedCompany);
      }
      
      setNewSite({ name: "", code: "", description: "", address: "", contact: "" });
      alert("사업장이 성공적으로 추가되었습니다.");
      
    } catch (err: any) {
      console.error("사업장 추가 오류:", err);
      setError(err.message || "사업장 추가 중 오류가 발생했습니다.");
      alert(`사업장 추가 실패: ${err.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 회사 삭제 핸들러
  const handleDeleteCompany = async (companyId: string) => {
    if (confirm("정말 이 회사를 삭제하시겠습니까? 소속된 모든 사업장도 함께 삭제됩니다.")) {
      setLoading(true);
      setError(null);
      
      try {
        // 서버에 회사 삭제 요청
        await deleteCompany(companyId);
        
        // UI 업데이트
        setCompanies(prev => prev.filter(company => company.id !== companyId));
        
        if (selectedCompany && selectedCompany.id === companyId) {
          setSelectedCompany(null);
        }
        
        alert("회사가 성공적으로 삭제되었습니다.");
      } catch (err: any) {
        console.error("회사 삭제 오류:", err);
        setError(err.message || "회사 삭제 중 오류가 발생했습니다.");
        alert(`회사 삭제 실패: ${err.message || "알 수 없는 오류"}`);
      } finally {
        setLoading(false);
      }
    }
  };
  
  // 사업장 삭제 핸들러
  const handleDeleteSite = async (siteId: string) => {
    if (!selectedCompany) return;
    
    if (confirm("정말 이 사업장을 삭제하시겠습니까?")) {
      setLoading(true);
      setError(null);
      
      try {
        // 서버에서 사업장 삭제
        await deleteSite(siteId);
        
        // UI 업데이트
        const updatedCompanies = companies.map(company => {
          if (company.id === selectedCompany.id) {
            return {
              ...company,
              sites: company.sites.filter(site => site.id !== siteId)
            };
          }
          return company;
        });
        
        setCompanies(updatedCompanies);
        
        // 선택된 회사 업데이트
        const updatedSelectedCompany = updatedCompanies.find(
          company => company.id === selectedCompany.id
        );
        
        if (updatedSelectedCompany) {
          setSelectedCompany(updatedSelectedCompany);
        }
        
        alert("사업장이 성공적으로 삭제되었습니다.");
      } catch (err: any) {
        console.error("사업장 삭제 오류:", err);
        setError(err.message || "사업장 삭제 중 오류가 발생했습니다.");
        alert(`사업장 삭제 실패: ${err.message || "알 수 없는 오류"}`);
      } finally {
        setLoading(false);
      }
    }
  };
  
  // 변경사항 저장 핸들러
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // saveAllCompanies 서비스 호출
      await saveAllCompanies(companies);
      
      alert("회사 및 사업장 정보가 성공적으로 저장되었습니다.");
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "데이터 저장 중 오류가 발생했습니다.");
      setLoading(false);
      console.error("회사 정보 저장 오류:", err);
    }
  };
  
  // 회사 편집 모드 시작
  const handleEditCompany = (company: Company) => {
    setCompanyToEdit({...company});
    setIsEditingCompany(true);
  };

  // 회사 정보 수정 취소
  const handleCancelEditCompany = () => {
    setIsEditingCompany(false);
    setCompanyToEdit(null);
  };

  // 회사 정보 수정 저장
  const handleSaveEditCompany = async () => {
    if (!companyToEdit) return;
    
    if (!companyToEdit.name || !companyToEdit.code) {
      alert("회사명과 회사 코드는 필수 입력 항목입니다.");
      return;
    }
    
    // 코드 중복 검사 (자신은 제외)
    if (companies.some(c => c.code === companyToEdit.code && c.id !== companyToEdit.id)) {
      alert("이미 사용 중인 회사 코드입니다.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 서버에 회사 정보 저장
      const updatedCompany = await saveCompany(companyToEdit);
      
      // 상태 업데이트
      const updatedCompanies = companies.map(company => 
        company.id === updatedCompany.id ? updatedCompany : company
      );
      
      setCompanies(updatedCompanies);
      setSelectedCompany(updatedCompany);
      setIsEditingCompany(false);
      setCompanyToEdit(null);
      
      alert("회사 정보가 성공적으로 수정되었습니다.");
    } catch (err: any) {
      console.error("회사 정보 수정 오류:", err);
      setError(err.message || "회사 정보 수정 중 오류가 발생했습니다.");
      alert(`회사 정보 수정 실패: ${err.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  // 사업장 편집 모드 시작
  const handleEditSite = (site: Site) => {
    setSiteToEdit({...site});
    setIsEditingSite(true);
  };

  // 사업장 정보 수정 취소
  const handleCancelEditSite = () => {
    setIsEditingSite(false);
    setSiteToEdit(null);
  };

  // 사업장 정보 수정 저장
  const handleSaveEditSite = async () => {
    if (!siteToEdit || !selectedCompany) return;
    
    if (!siteToEdit.name || !siteToEdit.code) {
      alert("사업장명과 사업장 코드는 필수 입력 항목입니다.");
      return;
    }
    
    // 사업장 코드 중복 검사 (자신은 제외)
    const allSites = companies.flatMap(company => company.sites);
    if (allSites.some(s => s.code === siteToEdit.code && s.id !== siteToEdit.id)) {
      alert("이미 사용 중인 사업장 코드입니다.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 서버에 사업장 정보 저장
      const updatedSite = await saveSite(siteToEdit);
      
      // 상태 업데이트
      const updatedCompanies = companies.map(company => {
        if (company.id === selectedCompany.id) {
          return {
            ...company,
            sites: company.sites.map(site => 
              site.id === updatedSite.id ? updatedSite : site
            )
          };
        }
        return company;
      });
      
      setCompanies(updatedCompanies);
      
      // 선택된 회사 업데이트
      const updatedSelectedCompany = updatedCompanies.find(
        company => company.id === selectedCompany.id
      );
      
      if (updatedSelectedCompany) {
        setSelectedCompany(updatedSelectedCompany);
      }
      
      setIsEditingSite(false);
      setSiteToEdit(null);
      
      alert("사업장 정보가 성공적으로 수정되었습니다.");
    } catch (err: any) {
      console.error("사업장 정보 수정 오류:", err);
      setError(err.message || "사업장 정보 수정 중 오류가 발생했습니다.");
      alert(`사업장 정보 수정 실패: ${err.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">회사 및 사업장 관리</h1>
        <p className="text-gray-600">
          발생보고서에 사용될 회사와 사업장 정보를 관리합니다.
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 회사 관리 섹션 */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">회사 목록</h2>
          
          {/* 회사 추가 폼 */}
          <div className="mb-6 p-3 bg-gray-50 rounded-md">
            <h3 className="text-md font-medium mb-2">새 회사 추가</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCompany.name}
                  onChange={handleNewCompanyChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="회사명 입력"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={newCompany.code}
                  onChange={handleNewCompanyChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="고유 코드 입력 (예: HQ, FACTORY1)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  name="description"
                  value={newCompany.description || ""}
                  onChange={handleNewCompanyChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="회사 설명 (선택사항)"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={newCompany.address || ""}
                  onChange={handleNewCompanyChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="회사 주소 (선택사항)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <input
                  type="text"
                  name="contact"
                  value={newCompany.contact || ""}
                  onChange={handleNewCompanyChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="회사 연락처 (선택사항)"
                />
              </div>
              
              <div>
                <button
                  onClick={handleAddCompany}
                  className="w-full py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                >
                  회사 추가
                </button>
              </div>
            </div>
          </div>
          
          {/* 회사 목록 */}
          <div className="max-h-96 overflow-y-auto">
            <ul className="divide-y">
              {companies.map(company => (
                <li
                  key={company.id}
                  className={`py-3 px-2 hover:bg-gray-50 cursor-pointer ${
                    selectedCompany?.id === company.id ? "bg-slate-50" : ""
                  }`}
                  onClick={() => handleSelectCompany(company)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{company.name}</h4>
                      <p className="text-sm text-gray-500">코드: {company.code}</p>
                      {company.description && (
                        <p className="text-sm text-gray-500">{company.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        사업장 {company.sites.length}개
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleEditCompany(company);
                        }}
                        className="px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 rounded"
                      >
                        수정
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteCompany(company.id!);
                        }}
                        className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              
              {companies.length === 0 && (
                <li className="py-4 text-center text-gray-500">
                  등록된 회사가 없습니다.
                </li>
              )}
            </ul>
          </div>
        </div>
        
        {/* 사업장 관리 섹션 */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {selectedCompany
              ? `${selectedCompany.name}의 사업장 목록`
              : "사업장 목록"}
          </h2>
          
          {selectedCompany ? (
            <>
              {/* 사업장 추가 폼 */}
              <div className="mb-6 p-3 bg-gray-50 rounded-md">
                <h3 className="text-md font-medium mb-2">새 사업장 추가</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사업장명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newSite.name}
                      onChange={handleNewSiteChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="사업장명 입력"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사업장 코드 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={newSite.code}
                      onChange={handleNewSiteChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="고유 코드 입력 (예: HQ-MAIN, FACT1-A)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명
                    </label>
                    <textarea
                      name="description"
                      value={newSite.description || ""}
                      onChange={handleNewSiteChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="사업장 설명 (선택사항)"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      주소
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={newSite.address || ""}
                      onChange={handleNewSiteChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="사업장 주소 (선택사항)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연락처
                    </label>
                    <input
                      type="text"
                      name="contact"
                      value={newSite.contact || ""}
                      onChange={handleNewSiteChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="사업장 연락처 (선택사항)"
                    />
                  </div>
                  
                  <div>
                    <button
                      onClick={handleAddSite}
                      className="w-full py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                    >
                      사업장 추가
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 사업장 목록 */}
              <div className="max-h-96 overflow-y-auto">
                <ul className="divide-y">
                  {selectedCompany.sites.map(site => (
                    <li key={site.id} className="py-3 px-2 border-b last:border-b-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{site.name}</h4>
                          <p className="text-sm text-gray-500">코드: {site.code}</p>
                          {site.description && (
                            <p className="text-sm text-gray-500">{site.description}</p>
                          )}
                          {site.address && (
                            <p className="text-sm text-gray-500">주소: {site.address}</p>
                          )}
                          {site.contact && (
                            <p className="text-sm text-gray-500">연락처: {site.contact}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditSite(site)}
                            className="px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 rounded"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteSite(site.id!)}
                            className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  
                  {selectedCompany.sites.length === 0 && (
                    <li className="py-4 text-center text-gray-500">
                      등록된 사업장이 없습니다.
                    </li>
                  )}
                </ul>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-gray-500">
              왼쪽에서 회사를 선택하면 사업장 목록이 표시됩니다.
            </div>
          )}
        </div>
      </div>
      
      {/* 저장 버튼 */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSaveChanges}
          disabled={loading}
          className={`px-6 py-2 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          } text-white rounded-md transition-colors`}
        >
          {loading ? "저장 중..." : "모든 변경사항 저장"}
        </button>
      </div>

      {/* 회사 수정 폼 */}
      {isEditingCompany && companyToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">회사 정보 수정</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={companyToEdit.name}
                  onChange={(e) => setCompanyToEdit({...companyToEdit, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="회사명 입력"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={companyToEdit.code}
                  onChange={(e) => setCompanyToEdit({...companyToEdit, code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="고유 코드 입력 (예: HQ, FACTORY1)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  name="description"
                  value={companyToEdit.description || ""}
                  onChange={(e) => setCompanyToEdit({...companyToEdit, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="회사 설명 (선택사항)"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={companyToEdit.address || ""}
                  onChange={(e) => setCompanyToEdit({...companyToEdit, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="회사 주소 (선택사항)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <input
                  type="text"
                  name="contact"
                  value={companyToEdit.contact || ""}
                  onChange={(e) => setCompanyToEdit({...companyToEdit, contact: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="회사 연락처 (선택사항)"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={handleCancelEditCompany}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveEditCompany}
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사업장 수정 폼 */}
      {isEditingSite && siteToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">사업장 정보 수정</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사업장명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={siteToEdit.name}
                  onChange={(e) => setSiteToEdit({...siteToEdit, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="사업장명 입력"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사업장 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={siteToEdit.code}
                  onChange={(e) => setSiteToEdit({...siteToEdit, code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="고유 코드 입력 (예: HQ-MAIN, FACT1-A)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  name="description"
                  value={siteToEdit.description || ""}
                  onChange={(e) => setSiteToEdit({...siteToEdit, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="사업장 설명 (선택사항)"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={siteToEdit.address || ""}
                  onChange={(e) => setSiteToEdit({...siteToEdit, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="사업장 주소 (선택사항)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <input
                  type="text"
                  name="contact"
                  value={siteToEdit.contact || ""}
                  onChange={(e) => setSiteToEdit({...siteToEdit, contact: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="사업장 연락처 (선택사항)"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={handleCancelEditSite}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveEditSite}
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 