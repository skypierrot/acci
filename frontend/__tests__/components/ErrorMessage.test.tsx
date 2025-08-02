/**
 * @file __tests__/components/ErrorMessage.test.tsx
 * @description ErrorMessage 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../../components/ErrorMessage';
import { ErrorType } from '../../types/error.types';

describe('ErrorMessage 컴포넌트', () => {
  const mockError = new Error('테스트 에러 메시지');
  const mockOnRetry = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('에러 메시지를 올바르게 표시한다', () => {
      render(<ErrorMessage error={mockError} />);
      
      expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
      expect(screen.getByText('예상치 못한 오류가 발생했습니다.')).toBeInTheDocument();
    });

    it('문자열 에러를 올바르게 처리한다', () => {
      render(<ErrorMessage error="문자열 에러 메시지" />);
      
      expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
      expect(screen.getByText('예상치 못한 오류가 발생했습니다.')).toBeInTheDocument();
    });
  });

  describe('에러 타입별 메시지', () => {
    it('네트워크 에러 타입을 올바르게 표시한다', () => {
      render(<ErrorMessage error={mockError} type={ErrorType.NETWORK} />);
      
      expect(screen.getByText('네트워크 연결 오류')).toBeInTheDocument();
      expect(screen.getByText('인터넷 연결을 확인하고 다시 시도해 주세요.')).toBeInTheDocument();
    });

    it('검증 에러 타입을 올바르게 표시한다', () => {
      render(<ErrorMessage error={mockError} type={ErrorType.VALIDATION} />);
      
      expect(screen.getByText('입력 데이터 오류')).toBeInTheDocument();
      expect(screen.getByText('입력하신 정보를 확인하고 다시 시도해 주세요.')).toBeInTheDocument();
    });

    it('인증 에러 타입을 올바르게 표시한다', () => {
      render(<ErrorMessage error={mockError} type={ErrorType.AUTHENTICATION} />);
      
      expect(screen.getByText('인증 오류')).toBeInTheDocument();
      expect(screen.getByText('로그인이 필요하거나 세션이 만료되었습니다.')).toBeInTheDocument();
    });

    it('권한 에러 타입을 올바르게 표시한다', () => {
      render(<ErrorMessage error={mockError} type={ErrorType.AUTHORIZATION} />);
      
      expect(screen.getByText('권한 오류')).toBeInTheDocument();
      expect(screen.getByText('이 기능에 접근할 권한이 없습니다.')).toBeInTheDocument();
    });

    it('서버 에러 타입을 올바르게 표시한다', () => {
      render(<ErrorMessage error={mockError} type={ErrorType.SERVER_ERROR} />);
      
      expect(screen.getByText('서버 오류')).toBeInTheDocument();
      expect(screen.getByText('서버에서 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')).toBeInTheDocument();
    });
  });

  describe('액션 버튼', () => {
    it('재시도 버튼이 올바르게 작동한다', () => {
      render(<ErrorMessage error={mockError} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByText('다시 시도');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('닫기 버튼이 올바르게 작동한다', () => {
      render(<ErrorMessage error={mockError} onClose={mockOnClose} />);
      
      const closeButton = screen.getByText('닫기');
      expect(closeButton).toBeInTheDocument();
      
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('인증 에러에서 로그인 버튼이 표시된다', () => {
      render(<ErrorMessage error={mockError} type={ErrorType.AUTHENTICATION} />);
      
      const loginButton = screen.getByText('로그인');
      expect(loginButton).toBeInTheDocument();
    });

    it('권한 에러에서 이전 페이지 버튼이 표시된다', () => {
      render(<ErrorMessage error={mockError} type={ErrorType.AUTHORIZATION} />);
      
      const backButton = screen.getByText('이전 페이지로');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('상세 정보 토글', () => {
    it('상세 정보 버튼이 표시된다', () => {
      render(<ErrorMessage error={mockError} />);
      
      const detailsButton = screen.getByText('상세 정보 보기');
      expect(detailsButton).toBeInTheDocument();
    });

    it('상세 정보를 토글할 수 있다', () => {
      render(<ErrorMessage error={mockError} />);
      
      const detailsButton = screen.getByText('상세 정보 보기');
      fireEvent.click(detailsButton);
      
      expect(screen.getByText('상세 정보 숨기기')).toBeInTheDocument();
      expect(screen.getByText('테스트 에러 메시지')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('상세 정보 숨기기'));
      expect(screen.getByText('상세 정보 보기')).toBeInTheDocument();
    });

    it('showDetails가 true일 때 상세 정보가 기본적으로 표시된다', () => {
      render(<ErrorMessage error={mockError} showDetails={true} />);
      
      expect(screen.getByText('상세 정보 숨기기')).toBeInTheDocument();
      expect(screen.getByText('테스트 에러 메시지')).toBeInTheDocument();
    });
  });

  describe('스타일링', () => {
    it('커스텀 클래스명이 적용된다', () => {
      const { container } = render(
        <ErrorMessage error={mockError} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('기본 스타일이 적용된다', () => {
      const { container } = render(<ErrorMessage error={mockError} />);
      
      expect(container.firstChild).toHaveClass('bg-red-50');
      expect(container.firstChild).toHaveClass('border-red-200');
    });
  });

  describe('접근성', () => {
    it('적절한 ARIA 레이블을 가진다', () => {
      render(<ErrorMessage error={mockError} />);
      
      const errorHeading = screen.getByRole('heading', { level: 3 });
      expect(errorHeading).toHaveTextContent('오류가 발생했습니다');
    });

    it('버튼들이 키보드로 접근 가능하다', () => {
      render(<ErrorMessage error={mockError} onRetry={mockOnRetry} onClose={mockOnClose} />);
      
      const retryButton = screen.getByText('다시 시도');
      const closeButton = screen.getByText('닫기');
      
      expect(retryButton).toHaveAttribute('type', 'button');
      expect(closeButton).toHaveAttribute('type', 'button');
    });
  });
}); 