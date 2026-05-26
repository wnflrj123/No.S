import type { InviteRole, InviteRound } from '@/lib/invites/types';
import { groupCastByRole } from './casting-utils';
import CastingPhoto from './CastingPhoto';
import PhotoPlaceholder from './PhotoPlaceholder';

interface Props {
  rounds: InviteRound[];
  roles: InviteRole[];
  inviteId: string;
}

/**
 * 캐스팅 섹션 — 배역별로 출연 배우를 묶어 표시.
 * 같은 배우가 여러 회차에 같은 배역으로 나와도 카드 1개 (dedupe).
 * 회차별 캐스팅은 별도로 RoundsList 모달에서 확인 가능.
 */
export default function CastingSection({ rounds, roles, inviteId }: Props) {
  const data = groupCastByRole(rounds, roles);
  if (data.length === 0) return null;

  return (
    <section className="px-5 py-8 bg-gray-50">
      <h2 className="text-lg font-bold text-gray-900">캐스팅</h2>
      <p className="mt-1 text-xs text-gray-500">
        배역별 출연 배우 · 회차별 캐스팅은 아래 공연 시간에서 회차를 선택하면 볼 수 있어요.
      </p>

      <div className="mt-5 space-y-7">
        {data.map(({ key, role, actors }) => (
          <div key={key}>
            <h3 className="text-base font-semibold text-gray-900">{role.name}</h3>
            {role.description && (
              <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{role.description}</p>
            )}
            <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {actors.map((a, i) => (
                <li
                  key={i}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {a.photoFile ? (
                      <CastingPhoto
                        src={`/invites/${inviteId}/cast/${a.photoFile}`}
                        alt={`${role.name} - ${a.actorName}`}
                        crop={a.photoCrop}
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    ) : (
                      <PhotoPlaceholder name={a.actorName} size="md" />
                    )}
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-sm font-semibold text-gray-900">{a.actorName}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
