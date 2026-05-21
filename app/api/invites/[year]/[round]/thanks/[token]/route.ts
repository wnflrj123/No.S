import { NextResponse } from 'next/server';
import {
  findRegistrationByToken,
  getInvite,
  inviteIdFrom,
} from '@/lib/invites/server';
import { ACCESS_TOKEN_LENGTH } from '@/lib/invites/constants';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string; token: string }>;
}

/**
 * thanks 페이지가 mount 시 호출하는 데이터 fetch.
 * 토큰 검증 + invite 매칭 후 thanks 표시에 필요한 최소 정보만 반환.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { year, round, token } = await params;
  if (!token || token.length !== ACCESS_TOKEN_LENGTH) {
    return NextResponse.json({ message: '잘못된 토큰' }, { status: 404 });
  }

  const [reg, invite] = await Promise.all([
    findRegistrationByToken(token),
    getInvite(year, round),
  ]);

  if (!reg) return NextResponse.json({ message: '신청 내역 없음' }, { status: 404 });
  if (reg.inviteId !== inviteIdFrom(year, round)) {
    return NextResponse.json({ message: '잘못된 경로' }, { status: 404 });
  }
  if (!invite) return NextResponse.json({ message: '공연 없음' }, { status: 404 });

  return NextResponse.json({
    year: invite.year,
    round: invite.round,
    token,
    isSponsor: reg.isSponsor,
    thanksMessage: invite.thanksMessage,
    sponsorAccount: invite.sponsorAccount,
    registrant: {
      name: reg.name,
      roundSelections: reg.roundSelections.map(s => ({
        roundNo: s.roundNo,
        headcount: s.headcount,
      })),
    },
  });
}
