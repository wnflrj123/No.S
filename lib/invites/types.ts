/**
 * 정기공연 신청 페이지 - 타입 정의
 *
 * `invites` 컬렉션과 `inviteRegistrations` 컬렉션의 스키마.
 * 클라이언트 SDK Timestamp 기준으로 정의하되, 서버(firebase-admin) 코드에서도
 * 구조적으로 호환되도록 사용한다.
 */

import type { Timestamp } from 'firebase/firestore';

// ─── 공유 서브 타입 ────────────────────────────────────────

export interface SponsorAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface MapLinks {
  naver?: string;
  kakao?: string;
  google?: string;
}

export interface Venue {
  name: string;
  address: string;
  directions: string; // 오시는 길 (자유 텍스트)
  mapLinks: MapLinks;
  mapEmbedUrl?: string; // 지도 임베드 iframe src URL (구글/네이버/카카오 지도 "공유 → 퍼가기"에서 복사)
}

/**
 * 배역 마스터. 공연 전체에 공통이며 회차에 관계없이 동일.
 * (예: "장발장", "팡틴" 같은 배역 + 설명)
 */
export interface InviteRole {
  id: string; // 안정적 식별자 (crypto.randomUUID)
  name: string; // 배역명
  description: string; // 배역 설명
  order?: number; // 표시 순서 (선택)
}

/**
 * 제작진(스태프) 멤버 한 명.
 */
export interface InviteStaffMember {
  name: string;
  /** 정적 파일명 (선택). 경로: /invites/{year}-{round}/staff/{photoFile} */
  photoFile?: string;
}

/**
 * 제작진 한 직책 (예: 연출, 분장). 멤버 1명 이상.
 * 공연 전체 공통이며 회차와 무관.
 */
export interface InviteStaff {
  id: string; // crypto.randomUUID()
  role: string; // 직책명
  members: InviteStaffMember[];
}

/**
 * 회차별 캐스팅. 배역(roleId)을 참조하고, 그 배역에 누가 캐스팅됐는지 + 사진을 보관.
 *
 * 레거시 호환: 과거에는 { role, description, photoFile }로 회차마다 직접 입력했다.
 * 폼 로드 시 자동으로 InviteRole + 신규 CastingEntry로 변환된다.
 */
export interface CastingEntry {
  roleId: string; // InviteRole.id 참조
  actorName: string; // 회차별 배우 이름
  photoFile?: string; // 정적 파일명 (예: "kim.jpg"). 경로: /invites/{year}-{round}/cast/{photoFile}
  /**
   * 사진 crop 메타데이터 (3:4 frame에 어떻게 보여줄지). react-easy-crop의
   * croppedArea 출력 그대로: 각 값은 원본 이미지 기준 %(0~100).
   * 미설정 시 object-cover 기본 동작.
   */
  photoCrop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // ─── 레거시 필드 (마이그레이션용, 새로 저장하지 않음) ───
  /** @deprecated InviteRole로 이전됨. 폼 로드 시 자동 변환. */
  role?: string;
  /** @deprecated InviteRole로 이전됨. 폼 로드 시 자동 변환. */
  description?: string;
}

export interface InviteRound {
  roundNo: number; // 1, 2, 3 ...
  startAt: Timestamp; // 회차 시작 시각
  teamName: string; // 예: "블루팀"
  casting: CastingEntry[];
  /**
   * 회차 신청 가능 좌석 수. 잔여 좌석 안내(절반·1/3 임계)에 사용.
   * 미설정 시 잔여석 표기를 하지 않는다.
   */
  seatCapacity?: number;
}

export interface InviteStats {
  totalRegistrations: number; // 신청 건수
  totalHeadcount: number; // 총 인원수 (회차별 인원의 합)
  totalSponsors: number; // isSponsor=true인 신청자 수
}

/**
 * 신청 폼에서 비활성화 가능한 선택 항목들.
 * (이름·휴대폰·회차·개인정보 동의 같은 필수 항목은 비활성화 대상이 아님)
 */
export type OptionalFieldKey = 'companions' | 'supportingActors' | 'seatRequests' | 'cheerMessage';

/**
 * 후원자 wall에 표시되는 외부 응원자.
 * 신청은 안 했지만 응원 꽃다발을 보낸 사람들 (이름만 수집).
 * 신청자 중 isSponsor=true 인 사람과 합쳐서 wall에 표시.
 */
export interface InviteSupporter {
  id: string;
  inviteId: string;
  name: string;
  createdAt: Timestamp;
}

export const OPTIONAL_FIELD_LABELS: Record<OptionalFieldKey, string> = {
  companions: '동반인 이름',
  supportingActors: '응원하는 배우',
  seatRequests: '좌석 요청사항',
  cheerMessage: '응원 메시지',
};

// ─── 메인 타입 ─────────────────────────────────────────────

export interface Invite {
  id: string; // documentId = "{year}-{round}"
  year: number;
  round: number;
  overline?: string; // 최상단 작은 라벨 (예: "삼성전자 뮤지컬 동호회 제1회 정기공연")
  title: string;
  subtitle?: string;
  description: string; // HTML (TipTap)
  posterImageUrl: string; // 정적 경로 또는 외부 URL
  /** 공개 정보 페이지에 옅게 깔리는 배경 이미지. 옵션. */
  backgroundImageUrl?: string;
  venue: Venue;
  roles: InviteRole[]; // 배역 마스터 (공연 전체 공통). 레거시 데이터는 폼 저장 시 자동 채워짐
  /** 제작진. 선택 필드 — staff 없는 기존 공연 데이터와 호환. */
  staff?: InviteStaff[];
  rounds: InviteRound[];
  sponsorAccount: SponsorAccount;
  thanksMessage?: string;
  /**
   * 신청 폼에서 비활성화할 선택 항목 목록.
   * 예: ['seatRequests'] → 좌석 요청 입력 칸을 숨기고 서버에서도 무시.
   */
  disabledFields?: OptionalFieldKey[];
  /**
   * 후원자 wall에서 외부 응원자(현장 후원자) 받기 기능을 끄는지 여부.
   * true면 '응원 꽃다발 보내기' 버튼 숨김 + API에서도 거절.
   */
  disableWallSupport?: boolean;
  isPublished: boolean;
  stats: InviteStats;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // userId
}

export interface RoundSelection {
  roundNo: number;
  headcount: number;
}

export interface InviteRegistration {
  id: string; // auto-id
  inviteId: string; // "{year}-{round}"
  name: string;
  phone: string; // "010-XXXX-XXXX"
  roundSelections: RoundSelection[];
  companions?: string;
  supportingActors?: string;
  seatRequests?: string;
  cheerMessage?: string;
  privacyConsent: true; // 동의한 경우에만 저장됨 → 항상 true
  accessToken: string; // 32자
  isSponsor: boolean;
  sponsorCheckedAt?: Timestamp;
  createdAt: Timestamp;

  /**
   * 신청 상태.
   *  - 'active' (기본/누락): 정상 신청. 통계·SMS·확인 페이지 대상
   *  - 'superseded': 같은 이름·휴대폰의 새 신청에 의해 대체됨. 로그로만 남음
   */
  status?: 'active' | 'superseded';
  supersededAt?: Timestamp;
  supersededByRegId?: string; // 대체한 새 registration id
}

// ─── 클라이언트 페이로드 (API 입력) ─────────────────────────

export interface RegisterPayload {
  name: string;
  phone: string;
  roundSelections: RoundSelection[];
  companions?: string;
  supportingActors?: string;
  seatRequests?: string;
  cheerMessage?: string;
  privacyConsent: boolean;
  /** 같은 이름·휴대폰 active 신청이 있어도 새 신청을 우선시(이전을 superseded로 표시)할지 */
  confirmSupersede?: boolean;
}
