import type { InviteStaff } from '@/lib/invites/types';
import CastingPhoto from './CastingPhoto';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/**
 * 제작진 소개 섹션.
 *  - 사진 있는 직책: box wrapper 없이 직책명 + 헤드샷 그리드만, 가운데 정렬
 *  - 사진 없는 직책: 흰 패널(rounded-2xl) + 행 사이 hairline divider
 *  - 헤드샷은 flex-wrap + justify-center로 항상 가운데 정렬
 *  - 모든 텍스트에 break-keep로 한글 어색한 줄바꿈 방지
 */
export default function StaffSection({ staff, inviteId }: Props) {
  const groups = staff.filter(s => s.role.trim() && s.members.length > 0);
  if (groups.length === 0) return null;

  const photoGroups = groups.filter(g => g.members.some(m => m.photoFile));
  const textGroups = groups.filter(g => !g.members.some(m => m.photoFile));

  return (
    <section className="bg-gray-50 px-5 py-12">
      <header className="text-center mb-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#0066B3]/60 font-semibold">
          CREW
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight break-keep">
          제작진
        </h2>
        <p className="mt-2 text-xs text-gray-500 break-keep">이 무대를 함께 만든 사람들</p>
      </header>

      {/* 사진 있는 직책 — 박스 없이 직책명 + 헤드샷 가운데 정렬 */}
      {photoGroups.length > 0 && (
        <div className="space-y-8 mb-8">
          {photoGroups.map(group => (
            <div key={group.id} className="text-center">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight break-keep mb-4">
                {group.role}
              </h3>
              {group.members.length === 1 ? (
                <div className="flex justify-center">
                  <figure className="w-28 sm:w-32">
                    <StaffHeadshot
                      name={group.members[0].name}
                      photoFile={group.members[0].photoFile}
                      photoCrop={group.members[0].photoCrop}
                      inviteId={inviteId}
                    />
                  </figure>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  {group.members.map((m, i) => (
                    <figure
                      key={i}
                      className="w-[calc(33.333%-8px)] sm:w-[calc(25%-9px)] max-w-[140px]"
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
              )}
            </div>
          ))}
        </div>
      )}

      {/* 사진 없는 직책 — 흰 패널 with hairline divider */}
      {textGroups.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 border border-gray-100 px-5 max-w-xl mx-auto">
          <ul className="divide-y divide-gray-100">
            {textGroups.map(group => (
              <li
                key={group.id}
                className="flex items-baseline justify-between gap-4 py-4"
              >
                <span className="shrink-0 text-xs tracking-wider text-gray-500 font-medium break-keep">
                  {group.role}
                </span>
                <span className="text-right text-sm font-semibold text-gray-900 tracking-tight break-keep">
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
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
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
      <figcaption className="mt-2 text-xs sm:text-sm font-semibold text-gray-900 text-center tracking-tight break-keep">
        {name}
      </figcaption>
    </>
  );
}
