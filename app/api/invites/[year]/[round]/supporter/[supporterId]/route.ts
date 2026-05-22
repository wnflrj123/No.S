import { NextResponse } from 'next/server';
import { deleteSupporter, verifyAdminToken } from '@/lib/invites/server';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string; supporterId: string }>;
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
