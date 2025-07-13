import axios from 'axios';

// 개선조치 상태 타입 정의
export type CorrectiveActionStatus = 'pending' | 'in_progress' | 'delayed' | 'completed';

// 개선조치 아이템 타입 정의
export interface CorrectiveAction {
  id?: number;
  investigation_id: number;
  title: string; // 개선계획 명칭
  description: string; // 개선조치 내용
  manager: string; // 담당자
  due_date: string; // 완료예정일
  status: CorrectiveActionStatus; // 상태
  created_at?: string;
  updated_at?: string;
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

/**
 * 개선조치 서비스 클래스
 * 백엔드 API와 연동하여 개선조치 CRUD 및 통계 기능을 제공합니다.
 */
class CorrectiveActionService {
  private baseURL = '/api/investigation';

  /**
   * 특정 조사보고서의 모든 개선조치를 조회합니다.
   * @param investigationId 조사보고서 ID
   * @returns 개선조치 목록
   */
  async getCorrectiveActions(investigationId: number): Promise<CorrectiveAction[]> {
    try {
      const response = await axios.get(`${this.baseURL}/${investigationId}/corrective-actions`);
      return response.data.data; // 백엔드 응답 구조에 맞춰 .data 추가
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
      return response.data.data; // 백엔드 응답 구조에 맞춰 .data 추가
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
      return response.data.data; // 백엔드 응답 구조에 맞춰 .data 추가
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
      return response.data.data; // 백엔드 응답 구조에 맞춰 .data 추가
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
      return response.data.data; // 백엔드 응답 구조에 맞춰 .data 추가
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
      return response.data.data; // 백엔드 응답 구조에 맞춰 .data 추가
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
      return response.data.data; // 백엔드 응답 구조에 맞춰 .data 추가
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
      return response.data.data; // 백엔드 응답 구조에 맞춰 .data 추가
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
      return response.data.data || [];
    } catch (error) {
      console.error('[FRONTEND_SERVICE] 연도별 개선조치 전체 조회 중 오류 발생:', error);
      return [];
    }
  }
}

// 서비스 인스턴스 생성 및 내보내기
export const correctiveActionService = new CorrectiveActionService();
export default correctiveActionService; 