import Image from 'next/image';
import type { Invite } from '@/lib/invites/types';

export default function Hero({ invite }: { invite: Invite }) {
  return (
    <section className="relative">
      <div className="aspect-[3/4] sm:aspect-[16/9] relative overflow-hidden bg-gray-100">
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
      <div className="px-5 -mt-24 sm:-mt-16 relative z-10 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg leading-tight">
          {invite.title}
        </h1>
        {invite.subtitle && (
          <p className="text-sm sm:text-base text-white/90 mt-1 drop-shadow">{invite.subtitle}</p>
        )}
      </div>
    </section>
  );
}
