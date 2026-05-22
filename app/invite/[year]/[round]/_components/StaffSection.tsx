import Image from 'next/image';
import type { InviteStaff } from '@/lib/invites/types';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/**
 * 제작진 소개 섹션. 공개 정보 페이지에서 캐스팅 섹션 아래에 표시.
 * - 사진을 가진 멤버가 있는 직책 → 사진 카드
 * - 사진 없는 직책 → "직책  이름, 이름" 텍스트 한 줄
 * 제작진이 없으면 아무것도 렌더하지 않는다.
 */
export default function StaffSection({ staff, inviteId }: Props) {
  const groups = staff.filter(s => s.role.trim() && s.members.length > 0);
  if (groups.length === 0) return null;

  return (
    <section className="px-5 py-8 bg-gray-50">
      <h2 className="text-lg font-bold text-gray-900 mb-3">제작진</h2>
      <div className="space-y-5">
        {groups.map(group => {
          const hasPhoto = group.members.some(m => m.photoFile);

          if (!hasPhoto) {
            return (
              <div key={group.id} className="flex gap-3 text-sm">
                <span className="font-semibold text-[#0066B3] shrink-0">{group.role}</span>
                <span className="text-gray-800">
                  {group.members.map(m => m.name).join(', ')}
                </span>
              </div>
            );
          }

          return (
            <div key={group.id}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{group.role}</h3>
              <ul className="flex flex-wrap gap-3">
                {group.members.map((m, i) => (
                  <li key={i} className="w-24 text-center">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-200">
                      {m.photoFile ? (
                        <Image
                          src={`/invites/${inviteId}/staff/${m.photoFile}`}
                          alt={m.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                          사진 없음
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-900">{m.name}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
