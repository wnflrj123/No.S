'use client';

import { format } from 'date-fns';
import type { InviteRegistration } from '@/lib/invites/types';

interface Props {
  registrations: InviteRegistration[];
}

export default function SponsorsTab({ registrations }: Props) {
  const sponsors = registrations.filter(r => r.isSponsor);

  if (sponsors.length === 0) {
    return (
      <p className="text-center text-gray-500 py-16 bg-gray-50 rounded-xl">
        아직 후원자가 없습니다.
      </p>
    );
  }

  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {sponsors.map(s => {
        const at = s.sponsorCheckedAt?.toDate() ?? null;
        return (
          <li key={s.id} className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="font-semibold text-[#0066B3]">💛 {s.name}</div>
            <div className="text-sm text-gray-600 mt-0.5">{s.phone}</div>
            {at && (
              <div className="text-xs text-gray-500 mt-1">후원 체크: {format(at, 'M월 d일 HH:mm')}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
