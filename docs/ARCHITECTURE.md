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
│   ├── musicals/page.tsx         # 작품 정보 (캐러셀+상세+등록/수정)
│   ├── productions/page.tsx      # 프로덕션 (캐스팅 보드, 공연 회차)
│   ├── admin/page.tsx            # 관리 페이지 (Owner 전용)
│   ├── admin/invites/            # 정기공연 신청 관리 (Admin 전용)
│   │   ├── page.tsx              # 공연 목록 + 공개 토글
│   │   ├── new/page.tsx          # 새 공연 생성
│   │   ├── [year]/[round]/page.tsx       # 신청자 통계·항목별 답변·후원자
│   │   └── [year]/[round]/edit/page.tsx  # 공연 정보 수정
│   ├── invite/[year]/[round]/    # 외부 관객용 (비로그인)
│   │   ├── page.tsx              # 공연 정보 (포스터/안내/시간/장소/캐스팅)
│   │   ├── apply/page.tsx        # 신청 폼
│   │   └── thanks/[token]/page.tsx       # 감사 + 후원 계좌 + 후원 토글
│   └── api/
│       ├── admin/sync-users/     # 회원 동기화 API (서버 라우트)
│       │   └── route.ts
│       ├── holidays/             # 공휴일 조회 API (공공데이터포털)
│       │   └── route.ts
│       └── invites/[year]/[round]/
│           ├── register/route.ts # 신청 등록 + 토큰 발급 (POST)
│           └── sponsor/route.ts  # 후원 토글 (POST, 토큰 검증)
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
│   ├── musicals/
│   │   ├── MusicalCard.tsx       # 작품 카드 (캐러셀 아이템)
│   │   ├── MusicalCarousel.tsx   # 작품 캐러셀 (large/mini 두 가지 변형)
│   │   ├── MusicalDetail.tsx     # 작품 상세 (씬·넘버 아코디언, 캐릭터 목록)
│   │   ├── MusicalForm.tsx       # 작품 등록/수정 폼 (캐릭터 테이블, 씬·넘버 편집)
│   │   └── SceneAccordion.tsx    # 씬·넘버 아코디언 컴포넌트
│   ├── notices/
│   │   └── RichTextEditor.tsx    # TipTap 리치 텍스트 에디터
│   ├── events/
│   │   ├── EventForm.tsx         # 이벤트 등록/수정 (Admin 전용)
│   │   └── EventList.tsx         # 이벤트 목록
│   ├── productions/
│   │   ├── ProductionCard.tsx    # 프로덕션 카드 (캐스팅·스태프·회차 표시)
│   │   ├── ProductionDetail.tsx  # 프로덕션 상세 (회차별 캐스팅 보드)
│   │   └── ProductionForm.tsx    # 프로덕션 등록/수정 폼 (Admin 전용)
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
│   ├── invites/                  # 정기공연 신청 관련 (Phase별 점진 추가)
│   │   ├── types.ts              # Invite, InviteRegistration 등 인터페이스
│   │   ├── constants.ts          # 정규식·토큰 길이 상수
│   │   ├── server.ts             # 서버 헬퍼 (firebase-admin 사용)
│   │   └── client.ts             # 클라이언트 헬퍼 (firebase 클라이언트 SDK)
│   └── hooks/
│       └── useAuth.ts            # AuthContext 래퍼 훅
├── types/
│   └── index.ts                  # 전체 타입 정의
├── scripts/
│   └── generate-icons.mjs        # PWA 아이콘 생성 스크립트 (sharp)
├── firestore.rules               # Firestore 보안 규칙
├── public/
│   └── invites/{year}-{round}/   # 정기공연 정적 자산 (Vercel CDN)
│       ├── poster.jpg
│       └── cast/                 # 배우 프로필 사진
└── docs/                         # 프로젝트 문서
    ├── PLAN.md                   # 기획서
    └── ARCHITECTURE.md           # 이 파일
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
  locationUrl?: string     // 지도 링크 ('기타' 장소 선택 시)
  purpose: string
  participants?: Array<{ userId: string; userName: string }>  // 함께 참여하는 멤버 목록
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

### `musicals` 컬렉션

```typescript
{
  name: string
  imageUrl?: string
  characters: Array<{
    id: number
    name: string
    abbr?: string       // 붙여넣기 매핑용 축약어
    description: string
  }>
  scenes: Array<{
    id: number
    index: number
    title: string
    numbers: Array<{
      id: number
      index: number
      title: string
      characters: number[]  // MusicalCharacter.id 배열
    }>
  }>
  createdBy: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `productions` 컬렉션

```typescript
{
  name: string
  description?: string
  musicalId: string         // musicals 컬렉션 문서 ID
  startDate: string         // "YYYY-MM-DD"
  endDate: string           // "YYYY-MM-DD"
  locations: string[]       // 공연 장소 목록
  staffs: Array<{
    userId: string
    role: 'DIRECTOR' | 'MUSIC_DIRECTOR' | 'CHOREOGRAPHER' | 'STAGE_MANAGER'
  }>
  performances: Array<{
    id: string
    dateTime: string        // "YYYY-MM-DDTHH:mm"
    location?: string
    castings: Array<{
      characterId: number   // MusicalCharacter.id
      userId: string
    }>
  }>
  createdBy: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `invites` 컬렉션

정기공연 관객 신청용 공개 공연 정보. documentId는 `{year}-{round}` (예: "2026-1").

```typescript
{
  year: number               // 연도 (예: 2026)
  round: number              // 회차 번호 (예: 1)
  title: string              // 공연명 (예: "제1회 정기공연")
  subtitle?: string
  description: string        // HTML (TipTap)
  posterImageUrl: string     // 정적 경로 또는 외부 URL
  venue: {
    name: string
    address: string
    directions: string       // 오시는 길 (자유 텍스트)
    mapLinks: { naver?: string; kakao?: string; google?: string }
  }
  rounds: Array<{
    roundNo: number
    startAt: Timestamp       // 회차 시작 시각 (이 시각이 지나면 자동 마감)
    teamName: string         // 예: "블루팀"
    casting: Array<{
      role: string
      description: string
      photoFile?: string     // 정적 파일명. 경로: /invites/{year}-{round}/cast/{photoFile}
    }>
  }>
  sponsorAccount: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
  thanksMessage?: string
  isPublished: boolean       // false면 공개 페이지에서 404
  stats: {                   // 통계 캐시 (트랜잭션으로 갱신)
    totalRegistrations: number
    totalHeadcount: number
    totalSponsors: number
  }
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}
```

### `inviteRegistrations` 컬렉션

정기공연 신청자. 클라이언트는 직접 쓸 수 없고 반드시 API route(`/api/invites/.../register`, `/api/invites/.../sponsor`)를 경유.

```typescript
{
  inviteId: string           // "{year}-{round}"
  name: string
  phone: string              // "010-XXXX-XXXX"
  roundSelections: Array<{
    roundNo: number
    headcount: number        // 1~20
  }>
  companions?: string        // 동반인 이름 (자유 텍스트)
  supportingActors?: string  // 응원하는 배우
  seatRequests?: string      // 좌석 요청사항
  cheerMessage?: string      // 응원 메시지
  privacyConsent: true       // 개인정보 동의 (필수)
  accessToken: string        // 32자 (crypto.randomUUID, 하이픈 제거)
  isSponsor: boolean         // 후원 체크 (기본 false)
  sponsorCheckedAt?: Timestamp
  createdAt: Timestamp
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
| musicals | 로그인 | Admin | Admin | Admin |
| productions | 로그인 | Admin | Admin | Admin |
| settings | 로그인 | 로그인 | 로그인 | 로그인 |
| users | 로그인 | 본인만 | 본인만 | 본인만 |
| invites | `isPublished=true` 또는 Admin | Admin | Admin | Admin |
| inviteRegistrations | Admin | ❌ (API only) | ❌ (API only) | ❌ (API only) |

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

### `GET /api/holidays?year=YYYY&month=M`

공공데이터포털 특일 정보 API를 프록시하여 공휴일 정보 반환.

- **인증**: 없음 (클라이언트에서 직접 호출)
- **캐싱**: `next: { revalidate: 86400 }` + `Cache-Control: public, max-age=86400`
- **응답**: `{ holidays: { "YYYY-MM-DD": "공휴일명", ... } }`
- **환경변수**: `HOLIDAY_API_KEY` (공공데이터포털 서비스 키)

### `POST /api/invites/[year]/[round]/register`

정기공연 신청 등록. 비로그인 호출 가능.

- **인증**: 없음
- **검증**: 이름·휴대폰 형식·회차별 인원·개인정보 동의 · `invites/{id}.isPublished=true` · 각 회차 `startAt > now`
- **처리**: 32자 `accessToken` 생성 → `inviteRegistrations` 문서 create → `invites/{id}.stats` 트랜잭션 increment
- **응답**: 성공 시 `{ token: string }` (201), 검증 실패 시 `{ message, errors[] }` (400), 비공개·미존재 시 (404)

### `POST /api/invites/[year]/[round]/sponsor`

신청자의 후원 체크 토글. 토큰 검증 필수.

- **인증**: URL 토큰 + body의 `{ token }` 매칭
- **처리**: 토큰으로 registration 조회 → `inviteId` 매치 확인 → `isSponsor=true`, `sponsorCheckedAt=now` 저장 → `invites/{id}.stats.totalSponsors` increment (멱등)
- **응답**: 성공 `{ ok: true }`, 무효 토큰 (404), 잘못된 요청 (400)

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
GitHub main push → Vercel (GitHub 연동)
  → 자동 빌드 → Edge Network 배포
  → https://www.samsung-musical.com
```

- **호스팅**: Vercel Hobby 플랜
- **자동 배포**: main 브랜치 푸시 시 Production 자동 배포, PR 생성 시 Preview 자동 배포
- **도메인**: 가비아 등록, DNS는 A(`@` → Vercel IP) + CNAME(`www` → Vercel CNAME)로 연결, SSL은 Vercel이 자동 발급
- **환경 변수**: Vercel 대시보드(Settings → Environment Variables)에서 관리

## 환경 변수

| 변수 | 위치 | 용도 |
|------|------|------|
| NEXT_PUBLIC_FIREBASE_* | .env.local | 클라이언트 Firebase 설정 (6개) |
| FIREBASE_SERVICE_ACCOUNT_KEY | .env.local | 서버 Admin SDK (JSON) |
| HOLIDAY_API_KEY | .env.local | 공공데이터포털 특일 정보 API 서비스 키 |

## 코딩 컨벤션

- 컴포넌트: PascalCase (ReservationForm.tsx)
- 함수/변수: camelCase (handleSubmit)
- 타입: PascalCase 인터페이스 (Reservation, ClubEvent)
- 경로 별칭: `@/` → 프로젝트 루트
- 클라이언트 컴포넌트: 파일 상단에 `'use client'` 명시
- Firestore 타입: 런타임(Date)과 문서(Timestamp) 분리 (Reservation vs ReservationDoc)
- 시간 형식: 24시간제 "HH:mm", 날짜 형식: "YYYY-MM-DD"
- 색상 체계: 블루(primary) = 일반 기능, 오렌지(orange) = 관리자/이벤트, 민트(#4eaea9) = 정기 일정
