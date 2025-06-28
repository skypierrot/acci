import { NextRequest, NextResponse } from "next/server";

/**
 * @file /app/api/files/[id]/route.ts
 * @description
 *  - 파일 정보 조회 및 다운로드 API
 *  - GET: 파일 다운로드 또는 메타데이터 조회
 *  - DELETE: 파일 삭제
 */

// 파일 메타데이터 목업 데이터
const mockFileData: Record<string, { name: string; type: string; url: string }> = {
  "photo1": { name: "현장사진1.jpg", type: "image/jpeg", url: "/icons/file.svg" },
  "photo2": { name: "현장사진2.jpg", type: "image/jpeg", url: "/icons/file.svg" },
  "video1": { name: "CCTV영상.mp4", type: "video/mp4", url: "/icons/file.svg" },
  "doc1": { name: "작업자진술서.pdf", type: "application/pdf", url: "/icons/file.svg" },
  "doc2": { name: "목격자진술서.pdf", type: "application/pdf", url: "/icons/file.svg" }
};

// 파일 정보 조회 또는 다운로드 API (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;
    const { searchParams } = new URL(request.url);
    const metaOnly = searchParams.get("meta") === "true";

    // 파일 정보 찾기 (실제로는 DB 조회)
    const fileInfo = mockFileData[fileId];
    
    if (!fileInfo) {
      return NextResponse.json(
        { error: "파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 메타데이터만 요청된 경우
    if (metaOnly) {
      return NextResponse.json({
        id: fileId,
        name: fileInfo.name,
        type: fileInfo.type,
        url: `/api/files/${fileId}`
      });
    }

    // 실제 프로젝트에서는 파일 다운로드 로직
    // 1. 스토리지에서 파일 스트림 읽기
    // 2. 적절한 MIME 타입과 함께 파일 스트림 반환
    
    // 테스트용으로는 아이콘 이미지 반환
    return NextResponse.json({
      id: fileId,
      name: fileInfo.name,
      type: fileInfo.type,
      url: fileInfo.url
    });
  } catch (error) {
    console.error("파일 조회 중 오류:", error);
    return NextResponse.json(
      { error: "파일 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 파일 삭제 API (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;
    
    // 파일 정보 찾기 (실제로는 DB 조회)
    const fileInfo = mockFileData[fileId];
    
    if (!fileInfo) {
      return NextResponse.json(
        { error: "파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 실제 프로젝트에서는 파일 삭제 로직
    // 1. 스토리지에서 파일 삭제
    // 2. DB에서 파일 메타데이터 삭제
    
    // 삭제 성공 응답
    return NextResponse.json({
      success: true,
      message: "파일이 성공적으로 삭제되었습니다."
    });
  } catch (error) {
    console.error("파일 삭제 중 오류:", error);
    return NextResponse.json(
      { error: "파일 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 