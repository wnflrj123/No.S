import { NextResponse } from 'next/server';
import {
  findRegistrationByToken,
  inviteIdFrom,
  markSponsor,
} from '@/lib/invites/server';
import { ACCESS_TOKEN_LENGTH } from '@/lib/invites/constants';

interface RouteParams {
  params: Promise<{ year: string; round: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { year, round } = await params;

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: '잘못된 요청 본문입니다.' }, { status: 400 });
  }

  const token = body.token;
  if (typeof token !== 'string' || token.length !== ACCESS_TOKEN_LENGTH) {
    return NextResponse.json({ message: '토큰이 유효하지 않습니다.' }, { status: 400 });
  }

  // 토큰이 해당 invite 소속인지 확인 (다른 공연 토큰으로 우회 방지)
  const reg = await findRegistrationByToken(token);
  if (!reg || reg.inviteId !== inviteIdFrom(year, round)) {
    return NextResponse.json({ message: '토큰을 찾을 수 없습니다.' }, { status: 404 });
  }

  try {
    const ok = await markSponsor(token);
    if (!ok) {
      return NextResponse.json({ message: '처리에 실패했습니다.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('sponsor toggle failure', err);
    return NextResponse.json({ message: '처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
