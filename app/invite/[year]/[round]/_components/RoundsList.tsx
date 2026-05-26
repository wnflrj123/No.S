'use client';

import { useEffect, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import type { ResolvedCasting } from './CastingTabs';
import CastingPhoto from './CastingPhoto';
import PhotoPlaceholder from './PhotoPlaceholder';

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

  // 모달 열린 동안 ESC 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (activeIdx === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIdx(null);
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeIdx]);

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

function CastingModal({
  round,
  inviteId,
  onClose,
}: {
  round: ResolvedRound;
  inviteId: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${round.roundNo}회차 캐스팅`}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        <header className="p-5 border-b border-gray-100 flex items-start justify-between gap-4 sticky top-0 bg-white">
          <div className="min-w-0">
            <div className="text-base font-bold text-gray-900">
              {formatInTimeZone(new Date(round.startAtMs), KST, 'M월 d일(EEE) HH:mm', { locale: ko })}
            </div>
            <div className="text-sm text-[#0066B3] font-medium mt-0.5">
              {round.roundNo}회차 · {round.teamName}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-xl leading-none shrink-0"
          >
            ×
          </button>
        </header>

        <div className="p-5 overflow-y-auto">
          {round.castings.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              캐스팅 정보가 준비되지 않았어요.
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {round.castings.map((c, i) => (
                <li
                  key={`${round.roundNo}-${i}`}
                  className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {c.photoFile ? (
                      <CastingPhoto
                        src={`/invites/${inviteId}/cast/${c.photoFile}`}
                        alt={`${c.roleName} - ${c.actorName}`}
                        crop={c.photoCrop}
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    ) : (
                      <PhotoPlaceholder name={c.actorName || c.roleName} size="md" />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold text-gray-900">{c.roleName}</div>
                    {c.actorName && (
                      <div className="text-xs text-[#0066B3] font-medium mt-0.5">{c.actorName}</div>
                    )}
                    {c.description && (
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{c.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
