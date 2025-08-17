/**
 * @file __tests__/utils/logger.test.ts
 * @description 로깅 시스템 테스트
 */

import { logger, logDebug, logInfo, logWarn, logError, logCritical } from '../../utils/logger';
import { LogLevel } from '../../types/error.types';

global.fetch = jest.fn();

describe('로깅 시스템', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    logger.updateConfig({ level: LogLevel.DEBUG, enableConsole: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('로거 인스턴스', () => {
    it('로거가 올바르게 생성된다', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.critical).toBe('function');
    });
  });

  describe('로그 레벨', () => {
    it('DEBUG 레벨 로그가 올바르게 기록된다', async () => {
      logDebug('디버그 메시지', { context: 'test' });
      await new Promise(r => setTimeout(r, 10));
      expect(console.debug).toHaveBeenCalled();
    });

    it('INFO 레벨 로그가 올바르게 기록된다', async () => {
      logInfo('정보 메시지', { context: 'test' });
      await new Promise(r => setTimeout(r, 10));
      expect(console.info).toHaveBeenCalled();
    });

    it('WARN 레벨 로그가 올바르게 기록된다', async () => {
      const testError = new Error('테스트 에러');
      logWarn('경고 메시지', { context: 'test' }, testError);
      await new Promise(r => setTimeout(r, 10));
      expect(console.warn).toHaveBeenCalled();
    });

    it('ERROR 레벨 로그가 올바르게 기록된다', async () => {
      const testError = new Error('테스트 에러');
      logError('에러 메시지', { context: 'test' }, testError);
      await new Promise(r => setTimeout(r, 10));
      expect(console.error).toHaveBeenCalled();
    });

    it('CRITICAL 레벨 로그가 올바르게 기록된다', async () => {
      const testError = new Error('치명적 에러');
      logCritical('치명적 메시지', { context: 'test' }, testError);
      await new Promise(r => setTimeout(r, 10));
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('환경별 설정', () => {
    it('개발 환경에서 DEBUG 레벨이 활성화된다', async () => {
      logger.updateConfig({ level: LogLevel.DEBUG, enableConsole: true });
      logDebug('개발 환경 테스트');
      await new Promise(r => setTimeout(r, 10));
      expect(console.debug).toHaveBeenCalled();
    });

    it('프로덕션 환경에서 ERROR 레벨만 활성화된다', async () => {
      logger.updateConfig({ level: LogLevel.ERROR, enableConsole: true });
      logDebug('프로덕션 환경 테스트');
      await new Promise(r => setTimeout(r, 10));
      expect(console.debug).not.toHaveBeenCalled();
      logError('프로덕션 에러 테스트');
      await new Promise(r => setTimeout(r, 10));
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 