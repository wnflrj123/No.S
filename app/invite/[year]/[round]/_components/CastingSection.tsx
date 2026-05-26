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
 * 캐스팅 섹션 — 배역별로 가운데 정렬 그리드.
 * NOL/인터파크 풍 프로그램북 레이아웃 차용:
 *  - 배역명: 가운데 정렬 large bold
 *  - 배역 설명: max-w 제한 + 가운데 정렬
 *  - 배우 사진: 가운데 정렬, 이름은 사진 하단 dark gradient overlay
 *  - 출연자 수에 따라 grid 컬럼 자동 (1·2·3+)
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

      <div className="space-y-10 md:space-y-12">
        {data.map(({ key, role, actors }) => (
          <article key={key} className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {role.name}
            </h3>
            {role.description && (
              <p className="mt-2.5 text-sm text-gray-600 leading-relaxed whitespace-pre-line max-w-md mx-auto">
                {role.description}
              </p>
            )}

            <div
              className={`mt-5 grid gap-3 mx-auto ${
                actors.length === 1
                  ? 'grid-cols-1 max-w-[180px]'
                  : actors.length === 2
                    ? 'grid-cols-2 max-w-md'
                    : 'grid-cols-2 sm:grid-cols-3 max-w-xl'
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
          </article>
        ))}
      </div>
    </section>
  );
}
