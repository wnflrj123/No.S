'use client';

import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';

const KST = 'Asia/Seoul';

export interface FormRound {
  roundNo: number;
  teamName: string;
  startAtMs: number;
  /** 회차 좌석 수. 미설정 시 잔여석 안내 비표시. */
  seatCapacity?: number;
  /** 회차의 현재 active 신청 인원 합. seatCapacity와 함께 사용. */
  booked?: number;
}

interface Props {
  rounds: FormRound[];
  value: Record<number, number>; // roundNo -> headcount
  onChange: (next: Record<number, number>) => void;
  maxHeadcount: number;
}

interface SeatHint {
  label: string;
  className: string;
}

/**
 * 잔여석 비율 임계:
 *  - 잔여 ≤ 0 → 빨강 ('거의 마감')
 *  - 잔여 ≤ 1/3 → 빨강 ('얼마 안 남았어요')
 *  - 1/3 < 잔여 ≤ 1/2 → 주황 ('잔여 N석')
 *  - 잔여 > 1/2 → 표시 안 함
 */
function computeSeatHint(
  seatCapacity: number | undefined,
  booked: number | undefined,
): SeatHint | null {
  if (!seatCapacity || seatCapacity <= 0) return null;
  const used = booked ?? 0;
  const remaining = seatCapacity - used;
  if (remaining <= 0) {
    return {
      label: '거의 마감',
      className: 'bg-red-100 text-red-700 border border-red-200',
    };
  }
  const ratio = remaining / seatCapacity;
  if (ratio <= 1 / 3) {
    return {
      label: `잔여 ${remaining}석 · 얼마 안 남았어요`,
      className: 'bg-red-100 text-red-700 border border-red-200',
    };
  }
  if (ratio <= 1 / 2) {
    return {
      label: `잔여 ${remaining}석`,
      className: 'bg-amber-100 text-amber-700 border border-amber-200',
    };
  }
  return null;
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
        const hint = closed ? null : computeSeatHint(r.seatCapacity, r.booked);
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
                  {formatInTimeZone(new Date(r.startAtMs), KST, 'M월 d일(EEE) HH:mm', { locale: ko })}
                </div>
                {hint && (
                  <span
                    className={`inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded ${hint.className}`}
                  >
                    {hint.label}
                  </span>
                )}
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
