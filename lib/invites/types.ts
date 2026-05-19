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
}

export interface CastingEntry {
  role: string; // 배역 이름
  description: string; // 배역 설명
  photoFile?: string; // 정적 파일명 (예: "kim.jpg"). 경로: /invites/{year}-{round}/cast/{photoFile}
}

export interface InviteRound {
  roundNo: number; // 1, 2, 3 ...
  startAt: Timestamp; // 회차 시작 시각
  teamName: string; // 예: "블루팀"
  casting: CastingEntry[];
}

export interface InviteStats {
  totalRegistrations: number; // 신청 건수
  totalHeadcount: number; // 총 인원수 (회차별 인원의 합)
  totalSponsors: number; // isSponsor=true인 신청자 수
}

// ─── 메인 타입 ─────────────────────────────────────────────

export interface Invite {
  id: string; // documentId = "{year}-{round}"
  year: number;
  round: number;
  title: string;
  subtitle?: string;
  description: string; // HTML (TipTap)
  posterImageUrl: string; // 정적 경로 또는 외부 URL
  venue: Venue;
  rounds: InviteRound[];
  sponsorAccount: SponsorAccount;
  thanksMessage?: string;
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
}
