/**
 * 정기공연 신청 페이지 - 클라이언트 사이드 Firestore 헬퍼
 *
 * Admin 관리 페이지에서 invite CRUD 시 사용. Firestore Rules에서 write 권한을 검증한다.
 */

'use client';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { INVITES_COLLECTION, REGISTRATIONS_COLLECTION, SUPPORTERS_COLLECTION } from './constants';
import type { Invite, InviteRegistration, InviteRound, InviteStaff, InviteStats, InviteSupporter } from './types';

export interface InviteWriteInput {
  year: number;
  round: number;
  overline?: string;
  title: string;
  subtitle?: string;
  description: string;
  posterImageUrl: string;
  venue: Invite['venue'];
  roles: Invite['roles'];
  /** 제작진. 폼에서 항상 배열로 전달되지만 호환을 위해 optional. */
  staff?: InviteStaff[];
  rounds: Array<Omit<InviteRound, 'startAt'> & { startAtMs: number }>;
  sponsorAccount: Invite['sponsorAccount'];
  thanksMessage?: string;
  disabledFields?: Invite['disabledFields'];
  disableWallSupport?: boolean;
  isPublished: boolean;
}

const EMPTY_STATS: InviteStats = {
  totalRegistrations: 0,
  totalHeadcount: 0,
  totalSponsors: 0,
};

export async function listInvites(): Promise<Invite[]> {
  // Firestore는 다중 정렬을 위해 인덱스가 필요할 수 있어 단일 필드(year)로만 정렬하고
  // 동일 year 내에서는 round를 클라이언트 측에서 정렬한다.
  const q = query(collection(db, INVITES_COLLECTION), orderBy('year', 'desc'));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Invite, 'id'>) }));
  return list.sort((a, b) => (b.year - a.year) || (b.round - a.round));
}

export async function getInviteClient(year: number, round: number): Promise<Invite | null> {
  const id = `${year}-${round}`;
  const snap = await getDoc(doc(db, INVITES_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Invite, 'id'>) };
}

export async function upsertInvite(
  input: InviteWriteInput,
  createdBy: string,
  isNew: boolean,
): Promise<string> {
  const id = `${input.year}-${input.round}`;
  const ref = doc(db, INVITES_COLLECTION, id);

  const rounds: InviteRound[] = input.rounds.map(({ startAtMs, ...rest }) => ({
    roundNo: rest.roundNo,
    teamName: rest.teamName,
    // 새 형식으로 저장: 레거시 role/description 필드는 제거
    casting: rest.casting.map(c => ({
      roleId: c.roleId,
      actorName: c.actorName,
      ...(c.photoFile ? { photoFile: c.photoFile } : {}),
      // photoCrop은 photoFile이 있을 때만 의미. Firestore는 undefined 거부.
      ...(c.photoFile && c.photoCrop ? { photoCrop: c.photoCrop } : {}),
    })),
    startAt: Timestamp.fromMillis(startAtMs),
    // Firestore는 undefined를 거부하므로 값이 있을 때만 필드 포함
    ...(typeof rest.seatCapacity === 'number' && rest.seatCapacity > 0
      ? { seatCapacity: rest.seatCapacity }
      : {}),
  }));

  // 제작진 정제: 빈 직책·빈 멤버 제거, photoFile 빈 값은 필드 자체를 생략
  const staff: InviteStaff[] = (input.staff ?? [])
    .map(s => ({
      id: s.id,
      role: s.role.trim(),
      members: s.members
        .filter(m => m.name.trim())
        .map(m => ({
          name: m.name.trim(),
          ...(m.photoFile && m.photoFile.trim() ? { photoFile: m.photoFile.trim() } : {}),
        })),
    }))
    .filter(s => s.role && s.members.length > 0);

  if (isNew) {
    // 이미 존재하는 문서를 덮어써서 stats가 초기화되는 사고 방지
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`INVITE_ALREADY_EXISTS: ${id}`);
    }
    await setDoc(ref, {
      year: input.year,
      round: input.round,
      overline: input.overline || '',
      title: input.title,
      subtitle: input.subtitle || '',
      description: input.description,
      posterImageUrl: input.posterImageUrl,
      venue: input.venue,
      roles: input.roles,
      staff,
      rounds,
      sponsorAccount: input.sponsorAccount,
      thanksMessage: input.thanksMessage || '',
      disabledFields: input.disabledFields ?? [],
      disableWallSupport: input.disableWallSupport ?? false,
      isPublished: input.isPublished,
      stats: EMPTY_STATS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy,
    });
  } else {
    await updateDoc(ref, {
      year: input.year,
      round: input.round,
      overline: input.overline || '',
      title: input.title,
      subtitle: input.subtitle || '',
      description: input.description,
      posterImageUrl: input.posterImageUrl,
      venue: input.venue,
      roles: input.roles,
      staff,
      rounds,
      sponsorAccount: input.sponsorAccount,
      thanksMessage: input.thanksMessage || '',
      disabledFields: input.disabledFields ?? [],
      disableWallSupport: input.disableWallSupport ?? false,
      isPublished: input.isPublished,
      updatedAt: serverTimestamp(),
    });
  }

  return id;
}

export async function togglePublished(id: string, isPublished: boolean): Promise<void> {
  await updateDoc(doc(db, INVITES_COLLECTION, id), {
    isPublished,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteInvite(id: string): Promise<void> {
  await deleteDoc(doc(db, INVITES_COLLECTION, id));
}

/**
 * 특정 invite의 신청자 목록 조회. 관리자만 접근 가능 (Firestore Rules에서 차단됨).
 *
 * inviteId 단일 필드 필터만 사용하여 복합 인덱스 요구를 피한다.
 * 정렬은 클라이언트에서 createdAt 내림차순으로 처리.
 * 동호회 규모(신청자 100명 미만)에서는 충분한 성능이며 인덱스 관리 부담이 없다.
 */
/**
 * wall에서 직접 추가된 외부 응원자(현장 후원자) 목록.
 * inviteSupporters는 누구나 read 허용이므로 별도 권한 불필요.
 */
export async function listSupporters(inviteId: string): Promise<InviteSupporter[]> {
  const q = query(
    collection(db, SUPPORTERS_COLLECTION),
    where('inviteId', '==', inviteId),
  );
  const snap = await getDocs(q);
  const list = snap.docs.map(
    d => ({ id: d.id, ...(d.data() as Omit<InviteSupporter, 'id'>) }),
  );
  return list.sort((a, b) => {
    const am = a.createdAt?.toMillis?.() ?? 0;
    const bm = b.createdAt?.toMillis?.() ?? 0;
    return bm - am;
  });
}

export async function listRegistrations(inviteId: string): Promise<InviteRegistration[]> {
  const q = query(
    collection(db, REGISTRATIONS_COLLECTION),
    where('inviteId', '==', inviteId),
  );
  const snap = await getDocs(q);
  const list = snap.docs.map(
    d => ({ id: d.id, ...(d.data() as Omit<InviteRegistration, 'id'>) }),
  );
  return list.sort((a, b) => {
    const am = a.createdAt?.toMillis?.() ?? 0;
    const bm = b.createdAt?.toMillis?.() ?? 0;
    return bm - am;
  });
}
