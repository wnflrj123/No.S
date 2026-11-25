'use client';

import { useEffect, useState } from 'react';
import { BRAND, SHADOW_OVERLAY } from './theme';

/** 맨 위로 가는 플로팅 버튼 — 히어로를 지나 내려가면 오른쪽 아래에 나타난다. */
export default function ScrollTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    const id = window.requestAnimationFrame(onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(id);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="맨 위로"
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={`fixed bottom-5 right-5 z-30 flex size-12 items-center justify-center rounded-full text-white transition-all duration-300 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#388BFF] md:bottom-8 md:right-8 ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      style={{ background: BRAND, boxShadow: SHADOW_OVERLAY }}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
