'use client';

import { useMemo } from 'react';
import type { InviteRegistration } from '@/lib/invites/types';

interface Props {
  registrations: InviteRegistration[];
}

export default function AnswersDigest({ registrations }: Props) {
  const cheers = useMemo(
    () => registrations.filter(r => r.cheerMessage?.trim()).map(r => ({ name: r.name, msg: r.cheerMessage! })),
    [registrations],
  );

  const seats = useMemo(
    () => registrations.filter(r => r.seatRequests?.trim()).map(r => ({ name: r.name, msg: r.seatRequests! })),
    [registrations],
  );

  const actorRanking = useMemo(() => {
    const counter = new Map<string, number>();
    for (const r of registrations) {
      const text = (r.supportingActors ?? '').trim();
      if (!text) continue;
      for (const raw of text.split(/[,/\s]+/)) {
        const name = raw.trim();
        if (!name) continue;
        counter.set(name, (counter.get(name) ?? 0) + 1);
      }
    }
    return Array.from(counter.entries()).sort((a, b) => b[1] - a[1]);
  }, [registrations]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <DigestCard title={`응원 메시지 (${cheers.length})`}>
        {cheers.length === 0 ? (
          <p className="text-sm text-gray-500">아직 메시지가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {cheers.map((c, i) => (
              <li key={i}>
                <div className="text-xs text-gray-500">{c.name}</div>
                <div className="text-sm text-gray-800 whitespace-pre-line">{c.msg}</div>
              </li>
            ))}
          </ul>
        )}
      </DigestCard>

      <DigestCard title={`응원하는 배우 (언급 빈도)`}>
        {actorRanking.length === 0 ? (
          <p className="text-sm text-gray-500">아직 언급된 배우가 없습니다.</p>
        ) : (
          <ul className="space-y-1">
            {actorRanking.map(([name, cnt]) => (
              <li key={name} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">{name}</span>
                <span className="text-[#0066B3] font-semibold">{cnt}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-400 mt-3">
          쉼표·공백·슬래시로 분리해 단순 빈도 카운트. 자유 텍스트라 표기 차이는 별개로 집계됩니다.
        </p>
      </DigestCard>

      <DigestCard title={`좌석 요청사항 (${seats.length})`} className="md:col-span-2">
        {seats.length === 0 ? (
          <p className="text-sm text-gray-500">없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {seats.map((s, i) => (
              <li key={i}>
                <div className="text-xs text-gray-500">{s.name}</div>
                <div className="text-sm text-gray-800 whitespace-pre-line">{s.msg}</div>
              </li>
            ))}
          </ul>
        )}
      </DigestCard>
    </div>
  );
}

function DigestCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 bg-white border border-gray-200 rounded-xl ${className}`}>
      <h3 className="text-sm font-bold mb-3 text-gray-900">{title}</h3>
      {children}
    </div>
  );
}
