import Link from 'next/link';

/**
 * @file app/settings/page.tsx
 * @description 설정 메인 페이지
 */

export default function SettingsPage() {
  return (
    <div className="bg-white p-6 rounded-md shadow">
      <h1 className="text-2xl font-bold mb-6">시스템 설정</h1>
      
      <p className="text-gray-600 mb-8">
        시스템 설정을 통해 회사 및 사업장 정보, 사용자 관리, 보고서 설정 등을 관리할 수 있습니다.
        왼쪽 메뉴에서 원하는 설정 항목을 선택하세요.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-md p-4 hover:bg-blue-50 transition-colors">
          <h2 className="text-xl font-semibold mb-2">회사 및 사업장 관리</h2>
          <p className="text-gray-600 mb-4">
            회사 정보와 사업장 정보를 등록, 수정, 삭제할 수 있습니다.
          </p>
          <Link 
            href="/settings/companies"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            관리하기 →
          </Link>
        </div>
        
        <div className="border border-gray-200 rounded-md p-4 hover:bg-blue-50 transition-colors">
          <h2 className="text-xl font-semibold mb-2">사용자 관리</h2>
          <p className="text-gray-600 mb-4">
            시스템 사용자를 등록하고 권한을 설정할 수 있습니다.
          </p>
          <Link 
            href="/settings/users"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            관리하기 →
          </Link>
        </div>
        
        <div className="border border-gray-200 rounded-md p-4 hover:bg-blue-50 transition-colors">
          <h2 className="text-xl font-semibold mb-2">보고서 설정</h2>
          <p className="text-gray-600 mb-4">
            보고서 템플릿과 자동화 규칙을 설정할 수 있습니다.
          </p>
          <Link 
            href="/settings/reports"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            관리하기 →
          </Link>
        </div>
        
        <div className="border border-gray-200 rounded-md p-4 hover:bg-blue-50 transition-colors">
          <h2 className="text-xl font-semibold mb-2">시스템 설정</h2>
          <p className="text-gray-600 mb-4">
            시스템 전반적인 설정을 관리할 수 있습니다.
          </p>
          <Link 
            href="/settings/system"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            관리하기 →
          </Link>
        </div>
      </div>
    </div>
  );
} 