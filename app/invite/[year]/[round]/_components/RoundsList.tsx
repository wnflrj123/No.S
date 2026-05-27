'use client';

import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import type { ResolvedCasting } from './casting-utils';
import CastingModal from './CastingModal';

const KST = 'Asia/Seoul';

export interface ResolvedRound {
  roundNo: number;
  teamName: string;
  startAtMs: number;
  castings: ResolvedCasting[];
}

interface Props {
  data: ResolvedRound[];
  inviteId: string;
  nowMs: number;
}

export default function RoundsList({ data, inviteId, nowMs }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const active = activeIdx !== null ? data[activeIdx] : null;

  return (
    <>
      <ul className="space-y-2">
        {data.map((r, i) => {
          const closed = r.startAtMs <= nowMs;
          const hasCasting = r.castings.length > 0;
          return (
            <li key={r.roundNo}>
              <button
                type="button"
                onClick={() => setActiveIdx(i)}
                disabled={!hasCasting}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  closed
                    ? 'bg-gray-100 border-gray-200 text-gray-400'
                    : 'bg-white border-gray-200 hover:border-[#0066B3]/40 hover:bg-blue-50/50'
                } ${hasCasting ? 'cursor-pointer' : 'cursor-default'}`}
                aria-label={hasCasting ? `${r.roundNo}회차 캐스팅 보기` : `${r.roundNo}회차`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium">
                      {r.roundNo}회차 · {r.teamName}
                    </div>
                    <div className="text-base font-bold mt-0.5">
                      {formatInTimeZone(new Date(r.startAtMs), KST, 'M월 d일(EEE) HH:mm', { locale: ko })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {closed && (
                      <span className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded">
                        공연 시작됨
                      </span>
                    )}
                    {hasCasting && (
                      <span className={`text-xs font-medium ${closed ? 'text-gray-400' : 'text-[#0066B3]'}`}>
                        캐스팅 보기 →
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {active && (
        <CastingModal round={active} inviteId={inviteId} onClose={() => setActiveIdx(null)} />
      )}
    </>
  );
}
