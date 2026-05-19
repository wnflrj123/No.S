import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getInvite } from '@/lib/invites/server';
import Hero from './_components/Hero';
import DescriptionSection from './_components/DescriptionSection';
import RoundsSection from './_components/RoundsSection';
import VenueSection from './_components/VenueSection';
import CastingSection from './_components/CastingSection';
import ApplyCTA from './_components/ApplyCTA';

export const dynamic = 'force-dynamic';

interface PageParams {
  params: Promise<{ year: string; round: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { year, round } = await params;
  const invite = await getInvite(year, round);
  if (!invite || !invite.isPublished) {
    return { title: '존재하지 않는 페이지' };
  }
  return {
    title: `${invite.title} | No.S`,
    description: invite.subtitle ?? '',
    openGraph: {
      title: invite.title,
      description: invite.subtitle ?? '',
      images: invite.posterImageUrl ? [invite.posterImageUrl] : undefined,
    },
  };
}

export default async function InvitePage({ params }: PageParams) {
  const { year, round } = await params;
  const invite = await getInvite(year, round);
  if (!invite || !invite.isPublished) notFound();

  // eslint-disable-next-line react-hooks/purity -- 서버 컴포넌트는 요청마다 새 인스턴스이며 현재 시각 조회가 정상
  const nowMs = Date.now();
  const allClosed =
    invite.rounds.length === 0 ||
    invite.rounds.every(r => r.startAt.toDate().getTime() <= nowMs);

  return (
    <main className="bg-white text-gray-900 pb-28">
      <Hero invite={invite} />
      <DescriptionSection html={invite.description} />
      <RoundsSection rounds={invite.rounds} nowMs={nowMs} />
      <VenueSection venue={invite.venue} />
      <CastingSection rounds={invite.rounds} inviteId={invite.id} />
      <ApplyCTA year={invite.year} round={invite.round} disabled={allClosed} />
    </main>
  );
}
