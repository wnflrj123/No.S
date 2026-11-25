import type { CSSProperties } from 'react';
import { BRAND } from './theme';
import { Bauble, Garland, GiftBox, Star } from './ChristmasDecor';

/** 신청 링크가 실제로 들어 있을 때만 버튼을 보여 준다. */
export function hasApply(apply?: { url: string }): apply is { url: string } {
  return Boolean(apply?.url?.trim());
}

const linkProps = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** 히어로용 큰 버튼 — 파란 배경 위 금색. 1·2·3부 바로가기 카드 아래에 놓인다 */
export function HeroApplyButton({ url, note }: { url: string; note?: string }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-2">
      <a
        href={url}
        {...linkProps}
        className="inline-flex h-14 items-center gap-2 rounded-full bg-[#F5CD47] px-9 text-lg font-bold text-[#172B4D] shadow-[0_8px_0_rgba(9,30,66,0.25)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        관람 신청하기 🎟️
      </a>
      {note?.trim() && <p className="text-sm font-medium text-white/85">{note}</p>}
    </div>
  );
}

/** 상단 고정 메뉴 오른쪽 작은 버튼 */
export function NavApplyButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      {...linkProps}
      className="ml-auto inline-flex h-8 shrink-0 items-center rounded-md px-3 text-sm font-semibold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#388BFF]"
      style={{ background: BRAND }}
    >
      함께하기
    </a>
  );
}

// 카드 안 눈송이 — 히어로와 같은 방식, 개수만 적게
const CARD_SNOW = Array.from({ length: 14 }, (_, i) => ({
  x: `${(i * 41 + 7) % 100}%`,
  s: `${3 + (i % 4)}px`,
  d: `${8 + (i % 5) * 1.5}s`,
  delay: `-${(i * 1.3) % 10}s`,
  drift: `${(i % 2 === 0 ? 1 : -1) * (8 + (i % 4) * 5)}px`,
}));

/** 페이지 맨 아래 신청 카드 — 히어로처럼 파란 밤하늘 + 전구 + 오너먼트 + 눈 */
export function ApplyCard({ url, note }: { url: string; note?: string }) {
  return (
    <div
      className="yearend-reveal relative mt-20 overflow-hidden rounded-2xl px-6 pt-24 pb-14 text-center text-white md:px-10 md:pt-28 md:pb-16"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 100%, rgba(245,205,71,0.25), transparent 70%), linear-gradient(160deg, ${BRAND} 0%, #0B4FB3 100%)`,
        boxShadow: '0 24px 48px -20px rgba(9,30,66,0.55)',
      }}
    >
      {/* 장식 */}
      <Garland />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Bauble color="#E2483D" className="top-24 -left-8 size-20 md:top-20 md:-left-6 md:size-28" />
        <Bauble color="#F5CD47" className="top-28 -right-6 size-16 md:top-24 md:-right-4 md:size-24" />
        <GiftBox className="bottom-6 left-[6%] size-12 md:size-16 -rotate-6" />
        <Star className="bottom-10 right-[9%] size-8 md:size-10" />
        {CARD_SNOW.map((f, i) => (
          <span
            key={i}
            className="yearend-snow"
            style={{ '--x': f.x, '--s': f.s, '--d': f.d, '--delay': f.delay, '--drift': f.drift, '--fall': '520px' } as CSSProperties}
          />
        ))}
      </div>

      <div className="relative">
        <p className="text-sm font-semibold text-[#F5CD47]">✦ 올해의 마지막 파티 ✦</p>
        <p className="mt-3 text-3xl md:text-4xl font-black tracking-[-0.03em] break-keep">함께해 주실 거죠? 🎄</p>
        <p className="mt-3 text-base md:text-lg text-white/85 break-keep">
          No.S의 2026 마지막 무대,
          <br />
          당신이 함께해야 완성돼요 💖
        </p>
        <a
          href={url}
          {...linkProps}
          className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-[#F5CD47] px-9 text-lg font-bold text-[#172B4D] shadow-[0_8px_0_rgba(9,30,66,0.3)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          관람 신청하기 🎟️
        </a>
        {note?.trim() && <p className="mt-4 text-sm font-medium text-white/80">{note}</p>}
      </div>
    </div>
  );
}
