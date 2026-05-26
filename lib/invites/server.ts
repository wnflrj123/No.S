/**
 * 정기공연 신청 페이지 - 서버 헬퍼
 *
 * Next.js API route 또는 서버 컴포넌트에서만 사용. firebase-admin SDK 사용으로
 * Firestore Rules를 우회하므로 클라이언트 컴포넌트에서 import 금지.
 */

// 서버 전용. firebase-admin을 import하므로 클라이언트 컴포넌트에서 이 파일을 import하면
// Next.js 빌드 단계에서 자연스럽게 차단된다.
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
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
  SUPPORTERS_COLLECTION,
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
 * 같은 invite + 같은 이름(trim) + 같은 전화번호인 active 신청을 찾는다.
 * supersede 흐름의 1차 체크에 사용.
 */
export async function findActiveDuplicate(
  inviteId: string,
  name: string,
  phone: string,
): Promise<InviteRegistration | null> {
  const trimmedName = name.trim();
  const q = await adminDb
    .collection(REGISTRATIONS_COLLECTION)
    .where('inviteId', '==', inviteId)
    .where('phone', '==', phone)
    .get();
  if (q.empty) return null;
  for (const doc of q.docs) {
    const data = doc.data() as Omit<InviteRegistration, 'id'>;
    const status = data.status ?? 'active';
    if (status === 'active' && data.name.trim() === trimmedName) {
      return { id: doc.id, ...data };
    }
  }
  return null;
}

/**
 * 검증된 페이로드로 신청 문서를 생성하고 invite.stats를 갱신한다.
 * 같은 이름·휴대폰의 active 중복이 있으면 함께 superseded로 표시하고 stats를 보정한다.
 *
 * @param supersedeId — 미리 조회한 중복 active registration의 id (있으면 supersede 처리)
 */
export async function createRegistration(
  invite: Invite,
  payload: RegisterPayload,
  supersedeId?: string,
): Promise<{ id: string; token: string }> {
  const token = generateAccessToken();
  const now = Timestamp.now();
  const totalHc = totalHeadcount(payload.roundSelections);

  // 운영자가 비활성화한 옵션 필드는 클라이언트가 보냈더라도 무시한다 (서버 측 방어선).
  const disabled = new Set(invite.disabledFields ?? []);
  const allow = (key: 'companions' | 'supportingActors' | 'seatRequests' | 'cheerMessage') =>
    !disabled.has(key);

  const reg = {
    inviteId: invite.id,
    name: payload.name.trim(),
    phone: payload.phone,
    roundSelections: payload.roundSelections,
    ...(allow('companions') && payload.companions?.trim() ? { companions: payload.companions.trim() } : {}),
    ...(allow('supportingActors') && payload.supportingActors?.trim() ? { supportingActors: payload.supportingActors.trim() } : {}),
    ...(allow('seatRequests') && payload.seatRequests?.trim() ? { seatRequests: payload.seatRequests.trim() } : {}),
    ...(allow('cheerMessage') && payload.cheerMessage?.trim() ? { cheerMessage: payload.cheerMessage.trim() } : {}),
    privacyConsent: true as const,
    accessToken: token,
    isSponsor: false,
    status: 'active' as const,
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

  // 같은 이름·휴대폰의 기존 active 신청을 superseded로 변경하고 stats를 차감한다.
  if (supersedeId) {
    const oldRef = adminDb.collection(REGISTRATIONS_COLLECTION).doc(supersedeId);
    const oldSnap = await oldRef.get();
    if (oldSnap.exists) {
      const oldData = oldSnap.data() as Omit<InviteRegistration, 'id'>;
      const oldStatus = oldData.status ?? 'active';
      if (oldStatus === 'active') {
        const oldHc = totalHeadcount(oldData.roundSelections);
        batch.update(oldRef, {
          status: 'superseded',
          supersededAt: now,
          supersededByRegId: regRef.id,
        });
        batch.update(inviteRef, {
          'stats.totalRegistrations': FieldValue.increment(-1),
          'stats.totalHeadcount': FieldValue.increment(-oldHc),
          ...(oldData.isSponsor ? { 'stats.totalSponsors': FieldValue.increment(-1) } : {}),
        });
      }
    }
  }

  await batch.commit();

  return { id: regRef.id, token };
}

/**
 * Admin이 신청의 후원 여부를 토글한다. 운영자가 실제 입금 내역과 맞춰 수동 보정.
 * active 신청만 stats(totalSponsors)에 반영, superseded는 데이터만 변경.
 * 동시성 안전: runTransaction.
 */
export async function adminSetSponsor(regId: string, isSponsor: boolean): Promise<boolean> {
  return adminDb.runTransaction(async tx => {
    const ref = adminDb.collection(REGISTRATIONS_COLLECTION).doc(regId);
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const data = snap.data() as Omit<InviteRegistration, 'id'>;
    if ((data.isSponsor === true) === isSponsor) return true; // 멱등

    const status = data.status ?? 'active';
    const now = Timestamp.now();
    const update: Record<string, unknown> = { isSponsor };
    if (isSponsor) update.sponsorCheckedAt = now;
    else update.sponsorCheckedAt = FieldValue.delete();
    tx.update(ref, update);

    if (status === 'active') {
      tx.update(adminDb.collection(INVITES_COLLECTION).doc(data.inviteId), {
        'stats.totalSponsors': FieldValue.increment(isSponsor ? 1 : -1),
        updatedAt: now,
      });
    }
    return true;
  });
}

/**
 * Admin이 신청 하나를 hard delete. stats도 active였던 경우에만 차감.
 * 반환: 삭제 성공 여부.
 */
export async function deleteRegistration(regId: string): Promise<boolean> {
  const ref = adminDb.collection(REGISTRATIONS_COLLECTION).doc(regId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const data = snap.data() as Omit<InviteRegistration, 'id'>;
  const status = data.status ?? 'active';
  const wasActive = status === 'active';
  const hc = totalHeadcount(data.roundSelections);
  const inviteRef = adminDb.collection(INVITES_COLLECTION).doc(data.inviteId);

  const batch = adminDb.batch();
  batch.delete(ref);
  if (wasActive) {
    batch.update(inviteRef, {
      'stats.totalRegistrations': FieldValue.increment(-1),
      'stats.totalHeadcount': FieldValue.increment(-hc),
      ...(data.isSponsor ? { 'stats.totalSponsors': FieldValue.increment(-1) } : {}),
    });
  }
  await batch.commit();
  return true;
}

/**
 * 이름·휴대폰으로 active 신청 단건 조회 (신청 확인 페이지용).
 */
export async function lookupActiveRegistration(
  inviteId: string,
  name: string,
  phone: string,
): Promise<InviteRegistration | null> {
  return findActiveDuplicate(inviteId, name, phone);
}

/**
 * 회차별 active 신청 인원의 합계를 반환한다 (잔여석 안내용).
 * 신청자가 없는 회차는 결과에 포함되지 않으니, 호출 측에서 `?? 0`으로 처리한다.
 */
export async function aggregateRoundHeadcounts(
  inviteId: string,
): Promise<Record<number, number>> {
  const snap = await adminDb
    .collection(REGISTRATIONS_COLLECTION)
    .where('inviteId', '==', inviteId)
    .get();
  const result: Record<number, number> = {};
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as Omit<InviteRegistration, 'id'>;
    if ((data.status ?? 'active') !== 'active') continue;
    for (const sel of data.roundSelections) {
      result[sel.roundNo] = (result[sel.roundNo] ?? 0) + sel.headcount;
    }
  }
  return result;
}

/**
 * Admin이 현장 후원자를 삭제. inviteSupporters 컬렉션 hard delete.
 */
export async function deleteSupporter(supporterId: string): Promise<boolean> {
  const ref = adminDb.collection(SUPPORTERS_COLLECTION).doc(supporterId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

/**
 * 후원자 wall용 외부 supporter를 추가한다. (이름만 기록)
 */
export async function addSupporter(inviteId: string, name: string): Promise<{ id: string }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('NAME_REQUIRED');
  if (trimmed.length > MAX_NAME_LENGTH) throw new Error('NAME_TOO_LONG');

  const ref = await adminDb.collection(SUPPORTERS_COLLECTION).add({
    inviteId,
    name: trimmed,
    createdAt: Timestamp.now(),
  });
  return { id: ref.id };
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

export type BulkSmsTarget = 'all' | 'round' | 'sponsors';

/**
 * 특정 invite의 신청자를 필터 조건에 맞춰 조회한다.
 * - 'all': 전체 신청자
 * - 'round': roundNo가 지정된 회차에 포함된 신청자만
 * - 'sponsors': isSponsor=true인 신청자만
 */
export async function listRegistrationsServer(
  inviteId: string,
  target: BulkSmsTarget,
  roundNo?: number,
): Promise<InviteRegistration[]> {
  let snap;
  if (target === 'sponsors') {
    snap = await adminDb
      .collection(REGISTRATIONS_COLLECTION)
      .where('inviteId', '==', inviteId)
      .where('isSponsor', '==', true)
      .get();
  } else {
    snap = await adminDb
      .collection(REGISTRATIONS_COLLECTION)
      .where('inviteId', '==', inviteId)
      .get();
  }
  const all = snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<InviteRegistration, 'id'>) }))
    // SMS 발송은 active 신청자에게만 보낸다 (superseded는 제외)
    .filter(r => (r.status ?? 'active') === 'active');
  if (target === 'round' && typeof roundNo === 'number') {
    return all.filter(r => r.roundSelections.some(s => s.roundNo === roundNo));
  }
  return all;
}

/**
 * Firebase ID 토큰을 검증하고 Admin/Owner 여부를 확인한다.
 * settings/admins 문서의 ownerUid 또는 uids 배열에 포함된 사용자만 통과.
 * 반환: 인증된 admin의 uid (실패 시 null).
 */
export async function verifyAdminToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const settingsSnap = await adminDb.collection('settings').doc('admins').get();
    if (!settingsSnap.exists) return null;
    const data = settingsSnap.data() as { ownerUid?: string; uids?: string[] };
    if (data.ownerUid === decoded.uid) return decoded.uid;
    if (Array.isArray(data.uids) && data.uids.includes(decoded.uid)) return decoded.uid;
    return null;
  } catch {
    return null;
  }
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
