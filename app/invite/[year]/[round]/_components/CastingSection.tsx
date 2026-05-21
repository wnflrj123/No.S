import type { InviteRole, InviteRound } from '@/lib/invites/types';
import CastingTabs, { type RoundCasting, type ResolvedCasting } from './CastingTabs';

interface Props {
  rounds: InviteRound[];
  roles: InviteRole[];
  inviteId: string;
}

/**
 * 새 형식(roleId 참조)과 레거시 형식(role 필드 직접) 모두를 안전하게 해석.
 */
function resolveCasting(round: InviteRound, roles: InviteRole[]): ResolvedCasting[] {
  return round.casting.map(c => {
    if (c.roleId) {
      const role = roles.find(r => r.id === c.roleId);
      return {
        roleName: role?.name ?? '',
        description: role?.description ?? '',
        actorName: c.actorName ?? '',
        photoFile: c.photoFile,
      };
    }
    // 레거시: role/description이 캐스팅에 직접 들어있음
    return {
      roleName: c.role ?? '',
      description: c.description ?? '',
      actorName: c.actorName ?? '',
      photoFile: c.photoFile,
    };
  });
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
