/**
 * @file __tests__/components/history/HistoryCard.test.tsx
 * @description HistoryCard 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryCard from '../../../components/history/HistoryCard';
import { createMockAccidentReport, createMockInvestigationReport } from '../../utils/test-utils';

// Next.js Link 모킹
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('HistoryCard 컴포넌트', () => {
  const mockReport = createMockAccidentReport();
  const mockInvestigationMap = new Map([
    [mockReport.accident_id, createMockInvestigationReport()]
  ]);
  const mockGetDisplayStatus = jest.fn(() => '완료');
  const mockGetStatusBadgeClass = jest.fn(() => 'bg-green-100 text-green-800');
  const mockGetAccidentTypeDisplay = jest.fn(() => ({ type: '인적' }));
  const mockOnToggleExpansion = jest.fn();
  const mockFormatDate = jest.fn(() => '2025-01-01');
  const mockExpandedRowDetails = jest.fn(() => <div>상세 정보</div>);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('사고 정보를 올바르게 표시한다', () => {
      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      expect(screen.getByText('완료')).toBeInTheDocument();
      expect(screen.getByText('ACC-2025-001')).toBeInTheDocument();
      expect(screen.getByText('테스트 사고 (최종)')).toBeInTheDocument();
      expect(screen.getByText('📍 테스트 사업장')).toBeInTheDocument();
      expect(screen.getByText('📅 2025-01-01')).toBeInTheDocument();
      expect(screen.getByText('인적')).toBeInTheDocument();
    });

    it('사고명이 없을 때 기본값을 표시한다', () => {
      const reportWithoutName = createMockAccidentReport({
        final_accident_name: undefined,
        accident_name: undefined
      });

      render(
        <HistoryCard
          report={reportWithoutName}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      expect(screen.getByText('미입력')).toBeInTheDocument();
    });
  });

  describe('상태 표시', () => {
    it('상태 배지가 올바르게 표시된다', () => {
      mockGetDisplayStatus.mockReturnValue('진행중');
      mockGetStatusBadgeClass.mockReturnValue('bg-yellow-100 text-yellow-800');

      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      const statusBadge = screen.getByText('진행중');
      expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  describe('사고 타입 표시', () => {
    it('인적 사고 타입이 올바르게 표시된다', () => {
      mockGetAccidentTypeDisplay.mockReturnValue({ type: '인적' });

      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      const typeBadge = screen.getByText('인적');
      expect(typeBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('물적 사고 타입이 올바르게 표시된다', () => {
      mockGetAccidentTypeDisplay.mockReturnValue({ type: '물적' });

      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      const typeBadge = screen.getByText('물적');
      expect(typeBadge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    it('복합 사고 타입이 올바르게 표시된다', () => {
      mockGetAccidentTypeDisplay.mockReturnValue({ type: '복합' });

      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      const typeBadge = screen.getByText('복합');
      expect(typeBadge).toHaveClass('bg-purple-100', 'text-purple-800');
    });
  });

  describe('확장/축소 기능', () => {
    it('확장 버튼이 올바르게 작동한다', () => {
      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      const expandButton = screen.getByTitle('상세 정보 펼치기');
      fireEvent.click(expandButton);

      expect(mockOnToggleExpansion).toHaveBeenCalledWith(mockReport.accident_id);
    });

    it('확장 상태에서 축소 버튼이 표시된다', () => {
      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={true}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      const collapseButton = screen.getByTitle('상세 정보 접기');
      expect(collapseButton).toBeInTheDocument();
    });

    it('확장 상태에서 상세 정보가 표시된다', () => {
      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={true}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
          ExpandedRowDetails={mockExpandedRowDetails}
        />
      );

      expect(screen.getByText('상세 정보')).toBeInTheDocument();
    });
  });

  describe('보고서 링크', () => {
    it('조사보고서 링크가 올바르게 표시된다', () => {
      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      const investigationLink = screen.getByText('📋 조사보고서 보기');
      expect(investigationLink).toBeInTheDocument();
      expect(investigationLink).toHaveAttribute('href', '/investigation/test-accident-1');
    });

    it('발생보고서 링크가 올바르게 표시된다', () => {
      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      const occurrenceLink = screen.getByText('📄 발생보고서 보기');
      expect(occurrenceLink).toBeInTheDocument();
      expect(occurrenceLink).toHaveAttribute('href', '/occurrence/test-accident-1');
    });

    it('조사보고서가 없을 때 조사보고서 링크가 표시되지 않는다', () => {
      const emptyInvestigationMap = new Map();

      render(
        <HistoryCard
          report={mockReport}
          investigationMap={emptyInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      expect(screen.queryByText('📋 조사보고서 보기')).not.toBeInTheDocument();
      expect(screen.getByText('📄 발생보고서 보기')).toBeInTheDocument();
    });
  });

  describe('날짜 포맷팅', () => {
    it('formatDate 함수가 호출된다', () => {
      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      expect(mockFormatDate).toHaveBeenCalledWith(mockReport.final_acci_time);
    });

    it('formatDate가 없을 때 빈 문자열을 표시한다', () => {
      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
        />
      );

      expect(screen.getByText('📅')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('확장 버튼에 적절한 title이 있다', () => {
      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      const expandButton = screen.getByTitle('상세 정보 펼치기');
      expect(expandButton).toBeInTheDocument();
    });

    it('링크들이 적절한 href를 가진다', () => {
      render(
        <HistoryCard
          report={mockReport}
          investigationMap={mockInvestigationMap}
          getDisplayStatus={mockGetDisplayStatus}
          getStatusBadgeClass={mockGetStatusBadgeClass}
          getAccidentTypeDisplay={mockGetAccidentTypeDisplay}
          isExpanded={false}
          onToggleExpansion={mockOnToggleExpansion}
          formatDate={mockFormatDate}
        />
      );

      const occurrenceLink = screen.getByText('📄 발생보고서 보기');
      expect(occurrenceLink).toHaveAttribute('href', '/occurrence/test-accident-1');
    });
  });
}); 