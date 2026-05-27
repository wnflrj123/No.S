import type { InviteRole, InviteRound } from '@/lib/invites/types';
import { groupCastByRole } from './casting-utils';
import CastingPhoto from './CastingPhoto';
import PhotoPlaceholder from './PhotoPlaceholder';

interface Props {
  rounds: InviteRound[];
  roles: InviteRole[];
  inviteId: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
function romanize(n: number): string {
  return ROMAN[n - 1] ?? String(n);
}

// 1-cast/2-cast/N-cast 모두 동일 폭. percentage라서 role card 너비에 자연 비례.
const ACTOR_CARD_W = 'w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)]';

/**
 * 캐스팅 섹션 — Editorial Programbook Luxe 무드.
 * - 따뜻한 cream/ivory 섹션 배경 (`#FAF7F2 → white → #FAF7F2` 미세 gradient)
 * - 각 배역에 로마 숫자(I·II·III…)를 큰 thin 글자로 얹어 프로그램북 act 번호 감성
 * - 다이아몬드 ◆ ornament 가로선 divider — 단순 hairline보다 격조
 * - 배역 설명은 italic으로 편집·문학적 톤
 * - 배역 카드 사이에 vertical thin 연결선으로 시각 rhythm 강화
 * - 배우 카드 hover 시 미세 scale, 이름 overlay 강화
 * - 카드 entrance를 staggered fade-in-up으로 등장 연출
 */
export default function CastingSection({ rounds, roles, inviteId }: Props) {
  const data = groupCastByRole(rounds, roles);
  if (data.length === 0) return null;

  return (
    <section className="relative px-5 py-14 bg-gradient-to-b from-[#FAF7F2] via-white to-[#FAF7F2] overflow-hidden">
      {/* 섹션 헤더 */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-3 text-[#0066B3]/50">
          <span aria-hidden className="h-px w-10 sm:w-14 bg-current" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold">CAST</span>
          <span aria-hidden className="h-px w-10 sm:w-14 bg-current" />
        </div>
        <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight break-keep">
          캐스팅
        </h2>
        <p className="mt-3 text-xs text-gray-500 break-keep">배역별 출연 배우</p>
      </header>

      {/* 배역 카드들 */}
      <div className="space-y-10">
        {data.map(({ key, role, actors }, idx) => (
          <div key={key} className="relative">
            {/* 카드 사이 vertical connector — 첫 카드는 제외 */}
            {idx > 0 && (
              <div
                aria-hidden
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-px h-10 bg-gradient-to-b from-transparent via-[#0066B3]/20 to-[#0066B3]/30"
              />
            )}

            <article
              className="bg-white/95 rounded-2xl shadow-[0_10px_40px_-15px_rgba(15,23,42,0.12)] ring-1 ring-[#E8DFCC]/50 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${Math.min(idx * 90, 540)}ms`, animationFillMode: 'both' }}
            >
              <div className="px-5 pt-7 pb-1 text-center">
                {/* 로마 숫자 — programbook act number 느낌 */}
                <div
                  aria-hidden
                  className="text-xl sm:text-2xl font-bold text-[#0066B3]/30 tracking-[0.15em] leading-none"
                >
                  {romanize(idx + 1)}
                </div>

                <h3 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight break-keep">
                  {role.name}
                </h3>

                {/* 다이아몬드 ornament divider */}
                <div
                  aria-hidden
                  className="mt-5 flex items-center justify-center gap-2.5 text-[#0066B3]/30"
                >
                  <span className="h-px w-10 bg-current" />
                  <span className="text-[9px] leading-none">◆</span>
                  <span className="h-px w-10 bg-current" />
                </div>

                {role.description && (
                  <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-md sm:max-w-xl mx-auto whitespace-pre-line break-keep italic">
                    {role.description}
                  </p>
                )}
              </div>

              {/* 배우 카드 그리드 */}
              <div className="pb-6 pt-6 px-3 sm:px-0">
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
          </div>
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
    <div className="group relative aspect-[3/4] overflow-hidden rounded-xl shadow-md ring-1 ring-black/10 bg-gray-100 transition-transform duration-300 ease-out hover:scale-[1.02] hover:shadow-lg">
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
      <div className="absolute inset-x-0 bottom-0 pt-16 pb-4 px-3 bg-gradient-to-t from-black/90 via-black/45 to-transparent">
        <p className="text-white text-base sm:text-lg font-bold text-center tracking-tight drop-shadow-md break-keep">
          {actorName}
        </p>
      </div>
    </div>
  );
}
