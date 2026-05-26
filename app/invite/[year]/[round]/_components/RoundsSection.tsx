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
    <section className="px-5 py-8 bg-gray-50">
      <h2 className="text-lg font-bold text-gray-900 mb-3">공연 시간</h2>
      <p className="text-xs text-gray-500 mb-3">회차를 누르면 해당 회차 캐스팅을 볼 수 있어요.</p>
      <RoundsList data={data} inviteId={inviteId} nowMs={nowMs} />
    </section>
  );
}
