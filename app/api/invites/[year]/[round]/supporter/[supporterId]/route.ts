import { NextResponse } from 'next/server';
import {
  deleteSupporter,
  setSupporterAmount,
  verifyAdminToken,
} from '@/lib/invites/server';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string; supporterId: string }>;
}

/**
 * Admin이 현장 후원자 금액을 설정. body: { amount: number | null }
 * null 또는 0이면 필드 제거.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const adminUid = await verifyAdminToken(req.headers.get('authorization'));
  if (!adminUid) {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
  }
  const { supporterId } = await params;
  if (!supporterId) {
    return NextResponse.json({ message: 'supporter ID가 필요합니다.' }, { status: 400 });
  }

  let body: { amount?: unknown };
  try {
    body = (await req.json()) as { amount?: unknown };
  } catch {
    return NextResponse.json({ message: '잘못된 요청 본문입니다.' }, { status: 400 });
  }
  if (body.amount === undefined) {
    return NextResponse.json({ message: 'amount 값이 필요합니다.' }, { status: 400 });
  }
  const v = body.amount;
  const amount = v === null ? null : typeof v === 'number' && Number.isFinite(v) ? v : NaN;
  if (Number.isNaN(amount as number)) {
    return NextResponse.json({ message: 'amount는 숫자 또는 null이어야 합니다.' }, { status: 400 });
  }

  try {
    const ok = await setSupporterAmount(supporterId, amount as number | null);
    if (!ok) return NextResponse.json({ message: '대상을 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] set supporter amount failed', err);
    return NextResponse.json({ message: '변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const adminUid = await verifyAdminToken(req.headers.get('authorization'));
  if (!adminUid) {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  const { supporterId } = await params;
  if (!supporterId) {
    return NextResponse.json({ message: 'supporter ID가 필요합니다.' }, { status: 400 });
  }

  try {
    const ok = await deleteSupporter(supporterId);
    if (!ok) return NextResponse.json({ message: '대상을 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] delete supporter failed', err);
    return NextResponse.json({ message: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
