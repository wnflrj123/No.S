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
 * 후원 클릭 시 발사되는 야단법석 효과.
 *  1. 화면 양옆에서 비스듬히 큰 burst (4번 빵빵빵빵)
 *  2. 꽃다발·꽃·하트·별 emoji confetti가 사방에서 떨어짐
 *  3. 12초간 화면 전 영역 폭죽 (간격 짧게, 입자 많이)
 *  4. 화면 진동 (vibrate API, 지원 시)
 */
function fireConfetti(): () => void {
  const burst = (opts: confetti.Options) =>
    confetti({ colors: CONFETTI_COLORS, ...opts, zIndex: 9999, disableForReducedMotion: false });

  // 1) 양옆 + 중앙 + 위쪽 4단계 큰 burst
  burst({ particleCount: 220, spread: 90, origin: { y: 0.55 }, startVelocity: 65 });
  setTimeout(() => burst({ particleCount: 160, angle: 60, spread: 100, origin: { x: 0, y: 0.7 }, startVelocity: 70 }), 100);
  setTimeout(() => burst({ particleCount: 160, angle: 120, spread: 100, origin: { x: 1, y: 0.7 }, startVelocity: 70 }), 100);
  setTimeout(() => burst({ particleCount: 200, spread: 360, startVelocity: 60, origin: { y: 0.35 }, scalar: 1.2 }), 350);
  setTimeout(() => burst({ particleCount: 120, angle: 90, spread: 60, origin: { x: 0.5, y: 1 }, startVelocity: 90 }), 600);

  // 2) 꽃다발·꽃·하트·별 emoji confetti (여러 차례)
  try {
    const bouquet = confetti.shapeFromText({ text: '💐', scalar: 3.5 });
    const flower = confetti.shapeFromText({ text: '🌸', scalar: 2.5 });
    const heart = confetti.shapeFromText({ text: '💝', scalar: 2.5 });
    const star = confetti.shapeFromText({ text: '⭐', scalar: 2.5 });
    const rose = confetti.shapeFromText({ text: '🌹', scalar: 2.5 });

    const emojiRain = (delay: number, shapes: confetti.Shape[], count: number) => {
      setTimeout(() => {
        confetti({
          shapes,
          scalar: 3,
          particleCount: count,
          spread: 140,
          startVelocity: 40,
          gravity: 0.7,
          ticks: 300,
          origin: { x: Math.random(), y: 0.1 + Math.random() * 0.2 },
          zIndex: 9999,
        });
      }, delay);
    };
    emojiRain(200, [bouquet, flower], 30);
    emojiRain(700, [heart, star], 25);
    emojiRain(1300, [bouquet, rose], 25);
    emojiRain(2200, [flower, heart, star], 30);
    emojiRain(3500, [bouquet], 20);
    emojiRain(5000, [rose, flower], 25);
    emojiRain(7000, [bouquet, heart, star], 30);
  } catch {
    // shapeFromText 미지원 브라우저
  }

  // 3) 18초간 화면 전 영역에 더 빈번한 폭죽 (140ms 간격, 입자 더 많이)
  const duration = 18000;
  const animationEnd = Date.now() + duration;
  const interval = setInterval(() => {
    if (Date.now() > animationEnd) {
      clearInterval(interval);
      return;
    }
    const particleCount = 80 + Math.floor(Math.random() * 60);
    burst({
      startVelocity: 35 + Math.random() * 30,
      spread: 360,
      ticks: 90,
      particleCount,
      scalar: 0.9 + Math.random() * 0.8,
      origin: {
        x: Math.random(),
        y: Math.random() * 0.75,
      },
    });
    // 동시 2발: 좌우 동시 발사 효과
    if (Math.random() > 0.6) {
      burst({
        startVelocity: 50 + Math.random() * 20,
        spread: 80,
        angle: Math.random() > 0.5 ? 60 : 120,
        particleCount: 60,
        origin: { x: Math.random() > 0.5 ? 0 : 1, y: 0.4 + Math.random() * 0.3 },
      });
    }
  }, 140);

  // 4) 진동 (지원 기기만)
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([100, 50, 100, 50, 200]);
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

  // thanked가 되는 순간 야단법석 효과. 18초 폭죽 + 5, 10, 15초 시점에 추가 발사.
  useEffect(() => {
    if (!thanked) return;
    const stop1 = fireConfetti();
    const t1 = setTimeout(() => fireConfetti(), 5000);
    const t2 = setTimeout(() => fireConfetti(), 10000);
    const t3 = setTimeout(() => fireConfetti(), 15000);
    return () => {
      stop1();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
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
      <main className="relative min-h-dvh overflow-hidden text-white px-5 py-20 flex flex-col items-center justify-center thanks-bg thanks-shake">
        {/* 끝없이 떨어지는 꽃잎 (배경 레이어) */}
        <PetalRain />
        {/* 좌우로 날아다니는 꽃다발 SVG */}
        <FlyingFlowers />

        {/* 메시지 */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 drop-shadow-2xl tracking-tight thanks-headline">
            정말, 정말, 정말<br className="sm:hidden" /> 고맙습니다!
          </h1>
          <p className="text-lg sm:text-xl text-white/95 max-w-md leading-relaxed drop-shadow-lg">
            <strong className="text-yellow-200">{p.registrant.name}</strong>님의 응원이<br />
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
  // 모바일·데스크탑 둘 다 자연스러운 양으로 (개수 너무 많으면 화면 가림)
  const petals = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {petals.map(i => {
        const left = (i * 7.14) % 100;
        const drift = (i % 2 === 0 ? 1 : -1) * (60 + ((i * 17) % 120));
        const dur = 9 + ((i * 5) % 8);
        const delay = (i * 1.1) % 10;
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

/**
 * 화면을 좌우로 가로지르며 날아다니는 꽃다발. SVG 5송이 묶음을 회전시키며 이동.
 * 이모지를 쓰지 않고 직접 그린다.
 */
function FlyingFlowers() {
  const items = [
    { dir: 'lr' as const, startY: '15vh', midY: '5vh', endY: '40vh', dur: 9, delay: 0, palette: 0, size: 88 },
    { dir: 'rl' as const, startY: '60vh', midY: '20vh', endY: '70vh', dur: 11, delay: 1.5, palette: 1, size: 100 },
    { dir: 'lr' as const, startY: '70vh', midY: '40vh', endY: '20vh', dur: 13, delay: 3, palette: 2, size: 80 },
    { dir: 'rl' as const, startY: '25vh', midY: '50vh', endY: '15vh', dur: 12, delay: 4.5, palette: 3, size: 92 },
    { dir: 'lr' as const, startY: '50vh', midY: '30vh', endY: '60vh', dur: 10, delay: 6, palette: 4, size: 96 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {items.map((it, i) => (
        <span
          key={i}
          className={it.dir === 'lr' ? 'flower-fly-lr' : 'flower-fly-rl'}
          style={
            {
              ['--start-y' as string]: it.startY,
              ['--mid-y' as string]: it.midY,
              ['--end-y' as string]: it.endY,
              ['--dur' as string]: `${it.dur}s`,
              ['--delay' as string]: `${it.delay}s`,
            } as React.CSSProperties
          }
        >
          <BouquetSvg size={it.size} paletteIdx={it.palette} />
        </span>
      ))}
    </div>
  );
}

const BOUQUET_PALETTES: { petals: string[]; center: string; leaf: string }[] = [
  { petals: ['#ff85a2', '#ff9bb3'], center: '#ffd700', leaf: '#86c8a3' },
  { petals: ['#f9a8d4', '#fbcfe8'], center: '#fde68a', leaf: '#86c8a3' },
  { petals: ['#fda4af', '#ffe4e6'], center: '#fde047', leaf: '#86c8a3' },
  { petals: ['#fcd34d', '#fef3c7'], center: '#fb923c', leaf: '#86c8a3' },
  { petals: ['#c084fc', '#e9d5ff'], center: '#fde68a', leaf: '#86c8a3' },
];

function BouquetSvg({ size, paletteIdx }: { size: number; paletteIdx: number }) {
  const p = BOUQUET_PALETTES[paletteIdx % BOUQUET_PALETTES.length];
  // 5송이 꽃 다발 (3송이 큰 + 2송이 작은) + 잎사귀 + 리본
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* 잎사귀 */}
      <ellipse cx="22" cy="60" rx="14" ry="6" fill={p.leaf} transform="rotate(-30 22 60)" />
      <ellipse cx="78" cy="60" rx="14" ry="6" fill={p.leaf} transform="rotate(30 78 60)" />
      <ellipse cx="50" cy="80" rx="16" ry="6" fill={p.leaf} />
      {/* 꽃 1 (가운데) */}
      <Flower cx={50} cy={42} r={20} petalColor={p.petals[0]} centerColor={p.center} />
      {/* 꽃 2 (왼쪽 위) */}
      <Flower cx={28} cy={32} r={14} petalColor={p.petals[1]} centerColor={p.center} />
      {/* 꽃 3 (오른쪽 위) */}
      <Flower cx={72} cy={32} r={14} petalColor={p.petals[0]} centerColor={p.center} />
      {/* 꽃 4 (왼쪽 아래) */}
      <Flower cx={32} cy={62} r={11} petalColor={p.petals[1]} centerColor={p.center} />
      {/* 꽃 5 (오른쪽 아래) */}
      <Flower cx={68} cy={62} r={11} petalColor={p.petals[1]} centerColor={p.center} />
      {/* 리본 */}
      <rect x="42" y="78" width="16" height="14" rx="3" fill="#fb7185" />
      <path d="M42 92 L34 96 L42 88 Z" fill="#fb7185" />
      <path d="M58 92 L66 96 L58 88 Z" fill="#fb7185" />
    </svg>
  );
}

function Flower({
  cx,
  cy,
  r,
  petalColor,
  centerColor,
}: {
  cx: number;
  cy: number;
  r: number;
  petalColor: string;
  centerColor: string;
}) {
  const petalR = r * 0.6;
  const offset = r * 0.55;
  return (
    <g>
      <circle cx={cx} cy={cy - offset} r={petalR} fill={petalColor} />
      <circle cx={cx + offset} cy={cy - offset * 0.3} r={petalR} fill={petalColor} />
      <circle cx={cx - offset} cy={cy - offset * 0.3} r={petalR} fill={petalColor} />
      <circle cx={cx + offset * 0.7} cy={cy + offset * 0.7} r={petalR} fill={petalColor} />
      <circle cx={cx - offset * 0.7} cy={cy + offset * 0.7} r={petalR} fill={petalColor} />
      <circle cx={cx} cy={cy} r={r * 0.35} fill={centerColor} />
    </g>
  );
}
