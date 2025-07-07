"use client";

import { useEffect, useState } from "react";
import { getOccurrenceReport } from "../../../../services/occurrence/occurrence.service";
import { OccurrenceFormData } from "../../../../types/occurrence.types";
import OccurrenceForm from "../../../../components/occurrence/OccurrenceForm";

interface OccurrenceEditClientProps {
  id: string;
}

const OccurrenceEditClient = ({ id }: OccurrenceEditClientProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<OccurrenceFormData> | null>(null);

  // 기존 보고서 데이터 로드
  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        console.log(`수정 페이지: 보고서 ID ${id} 로드 중...`);
        
        const reportData = await getOccurrenceReport(id);
        console.log('로드된 보고서 데이터:', reportData);

        // 폼 데이터 형식으로 변환
        const formData: Partial<OccurrenceFormData> & { company?: string; site?: string } = {
          company_name: reportData.company_name || '',
          company_code: reportData.company_code || '',
          site_name: reportData.site_name || '',
          site_code: reportData.site_code || '',
          // 검색 필드용 별도 설정
          company: reportData.company_name || '',
          site: reportData.site_name || '',
          acci_time: reportData.acci_time ? new Date(reportData.acci_time).toISOString().slice(0, 16) : '',
          acci_location: reportData.acci_location || '',
          is_contractor: reportData.is_contractor || false,
          contractor_name: reportData.contractor_name || '',
          victim_count: reportData.victim_count || 0,
          accident_type_level1: reportData.accident_type_level1 || '',
          accident_type_level2: reportData.accident_type_level2 || '',
          acci_summary: reportData.acci_summary || '',
          acci_detail: reportData.acci_detail || '',
          reporter_name: reportData.reporter_name || '',
          reporter_position: reportData.reporter_position || '',
          reporter_belong: reportData.reporter_belong || '',
          report_channel: reportData.report_channel || '',
          first_report_time: reportData.first_report_time ? new Date(reportData.first_report_time).toISOString().slice(0, 16) : '',
          _raw_first_report_time: reportData.first_report_time ? new Date(reportData.first_report_time).toISOString().slice(0, 16) : '',
          // 작업허가 관련 필드 추가
          work_permit_required: reportData.work_permit_required || '',
          work_permit_number: reportData.work_permit_number || '',
          work_permit_status: reportData.work_permit_status || '',
          scene_photos: Array.isArray(reportData.scene_photos) ? reportData.scene_photos : [],
          cctv_video: Array.isArray(reportData.cctv_video) ? reportData.cctv_video : [],
          statement_docs: Array.isArray(reportData.statement_docs) ? reportData.statement_docs : [],
          etc_documents: Array.isArray(reportData.etc_documents) ? reportData.etc_documents : [],
          // 자동 생성 필드들
          accident_id: reportData.accident_id || '',
          global_accident_no: reportData.global_accident_no || '',
          report_channel_no: reportData.report_channel_no || '',
          // 재해자 정보
          victims: reportData.victims || [],
          victim_name: reportData.victim_name || '',
          victim_age: reportData.victim_age || 0,
          victim_belong: reportData.victim_belong || '',
          victim_duty: reportData.victim_duty || '',
          injury_type: reportData.injury_type || '',
          ppe_worn: reportData.ppe_worn || '',
          first_aid: reportData.first_aid || '',
          // 물적피해 정보
          property_damages: reportData.property_damages || [],
          // 첨부파일 정보
          attachments: Array.isArray(reportData.attachments) ? reportData.attachments : []
        };

        setInitialData(formData);
        setLoading(false);
      } catch (error) {
        console.error('보고서 로드 오류:', error);
        setError('보고서를 로드하는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    if (id) {
      loadReport();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">보고서를 로드하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
          <a href="/occurrence" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            목록으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">데이터를 준비하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <OccurrenceForm 
      initialData={initialData}
      isEditMode={true}
      reportId={id}
    />
  );
};

export default OccurrenceEditClient;
