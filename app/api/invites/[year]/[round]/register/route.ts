import { NextResponse } from 'next/server';
import {
  createRegistration,
  getInvite,
  validateRegistrationPayload,
} from '@/lib/invites/server';
import type { RegisterPayload } from '@/lib/invites/types';

interface RouteParams {
  params: Promise<{ year: string; round: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { year, round } = await params;

  const invite = await getInvite(year, round);
  if (!invite || !invite.isPublished) {
    return NextResponse.json(
      { message: '존재하지 않거나 공개되지 않은 공연입니다.' },
      { status: 404 },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: '잘못된 요청 본문입니다.' }, { status: 400 });
  }

  const validation = validateRegistrationPayload(payload, invite, new Date());
  if (!validation.ok) {
    return NextResponse.json(
      { message: '입력값을 확인해주세요.', errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const { token } = await createRegistration(invite, payload as RegisterPayload);
    return NextResponse.json({ token }, { status: 201 });
  } catch (err) {
    console.error('register failure', err);
    return NextResponse.json({ message: '신청 저장에 실패했습니다.' }, { status: 500 });
  }
}
