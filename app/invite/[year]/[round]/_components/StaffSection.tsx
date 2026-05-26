import type { InviteStaff } from '@/lib/invites/types';
import CastingPhoto from './CastingPhoto';
import PhotoPlaceholder from './PhotoPlaceholder';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/**
 * 제작진 소개 섹션.
 * - 사진 있는 직책: 큰 정사각 헤드샷 카드 (다른 멤버는 PhotoPlaceholder initial)
 * - 사진 없는 직책(전원 무사진): 작은 원형 silhouette 아바타 카드
 *   → 시각 hierarchy(리드 vs 크루)는 유지하되 카드 형식으로 통일감 확보
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

      {/* 사진 있는 직책 — 큰 헤드샷 그리드 */}
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
      )}

      {/* 사진 없는 직책 — 작은 원형 silhouette 카드 */}
      {textGroups.length > 0 && (
        <div className="mt-5 space-y-4">
          {textGroups.map(group => (
            <div key={group.id}>
              <h3 className="mb-2 text-sm font-semibold text-gray-800">{group.role}</h3>
              <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {group.members.map((m, i) => (
                  <li key={i} className="text-center">
                    <div className="relative aspect-square overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5 mx-auto w-14 sm:w-16">
                      <PhotoPlaceholder variant="silhouette" />
                    </div>
                    <p className="mt-1 text-xs font-medium text-gray-700">{m.name}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
