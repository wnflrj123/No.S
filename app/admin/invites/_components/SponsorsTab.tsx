'use client';

import { format } from 'date-fns';
import type { InviteRegistration, InviteSupporter } from '@/lib/invites/types';

interface Props {
  registrations: InviteRegistration[];
  supporters?: InviteSupporter[]; // wall에서 추가된 현장 후원자
}

interface SponsorRow {
  key: string;
  name: string;
  phone?: string;
  checkedAt: Date | null;
  source: 'registration' | 'wall'; // 일반 후원 vs 현장(wall)
}

export default function SponsorsTab({ registrations, supporters = [] }: Props) {
  const fromRegs: SponsorRow[] = registrations
    .filter(r => r.isSponsor && (r.status ?? 'active') === 'active')
    .map(r => ({
      key: `r:${r.id}`,
      name: r.name,
      phone: r.phone,
      checkedAt: r.sponsorCheckedAt ? r.sponsorCheckedAt.toDate() : null,
      source: 'registration' as const,
    }));

  const fromSupporters: SponsorRow[] = supporters.map(s => ({
    key: `s:${s.id}`,
    name: s.name,
    checkedAt: s.createdAt?.toDate?.() ?? null,
    source: 'wall' as const,
  }));

  const all = [...fromRegs, ...fromSupporters].sort((a, b) => {
    const am = a.checkedAt?.getTime() ?? 0;
    const bm = b.checkedAt?.getTime() ?? 0;
    return bm - am;
  });

  if (all.length === 0) {
    return (
      <p className="text-center text-gray-500 py-16 bg-gray-50 rounded-xl">
        아직 후원자가 없습니다.
      </p>
    );
  }

  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {all.map(s => (
        <li
          key={s.key}
          className={`p-4 rounded-xl border ${
            s.source === 'wall'
              ? 'bg-pink-50 border-pink-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div
              className={`font-semibold ${
                s.source === 'wall' ? 'text-pink-700' : 'text-[#0066B3]'
              }`}
            >
              💛 {s.name}
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                s.source === 'wall'
                  ? 'bg-pink-200 text-pink-800'
                  : 'bg-blue-200 text-[#0066B3]'
              }`}
            >
              {s.source === 'wall' ? '🌸 현장 후원자' : '신청자'}
            </span>
          </div>
          {s.phone && <div className="text-sm text-gray-600 mt-0.5">{s.phone}</div>}
          {s.checkedAt && (
            <div className="text-xs text-gray-500 mt-1">
              {s.source === 'wall' ? '응원 보낸 시각' : '후원 체크'}: {format(s.checkedAt, 'M월 d일 HH:mm')}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
