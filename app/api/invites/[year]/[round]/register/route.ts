import { NextResponse } from 'next/server';
import {
  createRegistration,
  getInvite,
  validateRegistrationPayload,
} from '@/lib/invites/server';
import type { InviteRegistration, RegisterPayload } from '@/lib/invites/types';
import { sendConfirmationSms } from '@/lib/sms/templates/confirmation';

// crypto와 firebase-admin 사용 — Edge가 아닌 Node 런타임에서만 동작
export const runtime = 'nodejs';

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
    const typed = payload as RegisterPayload;
    const { id, token } = await createRegistration(invite, typed);

    // 신청 완료 자동 LMS 발송. fire-and-forget — SMS 실패해도 신청 성공으로 응답한다.
    // SMS 발송에 필요한 최소 필드만 갖는 registration 객체를 합성한다.
    const regForSms = {
      id,
      name: typed.name.trim(),
      phone: typed.phone,
      roundSelections: typed.roundSelections,
    } as InviteRegistration;
    sendConfirmationSms({ invite, registration: regForSms }).catch(err => {
      console.error('[SMS] confirmation send failed', err);
    });

    return NextResponse.json({ token }, { status: 201 });
  } catch (err) {
    console.error('register failure', err);
    return NextResponse.json({ message: '신청 저장에 실패했습니다.' }, { status: 500 });
  }
}
