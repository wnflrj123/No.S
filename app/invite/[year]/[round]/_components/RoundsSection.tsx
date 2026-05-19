import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { InviteRound } from '@/lib/invites/types';

interface Props {
  rounds: InviteRound[];
  nowMs: number;
}

export default function RoundsSection({ rounds, nowMs }: Props) {
  if (rounds.length === 0) return null;
  return (
    <section className="px-5 py-8 bg-gray-50">
      <h2 className="text-lg font-bold text-gray-900 mb-3">공연 시간</h2>
      <ul className="space-y-2">
        {rounds.map(r => {
          const startMs = r.startAt.toDate().getTime();
          const closed = startMs <= nowMs;
          return (
            <li
              key={r.roundNo}
              className={`p-4 rounded-xl border ${closed ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium">
                    {r.roundNo}회차 · {r.teamName}
                  </div>
                  <div className="text-base font-bold mt-0.5">
                    {format(new Date(startMs), 'M월 d일(EEE) HH:mm', { locale: ko })}
                  </div>
                </div>
                {closed && (
                  <span className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded">
                    공연 시작됨
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
