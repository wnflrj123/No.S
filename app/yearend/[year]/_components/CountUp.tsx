'use client';

import { useEffect, useState } from 'react';

const DURATION_MS = 1800;

/**
 * 숫자 카운트업 — 페이지가 열리면 0부터 value까지 한 번 세어 올라간다.
 * CSS 카운터 방식은 사파리에서 중간 값이 그려지지 않아 JS(requestAnimationFrame)로 직접 그린다.
 *
 * 서버 HTML에는 최종 숫자가 들어 있지만 처음엔 투명하게 숨겨 두고(yearend-num-pending),
 * 스크립트가 붙는 순간 0부터 보여 준다. 스크립트가 늦거나 없으면 CSS가 2.5초 뒤 최종 숫자를 그냥 보여 준다.
 * 모션 줄이기 설정이면 세지 않고 바로 최종 숫자를 보여 준다.
 */
export default function CountUp({ value, className = '' }: { value: number; className?: string }) {
  const [n, setN] = useState(value);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let start = 0;

    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - p, 4); // 처음엔 빠르게, 끝에선 천천히
      setN(Math.round(value * eased));
      setReady(true);
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(reduce ? () => setReady(true) : tick);
    return () => window.cancelAnimationFrame(raf);
  }, [value]);

  return <span className={`${className} ${ready ? '' : 'yearend-num-pending'}`}>{n.toLocaleString('en-US')}</span>;
}
