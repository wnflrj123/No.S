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
 * 캐스팅 섹션 — 배역별 가운데 정렬 카드.
 *  - 각 배역 = 흰 rounded-2xl 카드 (시각 구분 명확)
 *  - 사진 사이즈는 원본 grid-cols-2 sm:grid-cols-3 유지 (축소 금지)
 *  - 카드 내부 horizontal padding은 최소화해 사진 영역 확보
 *  - 배우 이름은 사진 하단 dark gradient overlay
 */
export default function CastingSection({ rounds, roles, inviteId }: Props) {
  const data = groupCastByRole(rounds, roles);
  if (data.length === 0) return null;

  return (
    <section className="px-5 py-10 bg-gray-50">
      <header className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">캐스팅</h2>
        <p className="mt-1.5 text-xs text-gray-500">배역별 출연 배우</p>
      </header>

      <div className="space-y-5">
        {data.map(({ key, role, actors }) => (
          <article
            key={key}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* 헤더: 배역명 + 설명 (가운데 정렬) */}
            <div className="px-5 pt-6 pb-1 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {role.name}
              </h3>
              {role.description && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line max-w-md mx-auto">
                  {role.description}
                </p>
              )}
            </div>

            {/* 배우 카드 그리드 — 사이즈 보존을 위해 카드 가로 padding 최소화 */}
            <div className="px-3 pb-5 pt-4">
              <div
                className={`grid gap-3 ${
                  actors.length === 1
                    ? 'grid-cols-1 max-w-[180px] mx-auto'
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {actors.map((a, i) => (
                  <figure
                    key={i}
                    className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-md ring-1 ring-black/5 bg-gray-100"
                  >
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
                    <figcaption className="absolute inset-x-0 bottom-0 pt-10 pb-3 px-2 bg-gradient-to-t from-black/75 via-black/30 to-transparent">
                      <p className="text-white text-sm font-semibold text-center drop-shadow-sm">
                        {a.actorName}
                      </p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
