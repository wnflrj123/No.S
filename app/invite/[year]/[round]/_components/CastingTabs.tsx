'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';

const KST = 'Asia/Seoul';

export interface ResolvedCasting {
  roleName: string;
  description: string;
  actorName: string;
  photoFile?: string;
}

export interface RoundCasting {
  roundNo: number;
  teamName: string;
  startAtMs: number; // 회차 시작 시각 (밀리초)
  castings: ResolvedCasting[];
}

interface Props {
  data: RoundCasting[];
  inviteId: string;
}

export default function CastingTabs({ data, inviteId }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = data[activeIdx] ?? data[0];

  return (
    <div>
      {data.length > 1 && (
        <nav
          aria-label="회차 선택"
          className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1"
        >
          {data.map((d, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={d.roundNo}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#0066B3] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
                aria-pressed={isActive}
              >
                {d.roundNo}회차 · {d.teamName}
              </button>
            );
          })}
        </nav>
      )}

      {/* 활성 회차 정보 — 일시를 메인으로, 회차/팀명은 보조 */}
      <div className="mb-4">
        <div className="text-base sm:text-lg font-bold text-gray-900">
          {formatInTimeZone(new Date(active.startAtMs), KST, 'M월 d일(EEE) HH:mm', { locale: ko })}
        </div>
        <div className="text-xs sm:text-sm font-medium text-[#0066B3] mt-0.5">
          {active.roundNo}회차 · {active.teamName}
        </div>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {active.castings.map((c, i) => (
          <li
            key={`${active.roundNo}-${i}`}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
          >
            {c.photoFile ? (
              <div className="relative aspect-[3/4] bg-gray-100">
                <Image
                  src={`/invites/${inviteId}/cast/${c.photoFile}`}
                  alt={`${c.roleName} - ${c.actorName}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                사진 준비 중
              </div>
            )}
            <div className="p-3">
              <div className="text-sm font-semibold text-gray-900">{c.roleName}</div>
              {c.actorName && (
                <div className="text-xs text-[#0066B3] font-medium mt-0.5">{c.actorName}</div>
              )}
              {c.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-3 whitespace-pre-line">
                  {c.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
