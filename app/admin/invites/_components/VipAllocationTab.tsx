'use client';

import { useMemo, useRef, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import type { Invite, InviteRegistration, InviteSupporter } from '@/lib/invites/types';

const KST = 'Asia/Seoul';

interface Props {
  invite: Invite;
  registrations: InviteRegistration[];
  supporters?: InviteSupporter[];
}

interface VipEntry {
  registrationId: string;
  name: string;
  phone: string;
  headcount: number;
  companions?: string;
  seatRequests?: string;
  /** 관리자가 입력한 후원 메모(꽃다발·케이크 등 현물 후원 내역). */
  memo?: string;
  createdAtMs: number;
}

interface RoundBucket {
  roundNo: number;
  teamName: string;
  startAtMs: number;
  entries: VipEntry[];
  totalSeats: number;
}

/**
 * 회차별로 후원자(=isSponsor=true active 신청자)를 분류해 VIP 좌석 배치용으로 보여준다.
 * 각 후원자가 그 회차에 신청한 인원수(=배정해야 할 VIP석 수)를 노출.
 *
 * 현장 후원자(inviteSupporters)는 회차 정보가 없으므로 하단에 별도 메모로만 표시한다.
 */
export default function VipAllocationTab({ invite, registrations, supporters = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  // 'all' → 회차 전체 펼침. 숫자 → 해당 회차만 큰 상세 뷰.
  const [selectedRoundNo, setSelectedRoundNo] = useState<number | 'all'>('all');

  const buckets = useMemo<RoundBucket[]>(() => {
    const activeSponsors = registrations.filter(
      r => r.isSponsor && (r.status ?? 'active') === 'active',
    );

    const byRound = new Map<number, VipEntry[]>();
    for (const r of activeSponsors) {
      for (const sel of r.roundSelections) {
        if ((sel.headcount ?? 0) <= 0) continue;
        const list = byRound.get(sel.roundNo) ?? [];
        list.push({
          registrationId: r.id,
          name: r.name,
          phone: r.phone,
          headcount: sel.headcount,
          companions: r.companions?.trim() || undefined,
          seatRequests: r.seatRequests?.trim() || undefined,
          memo: r.sponsorMemo?.trim() || undefined,
          createdAtMs: r.createdAt?.toMillis?.() ?? 0,
        });
        byRound.set(sel.roundNo, list);
      }
    }

    return [...invite.rounds]
      .sort((a, b) => a.roundNo - b.roundNo)
      .map(round => {
        const entries = (byRound.get(round.roundNo) ?? []).sort((a, b) => {
          if (b.headcount !== a.headcount) return b.headcount - a.headcount;
          return a.createdAtMs - b.createdAtMs;
        });
        return {
          roundNo: round.roundNo,
          teamName: round.teamName,
          startAtMs: round.startAt.toDate().getTime(),
          entries,
          totalSeats: entries.reduce((s, e) => s + e.headcount, 0),
        };
      });
  }, [registrations, invite.rounds]);

  const totalVipSeats = buckets.reduce((s, b) => s + b.totalSeats, 0);
  const totalVipPeople = useMemo(
    () =>
      registrations.filter(r => r.isSponsor && (r.status ?? 'active') === 'active').length,
    [registrations],
  );

  const visibleBuckets =
    selectedRoundNo === 'all'
      ? buckets
      : buckets.filter(b => b.roundNo === selectedRoundNo);

  /**
   * 현재 표시 중인(전체 또는 선택 회차) 명단을 텍스트 라인으로 빌드.
   * 'all'일 때만 헤더에 전체 합계 + 현장 후원자 메모를 포함.
   */
  const buildCopyText = (forAll: boolean) => {
    const lines: string[] = [];
    if (forAll) {
      lines.push(`[${invite.year}년 ${invite.round}회 ${invite.title}] VIP 좌석 배치`);
      lines.push(`총 VIP ${totalVipSeats}석 / ${totalVipPeople}건 신청`);
    } else {
      lines.push(`[${invite.year}년 ${invite.round}회 ${invite.title}] VIP 좌석 배치 — 회차별`);
    }
    lines.push('');
    for (const b of visibleBuckets) {
      const date = formatInTimeZone(b.startAtMs, KST, 'M월 d일(EEE) HH:mm', { locale: ko });
      lines.push(`■ ${b.roundNo}회차 · ${b.teamName} · ${date} — VIP ${b.totalSeats}석`);
      if (b.entries.length === 0) {
        lines.push('  (해당 회차 후원자 없음)');
      } else {
        for (const e of b.entries) {
          let row = `  - ${e.name} (${e.headcount}석)`;
          if (e.companions) row += ` · 동반: ${e.companions}`;
          if (e.seatRequests) row += ` · 요청: ${e.seatRequests}`;
          if (e.memo) row += ` · 메모: ${e.memo}`;
          lines.push(row);
        }
      }
      lines.push('');
    }
    if (forAll && supporters.length > 0) {
      lines.push(`* 현장 후원자 ${supporters.length}명은 회차 정보 없음 (당일 도착 순 배치)`);
    }
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(selectedRoundNo === 'all'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div ref={containerRef}>
      {/* 상단 요약 + 복사 */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="text-xs text-gray-500 leading-relaxed">
          후원자 + 동반인 명단입니다. 인원 많은 그룹 우선 정렬.
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-[#0066B3]/5 text-[#0066B3] text-xs font-bold tabular-nums">
            총 VIP {totalVipSeats}석 · {totalVipPeople}건
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800"
            title={selectedRoundNo === 'all' ? '전체 명단 복사' : '선택한 회차만 복사'}
          >
            {copied
              ? '복사됨 ✓'
              : selectedRoundNo === 'all'
                ? '전체 복사'
                : `${selectedRoundNo}회차 복사`}
          </button>
        </div>
      </div>

      {/* 회차 선택 pills */}
      {buckets.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <RoundPill
            active={selectedRoundNo === 'all'}
            onClick={() => setSelectedRoundNo('all')}
          >
            <span>전체</span>
            <span className="opacity-70 tabular-nums">{totalVipSeats}석</span>
          </RoundPill>
          {buckets.map(b => (
            <RoundPill
              key={b.roundNo}
              active={selectedRoundNo === b.roundNo}
              onClick={() => setSelectedRoundNo(b.roundNo)}
            >
              <span className="font-bold">{b.roundNo}회차</span>
              <span className="opacity-70">{b.teamName}</span>
              <span className="ml-0.5 px-1.5 py-0.5 rounded text-[10px] bg-white/30 tabular-nums">
                {b.totalSeats}석
              </span>
            </RoundPill>
          ))}
        </div>
      )}

      {/* 본문 */}
      {totalVipPeople === 0 ? (
        <p className="text-center text-gray-500 py-16 bg-gray-50 rounded-xl">
          아직 후원 체크된 신청자가 없습니다.
        </p>
      ) : (
        <div className="space-y-4">
          {visibleBuckets.map(b => (
            <RoundBlock key={b.roundNo} bucket={b} expanded={selectedRoundNo !== 'all'} />
          ))}
        </div>
      )}

      {supporters.length > 0 && selectedRoundNo === 'all' && (
        <p className="mt-4 px-4 py-3 rounded-xl bg-pink-50 border border-pink-200 text-xs text-pink-800 leading-relaxed">
          💡 현장 후원자 <strong>{supporters.length}명</strong>은 회차 정보가 없어요.
          당일 도착 순으로 배치해주세요.
        </p>
      )}
    </div>
  );
}

function RoundPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
        active
          ? 'bg-[#0066B3] text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function RoundBlock({ bucket, expanded }: { bucket: RoundBucket; expanded: boolean }) {
  const date = formatInTimeZone(bucket.startAtMs, KST, 'M월 d일(EEE) HH:mm', { locale: ko });

  return (
    <section className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <header
        className={`${
          expanded ? 'px-5 py-4' : 'px-4 py-3'
        } bg-gradient-to-r from-[#0066B3]/8 to-transparent border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap`}
      >
        <div className="min-w-0">
          <div className={`font-bold text-gray-900 ${expanded ? 'text-base' : 'text-sm'}`}>
            {bucket.roundNo}회차 · {bucket.teamName}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{date}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">VIP 좌석</div>
          <div
            className={`font-bold text-[#0066B3] tabular-nums leading-tight ${
              expanded ? 'text-2xl' : 'text-lg'
            }`}
          >
            {bucket.totalSeats}
            <span className="text-xs font-medium text-gray-500 ml-0.5">석</span>
          </div>
        </div>
      </header>

      {bucket.entries.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-400 text-center">
          이 회차에 후원자가 없어요.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {bucket.entries.map(e => (
            <li
              key={`${e.registrationId}-${bucket.roundNo}`}
              className={expanded ? 'px-5 py-3.5' : 'px-4 py-3'}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{e.name}</span>
                    <span className="text-[11px] text-gray-400">{e.phone}</span>
                  </div>
                  {e.companions && (
                    <div className="mt-1 text-xs text-gray-600">
                      <span className="text-gray-400 mr-1">동반</span>
                      {e.companions}
                    </div>
                  )}
                  {e.memo && (
                    <div className="mt-1 text-xs text-gray-600">
                      <span className="text-gray-400 mr-1">메모</span>
                      {e.memo}
                    </div>
                  )}
                  {e.seatRequests && (
                    <div className="mt-1.5 inline-block text-xs px-2 py-1 rounded-md bg-amber-50 text-amber-800 ring-1 ring-amber-200/60">
                      <span className="font-semibold mr-1">좌석 요청</span>
                      {e.seatRequests}
                    </div>
                  )}
                </div>
                <div className="shrink-0 px-2.5 py-1 rounded-md bg-[#0066B3] text-white text-xs font-bold tabular-nums">
                  {e.headcount}석
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
