import Image from 'next/image';
import { Fragment } from 'react';
import type { InviteStaff } from '@/lib/invites/types';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/**
 * 제작진 소개 섹션. 사진 유무와 무관하게 모든 크레딧을 한 패널에 통일된 행 형식으로.
 * 사진이 있는 멤버는 이름 앞에 작은 원형 아바타(36px). 시각 위계 통일로
 * '사진 있는 사람 / 없는 사람' 간 갭을 최소화.
 */
export default function StaffSection({ staff, inviteId }: Props) {
  const groups = staff.filter(s => s.role.trim() && s.members.length > 0);
  if (groups.length === 0) return null;

  return (
    <section className="bg-gray-50 px-5 py-8">
      <h2 className="text-lg font-bold text-gray-900">제작진</h2>
      <p className="mt-1 text-xs text-gray-500">이 무대를 함께 만든 사람들</p>

      <div className="mt-5 rounded-2xl border border-gray-200 bg-white px-5 shadow-sm">
        <ul className="divide-y divide-gray-100">
          {groups.map(group => (
            <li
              key={group.id}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <span className="shrink-0 text-sm text-gray-500">{group.role}</span>
              <div className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1.5">
                {group.members.map((m, i) => (
                  <Fragment key={i}>
                    {i > 0 && (
                      <span aria-hidden className="text-gray-300">·</span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      {m.photoFile && (
                        <Image
                          src={`/invites/${inviteId}/staff/${m.photoFile}`}
                          alt={m.name}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover bg-gray-200 ring-1 ring-black/5"
                        />
                      )}
                      <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                    </span>
                  </Fragment>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
