import type { InviteStaff } from '@/lib/invites/types';
import CastingPhoto from './CastingPhoto';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/**
 * 제작진 소개 섹션 — 캐스팅과 같은 Editorial Programbook Luxe 톤.
 *  - 따뜻한 cream/ivory 섹션 배경
 *  - 직책명·이름 typography 격상 (h3 text-2xl/3xl, name text-base)
 *  - 직책마다 다이아몬드 ◆ ornament divider
 *  - 헤드샷 카드는 box wrapping 없이 가운데 정렬만
 *  - 사진 없는 직책은 ivory tint 패널 + 부드러운 luxe shadow
 */
export default function StaffSection({ staff, inviteId }: Props) {
  const groups = staff.filter(s => s.role.trim() && s.members.length > 0);
  if (groups.length === 0) return null;

  const photoGroups = groups.filter(g => g.members.some(m => m.photoFile));
  const textGroups = groups.filter(g => !g.members.some(m => m.photoFile));

  return (
    <section className="relative px-5 py-14 bg-gradient-to-b from-[#FAF7F2] via-white to-[#FAF7F2] overflow-hidden">
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-3 text-[#0066B3]/50">
          <span aria-hidden className="h-px w-10 sm:w-14 bg-current" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold">CREW</span>
          <span aria-hidden className="h-px w-10 sm:w-14 bg-current" />
        </div>
        <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight break-keep">
          제작진
        </h2>
        <p className="mt-3 text-xs text-gray-500 break-keep">이 무대를 함께 만든 사람들</p>
      </header>

      {/* 사진 있는 직책 — 박스 없이, 큰 직책명 + ornament + 헤드샷 */}
      {photoGroups.length > 0 && (
        <div className="space-y-12 mb-10">
          {photoGroups.map(group => (
            <div key={group.id} className="text-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight break-keep">
                {group.role}
              </h3>
              {/* 다이아몬드 ornament divider */}
              <div
                aria-hidden
                className="mt-4 flex items-center justify-center gap-2.5 text-[#0066B3]/30"
              >
                <span className="h-px w-10 bg-current" />
                <span className="text-[9px] leading-none">◆</span>
                <span className="h-px w-10 bg-current" />
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-4">
                {group.members.map((m, i) => (
                  <figure
                    key={i}
                    className="w-[calc(33.333%-11px)] sm:w-[calc(25%-12px)]"
                  >
                    <StaffHeadshot
                      name={m.name}
                      photoFile={m.photoFile}
                      photoCrop={m.photoCrop}
                      inviteId={inviteId}
                    />
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 사진 없는 직책 — ivory tint 패널 + luxe shadow */}
      {textGroups.length > 0 && (
        <div className="bg-white/95 rounded-2xl shadow-[0_10px_40px_-15px_rgba(15,23,42,0.10)] ring-1 ring-[#E8DFCC]/50 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {textGroups.map(group => (
              <li
                key={group.id}
                className="flex items-baseline justify-between gap-4 px-5 py-4"
              >
                <span className="shrink-0 text-sm tracking-wider text-gray-500 font-semibold break-keep">
                  {group.role}
                </span>
                <span className="text-right text-base font-semibold text-gray-900 tracking-tight break-keep">
                  {group.members.map(m => m.name).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

interface HeadshotProps {
  name: string;
  photoFile?: string;
  photoCrop?: { x: number; y: number; width: number; height: number };
  inviteId: string;
}

function StaffHeadshot({ name, photoFile, photoCrop, inviteId }: HeadshotProps) {
  return (
    <>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/10 shadow-md transition-transform duration-300 ease-out hover:scale-[1.02]">
        {photoFile ? (
          <CastingPhoto
            src={`/invites/${inviteId}/staff/${photoFile}`}
            alt={name}
            crop={photoCrop}
            sizes="(max-width: 640px) 33vw, 25vw"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 break-keep">
            사진 없음
          </span>
        )}
      </div>
      <figcaption className="mt-2.5 text-sm sm:text-base font-semibold text-gray-900 text-center tracking-tight break-keep">
        {name}
      </figcaption>
    </>
  );
}
