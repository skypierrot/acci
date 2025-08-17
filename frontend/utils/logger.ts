/**
 * @file utils/logger.ts
 * @description 로깅 시스템 유틸리티
 */

import { LogLevel, LogEntry } from '../types/error.types';

// 로깅 설정
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}

// 기본 설정
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT
};

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // 최대 로그 개수

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 로그 레벨 확인
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * 로그 포맷팅
   */
  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? ` | Error: ${entry.error.message}` : '';
    
    return `[${timestamp}] ${levelName}: ${entry.message}${contextStr}${errorStr}`;
  }

  /**
   * 로그 저장
   */
  private saveLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // 최대 로그 개수 제한
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * 콘솔 출력
   */
  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const formatted = this.formatLog(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formatted);
        if (entry.error) {
          console.error(entry.error);
        }
        break;
    }
  }

  /**
   * 원격 로깅
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: LogLevel[entry.level],
          message: entry.message,
          timestamp: entry.timestamp.toISOString(),
          context: entry.context,
          error: entry.error ? {
            message: entry.error.message,
            stack: entry.error.stack,
            name: entry.error.name
          } : undefined
        })
      });
    } catch (error) {
      // 원격 로깅 실패 시 콘솔에 출력
      console.error('Remote logging failed:', error);
    }
  }

  /**
   * 로그 기록
   */
  private async log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    };

    this.saveLog(entry);
    this.logToConsole(entry);
    await this.logToRemote(entry);
  }

  /**
   * 디버그 로그
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * 정보 로그
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * 경고 로그
   */
  warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  /**
   * 에러 로그
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * 치명적 에러 로그
   */
  critical(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  /**
   * 로그 조회
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs;
    
    if (level !== undefined) {
      filtered = filtered.filter(log => log.level >= level);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  /**
   * 로그 초기화
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 싱글톤 인스턴스 생성
export const logger = new Logger();

// 편의 함수들
export const logDebug = (message: string, context?: Record<string, any>) => logger.debug(message, context);
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context);
export const logWarn = (message: string, context?: Record<string, any>, error?: Error) => logger.warn(message, context, error);
export const logError = (message: string, context?: Record<string, any>, error?: Error) => logger.error(message, context, error);
export const logCritical = (message: string, context?: Record<string, any>, error?: Error) => logger.critical(message, context, error); 