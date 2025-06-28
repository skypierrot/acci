/**
 * @file controllers/file.controller.ts
 * @description
 *  - 파일 업로드, 다운로드, 삭제 기능을 처리하는 컨트롤러
 *  - multer 미들웨어를 사용하여 파일 업로드 구현
 */

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// 파일 저장 경로 설정
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// 업로드 디렉토리가 없으면 생성
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 파일 저장을 위한 multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
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
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

export default class FileController {
  /**
   * @method upload
   * @description
   *  - POST /api/files/upload
   *  - 파일 업로드 처리
   */
  static upload = [
    // 단일 파일 업로드 미들웨어 적용
    upload.single('file'),
    
    // 업로드 완료 후 처리 핸들러
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: '업로드할 파일이 없습니다.' });
        }

        // 클라이언트에 반환할 파일 정보
        const fileInfo = {
          fileId: path.parse(req.file.filename).name, // 확장자 제외한 파일명 (UUID)
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        };

        // 응답
        return res.status(201).json(fileInfo);
      } catch (error: any) {
        console.error('파일 업로드 에러:', error.message);
        return res.status(500).json({ error: '파일 업로드 중 오류가 발생했습니다.' });
      }
    }
  ];

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

      // 해당 ID로 업로드된 파일 찾기
      const files = fs.readdirSync(UPLOAD_DIR);
      const fileWithId = files.find(file => file.startsWith(fileId));

      if (!fileWithId) {
        return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
      }

      const filePath = path.join(UPLOAD_DIR, fileWithId);
      
      // 파일 전송
      res.download(filePath);
    } catch (error: any) {
      console.error('파일 다운로드 에러:', error.message);
      return res.status(500).json({ error: '파일 다운로드 중 오류가 발생했습니다.' });
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

      // 해당 ID로 업로드된 파일 찾기
      const files = fs.readdirSync(UPLOAD_DIR);
      const fileWithId = files.find(file => file.startsWith(fileId));

      if (!fileWithId) {
        return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
      }

      const filePath = path.join(UPLOAD_DIR, fileWithId);
      
      // 파일 삭제
      fs.unlinkSync(filePath);
      
      // 응답
      return res.status(200).json({ message: '파일이 삭제되었습니다.' });
    } catch (error: any) {
      console.error('파일 삭제 에러:', error.message);
      return res.status(500).json({ error: '파일 삭제 중 오류가 발생했습니다.' });
    }
  }
}
