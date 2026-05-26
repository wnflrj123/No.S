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

interface SeatStatus {
  soldOut: boolean;
  badge: { label: string; className: string } | null;
}

/**
 * 잔여석 임계 (실제 좌석 수는 노출하지 않음):
 *  - 잔여 ≤ 0 → '잔여석 없음' + 신청 차단(soldOut)
 *  - 0 < 잔여 ≤ 10 → '거의 마감' (빨강 경고)
 *  - 10 < 잔여 ≤ capacity/2 → '절반 이상 마감' (주황 안내)
 *  - 그 외 → 표시 안 함
 *
 * seatCapacity 미설정 시 어드민이 좌석 안내를 옵트인하지 않은 것 → 모든 표시 비활성.
 */
const SOLD_OUT_THRESHOLD = 0;
const ALMOST_FULL_THRESHOLD = 10;

function computeSeatStatus(
  seatCapacity: number | undefined,
  booked: number | undefined,
): SeatStatus {
  if (!seatCapacity || seatCapacity <= 0) return { soldOut: false, badge: null };
  const remaining = seatCapacity - (booked ?? 0);
  if (remaining <= SOLD_OUT_THRESHOLD) {
    return {
      soldOut: true,
      badge: {
        label: '잔여석 없음',
        className: 'bg-red-100 text-red-700 border border-red-200',
      },
    };
  }
  if (remaining <= ALMOST_FULL_THRESHOLD) {
    return {
      soldOut: false,
      badge: {
        label: '거의 마감',
        className: 'bg-red-100 text-red-700 border border-red-200',
      },
    };
  }
  if (remaining <= seatCapacity / 2) {
    return {
      soldOut: false,
      badge: {
        label: '절반 이상 마감',
        className: 'bg-amber-100 text-amber-700 border border-amber-200',
      },
    };
  }
  return { soldOut: false, badge: null };
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
        const { soldOut, badge } = closed
          ? { soldOut: false, badge: null }
          : computeSeatStatus(r.seatCapacity, r.booked);
        // 매진이지만 편집 모드 등으로 이미 선택돼 있다면 그대로 유지 가능.
        // 새 선택만 차단하기 위해 selected=false 일 때만 disabled 처리.
        const blockNewSelection = soldOut && !selected;
        const checkboxDisabled = closed || blockNewSelection;
        return (
          <li
            key={r.roundNo}
            className={`p-3 border rounded-xl ${
              closed || blockNewSelection
                ? 'bg-gray-100 border-gray-200 text-gray-400'
                : selected
                ? 'border-[#0066B3] bg-blue-50'
                : 'bg-white border-gray-200'
            }`}
          >
            <label
              className={`flex items-center gap-3 select-none ${
                checkboxDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                disabled={checkboxDisabled}
                checked={selected}
                onChange={() => toggle(r.roundNo)}
                className="w-5 h-5"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {r.roundNo}회차 · {r.teamName}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs text-gray-500">
                    {formatInTimeZone(new Date(r.startAtMs), KST, 'M월 d일(EEE) HH:mm', { locale: ko })}
                  </span>
                  {badge && (
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  )}
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
