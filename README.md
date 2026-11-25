# No.S (넘버에스)

삼성전자 뮤지컬 동호회 **No.S**의 내부 웹 플랫폼입니다.
연습실 예약 현황 공유, 동호회 행사·공지 안내, 정기공연 관객 신청까지 한곳에서 다룹니다.

> ⚠️ 이 사이트는 실제 예약 시스템이 아닙니다. 회사 시스템에서 예약한 내용을 동호회원들과 공유하는 용도입니다.

## 주요 기능

- 🔐 **Google 로그인**: 동호회원 인증 (인앱 브라우저 감지 시 외부 브라우저 유도)
- 📅 **예약 현황** (`/reservations`): 캘린더/리스트 뷰, 반복 예약, 동호회 행사·정기 일정 표시, 실시간 반영
- 🎭 **작품 정보** (`/musicals`): 뮤지컬별 씬·넘버·캐릭터 정리
- 🎬 **프로덕션** (`/productions`): 공연 회차별 캐스팅 보드, 스태프 구성
- 📢 **공지사항** (`/notices`): 리치 텍스트(TipTap) 공지 작성·고정
- 🎟️ **정기공연 신청** (`/invite/[year]/[round]`): 외부 관객용 공연 안내·신청·후원, 후원자 Wall, SMS 발송
- 💐 **배우 응원** (`/cheers/[year]/[round]`): 공연 배우 응원 페이지
- 👑 **관리** (`/admin`): 어드민 추가/삭제, 소유권 이전, 회원 동기화, 정기공연 관리

자세한 기능 명세는 [docs/PLAN.md](docs/PLAN.md)를 참고하세요.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 언어 | TypeScript (strict) |
| 스타일링 | TailwindCSS 4 |
| 백엔드 | Firebase Authentication, Firestore, firebase-admin (서버 API 라우트) |
| 기타 | TipTap (리치 텍스트), date-fns, SOLAPI (SMS) |
| 배포 | Vercel (GitHub 연동) |

## 로컬에서 실행하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 채웁니다.
`.env*` 파일은 `.gitignore`에 포함되어 있어 커밋되지 않습니다.

```env
# [필수] 클라이언트 Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# [필수: 서버 API] Firebase Admin SDK 서비스 계정 키 (JSON 전체를 한 줄로)
FIREBASE_SERVICE_ACCOUNT_KEY=

# [선택] 공휴일 표시 (공공데이터포털 특일 정보 API)
HOLIDAY_API_KEY=

# [선택] 정기공연 SMS 발송 (SOLAPI)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER=
```

| 변수 | 필요 여부 | 어디서 받나요 |
|------|-----------|---------------|
| `NEXT_PUBLIC_FIREBASE_*` (6개) | 필수 | Firebase 콘솔 → 프로젝트 설정 → 일반 → 웹 앱 구성 |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | 서버 API 사용 시 필수 | Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 |
| `HOLIDAY_API_KEY` | 선택 | [공공데이터포털](https://www.data.go.kr/) 특일 정보 API |
| `SOLAPI_*` (3개) | 선택 | SOLAPI 콘솔 (API 키/시크릿, 등록된 발신번호) |

운영 환경의 실제 값은 Vercel 대시보드(Settings → Environment Variables)에서 관리합니다. 접근 권한이 없다면 운영진에게 요청하세요.

> 💡 `FIREBASE_SERVICE_ACCOUNT_KEY`가 없으면 관리자 API(회원 동기화, 정기공연 신청·후원 등)를 호출할 때 에러가 납니다. 일반 화면 대부분은 클라이언트 설정만으로 동작합니다.
>
> ⚠️ 운영 Firebase 프로젝트의 키를 쓰면, 로컬에서 바꾼 데이터도 운영 DB에 그대로 반영됩니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 에 접속합니다.
Google 로그인이 안 되면 Firebase 콘솔 → Authentication → 설정 → **승인된 도메인**에 `localhost`가 있는지 확인하세요.

### 4. 프로덕션 빌드 확인 (선택)

```bash
npm run build
npm start
```

### 기타 스크립트

```bash
npm run lint   # ESLint 검사
```

## 배포

`main` 브랜치에 push하면 Vercel이 자동으로 빌드·배포합니다.

- **Production**: `main` push → https://www.samsung-musical.com
- **Preview**: PR 생성 시 미리보기 배포 자동 생성
- **환경 변수**: Vercel 대시보드에서 관리

## 프로젝트 구조

```
├── app/                      # Next.js App Router 페이지
│   ├── page.tsx              # 메인(랜딩) 페이지
│   ├── login/                # 로그인
│   ├── reservations/         # 예약 현황
│   ├── musicals/             # 작품 정보
│   ├── productions/          # 프로덕션 (캐스팅 보드)
│   ├── notices/              # 공지사항
│   ├── invite/[year]/        # 정기공연 신청 (외부 관객용, 비로그인)
│   ├── cheers/[year]/        # 배우 응원
│   ├── admin/                # 관리 페이지 (+ invites: 정기공연 관리)
│   └── api/                  # 서버 API 라우트 (admin, holidays, invites, cheers)
├── components/               # React 컴포넌트 (기능별 폴더)
├── contexts/                 # React Context (AuthContext)
├── lib/
│   ├── firebase.ts           # Firebase 클라이언트 SDK
│   ├── firebase-admin.ts     # Firebase Admin SDK (서버 전용)
│   ├── invites/              # 정기공연 관련 로직
│   ├── sms/                  # SOLAPI SMS 클라이언트
│   └── hooks/                # 커스텀 훅
├── types/                    # TypeScript 타입 정의
├── public/                   # 정적 파일 (아이콘, 정기공연 이미지 등)
├── scripts/                  # 보조 스크립트 (아이콘 생성 등)
├── docs/                     # 기획서·아키텍처 문서
└── firestore.rules           # Firestore 보안 규칙
```

상세 아키텍처와 Firestore 스키마는 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고하세요.

## 라이선스

Private - 삼성전자 뮤지컬 동호회 No.S 전용
