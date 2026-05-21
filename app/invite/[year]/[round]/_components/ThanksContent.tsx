'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import SponsorAccountCard from './SponsorAccountCard';
import type { SponsorAccount } from '@/lib/invites/types';

const CONFETTI_COLORS = [
  '#0066B3', '#3a8fd6', '#ffd700', '#ff6b6b', '#ff85a2',
  '#a8e6cf', '#fff', '#ffb347', '#c084fc', '#34d399',
];

/**
 * 후원 클릭 시 발사되는 화려한 효과.
 *  1. 즉시 중앙 큰 burst
 *  2. 좌우 사이드 burst
 *  3. 꽃다발(💐) emoji confetti 큰 입자
 *  4. 6초간 화면 곳곳에서 반복 폭죽
 */
function fireConfetti(): () => void {
  const burst = (opts: confetti.Options) =>
    confetti({ colors: CONFETTI_COLORS, ...opts, zIndex: 50 });

  // 1) 중앙·좌·우 큰 burst
  burst({ particleCount: 150, spread: 80, origin: { y: 0.55 }, startVelocity: 55 });
  setTimeout(() => burst({ particleCount: 100, angle: 60, spread: 80, origin: { x: 0, y: 0.7 }, startVelocity: 60 }), 150);
  setTimeout(() => burst({ particleCount: 100, angle: 120, spread: 80, origin: { x: 1, y: 0.7 }, startVelocity: 60 }), 150);
  setTimeout(() => burst({ particleCount: 80, spread: 120, startVelocity: 50, origin: { y: 0.4 }, scalar: 1.2 }), 400);

  // 2) 꽃다발 emoji confetti — 큰 입자, 천천히 떨어짐
  try {
    const bouquet = confetti.shapeFromText({ text: '💐', scalar: 3 });
    const flower = confetti.shapeFromText({ text: '🌸', scalar: 2 });
    setTimeout(() => {
      confetti({
        shapes: [bouquet, flower],
        scalar: 3,
        particleCount: 25,
        spread: 100,
        startVelocity: 35,
        gravity: 0.6,
        ticks: 300,
        origin: { y: 0.3 },
        zIndex: 50,
      });
    }, 300);
    setTimeout(() => {
      confetti({
        shapes: [bouquet],
        scalar: 4,
        particleCount: 12,
        spread: 140,
        startVelocity: 30,
        gravity: 0.5,
        ticks: 400,
        origin: { y: 0.2 },
        zIndex: 50,
      });
    }, 800);
  } catch {
    // shapeFromText는 modern 브라우저 한정. 실패해도 다른 효과는 계속 동작.
  }

  // 3) 6초간 화면 곳곳에서 반복 폭죽
  const duration = 6000;
  const animationEnd = Date.now() + duration;
  const interval = setInterval(() => {
    if (Date.now() > animationEnd) {
      clearInterval(interval);
      return;
    }
    const particleCount = 40 + Math.floor(Math.random() * 30);
    burst({
      startVelocity: 25 + Math.random() * 15,
      spread: 360,
      ticks: 60,
      particleCount,
      origin: {
        x: Math.random(),
        y: Math.random() * 0.6,
      },
    });
  }, 350);

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

  // thanked가 되는 순간 화려한 효과 발사. 6초 폭죽 + 3초 후 한 번 더.
  useEffect(() => {
    if (!thanked) return;
    const stop1 = fireConfetti();
    const tid = setTimeout(() => fireConfetti(), 3000);
    return () => {
      stop1();
      clearTimeout(tid);
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
      <main className="relative min-h-dvh overflow-hidden text-white px-5 py-20 flex flex-col items-center justify-center thanks-bg">
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
          <Link
            href={`/invite/${p.year}/${p.round}`}
            className="mt-14 text-sm underline text-white/80 hover:text-white"
          >
            공연 정보 다시 보기
          </Link>
        </div>
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

