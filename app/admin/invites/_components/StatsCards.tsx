'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { Invite, InviteRegistration, InviteSupporter } from '@/lib/invites/types';

interface Props {
  invite: Invite;
  registrations: InviteRegistration[];
  supporters?: InviteSupporter[]; // wall에서 추가된 현장 후원자
}

export default function StatsCards({ invite, registrations, supporters = [] }: Props) {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

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
    return { active, totalRegs, totalHc, sponsors, byRound };
  }, [registrations, supporters]);

  const selectedRoundInfo = useMemo(() => {
    if (selectedRound === null) return null;
    const round = invite.rounds.find(r => r.roundNo === selectedRound);
    if (!round) return null;
    const items = stats.active
      .filter(r => r.roundSelections.some(s => s.roundNo === selectedRound))
      .map(r => ({
        reg: r,
        headcount: r.roundSelections.find(s => s.roundNo === selectedRound)?.headcount ?? 0,
      }))
      .sort((a, b) => b.reg.createdAt.toMillis() - a.reg.createdAt.toMillis());
    return { round, items };
  }, [selectedRound, invite.rounds, stats.active]);

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
              onClick={() => setSelectedRound(r.roundNo)}
            />
          ))}
        </div>
      )}

      {selectedRoundInfo && (
        <RoundRegistrantsModal
          round={selectedRoundInfo.round.roundNo}
          teamName={selectedRoundInfo.round.teamName}
          items={selectedRoundInfo.items}
          onClose={() => setSelectedRound(null)}
        />
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
  onClick,
}: {
  title: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
  small?: boolean;
  onClick?: () => void;
}) {
  const base = `p-4 rounded-xl border text-left ${
    highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
  }`;
  const content = (
    <>
      <div className="text-xs text-gray-500">{title}</div>
      <div
        className={`mt-1 font-bold ${small ? 'text-xl' : 'text-2xl'} ${
          highlight ? 'text-[#0066B3]' : 'text-gray-900'
        }`}
      >
        {value}
        {suffix && <span className="text-sm font-normal ml-0.5 text-gray-500">{suffix}</span>}
      </div>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} cursor-pointer hover:border-[#0066B3]/60 hover:bg-blue-50/40 transition-colors`}
        title="클릭해서 신청자 목록 보기"
      >
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
}

interface RoundItem {
  reg: InviteRegistration;
  headcount: number;
}

function RoundRegistrantsModal({
  round,
  teamName,
  items,
  onClose,
}: {
  round: number;
  teamName: string;
  items: RoundItem[];
  onClose: () => void;
}) {
  const totalHc = items.reduce((s, x) => s + x.headcount, 0);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h4 className="font-bold text-gray-900">
              {round}회차 ({teamName}) 신청자
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              총 {items.length}건 · {totalHc}명
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl px-2"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-12">이 회차에 신청자가 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-medium">이름</th>
                  <th className="px-3 py-2 font-medium">휴대폰</th>
                  <th className="px-3 py-2 font-medium">인원</th>
                  <th className="px-3 py-2 font-medium">응원배우</th>
                  <th className="px-3 py-2 font-medium">후원</th>
                  <th className="px-3 py-2 font-medium">신청일시</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ reg, headcount }) => (
                  <tr key={reg.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-900">{reg.name}</td>
                    <td className="px-3 py-2 text-gray-700">{reg.phone}</td>
                    <td className="px-3 py-2 text-gray-700">{headcount}명</td>
                    <td
                      className="px-3 py-2 text-gray-700 max-w-[10rem] truncate"
                      title={reg.supportingActors ?? ''}
                    >
                      {reg.supportingActors?.trim() || '-'}
                    </td>
                    <td className="px-3 py-2">
                      {reg.isSponsor ? (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                          💛 후원
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">미후원</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {format(reg.createdAt.toDate(), 'M/d HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
