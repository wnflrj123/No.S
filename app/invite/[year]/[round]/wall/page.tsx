import { notFound } from 'next/navigation';
import { getInvite, inviteIdFrom } from '@/lib/invites/server';
import SupporterWall from '../_components/SupporterWall';

export const dynamic = 'force-dynamic';

interface PageParams {
  params: Promise<{ year: string; round: string }>;
}

export default async function WallPage({ params }: PageParams) {
  const { year, round } = await params;
  const invite = await getInvite(year, round);
  if (!invite || !invite.isPublished) notFound();

  return (
    <SupporterWall
      year={invite.year}
      round={invite.round}
      inviteId={inviteIdFrom(year, round)}
      title={invite.title}
      overline={invite.overline}
      sponsorAccount={invite.sponsorAccount}
      disableWallSupport={invite.disableWallSupport ?? false}
    />
  );
}
