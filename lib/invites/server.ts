/**
 * 정기공연 신청 페이지 - 서버 헬퍼
 *
 * Next.js API route 또는 서버 컴포넌트에서만 사용. firebase-admin SDK 사용으로
 * Firestore Rules를 우회하므로 클라이언트 컴포넌트에서 import 금지.
 */

// 서버 전용. firebase-admin을 import하므로 클라이언트 컴포넌트에서 이 파일을 import하면
// Next.js 빌드 단계에서 자연스럽게 차단된다.
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import type { Invite, InviteRegistration, RegisterPayload, RoundSelection } from './types';
import {
  INVITES_COLLECTION,
  MAX_HEADCOUNT,
  MAX_NAME_LENGTH,
  MAX_ROUND_SELECTIONS,
  MAX_TEXT_LENGTH,
  MIN_HEADCOUNT,
  PHONE_REGEX,
  REGISTRATIONS_COLLECTION,
} from './constants';

export function inviteIdFrom(year: number | string, round: number | string): string {
  return `${year}-${round}`;
}

export async function getInvite(year: number | string, round: number | string): Promise<Invite | null> {
  const id = inviteIdFrom(year, round);
  const snap = await adminDb.collection(INVITES_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<Invite, 'id'>) };
}

export function generateAccessToken(): string {
  return crypto.randomUUID().replace(/-/g, ''); // 32자
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * 신청 페이로드를 검증한다. 시간 기반 마감(회차별 startAt > now) + invite 상위 상태도 함께 확인.
 *
 * 에러 코드:
 * - INVALID_PAYLOAD
 * - INVITE_NOT_PUBLISHED, INVITE_CLOSED
 * - NAME_REQUIRED, NAME_TOO_LONG
 * - PHONE_INVALID
 * - ROUND_REQUIRED, ROUND_TOO_MANY, ROUND_DUPLICATED
 * - ROUND_{n}_NOT_FOUND, ROUND_{n}_CLOSED, HEADCOUNT_{n}_INVALID
 * - PRIVACY_NOT_AGREED
 * - {FIELD}_TOO_LONG (companions, supportingActors, seatRequests, cheerMessage)
 */
export function validateRegistrationPayload(
  payload: unknown,
  invite: Invite,
  now: Date = new Date(),
): ValidationResult {
  const errors: string[] = [];

  // 상위 상태 검증 (방어선)
  if (!invite.isPublished) errors.push('INVITE_NOT_PUBLISHED');
  const allClosed = invite.rounds.length === 0
    || invite.rounds.every(r => r.startAt.toDate().getTime() <= now.getTime());
  if (allClosed) errors.push('INVITE_CLOSED');

  if (!payload || typeof payload !== 'object') {
    errors.push('INVALID_PAYLOAD');
    return { ok: false, errors };
  }
  const p = payload as Partial<RegisterPayload>;

  // 이름
  const trimmedName = typeof p.name === 'string' ? p.name.trim() : '';
  if (!trimmedName) {
    errors.push('NAME_REQUIRED');
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.push('NAME_TOO_LONG');
  }

  // 휴대폰
  if (!p.phone || typeof p.phone !== 'string' || !PHONE_REGEX.test(p.phone)) {
    errors.push('PHONE_INVALID');
  }

  // 회차 선택
  if (!Array.isArray(p.roundSelections) || p.roundSelections.length === 0) {
    errors.push('ROUND_REQUIRED');
  } else if (p.roundSelections.length > MAX_ROUND_SELECTIONS) {
    errors.push('ROUND_TOO_MANY');
  } else {
    const seenRoundNos = new Set<number>();
    let duplicateFlagged = false;
    for (const sel of p.roundSelections) {
      if (typeof sel !== 'object' || sel === null || typeof sel.roundNo !== 'number') {
        errors.push('ROUND_REQUIRED');
        continue;
      }
      if (seenRoundNos.has(sel.roundNo)) {
        if (!duplicateFlagged) {
          errors.push('ROUND_DUPLICATED');
          duplicateFlagged = true;
        }
        continue;
      }
      seenRoundNos.add(sel.roundNo);

      const round = invite.rounds.find(r => r.roundNo === sel.roundNo);
      if (!round) {
        errors.push(`ROUND_${sel.roundNo}_NOT_FOUND`);
        continue;
      }
      const startAt = round.startAt.toDate();
      if (startAt.getTime() <= now.getTime()) {
        errors.push(`ROUND_${sel.roundNo}_CLOSED`);
      }
      if (!Number.isInteger(sel.headcount) || sel.headcount < MIN_HEADCOUNT || sel.headcount > MAX_HEADCOUNT) {
        errors.push(`HEADCOUNT_${sel.roundNo}_INVALID`);
      }
    }
  }

  // 개인정보 동의
  if (p.privacyConsent !== true) errors.push('PRIVACY_NOT_AGREED');

  // 자유 텍스트 길이
  for (const field of ['companions', 'supportingActors', 'seatRequests', 'cheerMessage'] as const) {
    const v = p[field];
    if (v !== undefined && (typeof v !== 'string' || v.length > MAX_TEXT_LENGTH)) {
      errors.push(`${field.toUpperCase()}_TOO_LONG`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function totalHeadcount(selections: RoundSelection[]): number {
  return selections.reduce((sum, s) => sum + s.headcount, 0);
}

/**
 * 검증된 페이로드로 신청 문서를 생성하고 invite.stats를 갱신한다.
 * registration 생성과 stats 증가를 batch로 묶어 부분 실패를 방지한다.
 * 반환: 생성된 registration id와 accessToken.
 */
export async function createRegistration(
  invite: Invite,
  payload: RegisterPayload,
): Promise<{ id: string; token: string }> {
  const token = generateAccessToken();
  const now = Timestamp.now();
  const totalHc = totalHeadcount(payload.roundSelections);

  const reg = {
    inviteId: invite.id,
    name: payload.name.trim(),
    phone: payload.phone,
    roundSelections: payload.roundSelections,
    ...(payload.companions?.trim() ? { companions: payload.companions.trim() } : {}),
    ...(payload.supportingActors?.trim() ? { supportingActors: payload.supportingActors.trim() } : {}),
    ...(payload.seatRequests?.trim() ? { seatRequests: payload.seatRequests.trim() } : {}),
    ...(payload.cheerMessage?.trim() ? { cheerMessage: payload.cheerMessage.trim() } : {}),
    privacyConsent: true as const,
    accessToken: token,
    isSponsor: false,
    createdAt: now,
  };

  const regRef = adminDb.collection(REGISTRATIONS_COLLECTION).doc();
  const inviteRef = adminDb.collection(INVITES_COLLECTION).doc(invite.id);

  const batch = adminDb.batch();
  batch.set(regRef, reg);
  batch.update(inviteRef, {
    'stats.totalRegistrations': FieldValue.increment(1),
    'stats.totalHeadcount': FieldValue.increment(totalHc),
    updatedAt: now,
  });
  await batch.commit();

  return { id: regRef.id, token };
}

export async function findRegistrationByToken(token: string): Promise<InviteRegistration | null> {
  const q = await adminDb
    .collection(REGISTRATIONS_COLLECTION)
    .where('accessToken', '==', token)
    .limit(1)
    .get();
  if (q.empty) return null;
  const doc = q.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<InviteRegistration, 'id'>) };
}

/**
 * 토큰의 registration을 후원자로 표시한다. 동시 호출에도 카운트가 1번만 증가하도록
 * runTransaction으로 read→check→write를 원자화한다.
 * 반환: 처리 성공 여부 (토큰이 없으면 false).
 */
export async function markSponsor(token: string): Promise<boolean> {
  return adminDb.runTransaction(async tx => {
    const q = await tx.get(
      adminDb.collection(REGISTRATIONS_COLLECTION).where('accessToken', '==', token).limit(1),
    );
    if (q.empty) return false;

    const doc = q.docs[0];
    const data = doc.data() as Omit<InviteRegistration, 'id'>;
    if (data.isSponsor) return true; // 멱등

    const now = Timestamp.now();
    tx.update(doc.ref, { isSponsor: true, sponsorCheckedAt: now });
    tx.update(adminDb.collection(INVITES_COLLECTION).doc(data.inviteId), {
      'stats.totalSponsors': FieldValue.increment(1),
      updatedAt: now,
    });
    return true;
  });
}
