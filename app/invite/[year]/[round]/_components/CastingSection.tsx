import type { InviteRole, InviteRound } from '@/lib/invites/types';
import CastingTabs, { type RoundCasting } from './CastingTabs';
import { resolveCasting } from './casting-utils';

interface Props {
  rounds: InviteRound[];
  roles: InviteRole[];
  inviteId: string;
}

export default function CastingSection({ rounds, roles, inviteId }: Props) {
  const data: RoundCasting[] = rounds
    .filter(r => r.casting.length > 0)
    .map(r => ({
      roundNo: r.roundNo,
      teamName: r.teamName,
      startAtMs: r.startAt.toDate().getTime(),
      castings: resolveCasting(r, roles),
    }));

  if (data.length === 0) return null;

  return (
    <section className="px-5 py-8 bg-gray-50">
      <h2 className="text-lg font-bold text-gray-900 mb-3">회차별 캐스팅 정보</h2>
      <CastingTabs data={data} inviteId={inviteId} />
    </section>
  );
}
