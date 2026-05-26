import type { InviteStaff } from '@/lib/invites/types';
import CastingPhoto from './CastingPhoto';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/**
 * 제작진 소개 섹션. 공개 정보 페이지에서 캐스팅 섹션 아래에 표시.
 * 공연 프로그램북 감성의 "플레이빌" 스타일 — 직책과 이름을 점선 리더로 잇는다.
 * - 사진 있는 직책 → 정사각 헤드샷 그리드 (패널 위에 먼저)
 * - 사진 없는 직책 → 점선 리더 크레딧 패널
 * 제작진이 없으면 아무것도 렌더하지 않는다.
 */
export default function StaffSection({ staff, inviteId }: Props) {
  const groups = staff.filter(s => s.role.trim() && s.members.length > 0);
  if (groups.length === 0) return null;

  const photoGroups = groups.filter(g => g.members.some(m => m.photoFile));
  const textGroups = groups.filter(g => !g.members.some(m => m.photoFile));

  return (
    <section className="bg-gray-50 px-5 py-8">
      <h2 className="text-lg font-bold text-gray-900">제작진</h2>
      <p className="mt-1 text-xs text-gray-500">이 무대를 함께 만든 사람들</p>

      {/* 사진 있는 직책 — 헤드샷 그리드 */}
      {photoGroups.length > 0 && (
        <div className="mt-5 space-y-5">
          {photoGroups.map(group => (
            <div key={group.id}>
              <h3 className="mb-2.5 text-sm font-semibold text-gray-800">{group.role}</h3>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
          ))}
        </div>
      )}

      {/* 사진 없는 직책 — 2열 크레딧 패널 (행 사이 hairline divider) */}
      {textGroups.length > 0 && (
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white px-5 shadow-sm">
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
