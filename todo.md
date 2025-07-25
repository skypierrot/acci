# 조사보고서 카드 버튼 개선 To-Do List

## 🎯 목표
조사보고서 카드의 버튼 배치를 개선하여 사용자 경험 향상

## 📝 작업 항목

### 1. 조사보고서가 있는 카드 개선
- [x] "상세보기" 버튼을 "조사보고서 보기"로 변경
- [x] "조사보고서 보기" 버튼 왼쪽에 "발생보고서 보기" 버튼 추가
- [x] 두 버튼을 가로로 나란히 배치
- [x] 버튼 스타일 통일성 유지

### 2. 조사보고서가 없는 카드 개선
- [x] "조사보고서 작성" 버튼 유지
- [x] "발생보고서 보기" 버튼 추가
- [x] 두 버튼을 가로로 나란히 배치
- [x] 버튼 색상 구분 (발생보고서: 회색, 조사보고서 작성: 녹색)

### 3. 공통 개선사항
- [x] 버튼 크기 및 간격 조정
- [x] 반응형 디자인 적용 (모바일에서 세로 배치)
- [x] 한글 주석 추가
- [x] 접근성 개선 (aria-label 등)

## 🔧 기술적 고려사항
- 조사보고서가 있는 경우: 발생보고서 ID를 통해 발생보고서 상세 페이지로 이동
- 조사보고서가 없는 경우: 발생보고서만 존재하므로 발생보고서 상세 페이지로 이동
- 버튼 클릭 시 적절한 페이지로 라우팅

## ✅ 완료 조건
- [x] 모든 카드에서 버튼이 올바르게 표시됨
- [x] 버튼 클릭 시 올바른 페이지로 이동
- [x] 반응형 디자인이 적용됨
- [x] 코드 가독성 및 유지보수성 향상

## 🎉 완료된 개선사항
- ✅ 조사보고서가 있는 카드: "발생보고서 보기" + "조사보고서 보기" 버튼 나란히 배치
- ✅ 조사보고서가 없는 카드: "발생보고서 보기" + "조사보고서 작성" 버튼 나란히 배치
- ✅ 모바일 반응형: 작은 화면에서는 버튼이 세로로 배치
- ✅ 접근성: aria-label 속성 추가
- ✅ 색상 구분: 발생보고서(회색), 조사보고서(슬레이트/녹색)


