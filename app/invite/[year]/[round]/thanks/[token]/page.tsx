import { notFound } from 'next/navigation';
import { findRegistrationByToken, getInvite, inviteIdFrom } from '@/lib/invites/server';
import { ACCESS_TOKEN_LENGTH } from '@/lib/invites/constants';
import ThanksContent from '../../_components/ThanksContent';

export const dynamic = 'force-dynamic';

interface PageParams {
  params: Promise<{ year: string; round: string; token: string }>;
}

export default async function ThanksPage({ params }: PageParams) {
  const { year, round, token } = await params;
  if (!token || token.length !== ACCESS_TOKEN_LENGTH) notFound();

  const reg = await findRegistrationByToken(token);
  if (!reg) notFound();

  // 다른 공연의 토큰이 다른 공연 URL에 사용되는 것을 차단
  if (reg.inviteId !== inviteIdFrom(year, round)) notFound();

  const invite = await getInvite(year, round);
  if (!invite) notFound();

  return (
    <ThanksContent
      year={invite.year}
      round={invite.round}
      token={token}
      isSponsor={reg.isSponsor}
      thanksMessage={invite.thanksMessage}
      sponsorAccount={invite.sponsorAccount}
      registrant={{
        name: reg.name,
        roundSelections: reg.roundSelections.map(s => ({
          roundNo: s.roundNo,
          headcount: s.headcount,
        })),
      }}
    />
  );
}
