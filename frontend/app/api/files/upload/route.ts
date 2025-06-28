import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

/**
 * @file /app/api/files/upload/route.ts
 * @description
 *  - 파일 업로드 API
 *  - POST: 파일 업로드 처리 및 파일 ID 반환
 */

export async function POST(request: NextRequest) {
  try {
    // 멀티파트 폼 데이터 처리
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // 파일 유형 및 크기 검증
    const fileType = file.type;
    const fileSize = file.size;

    // 파일 크기 제한 (20MB)
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기가 제한을 초과합니다 (최대 20MB)." },
        { status: 400 }
      );
    }

    // 허용되는 파일 형식 검증
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "video/mp4",
      "video/mpeg",
      "video/quicktime"
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다." },
        { status: 400 }
      );
    }

    // 파일 ID 생성 (UUID)
    const fileId = uuidv4();

    // 실제 프로젝트에서는 파일 저장 로직 구현
    // 1. 클라우드 스토리지(S3 등)에 업로드
    // 2. 파일 메타데이터를 DB에 저장
    
    // 업로드 성공 응답
    return NextResponse.json({
      success: true,
      fileId,
      message: "파일 업로드 성공"
    });
  } catch (error) {
    console.error("파일 업로드 중 오류:", error);
    return NextResponse.json(
      { error: "파일 업로드 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 