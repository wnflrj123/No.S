import type { InviteRole, InviteRound } from '@/lib/invites/types';
import RoundsList, { type ResolvedRound } from './RoundsList';
import { resolveCasting } from './casting-utils';

interface Props {
  rounds: InviteRound[];
  roles: InviteRole[];
  inviteId: string;
  nowMs: number;
}

export default function RoundsSection({ rounds, roles, inviteId, nowMs }: Props) {
  if (rounds.length === 0) return null;

  // 서버에서 캐스팅 해석 + Timestamp → ms 변환 후 client에 plain 객체로 전달.
  const data: ResolvedRound[] = rounds.map(r => ({
    roundNo: r.roundNo,
    teamName: r.teamName,
    startAtMs: r.startAt.toDate().getTime(),
    castings: resolveCasting(r, roles),
  }));

  return (
    <section className="px-5 py-14 bg-gray-50">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-3 text-[#0066B3]/50">
          <span aria-hidden className="h-px w-10 sm:w-14 bg-current" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold">SCHEDULE</span>
          <span aria-hidden className="h-px w-10 sm:w-14 bg-current" />
        </div>
        <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight break-keep">
          공연 시간
        </h2>
        <p className="mt-3 text-xs text-gray-500 break-keep">
          회차를 누르면 해당 회차 캐스팅을 볼 수 있어요.
        </p>
      </header>
      <RoundsList data={data} inviteId={inviteId} nowMs={nowMs} />
    </section>
  );
}
