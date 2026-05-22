'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import SponsorAccountCard from './SponsorAccountCard';
import type { SponsorAccount } from '@/lib/invites/types';

const CONFETTI_COLORS = [
  '#0066B3', '#3a8fd6', '#ffd700', '#ff6b6b', '#ff85a2',
  '#a8e6cf', '#fff', '#ffb347', '#c084fc', '#34d399',
  '#f472b6', '#facc15', '#06b6d4',
];

/**
 * 후원 클릭 시 발사되는 귀여운 폭죽 효과.
 *  1. 중앙·좌·우 가벼운 burst (3번)
 *  2. 꽃다발 emoji confetti 3회
 *  3. 7초간 화면에 폭죽 (간격 적당)
 *  4. 가벼운 진동
 */
function fireConfetti(): () => void {
  const burst = (opts: confetti.Options) =>
    confetti({ colors: CONFETTI_COLORS, ...opts, zIndex: 9999, disableForReducedMotion: false });

  // 1) 중앙·좌·우 3방향 burst (입자 조금 줄임)
  burst({ particleCount: 80, spread: 80, origin: { y: 0.6 }, startVelocity: 50 });
  setTimeout(() => burst({ particleCount: 50, angle: 60, spread: 75, origin: { x: 0, y: 0.7 }, startVelocity: 55 }), 150);
  setTimeout(() => burst({ particleCount: 50, angle: 120, spread: 75, origin: { x: 1, y: 0.7 }, startVelocity: 55 }), 150);

  // 2) 꽃다발·꽃 emoji confetti 3회 — 좌·중·우에서 떨어져 화면 가로지르는 효과
  try {
    const bouquet = confetti.shapeFromText({ text: '💐', scalar: 3 });
    const flower = confetti.shapeFromText({ text: '🌸', scalar: 2.2 });
    const heart = confetti.shapeFromText({ text: '💝', scalar: 2.2 });

    const emojiRain = (delay: number, originX: number, shapes: confetti.Shape[], count: number) => {
      setTimeout(() => {
        confetti({
          shapes,
          scalar: 2.5,
          particleCount: count,
          spread: 110,
          startVelocity: 45,
          gravity: 0.6,
          ticks: 260,
          origin: { x: originX, y: 0.1 },
          zIndex: 9999,
        });
      }, delay);
    };
    emojiRain(200, 0.15, [bouquet, flower], 8);
    emojiRain(1500, 0.85, [bouquet, heart], 8);
    emojiRain(3000, 0.5, [flower, bouquet], 10);
  } catch {
    // shapeFromText 미지원 브라우저
  }

  // 3) 5초간 폭죽 (500ms 간격 — 모바일 fps 부담 감소)
  const duration = 5000;
  const animationEnd = Date.now() + duration;
  const interval = setInterval(() => {
    if (Date.now() > animationEnd) {
      clearInterval(interval);
      return;
    }
    burst({
      startVelocity: 30 + Math.random() * 20,
      spread: 360,
      ticks: 70,
      particleCount: 25 + Math.floor(Math.random() * 20),
      scalar: 0.8 + Math.random() * 0.4,
      origin: {
        x: Math.random(),
        y: Math.random() * 0.7,
      },
    });
  }, 500);

  // 4) 짧은 진동 1회 (지원 기기만)
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([80, 40, 80]);
    }
  } catch {
    // noop
  }

  return () => clearInterval(interval);
}

export interface ThanksContentProps {
  year: number;
  round: number;
  token: string;
  isSponsor: boolean;
  thanksMessage?: string;
  sponsorAccount: SponsorAccount;
  registrant: {
    name: string;
    roundSelections: { roundNo: number; headcount: number }[];
  };
}

export default function ThanksContent(p: ThanksContentProps) {
  const [thanked, setThanked] = useState(p.isSponsor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccount, setShowAccount] = useState(false);

  // thanked 순간 한 번만 발사 (5초 시퀀스). 부담 감소 + 자연스럽게 마무리.
  useEffect(() => {
    if (!thanked) return;
    const stop = fireConfetti();
    return () => stop();
  }, [thanked]);

  const handleSponsor = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invites/${p.year}/${p.round}/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: p.token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? '처리 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }
      setThanked(true);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  if (thanked) {
    return (
      <main className="relative min-h-dvh overflow-hidden text-white px-5 py-20 flex flex-col items-center justify-center thanks-bg">
        {/* 8. 카메라 플래시 — thanked 진입 직후 한 번만 (key로 마운트 제어, 0.7초 후 자동 사라짐) */}
        <div className="thanks-flash" aria-hidden />

        {/* 7. 가장자리 빛나는 vignette — 무대 조명 느낌 */}
        <div className="thanks-vignette" aria-hidden />

        {/* 끝없이 떨어지는 꽃잎 (배경 레이어) */}
        <PetalRain />

        {/* 메시지 — shake는 여기에만 (꽃잎 컨테이너에는 transform 영향 X) */}
        <div className="relative z-10 flex flex-col items-center text-center thanks-shake">
          {/* 10. 헤드라인 둘레를 회전하는 별 (양방향) */}
          <div className="relative">
            <span
              className="thanks-orbit-star cw"
              style={{ ['--orbit-r' as string]: '180px', ['--orbit-dur' as string]: '9s' } as React.CSSProperties}
              aria-hidden
            >
              ⭐
            </span>
            <span
              className="thanks-orbit-star ccw"
              style={{ ['--orbit-r' as string]: '210px', ['--orbit-dur' as string]: '12s', animationDelay: '-3s' } as React.CSSProperties}
              aria-hidden
            >
              ✨
            </span>
            <span
              className="thanks-orbit-star cw"
              style={{ ['--orbit-r' as string]: '160px', ['--orbit-dur' as string]: '14s', animationDelay: '-6s' } as React.CSSProperties}
              aria-hidden
            >
              🌟
            </span>
            <span
              className="thanks-orbit-star ccw"
              style={{ ['--orbit-r' as string]: '230px', ['--orbit-dur' as string]: '11s', animationDelay: '-2s' } as React.CSSProperties}
              aria-hidden
            >
              💫
            </span>
            <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 drop-shadow-2xl tracking-tight thanks-headline">
              정말, 정말, 정말<br className="sm:hidden" /> 고맙습니다!
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-white/95 max-w-md leading-relaxed drop-shadow-lg">
            {/* 12. 이름 글로우 펄스 */}
            <strong className="text-yellow-200 thanks-name-glow inline-block">
              {p.registrant.name}
            </strong>
            님의 응원이<br />
            저희에게 정말 큰 힘이 됩니다.
          </p>
          <p className="text-base sm:text-lg text-white/90 mt-5 max-w-md leading-relaxed drop-shadow">
            공연날, 가장 빛나는 무대로 인사드릴게요!
          </p>
          <div className="mt-12 flex flex-col items-center gap-2">
            <Link
              href={`/invite/${p.year}/${p.round}`}
              className="text-sm underline text-white/85 hover:text-white"
            >
              공연 정보 다시 보기
            </Link>
            <button
              type="button"
              onClick={() => setShowAccount(true)}
              className="text-sm underline text-white/85 hover:text-white"
            >
              후원 계좌 다시 보기
            </button>
          </div>
        </div>

        {/* 후원 계좌 안내 모달 */}
        {showAccount && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-5"
            onClick={() => setShowAccount(false)}
          >
            <div
              className="bg-white text-gray-900 rounded-2xl max-w-sm w-full p-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900">후원 계좌 안내</h4>
                <button
                  type="button"
                  onClick={() => setShowAccount(false)}
                  className="text-gray-400 text-lg leading-none"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              <SponsorAccountCard account={p.sponsorAccount} />
              <p className="text-xs text-gray-500 mt-3 text-center">
                후원해주신 모든 마음에 다시 한 번 감사드립니다 💛
              </p>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-10 pb-20">
      <div className="text-center">
        <div className="text-5xl">💌</div>
        <h1 className="text-2xl font-bold mt-3 text-gray-900">신청, 잘 받았어요! 🎉</h1>
        <p className="text-gray-600 mt-2">
          <strong>{p.registrant.name}</strong>님, 신청해주셔서 정말 감사합니다.
          <br />
          두근두근 기다리고 있을게요!
        </p>
      </div>

      <section className="mt-8 bg-blue-50 rounded-xl p-4">
        <div className="text-sm font-medium text-[#0066B3]">신청 내역</div>
        <ul className="mt-2 text-sm text-gray-800 space-y-1">
          {p.registrant.roundSelections.map(s => (
            <li key={s.roundNo}>
              · {s.roundNo}회차 — {s.headcount}명
            </li>
          ))}
        </ul>
      </section>

      {p.thanksMessage?.trim() && (
        <section className="mt-6 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {p.thanksMessage}
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">후원 안내</h2>
        <p className="text-sm text-gray-600 mt-1">
          응원하는 마음을 담아 아래 계좌로 살포시 보내주실 수도 있답니다.
          <br />
          부담은 NO, 마음만 받습니다 💛
        </p>
        <div className="mt-3">
          <SponsorAccountCard account={p.sponsorAccount} />
        </div>
        <button
          type="button"
          onClick={handleSponsor}
          disabled={loading}
          className="mt-4 w-full py-4 bg-[#0066B3] text-white rounded-xl font-semibold text-base disabled:bg-gray-300"
        >
          {loading ? '처리 중…' : '방금 후원하고 왔어요 💛'}
        </button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </section>

      <Link
        href={`/invite/${p.year}/${p.round}`}
        className="block text-center mt-10 text-sm text-gray-500 underline"
      >
        공연 정보로 돌아가기
      </Link>
    </main>
  );
}

// ─── 시각 효과 컴포넌트 ──────────────────────────────────────

const PETAL_COLORS = ['#ffc1d6', '#ffd6e7', '#ff9bb3', '#ffe9a8', '#fff', '#ffb3c6', '#d8b4fe'];

/**
 * 끝없이 떨어지는 꽃잎 (CSS animation 무한 반복).
 * 24장의 꽃잎이 다양한 left/duration/delay/색상으로 화면을 가득 채운다.
 */
function PetalRain() {
  // fixed로 viewport 기준 + 적당한 개수 (이전보다 줄여 모바일에서도 가볍게)
  const petals = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {petals.map(i => {
        const left = (i * 12.5) % 100;
        const drift = (i % 2 === 0 ? 1 : -1) * (60 + ((i * 17) % 120));
        const dur = 10 + ((i * 3) % 6);
        const delay = (i * 1.6) % 11;
        const color = PETAL_COLORS[i % PETAL_COLORS.length];
        const size = 16 + (i % 4) * 4;
        return (
          <span
            key={i}
            className="petal"
            style={
              {
                left: `${left}%`,
                ['--drift' as string]: `${drift}px`,
                ['--dur' as string]: `${dur}s`,
                ['--delay' as string]: `${delay}s`,
              } as React.CSSProperties
            }
          >
            <PetalSvg size={size} color={color} />
          </span>
        );
      })}
    </div>
  );
}

function PetalSvg({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.4)}
      viewBox="0 0 20 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 0.5 C 15.5 7 18 14 15 22 C 13 26 11 27.5 10 27.5 C 9 27.5 7 26 5 22 C 2 14 4.5 7 10 0.5 Z"
        fill={color}
      />
      <path
        d="M10 4 C 12 11 12 18 10 25"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

