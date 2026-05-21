import { NextResponse } from 'next/server';
import {
  adminSetSponsor,
  deleteRegistration,
  verifyAdminToken,
} from '@/lib/invites/server';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string; regId: string }>;
}

/**
 * Admin이 신청 정보 일부를 수정한다. 현재는 isSponsor 토글만 지원.
 * body: { isSponsor: boolean }
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const adminUid = await verifyAdminToken(req.headers.get('authorization'));
  if (!adminUid) {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  const { regId } = await params;
  if (!regId) return NextResponse.json({ message: '신청 ID가 필요합니다.' }, { status: 400 });

  let body: { isSponsor?: unknown };
  try {
    body = (await req.json()) as { isSponsor?: unknown };
  } catch {
    return NextResponse.json({ message: '잘못된 요청 본문입니다.' }, { status: 400 });
  }
  if (typeof body.isSponsor !== 'boolean') {
    return NextResponse.json({ message: 'isSponsor(boolean) 값이 필요합니다.' }, { status: 400 });
  }

  try {
    const ok = await adminSetSponsor(regId, body.isSponsor);
    if (!ok) return NextResponse.json({ message: '대상을 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] toggle sponsor failed', err);
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
