import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import type { Invite } from '@/lib/invites/types';
import PosterThumb from './PosterThumb';

const KST = 'Asia/Seoul';

export default function Hero({ invite }: { invite: Invite }) {
  // 회차 메타 요약 — 첫 회차 ~ 마지막 회차로 일자 범위 표시
  const sortedRounds = [...invite.rounds].sort(
    (a, b) => a.startAt.toDate().getTime() - b.startAt.toDate().getTime(),
  );
  const first = sortedRounds[0];
  const last = sortedRounds[sortedRounds.length - 1];

  let dateLabel = '';
  if (first && last) {
    if (sortedRounds.length === 1) {
      dateLabel = formatInTimeZone(first.startAt.toDate(), KST, 'M월 d일(EEE) HH:mm', { locale: ko });
    } else {
      const firstStr = formatInTimeZone(first.startAt.toDate(), KST, 'M월 d일(EEE)', { locale: ko });
      const lastStr = formatInTimeZone(last.startAt.toDate(), KST, 'M월 d일(EEE)', { locale: ko });
      dateLabel = firstStr === lastStr
        ? `${firstStr} · ${sortedRounds.length}회차`
        : `${firstStr} ~ ${lastStr} · 총 ${sortedRounds.length}회차`;
    }
  }

  return (
    <section className="px-5 md:px-8 pt-6 md:pt-14 pb-4 md:pb-8">
      <div className="max-w-3xl mx-auto flex items-start gap-3 md:gap-8">
        {/* 포스터 — 클릭하면 모달로 크게 표시 */}
        <div className="w-24 md:w-56 shrink-0">
          <PosterThumb
            src={invite.posterImageUrl}
            alt={invite.title}
            sizes="(min-width: 768px) 224px, 96px"
            priority
          />
        </div>

        {/* 정보 영역 — 항상 좌측 정렬 */}
        <div className="flex-1 min-w-0">
          {invite.overline?.trim() && (
            <div className="text-[11px] md:text-sm font-semibold text-[#0066B3] mb-1 md:mb-2 leading-tight">
              {invite.overline}
            </div>
          )}
          <h1 className="text-lg md:text-3xl lg:text-4xl font-bold text-gray-900 leading-snug md:leading-tight tracking-tight">
            {invite.title}
          </h1>
          {invite.subtitle && (
            <p className="text-xs md:text-base text-gray-600 mt-1.5 md:mt-2 leading-relaxed whitespace-pre-line line-clamp-2 md:line-clamp-none">
              {invite.subtitle}
            </p>
          )}

          {(dateLabel || invite.venue?.name) && (
            <dl className="mt-2.5 md:mt-5 flex flex-col gap-1 md:gap-1.5 text-xs md:text-sm text-gray-700">
              {dateLabel && (
                <div className="flex items-start gap-1.5 md:gap-2">
                  <span className="text-gray-400 shrink-0 leading-4 md:leading-5">📅</span>
                  <span className="leading-4 md:leading-5">{dateLabel}</span>
                </div>
              )}
              {invite.venue?.name && (
                <div className="flex items-start gap-1.5 md:gap-2">
                  <span className="text-gray-400 shrink-0 leading-4 md:leading-5">📍</span>
                  <span className="leading-4 md:leading-5">{invite.venue.name}</span>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
