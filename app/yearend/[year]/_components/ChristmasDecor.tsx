import type { CSSProperties } from 'react';

/**
 * 히어로용 크리스마스 장식 — 모두 장식용(aria-hidden)이고 CSS 도형만으로 그린다.
 * 위치·크기는 className으로 받는다.
 */

const GOLD = '#F5CD47';
const RED = '#E2483D';
const GREEN = '#22A06B';

/** 트리 볼 오너먼트 — 위로 끈이 올라가고, 금색 고리 뚜껑이 달린 공 */
export function Bauble({ className, color }: { className: string; color: string }) {
  return (
    <span className={`absolute ${className}`}>
      <span className="absolute bottom-[94%] left-1/2 h-[600px] w-px -translate-x-1/2 bg-white/50" />
      <span className="absolute -top-[7%] left-1/2 h-[12%] w-[24%] -translate-x-1/2 rounded-[3px] bg-[#C9A227]" />
      <span
        className="block size-full rounded-full"
        style={{ background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.55) 0 8%, transparent 9%), ${color}` }}
      />
    </span>
  );
}

/** 선물 상자 — 리본 십자 + 작은 리본 매듭 */
export function GiftBox({ className }: { className: string }) {
  return (
    <span className={`absolute ${className}`}>
      <span className="absolute inset-0 rounded-[18%]" style={{ background: GREEN }} />
      <span className="absolute inset-y-0 left-1/2 w-[18%] -translate-x-1/2" style={{ background: GOLD }} />
      <span className="absolute inset-x-0 top-1/2 h-[18%] -translate-y-1/2" style={{ background: GOLD }} />
      <span className="absolute -top-[22%] left-[22%] h-[28%] w-[30%] -rotate-[25deg] rounded-full border-[3px]" style={{ borderColor: GOLD }} />
      <span className="absolute -top-[22%] right-[22%] h-[28%] w-[30%] rotate-[25deg] rounded-full border-[3px]" style={{ borderColor: GOLD }} />
    </span>
  );
}

/** 캔디케인 막대 — 빨강·흰 사선 줄무늬 */
export function CandyCane({ className }: { className: string }) {
  return (
    <span
      className={`absolute rounded-full ${className}`}
      style={{ background: `repeating-linear-gradient(45deg, ${RED} 0 10px, #FFFFFF 10px 20px)` }}
    />
  );
}

/** 금색 별 */
export function Star({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`absolute drop-shadow-[0_0_12px_rgba(245,205,71,0.7)] ${className}`}>
      <path
        d="M12 1.8l2.9 6.5 7.1.7-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9l7.1-.7z"
        fill={GOLD}
      />
    </svg>
  );
}

// 전구 색 — 금·빨강·초록·하늘·분홍을 돌려 쓴다
const BULB_COLORS = [GOLD, RED, '#4BCE97', '#6CC3E0', '#E774BB'];
const BULB_COUNT = 18;

/**
 * 전구 가랜드 — 히어로 맨 위에 늘어진 전선과 반짝이는 전구.
 * 전선은 25% 간격으로 늘어진 곡선이고, 전구는 그 곡선 위에 놓인다.
 */
export function Garland({ wire = '#0B3B2C' }: { wire?: string }) {
  const bulbs = Array.from({ length: BULB_COUNT }, (_, i) => {
    const x = ((i + 0.5) / BULB_COUNT) * 100;
    const sag = Math.sin(((x % 25) / 25) * Math.PI); // 0(매듭) ~ 1(가장 늘어진 곳)
    return { x, top: 6 + sag * 26, color: BULB_COLORS[i % BULB_COLORS.length], delay: `${(i % 6) * 0.4}s` };
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-14">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path
          d="M0,6 Q12.5,46 25,6 Q37.5,46 50,6 Q62.5,46 75,6 Q87.5,46 100,6"
          fill="none"
          stroke={wire}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {bulbs.map((b, i) => (
        <span
          key={i}
          className="yearend-bulb absolute -translate-x-1/2"
          style={{ left: `${b.x}%`, top: b.top, animationDelay: b.delay } as CSSProperties}
        >
          <span className="mx-auto block h-1.5 w-2 rounded-t-[2px]" style={{ background: wire }} />
          <span
            className="block h-4 w-2.5 rounded-b-full rounded-t-[40%]"
            style={{ background: b.color, boxShadow: `0 0 10px 2px ${b.color}` }}
          />
        </span>
      ))}
    </div>
  );
}

/** 히어로 아래 눈 쌓인 언덕 — 흰 본문으로 자연스럽게 이어진다 */
export function Snowdrift() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full md:h-16"
    >
      <path
        d="M0,80 L0,42 C120,14 240,12 360,36 C480,60 600,18 720,30 C840,42 960,6 1080,28 C1200,50 1320,22 1440,36 L1440,80 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
