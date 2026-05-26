import type { InviteStaff } from '@/lib/invites/types';
import CastingPhoto from './CastingPhoto';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/**
 * 제작진 소개 섹션. 캐스팅 섹션과 같은 가운데 정렬 카드 무드로 통일.
 * - 사진 있는 직책: 흰 rounded-2xl 카드. 직책명 가운데 + 헤드샷 그리드(grid-cols-3 sm:cols-4)
 * - 사진 없는 직책: 흰 rounded-2xl 패널, 행 사이 hairline divider
 * radius는 큰 컨테이너 rounded-2xl, 작은 사진 카드 rounded-2xl(원형 헤드샷)로 일관 유지.
 */
export default function StaffSection({ staff, inviteId }: Props) {
  const groups = staff.filter(s => s.role.trim() && s.members.length > 0);
  if (groups.length === 0) return null;

  const photoGroups = groups.filter(g => g.members.some(m => m.photoFile));
  const textGroups = groups.filter(g => !g.members.some(m => m.photoFile));

  return (
    <section className="bg-gray-50 px-5 py-10">
      <header className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">제작진</h2>
        <p className="mt-1.5 text-xs text-gray-500">이 무대를 함께 만든 사람들</p>
      </header>

      {/* 사진 있는 직책 — 각 직책을 흰 카드로 감쌈 */}
      {photoGroups.length > 0 && (
        <div className="space-y-5">
          {photoGroups.map(group => (
            <article
              key={group.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-5 pt-6 text-center">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  {group.role}
                </h3>
              </div>
              <div className="px-3 pb-5 pt-4">
                <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {group.members.map((m, i) => (
                    <li key={i} className="text-center">
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-200 ring-1 ring-black/5">
                        {m.photoFile ? (
                          <CastingPhoto
                            src={`/invites/${inviteId}/staff/${m.photoFile}`}
                            alt={m.name}
                            crop={m.photoCrop}
                            sizes="(max-width: 640px) 33vw, 25vw"
                          />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                            사진 없음
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-gray-900">{m.name}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 사진 없는 직책 — 흰 rounded-2xl 패널 */}
      {textGroups.length > 0 && (
        <div
          className={`${photoGroups.length > 0 ? 'mt-5' : ''} rounded-2xl border border-gray-200 bg-white px-5 shadow-sm`}
        >
          <ul className="divide-y divide-gray-100">
            {textGroups.map(group => (
              <li
                key={group.id}
                className="flex items-baseline justify-between gap-4 py-3.5"
              >
                <span className="shrink-0 text-sm text-gray-500">{group.role}</span>
                <span className="text-right text-sm font-semibold text-gray-900">
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
