import { after, NextResponse } from 'next/server';
import {
  createRegistration,
  findActiveDuplicate,
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

    // 중복(같은 이름+전화번호 active) 체크
    const existing = await findActiveDuplicate(invite.id, typed.name, typed.phone);
    if (existing && !typed.confirmSupersede) {
      return NextResponse.json(
        {
          message: '이미 같은 이름·전화번호로 신청한 내역이 있어요. 새로 신청하시면 기존 신청은 취소됩니다.',
          duplicate: true,
        },
        { status: 409 },
      );
    }

    const { id, token } = await createRegistration(invite, typed, existing?.id);

    // 신청 완료 자동 LMS 발송. after()로 응답 후 background에서 안전하게 처리.
    // Vercel serverless 환경에서 응답 직후 컨테이너 동결로 fire-and-forget이 끊기는 문제를 회피.
    const regForSms = {
      id,
      name: typed.name.trim(),
      phone: typed.phone,
      roundSelections: typed.roundSelections,
    } as InviteRegistration;
    after(async () => {
      try {
        await sendConfirmationSms({ invite, registration: regForSms });
      } catch (err) {
        console.error('[SMS] confirmation send failed', err);
      }
    });

    // thanks 페이지 즉시 렌더에 필요한 데이터를 응답에 함께 전달
    // (클라이언트가 sessionStorage 캐시 후 thanks 페이지에서 Firestore 재조회 없이 즉시 화면)
    const thanksData = {
      year: invite.year,
      round: invite.round,
      token,
      isSponsor: false,
      thanksMessage: invite.thanksMessage,
      sponsorAccount: invite.sponsorAccount,
      registrant: {
        name: typed.name.trim(),
        roundSelections: typed.roundSelections,
      },
    };

    return NextResponse.json({ token, thanksData }, { status: 201 });
  } catch (err) {
    console.error('register failure', err);
    return NextResponse.json({ message: '신청 저장에 실패했습니다.' }, { status: 500 });
  }
}
