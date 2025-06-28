import OccurrenceDetailClient from "./client";

/**
 * @file app/occurrence/[id]/page.tsx
 * @description
 *  - 사고 발생보고서 상세 조회 페이지 (서버 컴포넌트)
 *  - URL 파라미터의 id를 기반으로 특정 사고 보고서 데이터를 조회
 */

// 서버 컴포넌트
export default async function OccurrenceDetailPage({ params }: { params: { id: string } }) {
  // Next.js 15에서는 params가 Promise이므로 await 사용
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  return <OccurrenceDetailClient id={id} />;
} 