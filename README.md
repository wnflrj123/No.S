# No.S (넘버에스)

삼성전자 뮤지컬 동호회 **No.S**의 예약 현황 공유 시스템입니다.

> ⚠️ 이 사이트는 실제 예약 시스템이 아닙니다. 회사 시스템에서 예약한 내용을 동호회원들과 공유하는 용도입니다.

## 주요 기능

- 🔐 **Google 로그인** - 동호회원 인증
- 📅 **예약 현황 조회** - 캘린더/목록 뷰로 예약 확인
- ✏️ **예약 정보 등록** - 예약한 내용 공유 (반복 일정 지원)
- 🎭 **동호회 행사** - 공연, 워크샵 등 행사 일정 공유
- 👑 **운영진 관리** - 운영진 추가/삭제 기능

## 기술 스택

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS
- **Backend**: Firebase (Authentication, Firestore)
- **Deployment**: Self-hosted Server with PM2

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 Firebase 설정을 추가:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

## 배포

GitHub Actions를 통해 `main` 브랜치에 push하면 자동으로 서버에 배포됩니다.

## 프로젝트 구조

```
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 메인(랜딩) 페이지
│   ├── login/             # 로그인 페이지
│   ├── reservations/      # 예약 현황 페이지
│   └── admin/             # 운영진 관리 페이지
├── components/            # React 컴포넌트
│   ├── common/            # 공통 컴포넌트
│   ├── layout/            # 레이아웃 (Header, Footer)
│   ├── auth/              # 인증 관련
│   ├── reservations/      # 예약 관련
│   └── events/            # 행사 관련
├── contexts/              # React Context
├── lib/                   # 유틸리티, Firebase 설정
└── types/                 # TypeScript 타입 정의
```

## 라이선스

Private - 삼성전자 뮤지컬 동호회 No.S 전용
