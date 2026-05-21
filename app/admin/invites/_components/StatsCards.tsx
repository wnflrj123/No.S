'use client';

import { useMemo } from 'react';
import type { Invite, InviteRegistration, InviteSupporter } from '@/lib/invites/types';

interface Props {
  invite: Invite;
  registrations: InviteRegistration[];
  supporters?: InviteSupporter[]; // wall에서 추가된 현장 후원자
}

export default function StatsCards({ invite, registrations, supporters = [] }: Props) {
  const stats = useMemo(() => {
    // superseded(취소된 이전 신청)는 통계에서 제외
    const active = registrations.filter(r => (r.status ?? 'active') === 'active');
    const totalRegs = active.length;
    const totalHc = active.reduce(
      (sum, r) => sum + r.roundSelections.reduce((s, x) => s + x.headcount, 0),
      0,
    );
    const sponsors = active.filter(r => r.isSponsor).length + supporters.length;
    const byRound = new Map<number, number>();
    for (const r of active) {
      for (const sel of r.roundSelections) {
        byRound.set(sel.roundNo, (byRound.get(sel.roundNo) ?? 0) + sel.headcount);
      }
    }
    return { totalRegs, totalHc, sponsors, byRound };
  }, [registrations, supporters]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Card title="총 신청 건수" value={stats.totalRegs} />
        <Card title="총 인원" value={stats.totalHc} suffix="명" />
        <Card title="후원자" value={stats.sponsors} suffix="명" highlight />
      </div>
      {invite.rounds.length > 0 && (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${invite.rounds.length}, minmax(0, 1fr))` }}
        >
          {invite.rounds.map(r => (
            <Card
              key={r.roundNo}
              title={`${r.roundNo}회차 (${r.teamName})`}
              value={stats.byRound.get(r.roundNo) ?? 0}
              suffix="명"
              small
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  value,
  suffix,
  highlight,
  small,
}: {
  title: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${
        highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
      }`}
    >
      <div className="text-xs text-gray-500">{title}</div>
      <div
        className={`mt-1 font-bold ${small ? 'text-xl' : 'text-2xl'} ${
          highlight ? 'text-[#0066B3]' : 'text-gray-900'
        }`}
      >
        {value}
        {suffix && <span className="text-sm font-normal ml-0.5 text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}
