'use client';

import { useMemo, useRef, useState } from 'react';
import type { InviteRegistration } from '@/lib/invites/types';

interface Props {
  registrations: InviteRegistration[];
  year?: number;
  round?: number;
}

export default function AnswersDigest({ registrations, year, round }: Props) {
  // 취소된(superseded) 신청은 항목별 답변 집계에서 제외
  const activeRegs = useMemo(
    () => registrations.filter(r => (r.status ?? 'active') === 'active'),
    [registrations],
  );

  const cheers = useMemo(
    () => activeRegs.filter(r => r.cheerMessage?.trim()).map(r => ({ name: r.name, msg: r.cheerMessage! })),
    [activeRegs],
  );

  const seats = useMemo(
    () => activeRegs.filter(r => r.seatRequests?.trim()).map(r => ({ name: r.name, msg: r.seatRequests! })),
    [activeRegs],
  );

  // 응원하는 배우는 사람이 적은 답변 전체를 하나의 키로 묶어 티켓파워(총 신청 인원수) 합산.
  // 공백/쉼표 등으로 분리하지 않음 — 표기 차이는 별개 키로 카운트.
  const actorRanking = useMemo(() => {
    const counter = new Map<string, number>();
    for (const r of activeRegs) {
      const text = (r.supportingActors ?? '').trim();
      if (!text) continue;
      const headcount = (r.roundSelections ?? []).reduce((s, sel) => s + (sel.headcount ?? 0), 0);
      if (headcount <= 0) continue;
      counter.set(text, (counter.get(text) ?? 0) + headcount);
    }
    return Array.from(counter.entries()).sort((a, b) => b[1] - a[1]);
  }, [activeRegs]);
  const actorTotal = useMemo(
    () => actorRanking.reduce((s, [, c]) => s + c, 0),
    [actorRanking],
  );

  const prefix = year && round ? `${year}-${round}_` : '';

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <DigestCard title={`응원 메시지 (${cheers.length})`} filename={`${prefix}응원메시지`}>
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

      <DigestCard
        title={`응원하는 배우 (${actorTotal})`}
        filename={`${prefix}응원하는배우`}
      >
        {actorRanking.length === 0 ? (
          <p className="text-sm text-gray-500">아직 언급된 배우가 없습니다.</p>
        ) : (
          <ul className="space-y-1">
            {actorRanking.map(([name, cnt]) => (
              <li key={name} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-gray-800 whitespace-pre-line break-words">{name}</span>
                <span className="text-[#0066B3] font-semibold shrink-0 tabular-nums">{cnt}</span>
              </li>
            ))}
          </ul>
        )}
      </DigestCard>

      <DigestCard
        title={`좌석 요청사항 (${seats.length})`}
        filename={`${prefix}좌석요청사항`}
        className="md:col-span-2"
      >
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
  filename,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  filename?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleExport = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.dataset.exportHide === 'true') return false;
          return true;
        },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${filename ?? title}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '이미지 저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={cardRef} className={`p-4 bg-white border border-gray-200 rounded-xl ${className}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {filename && (
          <button
            type="button"
            onClick={handleExport}
            disabled={busy}
            data-export-hide="true"
            className="text-[11px] text-gray-500 hover:text-[#0066B3] underline shrink-0 disabled:opacity-50"
          >
            {busy ? '저장중…' : '🖼️ 이미지 저장'}
          </button>
        )}
      </div>
      {err && (
        <div
          data-export-hide="true"
          className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700"
        >
          {err}
        </div>
      )}
      {children}
    </div>
  );
}
