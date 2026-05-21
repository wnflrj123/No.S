import Image from 'next/image';
import type { InviteRole, InviteRound } from '@/lib/invites/types';

interface Props {
  rounds: InviteRound[];
  roles: InviteRole[];
  inviteId: string;
}

interface ResolvedCasting {
  roleName: string;
  description: string;
  actorName: string;
  photoFile?: string;
}

/**
 * 새 형식(roleId 참조)과 레거시 형식(role 필드 직접) 모두를 안전하게 해석해
 * 표시용 객체로 변환한다.
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
  const roundsWithCasting = rounds.filter(r => r.casting.length > 0);
  if (roundsWithCasting.length === 0) return null;

  return (
    <section className="px-5 py-8 bg-gray-50">
      <h2 className="text-lg font-bold text-gray-900 mb-3">캐스팅</h2>
      <div className="space-y-6">
        {roundsWithCasting.map(r => {
          const resolved = resolveCasting(r, roles);
          return (
            <div key={r.roundNo}>
              <h3 className="text-sm font-bold text-[#0066B3] mb-3">
                {r.roundNo}회차 · {r.teamName}
              </h3>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {resolved.map((c, i) => (
                  <li
                    key={`${r.roundNo}-${i}`}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
                  >
                    {c.photoFile ? (
                      <div className="relative aspect-[3/4] bg-gray-100">
                        <Image
                          src={`/invites/${inviteId}/cast/${c.photoFile}`}
                          alt={`${c.roleName} - ${c.actorName}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                        사진 준비 중
                      </div>
                    )}
                    <div className="p-3">
                      <div className="text-sm font-semibold text-gray-900">{c.roleName}</div>
                      {c.actorName && (
                        <div className="text-xs text-[#0066B3] font-medium mt-0.5">
                          {c.actorName} 분
                        </div>
                      )}
                      {c.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-3 whitespace-pre-line">
                          {c.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

