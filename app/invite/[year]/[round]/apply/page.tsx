import { notFound } from 'next/navigation';
import Link from 'next/link';
import { aggregateRoundHeadcounts, getInvite, inviteIdFrom } from '@/lib/invites/server';
import ApplyForm from '../_components/ApplyForm';

export const dynamic = 'force-dynamic';

interface PageParams {
  params: Promise<{ year: string; round: string }>;
}

export default async function ApplyPage({ params }: PageParams) {
  const { year, round } = await params;
  const [invite, bookedByRound] = await Promise.all([
    getInvite(year, round),
    aggregateRoundHeadcounts(inviteIdFrom(year, round)),
  ]);
  if (!invite || !invite.isPublished) notFound();

  // eslint-disable-next-line react-hooks/purity -- 서버 컴포넌트는 요청마다 새 인스턴스
  const nowMs = Date.now();
  const allClosed =
    invite.rounds.length === 0 ||
    invite.rounds.every(r => r.startAt.toDate().getTime() <= nowMs);

  if (allClosed) {
    return (
      <main className="px-5 py-20 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-gray-900">신청이 종료되었습니다</h1>
        <p className="text-sm text-gray-500 mt-2">모든 회차가 종료되었습니다.</p>
        <Link
          href={`/invite/${year}/${round}`}
          className="inline-block mt-8 text-sm text-[#0066B3] underline"
        >
          공연 정보로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 pb-16">
      <header className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          {invite.overline?.trim() && (
            <div className="text-xs font-semibold text-[#0066B3] mb-1">{invite.overline}</div>
          )}
          <div className="text-xs text-gray-500">{invite.year}년 {invite.round}회</div>
          <h1 className="text-xl font-bold text-gray-900 mt-0.5">{invite.title} 신청</h1>
          {invite.subtitle && (
            <p className="text-sm text-gray-600 mt-0.5">{invite.subtitle}</p>
          )}
        </div>
        <Link
          href={`/invite/${year}/${round}`}
          className="text-sm text-gray-500 hover:text-gray-700 shrink-0 mt-1"
        >
          ← 공연 정보
        </Link>
      </header>

      <ApplyForm
        invite={{
          id: invite.id,
          year: invite.year,
          round: invite.round,
          title: invite.title,
          rounds: invite.rounds.map(r => ({
            roundNo: r.roundNo,
            teamName: r.teamName,
            startAtMs: r.startAt.toDate().getTime(),
            seatCapacity: r.seatCapacity,
            booked: bookedByRound[r.roundNo] ?? 0,
          })),
          disabledFields: invite.disabledFields,
        }}
      />
    </main>
  );
}
