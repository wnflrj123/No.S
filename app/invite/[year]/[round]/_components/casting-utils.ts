import type { InviteRole, InviteRound } from '@/lib/invites/types';
import type { ResolvedCasting } from './CastingTabs';

/**
 * 새 형식(roleId 참조)과 레거시 형식(role 필드 직접) 모두를 안전하게 해석.
 * CastingSection / RoundsSection 등 캐스팅을 표시하는 컴포넌트에서 공유 사용.
 */
export function resolveCasting(round: InviteRound, roles: InviteRole[]): ResolvedCasting[] {
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
