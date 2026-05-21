'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import SponsorAccountCard from './SponsorAccountCard';
import type { SponsorAccount } from '@/lib/invites/types';

const CONFETTI_COLORS = ['#0066B3', '#3a8fd6', '#ffd700', '#ff6b6b', '#ff85a2', '#a8e6cf', '#fff'];

function fireConfetti() {
  // 가운데에서 빵! + 좌우에서 추가 발사로 전 화면 덮기
  const burst = (opts: confetti.Options) =>
    confetti({ colors: CONFETTI_COLORS, ...opts });

  burst({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  setTimeout(() => burst({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }), 200);
  setTimeout(() => burst({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }), 200);
  setTimeout(() => burst({ particleCount: 60, spread: 100, startVelocity: 50, origin: { y: 0.4 } }), 500);
  setTimeout(() => burst({ particleCount: 40, spread: 120, scalar: 1.4, origin: { y: 0.3 } }), 900);
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

  // thanked가 되는 순간 꽃가루 발사. 새로고침 후 이미 thanked였어도 한 번 발사.
  useEffect(() => {
    if (!thanked) return;
    fireConfetti();
    const t = setTimeout(() => fireConfetti(), 2500);
    return () => clearTimeout(t);
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
      <main className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-[#0066B3] via-[#1b7fc4] to-[#3a8fd6] text-white px-5 py-20 flex flex-col items-center justify-center">
        {/* 떠다니는 배경 장식 이모지 */}
        <FloatingEmoji emoji="✨" left="8%" delay={0} />
        <FloatingEmoji emoji="🎉" left="22%" delay={1.4} />
        <FloatingEmoji emoji="💛" left="78%" delay={0.7} />
        <FloatingEmoji emoji="🌟" left="90%" delay={2.1} />
        <FloatingEmoji emoji="💫" left="44%" delay={2.8} />
        <FloatingEmoji emoji="🎭" left="62%" delay={1.0} />

        {/* 핵심 메시지 */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-8xl mb-6 drop-shadow-2xl thanks-bounce">🌟</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-5 drop-shadow-lg tracking-tight">
            정말, 정말, 정말<br className="sm:hidden" /> 고맙습니다!
          </h1>
          <p className="text-base sm:text-lg text-white/95 max-w-md leading-relaxed drop-shadow">
            <strong className="text-yellow-200">{p.registrant.name}</strong>님의 응원 한 톨 한 톨이<br />
            저희에게 정말 큰 힘이 됩니다 💛
          </p>
          <p className="text-sm sm:text-base text-white/85 mt-4 max-w-md leading-relaxed">
            공연날, 가장 빛나는 무대로 인사드릴게요!
          </p>
          <Link
            href={`/invite/${p.year}/${p.round}`}
            className="mt-12 text-sm underline text-white/80 hover:text-white"
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

/**
 * 배경에서 위로 둥둥 떠다니는 이모지. left·delay만 지정해 다양한 위치/타이밍으로 배치.
 */
function FloatingEmoji({ emoji, left, delay }: { emoji: string; left: string; delay: number }) {
  return (
    <span
      aria-hidden
      className="absolute bottom-0 text-4xl sm:text-5xl opacity-70 thanks-float pointer-events-none"
      style={{ left, animationDelay: `${delay}s` }}
    >
      {emoji}
    </span>
  );
}
