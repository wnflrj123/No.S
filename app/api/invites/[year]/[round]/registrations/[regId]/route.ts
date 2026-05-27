import { NextResponse } from 'next/server';
import {
  adminSetSponsor,
  deleteRegistration,
  setSponsorAmount,
  verifyAdminToken,
} from '@/lib/invites/server';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string; regId: string }>;
}

/**
 * Admin이 신청 정보 일부를 수정한다.
 * body: { isSponsor?: boolean, sponsorAmount?: number | null }
 *   - isSponsor: 후원 토글
 *   - sponsorAmount: 후원 금액(원). null 또는 0 이면 필드 제거.
 *   둘 중 하나 이상 포함되어야 한다.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const adminUid = await verifyAdminToken(req.headers.get('authorization'));
  if (!adminUid) {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  const { regId } = await params;
  if (!regId) return NextResponse.json({ message: '신청 ID가 필요합니다.' }, { status: 400 });

  let body: { isSponsor?: unknown; sponsorAmount?: unknown };
  try {
    body = (await req.json()) as { isSponsor?: unknown; sponsorAmount?: unknown };
  } catch {
    return NextResponse.json({ message: '잘못된 요청 본문입니다.' }, { status: 400 });
  }

  const hasIsSponsor = typeof body.isSponsor === 'boolean';
  const hasAmount = body.sponsorAmount !== undefined;
  if (!hasIsSponsor && !hasAmount) {
    return NextResponse.json(
      { message: 'isSponsor(boolean) 또는 sponsorAmount(number|null)이 필요합니다.' },
      { status: 400 },
    );
  }

  try {
    if (hasIsSponsor) {
      const ok = await adminSetSponsor(regId, body.isSponsor as boolean);
      if (!ok) return NextResponse.json({ message: '대상을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (hasAmount) {
      const v = body.sponsorAmount;
      const amount = v === null ? null : typeof v === 'number' && Number.isFinite(v) ? v : NaN;
      if (Number.isNaN(amount as number)) {
        return NextResponse.json(
          { message: 'sponsorAmount는 숫자 또는 null이어야 합니다.' },
          { status: 400 },
        );
      }
      const ok = await setSponsorAmount(regId, amount as number | null);
      if (!ok) return NextResponse.json({ message: '대상을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] patch registration failed', err);
    return NextResponse.json({ message: '변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const adminUid = await verifyAdminToken(req.headers.get('authorization'));
  if (!adminUid) {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  const { regId } = await params;
  if (!regId) return NextResponse.json({ message: '신청 ID가 필요합니다.' }, { status: 400 });

  try {
    const ok = await deleteRegistration(regId);
    if (!ok) return NextResponse.json({ message: '대상을 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] delete registration failed', err);
    return NextResponse.json({ message: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
