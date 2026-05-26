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
 * 캐스팅 섹션 — editorial programbook 무드.
 *  - 각 배역 = 흰 rounded-2xl 카드 (구분 명확)
 *  - 배우 카드는 인원수와 무관하게 모두 동일 고정 사이즈(`ACTOR_CARD_W`)
 *  - flex-wrap + justify-center로 1명·2명·3명+ 항상 가운데 정렬
 *  - 모바일 ~2-up, 데스크탑 ~3-up 자연스럽게 분배
 *  - 모든 텍스트에 break-keep로 한글 어색한 줄바꿈 방지
 */
// 1-cast/2-cast/N-cast 모두 동일하게 — 사이즈 유일 진실원천
const ACTOR_CARD_W = 'w-[140px] sm:w-56';
export default function CastingSection({ rounds, roles, inviteId }: Props) {
  const data = groupCastByRole(rounds, roles);
  if (data.length === 0) return null;

  return (
    <section className="px-5 py-12 bg-gray-50">
      <header className="text-center mb-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#0066B3]/60 font-semibold">
          CAST
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight break-keep">
          캐스팅
        </h2>
        <p className="mt-2 text-xs text-gray-500 break-keep">배역별 출연 배우</p>
      </header>

      <div className="space-y-6">
        {data.map(({ key, role, actors }) => (
          <article
            key={key}
            className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 border border-gray-100 overflow-hidden"
          >
            {/* 배역 헤더 */}
            <div className="px-5 pt-8 text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#0066B3]/70 font-semibold">
                ROLE
              </p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight break-keep">
                {role.name}
              </h3>
              {role.description && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-md mx-auto whitespace-pre-line break-keep">
                  {role.description}
                </p>
              )}
              <div aria-hidden className="mt-6 mx-auto w-8 h-px bg-gray-200" />
            </div>

            {/* 배우 카드 — 모든 카드 동일 고정 사이즈, 인원수 무관 항상 가운데 */}
            <div className="px-3 pb-7 pt-5">
              <div className="flex flex-wrap justify-center gap-3">
                {actors.map((a, i) => (
                  <figure key={i} className={ACTOR_CARD_W}>
                    <ActorPortrait
                      actorName={a.actorName}
                      photoFile={a.photoFile}
                      photoCrop={a.photoCrop}
                      roleName={role.name}
                      inviteId={inviteId}
                    />
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

interface PortraitProps {
  actorName: string;
  photoFile?: string;
  photoCrop?: { x: number; y: number; width: number; height: number };
  roleName: string;
  inviteId: string;
}

function ActorPortrait({ actorName, photoFile, photoCrop, roleName, inviteId }: PortraitProps) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-md ring-1 ring-black/10 bg-gray-100">
      {photoFile ? (
        <CastingPhoto
          src={`/invites/${inviteId}/cast/${photoFile}`}
          alt={`${roleName} - ${actorName}`}
          crop={photoCrop}
          sizes="(max-width: 640px) 50vw, 33vw"
        />
      ) : (
        <PhotoPlaceholder name={actorName} size="md" />
      )}
      <div className="absolute inset-x-0 bottom-0 pt-14 pb-3.5 px-3 bg-gradient-to-t from-black/85 via-black/35 to-transparent">
        <p className="text-white text-sm sm:text-base font-bold text-center tracking-tight drop-shadow-md break-keep">
          {actorName}
        </p>
      </div>
    </div>
  );
}
