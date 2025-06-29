/**
 * @file index.ts
 * @description
 *  - Express 서버를 초기화하고, Drizzle ORM을 연결한 뒤
 *    /api 경로에 정의된 라우트를 바인딩하여 서버를 실행합니다.
 */

import express from "express";           // Express 프레임워크
import { json } from "body-parser";      // 요청 바디(JSON) 파싱 미들웨어
import cors from "cors";                 // CORS 정책을 위한 미들웨어
import path from "path";                 // 경로 조작 유틸리티
import dotenv from "dotenv";             // 환경 변수 로드 라이브러리
import bodyParser from "body-parser";
import routes from "./routes";           // API 라우트 정의
import { connectDB } from "./orm/index"; // Drizzle ORM 연결 함수
import { runMigrations } from "./orm/migrations/index"; // 마이그레이션 실행 함수
import * as SettingsService from './services/settings.service';

// 상위 디렉토리의 .env 파일을 로드합니다
dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

// API 서버 포트 (기본값: 3000, 환경변수로 변경 가능)
const PORT = process.env.API_PORT || 3000;

/**
 * @function initializeApp
 * @description
 *  - Express 앱을 초기화하고 미들웨어와 라우트를 설정합니다.
 *  - 파일 업로드 경로도 생성합니다.
 */
function initializeApp() {
  // Express 앱 인스턴스 생성
  const app = express();

  // 기본 미들웨어 설정
  app.use(cors()); // CORS 허용
  app.use(bodyParser.json({ limit: '10mb' })); // JSON 요청 본문 파싱 (10MB 제한)
  app.use(bodyParser.urlencoded({ extended: true })); // URL 인코딩된 요청 본문 파싱

  // API 라우트 설정 (/api 접두사 추가)
  app.use("/api", routes);

  // 루트 경로 핸들러
  app.get("/", (req, res) => {
    res.send("사고 관리 API 서버가 정상 동작 중입니다.");
  });

  // 서버 시작
  app.listen(PORT, () => {
    console.log(`🚀 API 서버가 포트 ${PORT}에서 시작되었습니다.`);
  });
}

/**
 * @function startServer
 * @description
 *  - 데이터베이스 연결 후 서버 초기화 및 시작
 */
async function startServer() {
  try {
    // 1. 데이터베이스 연결
    console.log("🔌 데이터베이스 연결 중...");
    connectDB();
    console.log("✅ 데이터베이스 연결 성공!");

    // 2. 마이그레이션 실행
    console.log("🔄 마이그레이션 실행 중...");
    await runMigrations();
    console.log("✅ 마이그레이션 실행 완료!");

    // 3. 재해자 수 필드 위치 설정
    try {
      console.log("🔄 재해자 수 필드 위치 설정 중...");
      await SettingsService.moveVictimCountToAccidentGroup();
      console.log("✅ 재해자 수 필드 위치 설정 완료!");
    } catch (error) {
      console.error("⚠️ 재해자 수 필드 위치 설정 중 오류:", error);
    }

    // 3. Express 앱 초기화 및 시작
    console.log("🔄 서버 초기화 중...");
    initializeApp();
  } catch (error) {
    console.error("❌ 서버 시작 실패:", error);
    process.exit(1); // 오류 발생 시 프로세스 종료
  }
}

// 서버 시작
startServer();
