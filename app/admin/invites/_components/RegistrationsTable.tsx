'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { InviteRegistration } from '@/lib/invites/types';

interface Props {
  registrations: InviteRegistration[];
}

export default function RegistrationsTable({ registrations }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter(
      r => r.name.toLowerCase().includes(q) || r.phone.includes(q),
    );
  }, [registrations, search]);

  if (registrations.length === 0) {
    return (
      <p className="text-center text-gray-500 py-16 bg-gray-50 rounded-xl">아직 신청자가 없습니다.</p>
    );
  }

  return (
    <div>
      <input
        type="search"
        placeholder="이름·휴대폰 검색"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-3 w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">이름</th>
              <th className="px-3 py-2 font-medium">휴대폰</th>
              <th className="px-3 py-2 font-medium">회차+인원</th>
              <th className="px-3 py-2 font-medium">총 인원</th>
              <th className="px-3 py-2 font-medium">후원</th>
              <th className="px-3 py-2 font-medium">신청일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const totalHc = r.roundSelections.reduce((s, x) => s + x.headcount, 0);
              const createdAt = r.createdAt.toDate();
              return (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{r.name}</td>
                  <td className="px-3 py-2 text-gray-700">{r.phone}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {r.roundSelections.map(s => `${s.roundNo}회(${s.headcount})`).join(', ')}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{totalHc}명</td>
                  <td className="px-3 py-2">{r.isSponsor ? '💛' : ''}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {format(createdAt, 'M/d HH:mm')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-8">검색 결과가 없습니다.</p>
      )}
    </div>
  );
}
