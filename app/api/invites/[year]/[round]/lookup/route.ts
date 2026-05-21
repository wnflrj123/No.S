import { NextResponse } from 'next/server';
import { getInvite, inviteIdFrom, lookupActiveRegistration } from '@/lib/invites/server';
import { PHONE_REGEX } from '@/lib/invites/constants';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string }>;
}

interface LookupPayload {
  name?: unknown;
  phone?: unknown;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { year, round } = await params;

  let body: LookupPayload;
  try {
    body = (await req.json()) as LookupPayload;
  } catch {
    return NextResponse.json({ message: '잘못된 요청입니다.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone : '';
  if (!name) return NextResponse.json({ message: '이름을 입력해주세요.' }, { status: 400 });
  if (!PHONE_REGEX.test(phone)) {
    return NextResponse.json({ message: '휴대폰 번호 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const invite = await getInvite(year, round);
  if (!invite || !invite.isPublished) {
    return NextResponse.json({ found: false, message: '공연을 찾을 수 없습니다.' }, { status: 404 });
  }

  const reg = await lookupActiveRegistration(inviteIdFrom(year, round), name, phone);
  if (!reg) {
    return NextResponse.json({ found: false });
  }

  // 토큰은 민감 정보이므로 노출하지 않고, 표시용 요약만 전달.
  // 회차별 시간을 함께 보내 신청 내역 카드에서 일시도 표시할 수 있도록.
  return NextResponse.json({
    found: true,
    registration: {
      name: reg.name,
      phone: reg.phone,
      roundSelections: reg.roundSelections,
      totalHeadcount: reg.roundSelections.reduce((s, x) => s + x.headcount, 0),
      isSponsor: reg.isSponsor,
      createdAt: reg.createdAt.toMillis(),
    },
    rounds: invite.rounds.map(r => ({
      roundNo: r.roundNo,
      teamName: r.teamName,
      startAtMs: r.startAt.toDate().getTime(),
    })),
  });
}
