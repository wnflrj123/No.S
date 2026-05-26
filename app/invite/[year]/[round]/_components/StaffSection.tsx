import type { InviteStaff } from '@/lib/invites/types';
import CastingPhoto from './CastingPhoto';
import PhotoPlaceholder from './PhotoPlaceholder';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/**
 * 제작진 소개 섹션.
 * 사진 유무와 무관하게 모든 직책을 동일한 헤드샷 그리드로 통일 표시 —
 * 사진 없는 멤버는 PhotoPlaceholder(이니셜 + pastel gradient)로 자연스럽게 채워짐.
 * 제작진이 없으면 아무것도 렌더하지 않는다.
 */
export default function StaffSection({ staff, inviteId }: Props) {
  const groups = staff.filter(s => s.role.trim() && s.members.length > 0);
  if (groups.length === 0) return null;

  return (
    <section className="bg-gray-50 px-5 py-8">
      <h2 className="text-lg font-bold text-gray-900">제작진</h2>
      <p className="mt-1 text-xs text-gray-500">이 무대를 함께 만든 사람들</p>

      <div className="mt-5 space-y-5">
        {groups.map(group => (
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
                      <PhotoPlaceholder name={m.name} size="sm" />
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-gray-900">{m.name}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
