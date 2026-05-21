import Image from 'next/image';
import type { Invite } from '@/lib/invites/types';

export default function Hero({ invite }: { invite: Invite }) {
  return (
    <section className="relative">
      {/* 모바일 (md 미만): 풀 와이드 포스터 + 하단 텍스트 오버레이 */}
      <div className="md:hidden">
        <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
          <Image
            src={invite.posterImageUrl}
            alt={invite.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
        <div className="px-5 -mt-24 relative z-10 pb-6">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg leading-tight">
            {invite.title}
          </h1>
          {invite.subtitle && (
            <p className="text-sm text-white/90 mt-1 drop-shadow">{invite.subtitle}</p>
          )}
        </div>
      </div>

      {/* 데스크탑 (md 이상): 좌측 포스터 + 우측 제목·부제 split */}
      <div className="hidden md:flex md:items-center md:gap-10 lg:gap-14 max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="aspect-[3/4] relative overflow-hidden rounded-2xl bg-gray-100 shadow-2xl w-[48%] max-w-[560px] flex-shrink-0">
          <Image
            src={invite.posterImageUrl}
            alt={invite.title}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1280px) 560px, 45vw"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
            {invite.title}
          </h1>
          {invite.subtitle && (
            <p className="text-lg lg:text-xl text-gray-600 mt-5 leading-relaxed whitespace-pre-line">
              {invite.subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
