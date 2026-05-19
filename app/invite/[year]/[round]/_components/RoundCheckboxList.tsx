'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface FormRound {
  roundNo: number;
  teamName: string;
  startAtMs: number;
}

interface Props {
  rounds: FormRound[];
  value: Record<number, number>; // roundNo -> headcount
  onChange: (next: Record<number, number>) => void;
  maxHeadcount: number;
}

export default function RoundCheckboxList({ rounds, value, onChange, maxHeadcount }: Props) {
  // 마운트 시점 기준. 마감 판정이 페이지 체류 중 갱신되지 않아도 서버가 최종 검증함.
  const [nowMs] = useState(() => Date.now());

  const toggle = (roundNo: number) => {
    const next = { ...value };
    if ((next[roundNo] ?? 0) > 0) delete next[roundNo];
    else next[roundNo] = 1;
    onChange(next);
  };

  const setCount = (roundNo: number, n: number) => {
    const clamped = Math.max(1, Math.min(maxHeadcount, n));
    onChange({ ...value, [roundNo]: clamped });
  };

  return (
    <ul className="space-y-2">
      {rounds.map(r => {
        const closed = r.startAtMs <= nowMs;
        const selected = (value[r.roundNo] ?? 0) > 0;
        return (
          <li
            key={r.roundNo}
            className={`p-3 border rounded-xl ${
              closed
                ? 'bg-gray-100 border-gray-200 text-gray-400'
                : selected
                ? 'border-[#0066B3] bg-blue-50'
                : 'bg-white border-gray-200'
            }`}
          >
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={closed}
                checked={selected}
                onChange={() => toggle(r.roundNo)}
                className="w-5 h-5"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {r.roundNo}회차 · {r.teamName}
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(r.startAtMs), 'M월 d일(EEE) HH:mm', { locale: ko })}
                </div>
              </div>
              {closed && (
                <span className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded">마감</span>
              )}
            </label>
            {selected && !closed && (
              <div className="mt-3 ml-8 flex items-center gap-2">
                <span className="text-sm text-gray-700">인원수</span>
                <button
                  type="button"
                  onClick={() => setCount(r.roundNo, (value[r.roundNo] ?? 1) - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-lg leading-none"
                  aria-label="감소"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold">{value[r.roundNo]}</span>
                <button
                  type="button"
                  onClick={() => setCount(r.roundNo, (value[r.roundNo] ?? 1) + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-lg leading-none"
                  aria-label="증가"
                >
                  +
                </button>
                <span className="text-xs text-gray-500">명</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
