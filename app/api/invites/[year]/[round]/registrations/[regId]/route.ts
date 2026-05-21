import { NextResponse } from 'next/server';
import { deleteRegistration, verifyAdminToken } from '@/lib/invites/server';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string; regId: string }>;
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
