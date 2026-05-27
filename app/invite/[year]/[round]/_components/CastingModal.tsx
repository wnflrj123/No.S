'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import type { ResolvedCasting } from './casting-utils';
import CastingPhoto from './CastingPhoto';
import PhotoPlaceholder from './PhotoPlaceholder';

const KST = 'Asia/Seoul';

export interface CastingModalRound {
  roundNo: number;
  teamName: string;
  startAtMs: number;
  castings: ResolvedCasting[];
}

interface Props {
  round: CastingModalRound;
  inviteId: string;
  onClose: () => void;
}

/**
 * 회차별 캐스팅 모달. 공연 시간 리스트 / 캐스팅 스케줄 표 등 여러 곳에서 공용으로 사용.
 * - ESC 닫기 + body 스크롤 잠금
 * - createPortal로 document.body 에 렌더 — 상위에 `transform`을 쓰는 조상이 있어도
 *   `position: fixed` 가 viewport 기준으로 정상 작동하도록 보장
 *   (예: CastingScheduleSection의 `animate-fade-in-up` 카드 안에서 호출되는 경우)
 */
export default function CastingModal({ round, inviteId, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
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
              {formatInTimeZone(new Date(round.startAtMs), KST, 'M월 d일(EEE) HH:mm', {
                locale: ko,
              })}
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
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                        {c.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
