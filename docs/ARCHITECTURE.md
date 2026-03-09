# No.S 기술 아키텍처

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| 언어 | TypeScript (strict) | 5.9.3 |
| 스타일링 | TailwindCSS | 4 |
| DB | Firebase Firestore | — |
| 인증 | Firebase Auth (Google OAuth) | — |
| 서버 SDK | firebase-admin | 13.7.0 |
| 날짜 처리 | date-fns | 4.1.0 |
| 아이콘 | react-icons | 5.5.0 |
| 리치 텍스트 | TipTap (@tiptap/react, starter-kit 등) | — |

## 디렉토리 구조

```
No.S/
├── app/                          # Next.js App Router 페이지
│   ├── layout.tsx                # 루트 레이아웃 (AuthProvider, 폰트, 메타데이터)
│   ├── page.tsx                  # 메인 랜딩 페이지
│   ├── loading.tsx               # 글로벌 로딩 스피너
│   ├── globals.css               # 글로벌 스타일, CSS 변수, 애니메이션
│   ├── opengraph-image.tsx       # 동적 OG 이미지 (Edge Runtime)
│   ├── login/page.tsx            # 로그인 (인앱 브라우저 감지 포함)
│   ├── reservations/page.tsx     # 예약 현황 (캘린더/리스트 뷰)
│   ├── notices/page.tsx           # 공지사항 (목록/상세/작성/수정)
│   ├── admin/page.tsx            # 관리 페이지 (Owner 전용)
│   └── api/admin/sync-users/     # 회원 동기화 API (서버 라우트)
│       └── route.ts
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # 네비게이션 + 프로필 드롭다운 + 닉네임 수정
│   │   └── Footer.tsx            # 푸터
│   ├── auth/
│   │   └── GoogleSignInButton.tsx
│   ├── reservations/
│   │   ├── ReservationCalendar.tsx  # 월간 캘린더 (예약 건수 + 행사 뱃지, 여러날 행사 연결 표시)
│   │   ├── ReservationForm.tsx      # 예약 등록/수정 폼 (반복 예약 지원)
│   │   └── ReservationList.tsx      # 예약 목록 (삭제 모달 포함)
│   ├── notices/
│   │   └── RichTextEditor.tsx    # TipTap 리치 텍스트 에디터
│   ├── events/
│   │   ├── EventForm.tsx         # 이벤트 등록/수정 (Admin 전용)
│   │   └── EventList.tsx         # 이벤트 목록
│   ├── schedules/
│   │   ├── ScheduleForm.tsx      # 정기 일정 등록/수정 (Admin 전용, 반복 지원)
│   │   └── ScheduleList.tsx      # 정기 일정 목록 (삭제 모달 포함)
│   └── common/
│       ├── TimePicker.tsx        # 커스텀 시간 선택 (시→분 2단계)
│       └── InstallPrompt.tsx     # PWA 설치 유도 배너
├── contexts/
│   └── AuthContext.tsx           # 인증 상태 관리 (user, isAdmin, isOwner)
├── lib/
│   ├── firebase.ts               # 클라이언트 Firebase 초기화 (auth, db)
│   ├── firebase-admin.ts         # 서버 Firebase Admin 초기화 (adminAuth, adminDb)
│   └── hooks/
│       └── useAuth.ts            # AuthContext 래퍼 훅
├── types/
│   └── index.ts                  # 전체 타입 정의
├── scripts/
│   └── generate-icons.mjs        # PWA 아이콘 생성 스크립트 (sharp)
├── firestore.rules               # Firestore 보안 규칙
├── docs/                         # 프로젝트 문서
│   ├── PLAN.md                   # 기획서
│   └── ARCHITECTURE.md           # 이 파일
└── .github/workflows/
    └── deploy.yml                # GitHub Actions 자동 배포
```

## Firestore 스키마

### `reservations` 컬렉션

```typescript
{
  userId: string           // Firebase Auth UID
  userName: string         // 표시 이름 (커스텀 닉네임 반영)
  userEmail: string
  date: string             // "YYYY-MM-DD"
  startTime: string        // "HH:mm"
  endTime: string          // "HH:mm"
  location: LocationType   // '합동연습실' | 'ART8실' | '댄스3실' | '기타'
  customLocation?: string  // location이 '기타'일 때 직접 입력값
  purpose: string
  repeatGroupId?: string   // 반복 예약 그룹 UUID
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `events` 컬렉션

```typescript
{
  title: string
  description?: string
  date: string             // "YYYY-MM-DD" (시작일)
  endDate?: string         // "YYYY-MM-DD" (종료일, 여러날 행사)
  startTime?: string       // "HH:mm" (선택)
  endTime?: string         // "HH:mm" (선택)
  location?: LocationType
  customLocation?: string
  locationUrl?: string     // 지도 링크 (네이버지도, 카카오맵 등)
  createdBy: string        // userId
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `schedules` 컬렉션

```typescript
{
  title: string            // 일정 제목 (예: 아카데미, 정극 연습)
  date: string             // "YYYY-MM-DD"
  startTime: string        // "HH:mm"
  endTime: string          // "HH:mm"
  location: LocationType   // '합동연습실' | 'ART8실' | '댄스3실' | '기타'
  customLocation?: string  // location이 '기타'일 때 직접 입력값
  locationUrl?: string     // 지도 링크
  description?: string     // 일정 설명
  repeatGroupId?: string   // 반복 일정 그룹 ID
  createdBy: string        // userId
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `users` 컬렉션

```typescript
{
  uid: string
  displayName: string
  email: string
  photoURL?: string
  customName?: string      // 사용자 지정 닉네임
  lastLoginAt: Timestamp
}
```

### `notices` 컬렉션

```typescript
{
  title: string
  content: string             // HTML (리치 텍스트 에디터 출력)
  pinned: boolean             // 고정 공지 여부
  createdBy: string           // userId
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `settings/admins` 문서

```typescript
{
  uids: string[]           // 어드민 UID 배열
  users: Array<{           // 어드민 상세 정보
    uid: string
    email: string
    displayName: string
  }>
  ownerUid: string         // 최고 관리자 UID
}
```

## Firestore 보안 규칙

| 컬렉션 | read | create | update | delete |
|--------|------|--------|--------|--------|
| reservations | 로그인 | 로그인 | 본인만 | 본인 + Admin/Owner |
| events | 로그인 | 로그인 | 로그인 | 로그인 |
| schedules | 로그인 | Admin | Admin | Admin |
| notices | 로그인 | Admin | Admin | Admin |
| settings | 로그인 | 로그인 | 로그인 | 로그인 |
| users | 로그인 | 본인만 | 본인만 | 본인만 |

- `isAdmin()` 함수: `settings/admins` 문서의 `ownerUid` 또는 `uids` 배열에 포함 여부로 판별
- 규칙 파일: `firestore.rules` (Firebase 콘솔에서 수동 배포)

## 인증 플로우

```
사용자 → Google OAuth (signInWithRedirect)
  → Firebase Auth 상태 변경 (onAuthStateChanged)
    → Firestore users/{uid} 동기화 (handleFirebaseUser)
    → settings/admins 조회 → isAdmin, isOwner 판별
    → effectiveName = customName || displayName || '익명'
```

- 인앱 브라우저(카카오톡, 네이버, 인스타그램 등) 감지 시 외부 브라우저로 유도
- 커스텀 닉네임 변경 시 users/{uid} + 본인 예약 전체 batch 업데이트

## API 라우트

### `POST /api/admin/sync-users`

Firebase Auth 전체 사용자 → Firestore users 컬렉션 동기화.

- **인증**: Authorization 헤더의 Bearer 토큰 검증 (firebase-admin)
- **권한**: Owner만 호출 가능
- **처리**: listUsers() 페이지네이션 → batch write
- **응답**: `{ synced: number }`

## 실시간 데이터 패턴

- 캘린더/리스트 모두 `onSnapshot` 리스너 사용
- 컴포넌트 언마운트 시 unsubscribe 정리
- 캘린더: 월 단위 쿼리, 날짜별 예약 카운트 + 행사 뱃지(오렌지) + 정기 일정 뱃지(#4eaea9) 집계
- 리스트: 선택 날짜 또는 기간 범위 쿼리

## 반복 예약 시스템

- `repeatGroupId`: `crypto.randomUUID()` + 타임스탬프로 생성
- 선택한 요일 패턴에 따라 날짜 생성 → 최대 100건 일괄 addDoc
- 삭제 시 3가지 옵션: 단일 / 이후 전부(date >=) / 전체 그룹
- 정기 일정 수정 시 3가지 옵션: 단일 / 이후 전부 / 전체 + 종료일 변경 (단축/연장)

## 배포 파이프라인

```
GitHub main push → GitHub Actions
  → SSH 접속 (자체 서버)
  → git pull → npm install → npm run build
  → pm2 restart (port 3333)
```

## 환경 변수

| 변수 | 위치 | 용도 |
|------|------|------|
| NEXT_PUBLIC_FIREBASE_* | .env.local | 클라이언트 Firebase 설정 (6개) |
| FIREBASE_SERVICE_ACCOUNT_KEY | .env.local | 서버 Admin SDK (JSON) |

## 코딩 컨벤션

- 컴포넌트: PascalCase (ReservationForm.tsx)
- 함수/변수: camelCase (handleSubmit)
- 타입: PascalCase 인터페이스 (Reservation, ClubEvent)
- 경로 별칭: `@/` → 프로젝트 루트
- 클라이언트 컴포넌트: 파일 상단에 `'use client'` 명시
- Firestore 타입: 런타임(Date)과 문서(Timestamp) 분리 (Reservation vs ReservationDoc)
- 시간 형식: 24시간제 "HH:mm", 날짜 형식: "YYYY-MM-DD"
- 색상 체계: 블루(primary) = 일반 기능, 오렌지(orange) = 관리자/이벤트, 민트(#4eaea9) = 정기 일정
