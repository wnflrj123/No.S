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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { INVITES_COLLECTION } from './constants';
import type { Invite, InviteRound, InviteStats } from './types';

export interface InviteWriteInput {
  year: number;
  round: number;
  title: string;
  subtitle?: string;
  description: string;
  posterImageUrl: string;
  venue: Invite['venue'];
  rounds: Array<Omit<InviteRound, 'startAt'> & { startAtMs: number }>;
  sponsorAccount: Invite['sponsorAccount'];
  thanksMessage?: string;
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
    ...rest,
    startAt: Timestamp.fromMillis(startAtMs),
  }));

  if (isNew) {
    // 이미 존재하는 문서를 덮어써서 stats가 초기화되는 사고 방지
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`INVITE_ALREADY_EXISTS: ${id}`);
    }
    await setDoc(ref, {
      year: input.year,
      round: input.round,
      title: input.title,
      subtitle: input.subtitle || '',
      description: input.description,
      posterImageUrl: input.posterImageUrl,
      venue: input.venue,
      rounds,
      sponsorAccount: input.sponsorAccount,
      thanksMessage: input.thanksMessage || '',
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
      title: input.title,
      subtitle: input.subtitle || '',
      description: input.description,
      posterImageUrl: input.posterImageUrl,
      venue: input.venue,
      rounds,
      sponsorAccount: input.sponsorAccount,
      thanksMessage: input.thanksMessage || '',
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
