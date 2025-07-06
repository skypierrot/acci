/**
 * @file controllers/file.controller.ts
 * @description
 *  - 파일 업로드, 다운로드, 삭제 기능을 처리하는 컨트롤러
 *  - 데이터베이스 연동 및 보고서 맵핑 기능 포함
 *  - 임시 파일 세션 관리 및 고아 파일 정리 기능
 */

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../orm/index';
import { files, tempFileSessions, fileAccessLogs } from '../orm/schema/files';
import { occurrenceReport } from '../orm/schema/occurrence';
import { eq, and, lt, inArray } from 'drizzle-orm';

// 파일 저장 경로 설정
const UPLOAD_DIR = '/usr/src/app/uploads';
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');
const REPORTS_DIR = path.join(UPLOAD_DIR, 'reports');

// 디렉토리 생성
[UPLOAD_DIR, TEMP_DIR, REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 파일 저장을 위한 multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 임시 업로드는 temp 폴더에 저장
    cb(null, TEMP_DIR);
  },
  filename: function (req, file, cb) {
    // 고유한 파일명 생성 (원본 파일 확장자 유지)
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  }
});

// 업로드 용량 제한 및 설정
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    // 허용되는 파일 형식 검증
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "video/mp4", "video/mpeg", "video/quicktime", "video/webm"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

export default class FileController {
  /**
   * @method upload
   * @description
   *  - POST /api/files/upload
   *  - 파일 업로드 처리 및 데이터베이스 저장
   */
  static upload = [
    upload.single('file'),
    
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: '업로드할 파일이 없습니다.' });
        }

        const fileId = path.parse(req.file.filename).name;
        const fileExtension = path.extname(req.file.originalname);
        const category = req.body.category || 'etc_documents';
        const sessionId = req.body.sessionId || uuidv4();

        // 파일 메타데이터 추출
        const metadata: any = {
          width: null,
          height: null,
          duration: null
        };

        // 이미지 파일인 경우 크기 정보 추출 (선택사항)
        if (req.file.mimetype.startsWith('image/')) {
          // 이미지 처리 라이브러리 사용 시 여기에 구현
          // 예: sharp, jimp 등
        }

        // 데이터베이스에 파일 정보 저장
        const fileRecord = await db().insert(files).values({
          file_id: fileId,
          original_name: req.file.originalname,
          stored_name: req.file.filename,
          file_path: `temp/${req.file.filename}`,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          file_extension: fileExtension,
          category: category,
          uploaded_by: req.user?.id || 'anonymous', // 사용자 인증 구현 시 사용
          status: 'uploaded',
          metadata: metadata,
        }).returning();

        // 임시 파일 세션 관리
        await this.updateTempSession(sessionId, fileId, category);

              // 접근 로그 기록
      await FileController.logFileAccess(fileId, 'upload', req);

        // 클라이언트에 반환할 파일 정보
        const fileInfo = {
          fileId: fileId,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          category: category,
          sessionId: sessionId,
          previewUrl: FileController.generatePreviewUrl(fileId, req.file.mimetype),
        };

        return res.status(201).json(fileInfo);
      } catch (error: any) {
        console.error('파일 업로드 에러:', error.message);
        
        // 업로드 실패 시 파일 삭제
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (deleteError) {
            console.error('임시 파일 삭제 실패:', deleteError);
          }
        }
        
        return res.status(500).json({ error: '파일 업로드 중 오류가 발생했습니다.' });
      }
    }
  ];

  /**
   * @method attachToReport
   * @description
   *  - POST /api/files/attach
   *  - 업로드된 파일들을 보고서에 첨부
   */
  static async attachToReport(req: Request, res: Response) {
    try {
      const { fileIds, reportId, reportType } = req.body;

      if (!fileIds || !Array.isArray(fileIds) || !reportId || !reportType) {
        return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
      }

      // 파일들을 임시 폴더에서 보고서 폴더로 이동
      const reportDir = path.join(REPORTS_DIR, reportType, reportId);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const attachedFiles = [];
      const filesByCategory: Record<string, string[]> = {};

      for (const fileId of fileIds) {
        try {
          // 데이터베이스에서 파일 정보 조회
          const fileRecord = await db().select().from(files)
            .where(eq(files.file_id, fileId))
            .limit(1);

          if (fileRecord.length === 0) {
            console.warn(`파일 ID ${fileId}를 찾을 수 없습니다.`);
            continue;
          }

          const file = fileRecord[0];
          const oldPath = path.join(UPLOAD_DIR, file.file_path);
          const newFileName = `${fileId}${path.extname(file.stored_name)}`;
          const newPath = path.join(reportDir, newFileName);

          // 파일 이동
          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);

            // 데이터베이스 업데이트
            await db().update(files)
              .set({
                file_path: `reports/${reportType}/${reportId}/${newFileName}`,
                report_id: reportId,
                report_type: reportType,
                status: 'attached',
                updated_at: new Date(),
              })
              .where(eq(files.file_id, fileId));

            attachedFiles.push(fileId);
            
            // 카테고리별로 파일 ID 그룹화
            const category = file.category;
            if (!filesByCategory[category]) {
              filesByCategory[category] = [];
            }
            filesByCategory[category].push(fileId);
          }
        } catch (error) {
          console.error(`파일 ${fileId} 첨부 실패:`, error);
        }
      }

      // 보고서 테이블의 파일 필드 업데이트
      if (reportType === 'occurrence' && Object.keys(filesByCategory).length > 0) {
        try {
          // 기존 보고서 데이터 조회
          const existingReport = await db().select().from(occurrenceReport)
            .where(eq(occurrenceReport.accident_id, reportId))
            .limit(1);

          if (existingReport.length > 0) {
            const report = existingReport[0];
            const updateData: any = {};

            // 카테고리별로 필드 업데이트
            for (const [category, fileIds] of Object.entries(filesByCategory)) {
              const fieldName = category; // scene_photos, cctv_video, statement_docs, etc_documents
              
              // 기존 파일 ID들과 새로운 파일 ID들을 합치기
              let existingIds: string[] = [];
              const existingValue = report[fieldName as keyof typeof report];
              
              if (Array.isArray(existingValue)) {
                existingIds = existingValue;
              } else if (typeof existingValue === 'string' && existingValue) {
                try {
                  const parsed = JSON.parse(existingValue);
                  existingIds = Array.isArray(parsed) ? parsed : [];
                } catch {
                  existingIds = [];
                }
              }

              // 중복 제거하여 새로운 파일 ID 배열 생성
              const combinedIds = [...new Set([...existingIds, ...fileIds])];
              updateData[fieldName] = JSON.stringify(combinedIds);
            }

            // 보고서 업데이트
            await db().update(occurrenceReport)
              .set(updateData)
              .where(eq(occurrenceReport.accident_id, reportId));

            console.log(`보고서 ${reportId}의 파일 필드 업데이트 완료:`, updateData);
          }
        } catch (reportUpdateError) {
          console.error('보고서 파일 필드 업데이트 실패:', reportUpdateError);
        }
      }

      // 접근 로그 기록
      for (const fileId of attachedFiles) {
        await FileController.logFileAccess(fileId, 'attach', req);
      }

      return res.status(200).json({
        success: true,
        attachedFiles: attachedFiles,
        filesByCategory: filesByCategory,
        message: `${attachedFiles.length}개 파일이 성공적으로 첨부되었습니다.`
      });
    } catch (error: any) {
      console.error('파일 첨부 에러:', error.message);
      return res.status(500).json({ error: '파일 첨부 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @method download
   * @description
   *  - GET /api/files/:fileId
   *  - 파일 다운로드 처리
   */
  static async download(req: Request, res: Response) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({ error: '파일 ID가 필요합니다.' });
      }

      // 데이터베이스에서 파일 정보 조회
      const fileRecord = await db().select().from(files)
        .where(eq(files.file_id, fileId))
        .limit(1);

      if (fileRecord.length === 0) {
        return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
      }

      const file = fileRecord[0];
      const filePath = path.join(UPLOAD_DIR, file.file_path);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '파일이 서버에 존재하지 않습니다.' });
      }

      // 접근 로그 기록
      await FileController.logFileAccess(fileId, 'download', req);

      // 파일 전송
      res.download(filePath, file.original_name);
    } catch (error: any) {
      console.error('파일 다운로드 에러:', error.message);
      return res.status(500).json({ error: '파일 다운로드 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @method getFileInfo
   * @description
   *  - GET /api/files/:fileId/info
   *  - 파일 정보 조회
   */
  static async getFileInfo(req: Request, res: Response) {
    try {
      const { fileId } = req.params;

      const fileRecord = await db().select().from(files)
        .where(eq(files.file_id, fileId))
        .limit(1);

      if (fileRecord.length === 0) {
        return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
      }

      const file = fileRecord[0];
      
      return res.status(200).json({
        fileId: file.file_id,
        name: file.original_name,
        size: file.file_size,
        type: file.mime_type,
        category: file.category,
        status: file.status,
        reportId: file.report_id,
        reportType: file.report_type,
        createdAt: file.created_at,
        previewUrl: FileController.generatePreviewUrl(file.file_id, file.mime_type),
      });
    } catch (error: any) {
      console.error('파일 정보 조회 에러:', error.message);
      return res.status(500).json({ error: '파일 정보 조회 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @method delete
   * @description
   *  - DELETE /api/files/:fileId
   *  - 파일 삭제 처리
   */
  static async delete(req: Request, res: Response) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({ error: '파일 ID가 필요합니다.' });
      }

      // 데이터베이스에서 파일 정보 조회
      const fileRecord = await db().select().from(files)
        .where(eq(files.file_id, fileId))
        .limit(1);

      if (fileRecord.length === 0) {
        return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
      }

      const file = fileRecord[0];
      const filePath = path.join(UPLOAD_DIR, file.file_path);

      // 물리적 파일 삭제
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 데이터베이스에서 파일 상태 업데이트 (삭제 표시)
      await db().update(files)
        .set({
          status: 'deleted',
          updated_at: new Date(),
        })
        .where(eq(files.file_id, fileId));

      // 보고서에서 파일 ID 제거 (첨부된 파일인 경우)
      if (file.report_id && file.report_type === 'occurrence') {
        try {
          const existingReport = await db().select().from(occurrenceReport)
            .where(eq(occurrenceReport.accident_id, file.report_id))
            .limit(1);

          if (existingReport.length > 0) {
            const report = existingReport[0];
            const updateData: any = {};
            const category = file.category;

            // 해당 카테고리 필드에서 파일 ID 제거
            const existingValue = report[category as keyof typeof report];
            let existingIds: string[] = [];
            
            if (Array.isArray(existingValue)) {
              existingIds = existingValue;
            } else if (typeof existingValue === 'string' && existingValue) {
              try {
                const parsed = JSON.parse(existingValue);
                existingIds = Array.isArray(parsed) ? parsed : [];
              } catch {
                existingIds = [];
              }
            }

            // 삭제할 파일 ID를 제외한 새로운 배열 생성
            const filteredIds = existingIds.filter(id => id !== fileId);
            updateData[category] = JSON.stringify(filteredIds);

            // 보고서 업데이트
            await db().update(occurrenceReport)
              .set(updateData)
              .where(eq(occurrenceReport.accident_id, file.report_id));

            console.log(`보고서 ${file.report_id}에서 파일 ${fileId} 제거 완료`);
          }
        } catch (reportUpdateError) {
          console.error('보고서에서 파일 제거 실패:', reportUpdateError);
        }
      }

      // 접근 로그 기록
      try {
        await FileController.logFileAccess(fileId, 'delete', req);
      } catch (logError) {
        console.warn('파일 접근 로그 기록 실패:', logError);
      }

      return res.status(200).json({ 
        message: '파일이 삭제되었습니다.',
        fileId: fileId 
      });
    } catch (error: any) {
      console.error('파일 삭제 에러:', error.message);
      return res.status(500).json({ error: '파일 삭제 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @method cleanupOrphanedFiles
   * @description
   *  - DELETE /api/files/cleanup
   *  - 고아 파일 정리 (24시간 이상 된 미첨부 파일)
   */
  static async cleanupOrphanedFiles(req: Request, res: Response) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 24); // 24시간 전

      // 24시간 이상 된 미첨부 파일 조회
      const orphanedFiles = await db().select().from(files)
        .where(
          and(
            eq(files.status, 'uploaded'),
            lt(files.created_at, cutoffTime)
          )
        );

      let deletedCount = 0;

      for (const file of orphanedFiles) {
        try {
          const filePath = path.join(UPLOAD_DIR, file.file_path);
          
          // 물리적 파일 삭제
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          // 데이터베이스에서 파일 상태 업데이트
          await db().update(files)
            .set({
              status: 'deleted',
              updated_at: new Date(),
            })
            .where(eq(files.file_id, file.file_id));

          deletedCount++;
        } catch (error) {
          console.error(`파일 ${file.file_id} 정리 실패:`, error);
        }
      }

      return res.status(200).json({
        message: `${deletedCount}개의 고아 파일이 정리되었습니다.`,
        deletedCount: deletedCount
      });
    } catch (error: any) {
      console.error('파일 정리 에러:', error.message);
      return res.status(500).json({ error: '파일 정리 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @method preview
   * @description
   *  - GET /api/files/:fileId/preview
   *  - 파일 미리보기 (주로 이미지 파일)
   */
  static async preview(req: Request, res: Response) {
    try {
      const { fileId } = req.params;

      // 개발 환경에서는 실제 업로드된 파일을 반환
      // 먼저 데이터베이스에서 파일 정보 조회 시도
      try {
        const fileRecord = await db().select().from(files)
          .where(eq(files.file_id, fileId))
          .limit(1);

        if (fileRecord.length > 0) {
          const file = fileRecord[0];
          const filePath = path.join(UPLOAD_DIR, file.file_path);

          // 파일이 존재하고 이미지 타입인 경우
          if (fs.existsSync(filePath) && file.mime_type.startsWith('image/')) {
            const fileBuffer = fs.readFileSync(filePath);
            
            res.set({
              'Content-Type': file.mime_type,
              'Cache-Control': 'public, max-age=3600',
              'Content-Length': fileBuffer.length.toString(),
            });
            
            return res.send(fileBuffer);
          }
        }
      } catch (dbError) {
        console.warn('데이터베이스 조회 실패, 더미 이미지로 대체:', dbError);
      }

      // 데이터베이스 조회 실패하거나 파일이 없는 경우 더미 이미지 반환
      try {
        // 외부 이미지를 가져와서 프록시
        const placeholderUrl = 'https://via.placeholder.com/300x200.png?text=Preview';
        const response = await fetch(placeholderUrl);
        
        if (!response.ok) {
          throw new Error('외부 이미지 로드 실패');
        }
        
        const buffer = await response.arrayBuffer();
        
        res.set({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
          'Content-Length': buffer.byteLength.toString(),
        });
        
        return res.send(Buffer.from(buffer));
        
      } catch (fetchError) {
        console.error('외부 이미지 가져오기 실패:', fetchError);
        
        // 모든 것이 실패한 경우 기본 SVG 아이콘 반환
        const defaultSvg = `
          <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
            <rect width="150" height="150" fill="#f0f0f0" stroke="#ccc"/>
            <text x="75" y="75" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="#666">
              미리보기
            </text>
          </svg>
        `;
        
        res.set({
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        });
        
        return res.send(defaultSvg);
      }
    } catch (error: any) {
      console.error('파일 미리보기 오류:', error.message);
      return res.status(500).json({ error: '파일 미리보기 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @method updateTempSession
   * @description 임시 파일 세션 업데이트
   */
  private static async updateTempSession(sessionId: string, fileId: string, reportType: string) {
    try {
      // 기존 세션 조회
      const existingSessions = await db().select().from(tempFileSessions)
        .where(eq(tempFileSessions.session_id, sessionId))
        .limit(1);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 후 만료

      if (existingSessions.length > 0) {
        // 기존 세션에 파일 ID 추가
        const session = existingSessions[0];
        const currentFileIds = Array.isArray(session.file_ids) ? session.file_ids : [];
        const updatedFileIds = [...currentFileIds, fileId];

        await db().update(tempFileSessions)
          .set({
            file_ids: updatedFileIds,
            expires_at: expiresAt,
            updated_at: new Date(),
          })
          .where(eq(tempFileSessions.session_id, sessionId));
      } else {
        // 새 세션 생성
        await db().insert(tempFileSessions).values({
          session_id: sessionId,
          file_ids: [fileId],
          expires_at: expiresAt,
          report_type: reportType,
          status: 'active',
        });
      }
    } catch (error) {
      console.error('임시 파일 세션 업데이트 실패:', error);
    }
  }

  /**
   * @method logFileAccess
   * @description 파일 접근 로그 기록
   */
  private static async logFileAccess(fileId: string, accessType: string, req: Request) {
    try {
      await db().insert(fileAccessLogs).values({
        log_id: uuidv4(),
        file_id: fileId,
        access_type: accessType,
        user_id: req.user?.id || 'anonymous',
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
      });
    } catch (error) {
      console.error('파일 접근 로그 기록 실패:', error);
    }
  }

  /**
   * @method generatePreviewUrl
   * @description 파일 미리보기 URL 생성
   */
  private static generatePreviewUrl(fileId: string, mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      // 백엔드 API의 절대 URL 반환
      return `http://192.168.100.200:6001/api/files/${fileId}/preview`;
    } else if (mimeType.startsWith('video/')) {
      return '/icons/video.svg';
    } else if (mimeType === 'application/pdf') {
      return '/icons/pdf.svg';
    } else {
      return '/icons/file.svg';
    }
  }
}
