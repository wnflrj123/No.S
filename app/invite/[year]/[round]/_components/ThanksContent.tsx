'use client';

import { useState } from 'react';
import Link from 'next/link';
import SponsorAccountCard from './SponsorAccountCard';
import type { SponsorAccount } from '@/lib/invites/types';

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
      <main className="min-h-dvh bg-gradient-to-b from-[#0066B3] via-[#1b7fc4] to-[#3a8fd6] text-white px-5 py-20 flex flex-col items-center justify-center">
        <div className="text-7xl mb-5 animate-pulse">🌟</div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">정말 고맙습니다!</h1>
        <p className="text-white/90 text-center max-w-md leading-relaxed">
          {p.registrant.name}님의 응원과 후원이 무대를 더욱 빛나게 합니다.
          <br />
          공연 당일 따뜻한 박수로 맞이하겠습니다.
        </p>
        <Link
          href={`/invite/${p.year}/${p.round}`}
          className="mt-12 text-sm underline text-white/80 hover:text-white"
        >
          공연 정보 다시 보기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-10 pb-20">
      <div className="text-center">
        <div className="text-5xl">💌</div>
        <h1 className="text-2xl font-bold mt-3 text-gray-900">신청이 완료되었습니다</h1>
        <p className="text-gray-600 mt-2">
          <strong>{p.registrant.name}</strong>님, 신청해주셔서 감사합니다.
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
          작은 후원도 큰 힘이 됩니다. 자율적으로 참여해주세요.
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
          {loading ? '처리 중…' : '후원했어요 💛'}
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
