import type { CSSProperties } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import type { YearEndConcert } from '@/lib/yearend/types';
import Lozenge from './Lozenge';
import Phrases from './Phrases';
import { Bauble, CandyCane, Garland, GiftBox, Snowdrift, Star } from './ChristmasDecor';
import { HeroApplyButton, hasApply } from './ApplyButton';
import CountUp from './CountUp';
import { BRAND, BRAND_TEXT, HEADING, SHADOW_OVERLAY, TEXT_SUBTLEST } from './theme';

const KST = 'Asia/Seoul';

// 히어로 눈송이 — 서버에서 매번 같은 값이 나오도록 인덱스로 위치·속도를 정한다
const SNOW = Array.from({ length: 40 }, (_, i) => ({
  x: `${(i * 37 + 11) % 100}%`,
  s: `${3 + (i % 5)}px`,
  d: `${10 + (i % 7) * 1.5}s`,
  delay: `-${(i * 1.7) % 14}s`,
  drift: `${(i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 6)}px`,
}));

/**
 * 히어로 — 브랜드 블루 면 위에 크리스마스 장식(오너먼트·선물 상자·캔디케인·별·전구 가랜드)을 단
 * Atlassian 마케팅 스타일. 숫자 525,600은 로드 때 한 번 0부터 세어 올라가고, 눈이 내리고 전구가 반짝인다
 * (모션 줄이기 설정이면 모두 멈춤). 아래쪽은 눈 쌓인 언덕으로 본문과 이어진다.
 */
export default function Hero({ concert }: { concert: YearEndConcert }) {
  const numberText = concert.heroNumber.toLocaleString('ko-KR');

  const start = concert.startAt ? new Date(concert.startAt) : null;
  const dayLabel = start ? formatInTimeZone(start, KST, 'M월 d일 (EEE)', { locale: ko }) : null;
  const timeLabel = start ? formatInTimeZone(start, KST, 'a h시 mm분', { locale: ko }).replace(' 00분', '') : null;

  return (
    <section className="relative overflow-hidden text-white" style={{ background: BRAND }}>
      {/* 크리스마스 장식 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* 모바일: 화면 안쪽 모서리에 작게 / 데스크톱: 가장자리에 크게 걸친다 */}
        <Bauble color="#F5CD47" className="top-[4.25rem] right-3 size-14 md:top-14 md:-right-10 md:size-72" />
        <Bauble color="#E2483D" className="top-[5.5rem] left-4 size-11 md:top-56 md:-left-12 md:size-56" />
        <GiftBox className="bottom-9 right-5 size-12 rotate-12 md:bottom-32 md:right-[5%] md:size-24" />
        <CandyCane className="bottom-12 left-5 h-5 w-20 -rotate-12 md:bottom-20 md:left-[8%] md:h-8 md:w-36" />
        <Star className="top-[10.5rem] right-7 size-6 md:top-[40%] md:right-[14%] md:size-14" />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,102,228,0)_0%,rgba(9,50,140,0.35)_100%)]" />
      </div>
      <Garland />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {SNOW.map((f, i) => (
          <span
            key={i}
            className="yearend-snow"
            style={{ '--x': f.x, '--s': f.s, '--d': f.d, '--delay': f.delay, '--drift': f.drift, '--fall': '1100px' } as CSSProperties}
          />
        ))}
      </div>

      <div className="relative max-w-3xl mx-auto px-5 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
        <Lozenge bg="#FFFFFF" fg={BRAND_TEXT} className="!text-sm !px-3 !py-1 !rounded-full">
          {concert.overline}
        </Lozenge>

        <h1 className="mt-10 md:mt-14">
          <span className="sr-only">
            {concert.heroLead} {numberText}
            {concert.heroUnit}
          </span>
          <span aria-hidden className={`${HEADING} block text-2xl md:text-4xl`}>
            {concert.heroLead}
          </span>
          <span aria-hidden className="mt-2 inline-flex items-baseline gap-1 md:gap-2">
            <CountUp
              value={concert.heroNumber}
              className="font-black leading-none tracking-[-0.045em] tabular-nums text-[clamp(3.4rem,17vw,10.5rem)] [text-shadow:0_6px_0_rgba(9,30,66,0.18)]"
            />
            <span className="text-4xl md:text-7xl font-black tracking-[-0.04em] text-[#F5CD47]">{concert.heroUnit}</span>
          </span>
        </h1>

        <p className="mt-8 md:mt-10 text-lg md:text-2xl font-semibold leading-snug whitespace-pre-line break-keep">
          <Phrases text={concert.tagline} />
        </p>

        {/* 일시·장소 카드 */}
        <div className="mt-12 mx-auto max-w-xl rounded-xl bg-white text-left text-[#172B4D]" style={{ boxShadow: SHADOW_OVERLAY }}>
          <dl className="grid grid-cols-2 divide-x divide-dashed divide-[#091E42]/15">
            <div className="p-5 md:p-6">
              <dt>
                <Lozenge bg="#E9F2FF" fg={BRAND_TEXT}>
                  언제
                </Lozenge>
              </dt>
              <dd className="mt-2.5">
                {dayLabel ? (
                  <>
                    <span className={`${HEADING} block text-xl md:text-2xl`}>{dayLabel}</span>
                    <span className="block mt-1 text-sm md:text-base" style={{ color: TEXT_SUBTLEST }}>
                      {timeLabel} 시작!
                    </span>
                  </>
                ) : (
                  <span className="text-sm" style={{ color: TEXT_SUBTLEST }}>
                    곧 알려 줄게요
                  </span>
                )}
              </dd>
            </div>
            <div className="p-5 md:p-6">
              <dt>
                <Lozenge bg="#FFECF8" fg="#943D73">
                  어디서
                </Lozenge>
              </dt>
              <dd className="mt-2.5">
                {concert.venue ? (
                  <a href="#visit" className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#388BFF]">
                    <span className={`${HEADING} block text-xl md:text-2xl break-keep group-hover:underline underline-offset-4`}>
                      {concert.venue.name}
                    </span>
                    <span className="block mt-1 text-sm" style={{ color: TEXT_SUBTLEST }}>
                      오시는 길 보기
                    </span>
                  </a>
                ) : (
                  <span className="text-sm" style={{ color: TEXT_SUBTLEST }}>
                    곧 알려 줄게요
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* 3부 바로가기 카드 */}
        <nav aria-label="공연 구성" className="mt-6 mx-auto max-w-xl grid grid-cols-3 gap-2 md:gap-3 text-left">
          {concert.parts.map(part => (
            <a
              key={part.no}
              href={`#part-${part.no}`}
              className="rounded-lg bg-white p-3 md:p-4 text-[#172B4D] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ boxShadow: SHADOW_OVERLAY }}
            >
              <span
                aria-hidden
                className="flex size-9 md:size-10 items-center justify-center rounded-[25%] text-lg md:text-xl"
                style={{ background: part.tint }}
              >
                {part.icon}
              </span>
              <span className="mt-2.5 block text-xs font-bold" style={{ color: part.accent }}>
                {part.no}부
              </span>
              <span className="mt-0.5 block text-sm md:text-base font-bold leading-snug break-keep">{part.title}</span>
            </a>
          ))}
        </nav>

        {hasApply(concert.apply) && <HeroApplyButton url={concert.apply.url} note={concert.apply.note} />}
      </div>
      <Snowdrift />
    </section>
  );
}
