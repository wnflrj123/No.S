import { NextResponse } from 'next/server';
import {
  getInvite,
  inviteIdFrom,
  listAllRegistrationsServer,
  verifyUserToken,
} from '@/lib/invites/server';
import { groupCastByRole } from '@/app/invite/[year]/[round]/_components/casting-utils';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string }>;
}

/**
 * 배우 응원 페이지(`/cheers/[year]/[round]`) 데이터.
 *
 * 외부에 노출하지 않고 로그인된 회원에게만 제공한다.
 * 인증 검증과 데이터 fetch를 병렬로 kick off — 인증 통과 후 데이터 그대로 반환.
 */
export async function GET(req: Request, { params }: RouteParams) {
  const { year, round } = await params;

  const authPromise = verifyUserToken(req.headers.get('authorization'));
  const dataPromise = Promise.all([
    getInvite(year, round),
    listAllRegistrationsServer(inviteIdFrom(year, round)).catch(err => {
      console.error('[cheers api] registrations fetch failed', err);
      return [];
    }),
  ]);

  const uid = await authPromise;
  if (!uid) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const [invite, allRegs] = await dataPromise;
  if (!invite) {
    return NextResponse.json({ message: '존재하지 않는 공연입니다.' }, { status: 404 });
  }

  const activeRegs = allRegs.filter(r => (r.status ?? 'active') === 'active');

  const totalRegistrations = activeRegs.length;
  const totalSeats = activeRegs.reduce(
    (s, r) => s + r.roundSelections.reduce((a, sel) => a + (sel.headcount ?? 0), 0),
    0,
  );

  const seatsByRound = new Map<number, number>();
  for (const r of activeRegs) {
    for (const sel of r.roundSelections) {
      seatsByRound.set(sel.roundNo, (seatsByRound.get(sel.roundNo) ?? 0) + (sel.headcount ?? 0));
    }
  }
  const roundStats = invite.rounds
    .map(r => ({
      roundNo: r.roundNo,
      teamName: r.teamName,
      headcount: seatsByRound.get(r.roundNo) ?? 0,
    }))
    .sort((a, b) => a.roundNo - b.roundNo);

  const grouped = groupCastByRole(invite.rounds, invite.roles ?? []);
  const actors = grouped.flatMap(g =>
    g.actors.map(a => ({
      roleName: g.role.name,
      actorName: a.actorName,
      photoFile: a.photoFile,
      photoCrop: a.photoCrop,
    })),
  );

  // sponsorAmount는 의도적으로 전달하지 않는다 — 후원 여부만 뱃지로 노출.
  const items = activeRegs
    .filter(r => (r.supportingActors ?? '').trim() || (r.cheerMessage ?? '').trim())
    .map(r => ({
      id: r.id,
      name: r.name,
      supportingActors: (r.supportingActors ?? '').trim(),
      cheerMessage: (r.cheerMessage ?? '').trim(),
      headcount: r.roundSelections.reduce((s, sel) => s + (sel.headcount ?? 0), 0),
      roundSelections: [...r.roundSelections]
        .filter(sel => (sel.headcount ?? 0) > 0)
        .sort((a, b) => a.roundNo - b.roundNo)
        .map(sel => ({ roundNo: sel.roundNo, headcount: sel.headcount })),
      isSponsor: r.isSponsor === true,
      createdAtMs: r.createdAt?.toMillis?.() ?? 0,
    }))
    .sort((a, b) => b.createdAtMs - a.createdAtMs);

  return NextResponse.json({
    invite: {
      id: invite.id,
      year: invite.year,
      round: invite.round,
      title: invite.title,
      overline: invite.overline,
      isPublished: invite.isPublished,
    },
    actors,
    items,
    totalRegistrations,
    totalSeats,
    roundStats,
  });
}
