import Image from 'next/image';
import type { InviteStaff } from '@/lib/invites/types';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/** 직책 라벨. 사진/텍스트 두 모드에서 공통으로 쓰는 파란 톤 핀. */
function RolePill({ role }: { role: string }) {
  return (
    <span className="inline-block rounded-full bg-[#0066B3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0066B3]">
      {role}
    </span>
  );
}

/**
 * 제작진 소개 섹션. 공개 정보 페이지에서 캐스팅 섹션 아래에 표시.
 * - 사진 있는 직책 → 정사각 헤드샷 그리드 (상단에 먼저)
 * - 사진 없는 직책 → 직책 핀 + 이름의 크레딧 카드 그리드
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
      <p className="mt-1 mb-5 text-xs text-gray-500">이 무대를 함께 만든 사람들</p>

      {/* 사진 있는 직책 — 헤드샷 그리드 */}
      {photoGroups.length > 0 && (
        <div className="mb-6 space-y-5">
          {photoGroups.map(group => (
            <div key={group.id}>
              <div className="mb-2.5">
                <RolePill role={group.role} />
              </div>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {group.members.map((m, i) => (
                  <li key={i} className="text-center">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-200 ring-1 ring-black/5">
                      {m.photoFile ? (
                        <Image
                          src={`/invites/${inviteId}/staff/${m.photoFile}`}
                          alt={m.name}
                          fill
                          sizes="(max-width: 640px) 33vw, 25vw"
                          className="object-cover"
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

      {/* 사진 없는 직책 — 크레딧 카드 그리드 */}
      {textGroups.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {textGroups.map(group => (
            <li
              key={group.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-[#0066B3]/30"
            >
              <RolePill role={group.role} />
              <p className="mt-2.5 text-sm font-semibold leading-snug text-gray-900">
                {group.members.map(m => m.name).join(', ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
