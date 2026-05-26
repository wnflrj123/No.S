import type { InviteStaff } from '@/lib/invites/types';
import CastingPhoto from './CastingPhoto';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/**
 * 제작진 소개 섹션.
 *  - 사진 있는 직책: 그 어떤 box wrapper도 없이, 직책명(h3) + 헤드샷 그리드. 가운데 정렬만.
 *  - 사진 없는 직책: 흰 패널(rounded-2xl) + 행 사이 hairline divider
 */
export default function StaffSection({ staff, inviteId }: Props) {
  const groups = staff.filter(s => s.role.trim() && s.members.length > 0);
  if (groups.length === 0) return null;

  const photoGroups = groups.filter(g => g.members.some(m => m.photoFile));
  const textGroups = groups.filter(g => !g.members.some(m => m.photoFile));

  return (
    <section className="bg-gray-50 px-5 py-10">
      <header className="text-center mb-8">
        <h2 className="text-lg font-bold text-gray-900 break-keep">제작진</h2>
        <p className="mt-1 text-xs text-gray-500 break-keep">이 무대를 함께 만든 사람들</p>
      </header>

      {/* 사진 있는 직책 — 박스 없음, 직책명 + 헤드샷 그리드 */}
      {photoGroups.length > 0 && (
        <div className="space-y-8 mb-8">
          {photoGroups.map(group => (
            <div key={group.id} className="text-center">
              <h3 className="mb-4 text-sm font-semibold text-gray-800 break-keep">
                {group.role}
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {group.members.map((m, i) => (
                  <figure
                    key={i}
                    // 원본 grid-cols-3 sm:grid-cols-4 + gap-3과 동일한 폭
                    className="w-[calc(33.333%-8px)] sm:w-[calc(25%-9px)]"
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
                <span className="text-right text-sm font-semibold text-gray-900 break-keep">
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
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-200 ring-1 ring-black/5">
        {photoFile ? (
          <CastingPhoto
            src={`/invites/${inviteId}/staff/${photoFile}`}
            alt={name}
            crop={photoCrop}
            sizes="(max-width: 640px) 25vw, 15vw"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 break-keep">
            사진 없음
          </span>
        )}
      </div>
      <figcaption className="mt-1.5 text-sm font-medium text-gray-900 text-center break-keep">
        {name}
      </figcaption>
    </>
  );
}
