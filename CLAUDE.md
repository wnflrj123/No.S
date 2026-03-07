# No.S (넘버에스)

삼성전자 뮤지컬 동호회 예약 공유 플랫폼

## 기본 정보

- **기술 스택**: Next.js 16 + React 19 + Firebase (Auth/Firestore) + TailwindCSS 4
- **배포**: GitHub Actions → 자체 서버 (PM2, port 3333)
- **인증**: Google OAuth (Firebase Auth)
- **언어**: 한국어

## 문서 구조

- `docs/PLAN.md` — 기획서, 기능 명세, 로드맵
- `docs/ARCHITECTURE.md` — 기술 아키텍처, Firestore 스키마, 컴포넌트 구조, 배포

## 작업 규칙

- 한국어로 대화
- 코드 수정 시 TypeScript strict mode 준수
- TailwindCSS 유틸리티 클래스 사용 (CSS 모듈 X)
- 컴포넌트는 'use client' 명시 필요 여부 확인
- Firebase 클라이언트(lib/firebase.ts)와 서버(lib/firebase-admin.ts) 구분하여 사용
