import axios from 'axios';

// 개선조치 상태 타입 정의 (한국어 DB 상태 → 영어 프론트엔드 상태)
export type CorrectiveActionStatus = 'pending' | 'in_progress' | 'delayed' | 'completed';

// 개선조치 아이템 타입 정의
export interface CorrectiveAction {
  id?: number;
  investigation_id: string; // 문자열로 변경
  title: string; // 개선계획 명칭
  description: string; // 개선조치 내용 (improvement_plan과 매핑)
  manager: string; // 담당자 (responsible_person과 매핑)
  due_date: string; // 완료예정일 (scheduled_date와 매핑)
  status: CorrectiveActionStatus; // 상태 (progress_status와 매핑)
  created_at?: string;
  updated_at?: string;
  // 조사보고서 정보 추가
  original_global_accident_no?: string;
  investigation_global_accident_no?: string;
  investigation_accident_name?: string;
  action_type?: string; // 대책유형 (기술적/교육적/관리적)
}

// 백엔드 스키마와 일치하는 실제 필드명 인터페이스 (한국어 상태)
export interface CorrectiveActionRaw {
  id?: number;
  investigation_id: string;
  action_type?: string;
  title?: string;
  improvement_plan?: string;
  progress_status: string; // 한국어 상태: '대기' | '진행' | '완료' | '지연'
  scheduled_date?: string;
  responsible_person?: string;
  completion_date?: string;
  created_at?: string;
  updated_at?: string;
  // 조사보고서 정보 추가
  original_global_accident_no?: string;
  investigation_global_accident_no?: string;
  investigation_accident_name?: string;
}

// 개선조치 생성 요청 타입
export interface CreateCorrectiveActionRequest {
  investigation_id: number;
  title: string;
  description: string;
  manager: string;
  due_date: string;
  status: CorrectiveActionStatus;
}

// 개선조치 수정 요청 타입
export interface UpdateCorrectiveActionRequest {
  title?: string;
  description?: string;
  manager?: string;
  due_date?: string;
  status?: CorrectiveActionStatus;
}

// 상태별 통계 타입
export interface StatusStats {
  total: number;
  pending: number;
  in_progress: number;
  delayed: number;
  completed: number;
}

// 담당자별 통계 타입
export interface ManagerStats {
  manager: string;
  total: number;
  pending: number;
  in_progress: number;
  delayed: number;
  completed: number;
}

// 연도별 통계 타입
export interface YearlyStats {
  year: number;
  total: number;
  pending: number;
  in_progress: number;
  delayed: number;
  completed: number;
}

// 대시보드 갱신 콜백 타입
export type DashboardRefreshCallback = () => Promise<void>;

/**
 * 한국어 상태를 영어 상태로 변환하는 함수
 * @param koreanStatus 한국어 상태
 * @returns 영어 상태
 */
function mapStatusToEnglish(koreanStatus: string): CorrectiveActionStatus {
  switch (koreanStatus) {
    case '대기': return 'pending';
    case '진행': return 'in_progress';
    case '완료': return 'completed';
    case '지연': return 'delayed';
    default: return 'pending';
  }
}

/**
 * 백엔드 응답을 프론트엔드 타입으로 변환하는 매핑 함수
 * @param raw 백엔드에서 받은 원본 데이터
 * @returns 프론트엔드에서 사용하는 CorrectiveAction 타입
 */
function mapCorrectiveAction(raw: CorrectiveActionRaw): CorrectiveAction {
  return {
    id: raw.id,
    investigation_id: raw.investigation_id, // 문자열로 유지
    title: raw.title || '',
    description: raw.improvement_plan || '',
    manager: raw.responsible_person || '',
    due_date: raw.scheduled_date || '',
    status: mapStatusToEnglish(raw.progress_status), // 한국어 → 영어 변환
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    // 조사보고서 정보 매핑
    original_global_accident_no: raw.original_global_accident_no,
    investigation_global_accident_no: raw.investigation_global_accident_no,
    investigation_accident_name: raw.investigation_accident_name,
    action_type: raw.action_type,
  };
}

/**
 * 개선조치 서비스 클래스
 * 백엔드 API와 연동하여 개선조치 CRUD 및 통계 기능을 제공합니다.
 */
class CorrectiveActionService {
  private baseURL = '/api/investigation';
  private dashboardRefreshCallback?: DashboardRefreshCallback;

  /**
   * 대시보드 갱신 콜백을 설정합니다.
   * @param callback 대시보드 갱신 함수
   */
  setDashboardRefreshCallback(callback: DashboardRefreshCallback) {
    this.dashboardRefreshCallback = callback;
  }

  /**
   * 대시보드를 갱신합니다.
   */
  private async refreshDashboard() {
    if (this.dashboardRefreshCallback) {
      try {
        await this.dashboardRefreshCallback();
      } catch (error) {
        console.error('대시보드 갱신 중 오류:', error);
      }
    }
  }

  /**
   * 특정 조사보고서의 모든 개선조치를 조회합니다.
   * @param investigationId 조사보고서 ID
   * @returns 개선조치 목록
   */
  async getCorrectiveActions(investigationId: number): Promise<CorrectiveAction[]> {
    try {
      const response = await axios.get(`${this.baseURL}/${investigationId}/corrective-actions`);
      return (response.data.data || []).map(mapCorrectiveAction); // 백엔드 응답 구조에 맞춰 .data 추가
    } catch (error) {
      console.error('개선조치 조회 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 특정 개선조치를 조회합니다.
   * @param investigationId 조사보고서 ID
   * @param actionId 개선조치 ID
   * @returns 개선조치 상세 정보
   */
  async getCorrectiveAction(investigationId: number, actionId: number): Promise<CorrectiveAction> {
    try {
      const response = await axios.get(`${this.baseURL}/${investigationId}/corrective-actions/${actionId}`);
      return mapCorrectiveAction(response.data.data); // 백엔드 응답 구조에 맞춰 .data 추가
    } catch (error) {
      console.error('개선조치 상세 조회 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 새로운 개선조치를 생성합니다.
   * @param investigationId 조사보고서 ID
   * @param data 개선조치 생성 데이터
   * @returns 생성된 개선조치 정보
   */
  async createCorrectiveAction(
    investigationId: number, 
    data: CreateCorrectiveActionRequest
  ): Promise<CorrectiveAction> {
    try {
      const response = await axios.post(`${this.baseURL}/${investigationId}/corrective-actions`, data);
      const result = response.data.data;
      
      // 생성 후 대시보드 갱신
      await this.refreshDashboard();
      
      return mapCorrectiveAction(result);
    } catch (error) {
      console.error('개선조치 생성 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 개선조치를 수정합니다.
   * @param investigationId 조사보고서 ID
   * @param actionId 개선조치 ID
   * @param data 수정할 데이터
   * @returns 수정된 개선조치 정보
   */
  async updateCorrectiveAction(
    investigationId: number,
    actionId: number,
    data: UpdateCorrectiveActionRequest
  ): Promise<CorrectiveAction> {
    try {
      const response = await axios.put(`${this.baseURL}/${investigationId}/corrective-actions/${actionId}`, data);
      const result = response.data.data;
      
      // 수정 후 대시보드 갱신
      await this.refreshDashboard();
      
      return mapCorrectiveAction(result);
    } catch (error) {
      console.error('개선조치 수정 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 개선조치를 삭제합니다.
   * @param investigationId 조사보고서 ID
   * @param actionId 개선조치 ID
   * @returns 삭제 성공 여부
   */
  async deleteCorrectiveAction(investigationId: number, actionId: number): Promise<boolean> {
    try {
      await axios.delete(`${this.baseURL}/${investigationId}/corrective-actions/${actionId}`);
      
      // 삭제 후 대시보드 갱신
      await this.refreshDashboard();
      
      return true;
    } catch (error) {
      console.error('개선조치 삭제 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 상태별 개선조치 통계를 조회합니다.
   * @param investigationId 조사보고서 ID (선택사항)
   * @returns 상태별 통계 정보 (모든 상태가 0건으로 표시됨)
   */
  async getStatusStats(investigationId?: number): Promise<StatusStats> {
    try {
      const url = investigationId 
        ? `${this.baseURL}/${investigationId}/corrective-actions/stats`
        : `${this.baseURL}/corrective-actions/stats`;
      const response = await axios.get(url);
      
      // 백엔드에서 받은 데이터
      const data = response.data.data || {};
      
      // 모든 가능한 상태를 0으로 초기화 (없는 상태도 0건으로 표시)
      const defaultStats: StatusStats = {
        total: 0,
        pending: 0,
        in_progress: 0,
        delayed: 0,
        completed: 0
      };
      
      // 실제 데이터로 업데이트 (없는 상태는 0으로 유지)
      return {
        total: data.total || 0,
        pending: data.pending || 0,
        in_progress: data.in_progress || 0,
        delayed: data.delayed || 0,
        completed: data.completed || 0
      };
    } catch (error) {
      console.error('상태별 통계 조회 중 오류 발생:', error);
      // 에러 발생 시에도 모든 상태를 0으로 반환
      return {
        total: 0,
        pending: 0,
        in_progress: 0,
        delayed: 0,
        completed: 0
      };
    }
  }

  /**
   * 담당자별 개선조치 통계를 조회합니다.
   * @param investigationId 조사보고서 ID (선택사항)
   * @returns 담당자별 통계 정보
   */
  async getManagerStats(investigationId?: number): Promise<ManagerStats[]> {
    try {
      const url = investigationId 
        ? `${this.baseURL}/${investigationId}/corrective-actions/stats`
        : `${this.baseURL}/corrective-actions/stats`;
      const response = await axios.get(url);
      return response.data.data; // 백엔드 응답 구조에 맞춰 .data 추가
    } catch (error) {
      console.error('담당자별 통계 조회 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 연도별 개선조치 통계를 조회합니다.
   * @param startYear 시작 연도 (선택사항)
   * @param endYear 종료 연도 (선택사항)
   * @returns 연도별 통계 정보
   */
  async getYearlyStats(startYear?: number, endYear?: number): Promise<YearlyStats[]> {
    try {
      let url = `${this.baseURL}/corrective-actions/stats`;
      const params = new URLSearchParams();
      if (startYear) params.append('startYear', startYear.toString());
      if (endYear) params.append('endYear', endYear.toString());
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url);
      return response.data.data; // 백엔드 응답 구조에 맞춰 .data 추가
    } catch (error) {
      console.error('연도별 통계 조회 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 상태별로 개선조치를 필터링하여 조회합니다.
   * @param status 필터링할 상태
   * @param investigationId 조사보고서 ID (선택사항)
   * @returns 필터링된 개선조치 목록
   */
  async getCorrectiveActionsByStatus(
    status: CorrectiveActionStatus,
    investigationId?: number
  ): Promise<CorrectiveAction[]> {
    try {
      let url = `${this.baseURL}/corrective-actions`;
      const params = new URLSearchParams();
      params.append('status', status);
      if (investigationId) params.append('investigationId', investigationId.toString());
      url += `?${params.toString()}`;
      
      const response = await axios.get(url);
      return (response.data.data || []).map(mapCorrectiveAction); // 백엔드 응답 구조에 맞춰 .data 추가
    } catch (error) {
      console.error('상태별 개선조치 조회 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 담당자별로 개선조치를 필터링하여 조회합니다.
   * @param manager 필터링할 담당자
   * @param investigationId 조사보고서 ID (선택사항)
   * @returns 필터링된 개선조치 목록
   */
  async getCorrectiveActionsByManager(
    manager: string,
    investigationId?: number
  ): Promise<CorrectiveAction[]> {
    try {
      let url = `${this.baseURL}/corrective-actions`;
      const params = new URLSearchParams();
      params.append('manager', manager);
      if (investigationId) params.append('investigationId', investigationId.toString());
      url += `?${params.toString()}`;
      
      const response = await axios.get(url);
      return (response.data.data || []).map(mapCorrectiveAction); // 백엔드 응답 구조에 맞춰 .data 추가
    } catch (error) {
      console.error('담당자별 개선조치 조회 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 완료예정일이 지난 개선조치를 조회합니다 (지연된 항목).
   * @param investigationId 조사보고서 ID (선택사항)
   * @returns 지연된 개선조치 목록
   */
  async getOverdueCorrectiveActions(investigationId?: number): Promise<CorrectiveAction[]> {
    try {
      let url = `${this.baseURL}/corrective-actions/overdue`;
      if (investigationId) {
        url += `?investigationId=${investigationId}`;
      }
      
      const response = await axios.get(url);
      return (response.data.data || []).map(mapCorrectiveAction); // 백엔드 응답 구조에 맞춰 .data 추가
    } catch (error) {
      console.error('지연된 개선조치 조회 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 개선조치 상태를 일괄 업데이트합니다.
   * @param investigationId 조사보고서 ID
   * @param actionIds 업데이트할 개선조치 ID 배열
   * @param status 변경할 상태
   * @returns 업데이트된 개선조치 목록
   */
  async bulkUpdateStatus(
    investigationId: number,
    actionIds: number[],
    status: CorrectiveActionStatus
  ): Promise<CorrectiveAction[]> {
    try {
      const response = await axios.put(`${this.baseURL}/${investigationId}/corrective-actions/bulk-status`, {
        actionIds,
        status
      });
      const result = response.data.data;
      
      // 일괄 상태 업데이트 후 대시보드 갱신
      await this.refreshDashboard();
      
      return result.map(mapCorrectiveAction);
    } catch (error) {
      console.error('개선조치 일괄 상태 업데이트 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 연도별 전체 개선조치 리스트를 조회합니다.
   * @param year 연도(YYYY)
   * @returns 개선조치 목록
   */
  async getAllActionsByYear(year: number): Promise<CorrectiveAction[]> {
    console.log('[FRONTEND_SERVICE] getAllActionsByYear 진입', { year });
    console.log('[FRONTEND_SERVICE] 요청 URL:', `${this.baseURL}/corrective-actions?year=${year}`);
    
    try {
      const url = `${this.baseURL}/corrective-actions?year=${year}`;
      const response = await axios.get(url);
      console.log('[FRONTEND_SERVICE] 응답 성공:', response.status, response.data);
      return (response.data.data || []).map(mapCorrectiveAction);
    } catch (error) {
      console.error('[FRONTEND_SERVICE] 연도별 개선조치 전체 조회 중 오류 발생:', error);
      return [];
    }
  }
}

// 서비스 인스턴스 생성 및 내보내기
export const correctiveActionService = new CorrectiveActionService();
export default correctiveActionService; 