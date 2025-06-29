import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 실제 프로젝트에서는 다음과 같이 구현:
    // 1. 파일 ID로 데이터베이스에서 파일 정보 조회
    // 2. 클라우드 스토리지(S3 등)에서 파일 다운로드
    // 3. 이미지 파일의 경우 적절한 크기로 리사이징
    // 4. 파일 스트림을 응답으로 반환
    
    // 현재는 개발용 더미 이미지 반환
    // 실제로는 저장된 파일을 반환해야 함
    const response = await fetch('https://via.placeholder.com/150x150.png?text=Preview');
    
    if (!response.ok) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
    
  } catch (error) {
    console.error('파일 미리보기 오류:', error);
    return NextResponse.json(
      { error: '파일 미리보기 실패' },
      { status: 500 }
    );
  }
} 