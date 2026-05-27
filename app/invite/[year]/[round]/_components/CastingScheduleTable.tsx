'use client';

import { useCallback, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import CastingModal, { type CastingModalRound } from './CastingModal';

const KST = 'Asia/Seoul';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
function romanize(n: number): string {
  return ROMAN[n - 1] ?? String(n);
}

interface Props {
  rows: CastingModalRound[];
  displayRoleNames: string[];
  inviteId: string;
}

/**
 * 캐스팅 스케줄 표 (클라이언트).
 * - 모바일(< sm): 전치된 표 — 배역=행, 회차=열. 보통 "회차 수 < 배역 수" 라서
 *   세로로 길게 펼치는 편이 좁은 화면에서 한눈에 들어옴. 가로 스크롤 없음.
 * - sm+: 전통 표 — 회차=행, 배역=열. 베어 더 뮤지컬 등 정통 프로그램북 레이아웃.
 * - 양쪽 다 회차 헤더(또는 행) 클릭 시 동일한 CastingModal 오픈.
 */
export default function CastingScheduleTable({ rows, displayRoleNames, inviteId }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const active = activeIdx !== null ? rows[activeIdx] : null;

  // 팀명 기반 컬러 — 인쇄 스케줄표의 토=blue/일=red 컨벤션 대신 팀 컬러로 매핑.
  // 본 동호회는 같은 요일에 블루/레드가 섞이므로(예: 토 점심=블루 / 토 저녁=레드)
  // 요일 컬러는 의미 충돌을 일으킴 → 실제 팀 컬러를 따라가도록 변경.
  const teamTone = (teamName: string) => {
    const t = (teamName || '').toLowerCase();
    if (t.includes('블루') || t.includes('blue')) return 'text-[#1E5FA8]';
    if (t.includes('레드') || t.includes('red')) return 'text-[#B9304B]';
    return 'text-gray-800';
  };

  // 회차별 (배역명 → 배우명) 맵 사전 계산 — 모바일/데스크탑 둘 다 재사용
  const byRoleByRound = rows.map(row => {
    const m = new Map<string, string>();
    for (const c of row.castings) {
      const an = c.actorName?.trim();
      if (c.roleName && an) m.set(c.roleName, an);
    }
    return m;
  });

  const open = useCallback(
    (i: number) => {
      if (rows[i].castings.length > 0) setActiveIdx(i);
    },
    [rows]
  );
  const onRowKey = useCallback(
    (i: number) =>
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(i);
        }
      },
    [open]
  );

  return (
    <>
      {/* ───── 모바일: 전치된 표 (배역=행, 회차=열) ───── */}
      <div className="sm:hidden">
        <table className="w-full text-[11.5px] border-separate border-spacing-0 table-fixed">
          <colgroup>
            <col className="w-[26%]" />
          </colgroup>
          <thead>
            <tr>
              <th
                scope="col"
                className="pl-1 pr-1 py-3 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-[#054A85] bg-[#F7EFDB]/55 border-y-2 border-double border-[#0066B3]/25"
              >
                배역
              </th>
              {rows.map((row, i) => {
                const day = formatInTimeZone(new Date(row.startAtMs), KST, 'EEE', { locale: ko });
                const tone = teamTone(row.teamName);
                const hasCasting = row.castings.length > 0;
                const colDivider =
                  i === rows.length - 1 ? '' : 'border-r border-[#E8DFCC]/45';
                return (
                  <th
                    key={i}
                    scope="col"
                    role={hasCasting ? 'button' : undefined}
                    tabIndex={hasCasting ? 0 : undefined}
                    aria-label={
                      hasCasting ? `${row.roundNo}회차 ${row.teamName} 캐스팅 보기` : undefined
                    }
                    onClick={() => open(i)}
                    onKeyDown={onRowKey(i)}
                    className={`px-1 py-3 text-center align-middle bg-[#F7EFDB]/55 border-y-2 border-double border-[#0066B3]/25 ${colDivider} ${
                      hasCasting
                        ? 'cursor-pointer hover:bg-[#FAF3E2]/75 focus:bg-[#FAF3E2]/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066B3]/45 focus-visible:ring-inset'
                        : ''
                    }`}
                  >
                    <div className={`flex flex-col items-center gap-0.5 ${tone}`}>
                      <span
                        aria-hidden
                        className="text-[8.5px] font-bold tracking-[0.14em] text-[#0066B3]/55 tabular-nums leading-none"
                      >
                        {romanize(i + 1)}
                      </span>
                      <span className="text-[11px] font-bold tabular-nums tracking-tight leading-tight whitespace-nowrap">
                        {formatInTimeZone(new Date(row.startAtMs), KST, 'M/d', { locale: ko })}
                        <span className="ml-0.5">({day})</span>
                      </span>
                      <span className="text-[10.5px] font-semibold tabular-nums tracking-tight leading-tight whitespace-nowrap">
                        {formatInTimeZone(new Date(row.startAtMs), KST, 'HH:mm', { locale: ko })}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayRoleNames.map((name, ri) => {
              const isLast = ri === displayRoleNames.length - 1;
              const rowBorder = isLast ? '' : 'border-b border-[#E8DFCC]/55';
              const rowBg = ri % 2 === 1 ? 'bg-[#FAF7F2]/45' : '';
              return (
                <tr key={name} className={rowBg}>
                  <th
                    scope="row"
                    className={`pl-1 pr-1 py-3 text-left text-[11px] font-semibold text-[#5C5043] tracking-tight break-keep ${rowBorder}`}
                  >
                    {name}
                  </th>
                  {rows.map((row, i) => {
                    const actor = byRoleByRound[i].get(name);
                    const hasCasting = row.castings.length > 0;
                    const colDivider =
                      i === rows.length - 1 ? '' : 'border-r border-[#E8DFCC]/45';
                    return (
                      <td
                        key={i}
                        onClick={() => open(i)}
                        className={`px-1 py-3 text-center text-[12px] text-gray-900 font-medium tracking-tight break-keep ${rowBorder} ${colDivider} ${
                          hasCasting ? 'cursor-pointer' : ''
                        }`}
                      >
                        {actor ?? (
                          <span aria-hidden className="text-[#0066B3]/25 text-[9px]">
                            ◇
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ───── sm+: 전통 표 (회차=행, 배역=열) ───── */}
      <div className="hidden sm:block overflow-x-auto -mx-1 px-1">
        <table className="w-full text-[13px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#F7EFDB]/55 [&>th]:border-y [&>th]:border-double [&>th]:border-y-2 [&>th]:border-[#0066B3]/25">
              <th
                scope="col"
                className="px-2.5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-[#054A85] whitespace-nowrap"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-1.5 py-3 text-center text-[10px] font-bold tracking-wider text-[#054A85] whitespace-nowrap"
              >
                요일
              </th>
              <th
                scope="col"
                className="px-2.5 py-3 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#054A85] whitespace-nowrap"
              >
                Time
              </th>
              {displayRoleNames.map(name => (
                <th
                  key={name}
                  scope="col"
                  className="px-2 py-3 text-center text-[12px] font-bold tracking-tight text-gray-900 break-keep whitespace-nowrap"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const day = formatInTimeZone(new Date(row.startAtMs), KST, 'EEE', { locale: ko });
              const tone = teamTone(row.teamName);
              const isLast = i === rows.length - 1;
              const cellBorder = isLast ? '' : 'border-b border-[#E8DFCC]/55';
              const hasCasting = row.castings.length > 0;

              return (
                <tr
                  key={i}
                  role={hasCasting ? 'button' : undefined}
                  tabIndex={hasCasting ? 0 : undefined}
                  aria-label={
                    hasCasting ? `${row.roundNo}회차 ${row.teamName} 캐스팅 보기` : undefined
                  }
                  onClick={() => open(i)}
                  onKeyDown={onRowKey(i)}
                  className={`group transition-colors ${
                    hasCasting
                      ? 'cursor-pointer hover:bg-[#FAF3E2]/55 focus:bg-[#FAF3E2]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066B3]/40 focus-visible:ring-inset'
                      : ''
                  }`}
                >
                  <td
                    className={`relative pl-5 pr-2 py-3 whitespace-nowrap font-semibold tabular-nums tracking-tight ${tone} ${cellBorder}`}
                  >
                    <span
                      aria-hidden
                      className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold tracking-[0.1em] text-[#0066B3]/30 tabular-nums"
                    >
                      {romanize(i + 1)}
                    </span>
                    {formatInTimeZone(new Date(row.startAtMs), KST, 'M월 d일', { locale: ko })}
                  </td>
                  <td
                    className={`px-1.5 py-3 text-center font-semibold ${tone} ${cellBorder}`}
                  >
                    {day}
                  </td>
                  <td
                    className={`px-2.5 py-3 text-center font-semibold tabular-nums tracking-tight ${tone} ${cellBorder}`}
                  >
                    {formatInTimeZone(new Date(row.startAtMs), KST, 'HH:mm', { locale: ko })}
                  </td>
                  {displayRoleNames.map((name, ci) => {
                    const actor = byRoleByRound[i].get(name);
                    const isLastCol = ci === displayRoleNames.length - 1;
                    return (
                      <td
                        key={name}
                        className={`relative px-2 py-3 text-center text-gray-800 tracking-tight break-keep whitespace-nowrap ${cellBorder}`}
                      >
                        {actor ?? (
                          <span aria-hidden className="text-[#0066B3]/20 text-[10px]">
                            ◇
                          </span>
                        )}
                        {isLastCol && hasCasting && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-[#0066B3]/0 group-hover:text-[#0066B3]/55 group-focus:text-[#0066B3]/70 transition-colors"
                          >
                            →
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {active && (
        <CastingModal round={active} inviteId={inviteId} onClose={() => setActiveIdx(null)} />
      )}
    </>
  );
}
