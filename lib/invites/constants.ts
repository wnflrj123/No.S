/**
 * 정기공연 신청 페이지 - 상수
 */

// 휴대폰 정규식: 010-XXXX-XXXX
export const PHONE_REGEX = /^010-\d{4}-\d{4}$/;

// accessToken 길이 (crypto.randomUUID()는 36자, 하이픈 제거 시 32자)
export const ACCESS_TOKEN_LENGTH = 32;

// 신청 폼 자유 텍스트 max length
export const MAX_TEXT_LENGTH = 500;
export const MAX_NAME_LENGTH = 50;

// 후원 메모(관리자 전용) max length — 물품·서비스 후원 내역 메모용
export const MAX_SPONSOR_MEMO_LENGTH = 300;

// 회차당 인원수 범위
export const MIN_HEADCOUNT = 1;
export const MAX_HEADCOUNT = 20;

// 한 신청에서 선택 가능한 회차 수 상한 (악성 요청 방어)
export const MAX_ROUND_SELECTIONS = 10;

// Firestore 컬렉션 이름
export const INVITES_COLLECTION = 'invites';
export const REGISTRATIONS_COLLECTION = 'inviteRegistrations';
export const SUPPORTERS_COLLECTION = 'inviteSupporters';
