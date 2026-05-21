import Image from 'next/image';
import type { Invite } from '@/lib/invites/types';

export default function Hero({ invite }: { invite: Invite }) {
  return (
    <section className="px-5 md:px-8 pt-10 md:pt-16 pb-2">
      {/* 텍스트 블록 — 모바일/데스크탑 동일 세로 구조 */}
      <div className="max-w-2xl mx-auto text-center">
        {invite.overline?.trim() && (
          <div className="text-xs md:text-sm font-semibold text-[#0066B3] mb-3 md:mb-4">
            {invite.overline}
          </div>
        )}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
          {invite.title}
        </h1>
        {invite.subtitle && (
          <p className="text-base md:text-lg lg:text-xl text-gray-600 mt-3 md:mt-5 leading-relaxed whitespace-pre-line">
            {invite.subtitle}
          </p>
        )}
      </div>

      {/* 포스터 — 본문 가로 폭(max-w-3xl)에 맞춰 정렬 */}
      <div className="mt-8 md:mt-12 mx-auto w-full max-w-3xl">
        <div className="aspect-[3/4] relative overflow-hidden rounded-2xl bg-gray-100 shadow-2xl">
          <Image
            src={invite.posterImageUrl}
            alt={invite.title}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </div>
      </div>
    </section>
  );
}
